// infra/cdk/lib/sic-api-stack.ts

import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwv2Authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
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
  }
}