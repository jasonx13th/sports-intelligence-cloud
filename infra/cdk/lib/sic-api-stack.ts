// infra/cdk/lib/sic-api-stack.ts

import { Stack, StackProps, CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as apigwv2Authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface SicApiStackProps extends StackProps {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
}

export class SicApiStack extends Stack {
  constructor(scope: Construct, id: string, props: SicApiStackProps) {
    super(scope, id, props);

    const envName = this.node.tryGetContext("env") ?? "dev";

    // -----------------------------
    // Tenant Entitlements Store (DynamoDB)
    // -----------------------------
    const tenantEntitlementsTable = new dynamodb.Table(this, "TenantEntitlementsTable", {
      tableName: `sic-tenant-entitlements-${envName}`,
      partitionKey: { name: "user_sub", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // dev only; later RETAIN
    });

    // -----------------------------
    // SIC Domain Store (DynamoDB) — tenant-partitioned single table
    // -----------------------------
    const sicDomainTable = new dynamodb.Table(this, "SicDomainTable", {
      tableName: `sic-domain-${envName}`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // dev only; later RETAIN
    });

    // Lambda: /me
    const meFn = new lambda.Function(this, "MeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "me/handler.handler",
      functionName: `sic-club-vivo-me-${envName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/club-vivo/api")),
      environment: {
        TENANT_ENTITLEMENTS_TABLE: tenantEntitlementsTable.tableName,
      },
    });

    // Lambda: /athletes
    const athletesFn = new lambda.Function(this, "AthletesFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "athletes/handler.handler",
      functionName: `sic-club-vivo-athletes-${envName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/club-vivo/api")),
      environment: {
        TENANT_ENTITLEMENTS_TABLE: tenantEntitlementsTable.tableName,
        SIC_DOMAIN_TABLE: sicDomainTable.tableName,
      },
    });

    // -----------------------------
    // IAM grants (least privilege)
    // -----------------------------
    // Entitlements: read-only for /me (NOTE: grantReadData includes Scan; we’ll tighten later)
    tenantEntitlementsTable.grantReadData(meFn);

    // Entitlements: explicit allow-list for /athletes (NO Scan)
    athletesFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:DescribeTable", "dynamodb:BatchGetItem"],
        resources: [tenantEntitlementsTable.tableArn],
      })
    );

    // Domain table: explicit allow-list (NO Scan) + writes for idempotent create (+ audit)
    const domainAccessActions = [
      // reads
      "dynamodb:Query",
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
      "dynamodb:DescribeTable",
      // writes
      "dynamodb:PutItem",
      "dynamodb:TransactWriteItems",
    ];

    athletesFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: domainAccessActions,
        resources: [sicDomainTable.tableArn],
      })
    );

    // -----------------------------
    // HTTP API
    // -----------------------------
    const api = new apigwv2.HttpApi(this, "ClubVivoHttpApi", {
      apiName: `sic-club-vivo-api-${envName}`,
    });

    // Access logs for HTTP API
    const apiAccessLogs = new logs.LogGroup(this, "ClubVivoHttpApiAccessLogs", {
      logGroupName: `/aws/apigwv2/sic-club-vivo-api-${envName}`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Enable access logging on default stage
    const defaultStage = api.defaultStage;
    if (defaultStage) {
      const cfnStage = defaultStage.node.defaultChild as apigwv2.CfnStage;
      cfnStage.accessLogSettings = {
        destinationArn: apiAccessLogs.logGroupArn,
        format: JSON.stringify({
          requestId: "$context.requestId",
          ip: "$context.identity.sourceIp",
          requestTime: "$context.requestTime",
          httpMethod: "$context.httpMethod",
          routeKey: "$context.routeKey",
          status: "$context.status",
          responseLength: "$context.responseLength",
          integrationError: "$context.integrationErrorMessage",
        }),
      };
    }

    // Cognito JWT Authorizer
    const authorizer = new apigwv2Authorizers.HttpJwtAuthorizer(
      "ClubVivoJwtAuth",
      `https://cognito-idp.${Stack.of(this).region}.amazonaws.com/${props.userPoolId}`,
      {
        jwtAudience: [props.userPoolClientId],
      }
    );

    // Route: GET /me
    api.addRoutes({
      path: "/me",
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2Integrations.HttpLambdaIntegration("MeIntegration", meFn),
      authorizer,
    });

    // Routes: /athletes
    api.addRoutes({
      path: "/athletes",
      methods: [apigwv2.HttpMethod.POST, apigwv2.HttpMethod.GET],
      integration: new apigwv2Integrations.HttpLambdaIntegration("AthletesIntegration", athletesFn),
      authorizer,
    });

    api.addRoutes({
      path: "/athletes/{athleteId}",
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2Integrations.HttpLambdaIntegration("AthleteByIdIntegration", athletesFn),
      authorizer,
    });

    // -----------------------------
    // Outputs
    // -----------------------------
    new CfnOutput(this, "ClubVivoApiUrl", {
      value: api.url ?? "unknown",
      exportName: `ClubVivoApiUrl-${envName}`,
    });

    new CfnOutput(this, "TenantEntitlementsTableName", {
      value: tenantEntitlementsTable.tableName,
      exportName: `TenantEntitlementsTableName-${envName}`,
    });

    new CfnOutput(this, "SicDomainTableName", {
      value: sicDomainTable.tableName,
      exportName: `SicDomainTableName-${envName}`,
    });

    // -----------------------------
    // Observability: athlete create metric filters + alarm
    // -----------------------------
    const athletesLogGroup = logs.LogGroup.fromLogGroupName(
      this,
      "AthletesFnLogGroup",
      `/aws/lambda/${athletesFn.functionName}`
    );

    new logs.MetricFilter(this, "AthleteCreateSuccessMetricFilter", {
      logGroup: athletesLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "athlete_create_success",
      filterPattern: logs.FilterPattern.stringValue("$.eventCode", "=", "athlete_create_success"),
      metricValue: "1",
    });

    new logs.MetricFilter(this, "AthleteCreateReplayMetricFilter", {
      logGroup: athletesLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "athlete_create_idempotent_replay",
      filterPattern: logs.FilterPattern.stringValue("$.eventCode", "=", "athlete_create_idempotent_replay"),
      metricValue: "1",
    });

    new logs.MetricFilter(this, "AthleteCreateFailureMetricFilter", {
      logGroup: athletesLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "athlete_create_failure",
      filterPattern: logs.FilterPattern.stringValue("$.eventCode", "=", "athlete_create_failure"),
      metricValue: "1",
    });

    const athleteCreateFailureMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "athlete_create_failure",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    new cloudwatch.Alarm(this, "AthleteCreateFailureAlarm", {
      alarmName: `sic-${envName}-athlete-create-failures`,
      metric: athleteCreateFailureMetric,
      threshold: 1,
      evaluationPeriods: 1,
    });

    // --- CloudWatch Alarms ---

    // Lambda: Me Errors
    new cloudwatch.Alarm(this, "MeFnErrorsAlarm", {
      alarmName: `sic-${envName}-mefn-errors`,
      metric: meFn.metricErrors({ period: Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // Lambda: Me Throttles
    new cloudwatch.Alarm(this, "MeFnThrottlesAlarm", {
      alarmName: `sic-${envName}-mefn-throttles`,
      metric: meFn.metricThrottles({ period: Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
    });
    
    // Lambda: Athletes Errors
    new cloudwatch.Alarm(this, "AthletesFnErrorsAlarm", {
      alarmName: `sic-${envName}-athletesfn-errors`,
      metric: athletesFn.metricErrors({ period: Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // Lambda: Athletes Throttles
    new cloudwatch.Alarm(this, "AthletesFnThrottlesAlarm", {
      alarmName: `sic-${envName}-athletesfn-throttles`,
      metric: athletesFn.metricThrottles({ period: Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // API Gateway V2 (HTTP API) metrics
    const apiId = api.apiId;

    // 4XX
    new cloudwatch.Alarm(this, "HttpApi4xxAlarm", {
      alarmName: `sic-${envName}-httpapi-4xx`,
      metric: new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "4xx",
        dimensionsMap: { ApiId: apiId },
        period: Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 10,
      evaluationPeriods: 1,
    });

    // 5XX
    new cloudwatch.Alarm(this, "HttpApi5xxAlarm", {
      alarmName: `sic-${envName}-httpapi-5xx`,
      metric: new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "5xx",
        dimensionsMap: { ApiId: apiId },
        period: Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 1,
      evaluationPeriods: 1,
    });
  }
}