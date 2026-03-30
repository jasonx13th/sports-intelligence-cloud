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
import * as s3 from "aws-cdk-lib/aws-s3";
import * as notifications from "aws-cdk-lib/aws-s3-notifications";

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

    const isDev = envName === "dev";

    // -----------------------------
    // S3 Buckets
    // -----------------------------
    const sessionPdfBucket = new s3.Bucket(this, "SessionPdfBucket", {
      bucketName: `sic-session-pdfs-${envName}-${Stack.of(this).account}-${Stack.of(this).region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      autoDeleteObjects: isDev,
    });

    // NEW: Domain export bucket (lake-ready domain datasets; NOT PDFs)
    const domainExportBucket = new s3.Bucket(this, "DomainExportBucket", {
      bucketName: `sic-domain-exports-${envName}-${Stack.of(this).account}-${Stack.of(this).region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      autoDeleteObjects: isDev,
    });

    // NEW: Data lake bucket (bronze/silver/gold). App-only access in v1.
    const lakeBucket = new s3.Bucket(this, "LakeBucket", {
      bucketName: `sic-data-lake-${envName}-${Stack.of(this).account}-${Stack.of(this).region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: isDev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      autoDeleteObjects: isDev,
      lifecycleRules: [
        {
          prefix: "bronze/",
          expiration: Duration.days(30),
        },
      ],
    });

    // Lake ingest function
    const lakeIngestFn = new lambda.Function(this, "LakeIngestFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "lake-ingest/handler.handler",
      functionName: `sic-club-vivo-lake-ingest-${envName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/club-vivo/api")),
      timeout: Duration.seconds(30),
      environment: {
        DOMAIN_EXPORT_BUCKET: domainExportBucket.bucketName,
        LAKE_BUCKET: lakeBucket.bucketName,
      },
    });

    domainExportBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new notifications.LambdaDestination(lakeIngestFn),
      {
        prefix: "exports/domain/",
        suffix: ".ndjson",
      }
    );

    lakeIngestFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:HeadObject"],
        resources: [domainExportBucket.arnForObjects("exports/domain/*")],
      })
    );

    lakeIngestFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:HeadObject"],
        resources: [lakeBucket.arnForObjects("bronze/*")],
      })
    );

    // -----------------------------
    // Lambdas
    // -----------------------------

    // Lambda: /me
    const meFn = new lambda.Function(this, "MeFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "me/handler.handler",
      functionName: `sic-club-vivo-me-${envName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/club-vivo/api")),
      timeout: Duration.seconds(10),
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
      timeout: Duration.seconds(15),
      environment: {
        TENANT_ENTITLEMENTS_TABLE: tenantEntitlementsTable.tableName,
        SIC_DOMAIN_TABLE: sicDomainTable.tableName,
      },
    });

    // Lambda: /sessions
    const sessionsFn = new lambda.Function(this, "SessionsFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "sessions/handler.handler",
      functionName: `sic-club-vivo-sessions-${envName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/club-vivo/api")),
      timeout: Duration.seconds(15),
      environment: {
        TENANT_ENTITLEMENTS_TABLE: tenantEntitlementsTable.tableName,
        SIC_DOMAIN_TABLE: sicDomainTable.tableName,
        PDF_BUCKET_NAME: sessionPdfBucket.bucketName,
        PDF_URL_TTL_SECONDS: "300",
      },
    });

    // Lambda: /memberships
    const membershipsFn = new lambda.Function(this, "MembershipsFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "memberships/handler.handler",
      functionName: `sic-club-vivo-memberships-${envName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/club-vivo/api")),
      timeout: Duration.seconds(15),
      environment: {
        TENANT_ENTITLEMENTS_TABLE: tenantEntitlementsTable.tableName,
        SIC_DOMAIN_TABLE: sicDomainTable.tableName,
      },
    });

    // Lambda: /session-packs
    // NOTE: Session packs are stateless today (no domain table needed). Keep env minimal.
    const sessionPacksFn = new lambda.Function(this, "SessionPacksFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "session-packs/handler.handler",
      functionName: `sic-club-vivo-session-packs-${envName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/club-vivo/api")),
      timeout: Duration.seconds(15),
      environment: {
        TENANT_ENTITLEMENTS_TABLE: tenantEntitlementsTable.tableName,
      },
    });

    // NEW: /exports/domain (domain export job; admin-only enforced in handler)
    const exportsDomainFn = new lambda.Function(this, "ExportsDomainFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "exports-domain/handler.handler",
      functionName: `sic-club-vivo-exports-domain-${envName}`,
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../services/club-vivo/api")),
      timeout: Duration.seconds(30),
      environment: {
        TENANT_ENTITLEMENTS_TABLE: tenantEntitlementsTable.tableName,
        SIC_DOMAIN_TABLE: sicDomainTable.tableName,
        DOMAIN_EXPORT_BUCKET: domainExportBucket.bucketName,
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

    // Entitlements: explicit allow-list for /sessions (NO Scan)
    sessionsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:DescribeTable", "dynamodb:BatchGetItem"],
        resources: [tenantEntitlementsTable.tableArn],
      })
    );

    // Entitlements: explicit allow-list for /memberships (NO Scan)
    membershipsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:DescribeTable", "dynamodb:BatchGetItem"],
        resources: [tenantEntitlementsTable.tableArn],
      })
    );

    // Entitlements: explicit allow-list for /exports/domain (NO Scan)
    exportsDomainFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:DescribeTable", "dynamodb:BatchGetItem"],
        resources: [tenantEntitlementsTable.tableArn],
      })
    );

    // S3: session PDFs (existing behavior; consider tightening later to a prefix)
    sessionsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:GetObject"],
        resources: [sessionPdfBucket.arnForObjects("*")],
      })
    );

    // S3: domain exports — PUT ONLY to exports/domain/*
    exportsDomainFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: [domainExportBucket.arnForObjects("exports/domain/*")],
      })
    );

    // Entitlements: explicit allow-list for /session-packs (NO Scan)
    sessionPacksFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:DescribeTable", "dynamodb:BatchGetItem"],
        resources: [tenantEntitlementsTable.tableArn],
      })
    );

    // Domain table: explicit allow-list (NO Scan)
    const domainReadWriteActions = [
      // reads
      "dynamodb:Query",
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
      "dynamodb:DescribeTable",
      // writes
      "dynamodb:PutItem",
    ];

    // Keep TransactWriteItems only where truly needed (leave existing behavior for now)
    const domainReadWriteActionsWithTransact = [...domainReadWriteActions, "dynamodb:TransactWriteItems"];

    athletesFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: domainReadWriteActionsWithTransact,
        resources: [sicDomainTable.tableArn],
      })
    );

    sessionsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: domainReadWriteActionsWithTransact,
        resources: [sicDomainTable.tableArn],
      })
    );

    // Memberships v1 does not use transactions; keep permission tight
    membershipsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: domainReadWriteActions,
        resources: [sicDomainTable.tableArn],
      })
    );

    // Exports only need reads from domain table (keep tight)
    const domainReadActions = ["dynamodb:Query", "dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:DescribeTable"];

    exportsDomainFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: domainReadActions,
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

    // Routes: /sessions
    api.addRoutes({
      path: "/sessions",
      methods: [apigwv2.HttpMethod.POST, apigwv2.HttpMethod.GET],
      integration: new apigwv2Integrations.HttpLambdaIntegration("SessionsIntegration", sessionsFn),
      authorizer,
    });

    api.addRoutes({
      path: "/sessions/{sessionId}",
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2Integrations.HttpLambdaIntegration("SessionByIdIntegration", sessionsFn),
      authorizer,
    });

    api.addRoutes({
      path: "/sessions/{sessionId}/pdf",
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2Integrations.HttpLambdaIntegration("SessionPdfIntegration", sessionsFn),
      authorizer,
    });

    // Routes: /memberships
    api.addRoutes({
      path: "/memberships",
      methods: [apigwv2.HttpMethod.POST, apigwv2.HttpMethod.GET],
      integration: new apigwv2Integrations.HttpLambdaIntegration("MembershipsIntegration", membershipsFn),
      authorizer,
    });

    // Routes: /session-packs
    api.addRoutes({
      path: "/session-packs",
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwv2Integrations.HttpLambdaIntegration("SessionPacksIntegration", sessionPacksFn),
      authorizer,
    });

    // NEW: Routes: /exports/domain
    api.addRoutes({
      path: "/exports/domain",
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwv2Integrations.HttpLambdaIntegration("ExportsDomainIntegration", exportsDomainFn),
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

    // Lake outputs (FIX: use imported CfnOutput, not cdk.CfnOutput)
    new CfnOutput(this, "LakeBucketName", {
      value: lakeBucket.bucketName,
      exportName: `LakeBucketName-${envName}`,
    });

    new CfnOutput(this, "LakeBucketArn", {
      value: lakeBucket.bucketArn,
      exportName: `LakeBucketArn-${envName}`,
    });

    // -----------------------------
    // Observability: athlete create metric filters + alarm
    // -----------------------------
    const athletesLogGroup = logs.LogGroup.fromLogGroupName(
      this,
      "AthletesFnLogGroup",
      `/aws/lambda/${athletesFn.functionName}`
    );

    const sessionsLogGroup = logs.LogGroup.fromLogGroupName(
      this,
      "SessionsFnLogGroup",
      `/aws/lambda/${sessionsFn.functionName}`
    );

    const sessionPacksLogGroup = logs.LogGroup.fromLogGroupName(
      this,
      "SessionPacksFnLogGroup",
      `/aws/lambda/${sessionPacksFn.functionName}`
    );

    // NEW: ExportsDomain log group (for metric filters + alarms)
    const exportsDomainLogGroup = logs.LogGroup.fromLogGroupName(
      this,
      "ExportsDomainFnLogGroup",
      `/aws/lambda/${exportsDomainFn.functionName}`
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

    new logs.MetricFilter(this, "SessionCreateSuccessMetricFilter", {
      logGroup: sessionsLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "session_create_success",
      filterPattern: logs.FilterPattern.literal('{ $.eventType = "session_created" }'),
      metricValue: "1",
    });

    new logs.MetricFilter(this, "SessionPackSuccessMetricFilter", {
      logGroup: sessionPacksLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "session_pack_success",
      filterPattern: logs.FilterPattern.literal('{ $.eventType = "pack_generated_success" }'),
      metricValue: "1",
    });

    new logs.MetricFilter(this, "PdfExportSuccessMetricFilter", {
      logGroup: sessionsLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "pdf_export_success",
      filterPattern: logs.FilterPattern.literal('{ $.eventType = "session_pdf_exported" }'),
      metricValue: "1",
    });

    new logs.MetricFilter(this, "PdfExportFailureMetricFilter", {
      logGroup: sessionsLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "pdf_export_failure",
      filterPattern: logs.FilterPattern.literal('{ $.eventType = "pdf_export_failed" }'),
      metricValue: "1",
    });

    new logs.MetricFilter(this, "SessionsHandlerErrorMetricFilter", {
      logGroup: sessionsLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "handler_error",
      filterPattern: logs.FilterPattern.literal('{ $.level = "ERROR" && $.eventType = "handler_error" }'),
      metricValue: "1",
    });

    new logs.MetricFilter(this, "SessionPacksHandlerErrorMetricFilter", {
      logGroup: sessionPacksLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "handler_error",
      filterPattern: logs.FilterPattern.literal('{ $.level = "ERROR" && $.eventType = "handler_error" }'),
      metricValue: "1",
    });

    // NEW: Domain export success metric (log-based)
    new logs.MetricFilter(this, "DomainExportSuccessMetricFilter", {
      logGroup: exportsDomainLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "domain_export_success",
      filterPattern: logs.FilterPattern.literal('{ $.eventType = "domain_export_completed" }'),
      metricValue: "1",
    });

    // NEW: Domain export failure metric (log-based)
    new logs.MetricFilter(this, "DomainExportFailureMetricFilter", {
      logGroup: exportsDomainLogGroup,
      metricNamespace: "SIC/ClubVivo",
      metricName: "domain_export_failure",
      filterPattern: logs.FilterPattern.literal('{ $.level = "ERROR" && $.eventType = "handler_error" }'),
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

    // NEW: Domain export alarms
    const domainExportFailureMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "domain_export_failure",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    new cloudwatch.Alarm(this, "DomainExportFailureAlarm", {
      alarmName: `sic-${envName}-domain-export-failures`,
      alarmDescription: "Domain export failures",
      metric: domainExportFailureMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const domainExportSuccessMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "domain_export_success",
      period: Duration.hours(24),
      statistic: "Sum",
    });

    new cloudwatch.Alarm(this, "DomainExportNoSuccessAlarm", {
      alarmName: `sic-${envName}-domain-export-no-success-24h`,
      alarmDescription: "No successful domain exports in the last 24 hours",
      metric: domainExportSuccessMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    // -----------------------------
    // CloudWatch Dashboard (baseline)
    // -----------------------------
    const dashboard = new cloudwatch.Dashboard(this, "ClubVivoOpsDashboard", {
      dashboardName: `sic-${envName}-ops`,
    });

    const successMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "athlete_create_success",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    const replayMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "athlete_create_idempotent_replay",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    const failureMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "athlete_create_failure",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Athlete Create — Success",
        left: [successMetric],
      }),
      new cloudwatch.GraphWidget({
        title: "Athlete Create — Idempotent Replay",
        left: [replayMetric],
      }),
      new cloudwatch.GraphWidget({
        title: "Athlete Create — Failure",
        left: [failureMetric],
      })
    );

    const coachLoopDashboard = new cloudwatch.Dashboard(this, "ClubVivoCoachLoopDashboard", {
      dashboardName: `sic-club-vivo-${envName}`,
    });

    const sessionCreateSuccessMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "session_create_success",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    const sessionPackSuccessMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "session_pack_success",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    const pdfExportSuccessMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "pdf_export_success",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    const pdfExportFailureMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "pdf_export_failure",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    const handlerErrorMetric = new cloudwatch.Metric({
      namespace: "SIC/ClubVivo",
      metricName: "handler_error",
      period: Duration.minutes(5),
      statistic: "Sum",
    });

    coachLoopDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Session Create Success",
        left: [sessionCreateSuccessMetric],
      }),
      new cloudwatch.GraphWidget({
        title: "Session Pack Success",
        left: [sessionPackSuccessMetric],
      }),
      new cloudwatch.GraphWidget({
        title: "PDF Export Success / Failure",
        left: [pdfExportSuccessMetric, pdfExportFailureMetric],
      }),
      new cloudwatch.GraphWidget({
        title: "Handler Error",
        left: [handlerErrorMetric],
      })
    );

    new cloudwatch.Alarm(this, "PdfExportFailureAlarm", {
      alarmName: `sic-${envName}-pdf-export-failures`,
      alarmDescription: "PDF export failures in dev",
      metric: pdfExportFailureMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
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
