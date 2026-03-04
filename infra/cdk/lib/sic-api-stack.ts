// infra/cdk/lib/sic-api-stack.ts

import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwv2Authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export interface SicApiStackProps extends StackProps {
  readonly userPoolId: string;
  readonly userPoolClientId: string;
}

export class SicApiStack extends Stack {
  constructor(scope: Construct, id: string, props: SicApiStackProps) {
    super(scope, id, props);

    const envName = this.node.tryGetContext('env') ?? 'dev';

    // Lambda: /me
    const meFn = new lambda.Function(this, 'MeFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      functionName: `sic-club-vivo-me-${envName}`,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../../services/club-vivo/api/me'),
      ),
    });

    // HTTP API
    const api = new apigwv2.HttpApi(this, 'ClubVivoHttpApi', {
      apiName: `sic-club-vivo-api-${envName}`,
    });

    // Access logs for HTTP API (required for ops + later metric filters)
    const apiAccessLogs = new logs.LogGroup(this, 'ClubVivoHttpApiAccessLogs', {
      logGroupName: `/aws/apigwv2/sic-club-vivo-api-${envName}`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Enable access logging (structured JSON) on default stage
    const defaultStage = api.defaultStage;
    if (defaultStage) {
      const cfnStage = defaultStage.node.defaultChild as apigwv2.CfnStage;
      cfnStage.accessLogSettings = {
        destinationArn: apiAccessLogs.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          responseLength: '$context.responseLength',
          integrationError: '$context.integrationErrorMessage',
        }),
      };
    }

    // Cognito JWT Authorizer
    const authorizer = new apigwv2Authorizers.HttpJwtAuthorizer(
      'ClubVivoJwtAuth',
      `https://cognito-idp.${Stack.of(this).region}.amazonaws.com/${props.userPoolId}`,
      {
        jwtAudience: [props.userPoolClientId],
      },
    );

    // Route: GET /me
    api.addRoutes({
      path: '/me',
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2Integrations.HttpLambdaIntegration('MeIntegration', meFn),
      authorizer,
    });

    new CfnOutput(this, 'ClubVivoApiUrl', {
      value: api.url ?? 'unknown',
      exportName: `ClubVivoApiUrl-${envName}`,
    });

    // --- CloudWatch Alarms (minimum viable) ---

    // Lambda: Errors
    new cloudwatch.Alarm(this, 'MeFnErrorsAlarm', {
      alarmName: `sic-${envName}-mefn-errors`,
      metric: meFn.metricErrors({ period: Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // Lambda: Throttles
    new cloudwatch.Alarm(this, 'MeFnThrottlesAlarm', {
      alarmName: `sic-${envName}-mefn-throttles`,
      metric: meFn.metricThrottles({ period: Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // API Gateway V2 (HTTP API) metrics
    const apiId = api.apiId;

    // 4XX
    new cloudwatch.Alarm(this, 'HttpApi4xxAlarm', {
      alarmName: `sic-${envName}-httpapi-4xx`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4xx',
        dimensionsMap: { ApiId: apiId },
        period: Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
    });

    // 5XX
    new cloudwatch.Alarm(this, 'HttpApi5xxAlarm', {
      alarmName: `sic-${envName}-httpapi-5xx`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5xx',
        dimensionsMap: { ApiId: apiId },
        period: Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
    });
  }
}