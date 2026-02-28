// infra/cdk/lib/sic-auth-stack.ts

import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class SicAuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Simple env name for naming – we can refine later if we want
    const envName = this.node.tryGetContext('env') ?? 'dev';

    // 1) User Pool
    const userPool = new cognito.UserPool(this, 'SicUserPool', {
      userPoolName: `sic-user-pool-${envName}`,
      signInAliases: {
        email: true,
      },
      selfSignUpEnabled: false, // we’ll control flows later
      passwordPolicy: {
        minLength: 12,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(7),
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      customAttributes: {
        tenant_id: new cognito.StringAttribute({
          mutable: true, // allows controlled tenant moves later if needed
        }),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OFF, // later: OPTIONAL + enforce for cv-admin
    });

    // 2) User Pool Client for Club Vivo web
    const clubVivoWebClient = userPool.addClient('ClubVivoWebClient', {
      userPoolClientName: `club-vivo-web-${envName}`,
      generateSecret: false, // SPA
      preventUserExistenceErrors: true,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: ['http://localhost:3000/callback'], // TODO: replace with real URLs per env
        logoutUrls: ['http://localhost:3000/logout'],
      },
    });

    // 3) Cognito domain (for Hosted UI)
    const domain = userPool.addDomain('ClubVivoDomain', {
      cognitoDomain: {
        // must be globally unique across AWS accounts/regions
        domainPrefix: `club-vivo-${envName}`,
      },
    });

    // 4) Groups (roles)
    new cognito.CfnUserPoolGroup(this, 'CvAdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'cv-admin',
      description: 'Tenant admin / director or solo-coach owner',
    });

    new cognito.CfnUserPoolGroup(this, 'CvCoachGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'cv-coach',
      description: 'Coach within a tenant',
    });

    new cognito.CfnUserPoolGroup(this, 'CvMedicalGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'cv-medical',
      description: 'Medical / performance staff within a tenant',
    });

    new cognito.CfnUserPoolGroup(this, 'CvAthleteGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'cv-athlete',
      description: 'Athlete within a tenant',
    });

    // 4.5) Lambda: PostConfirmation trigger for role assignment
    const postConfirmationFn = new lambda.Function(this, 'PostConfirmationFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler.handler',
      functionName: `sic-post-confirmation-${envName}`,
      code: lambda.Code.fromAsset(
    // infra/cdk/lib -> infra/cdk -> infra -> repo root -> services/...
    path.join(__dirname, '../../../services/auth/post-confirmation'),
  ),
      environment: {
        LOG_LEVEL: 'info',
      },
    });

    // Allow the Lambda to add users to groups in this User Pool
    postConfirmationFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminAddUserToGroup'],
        resources: ['*'], // TEMP: avoids circular dependency; tighten later
      }),
    );

    // Attach Lambda as PostConfirmation trigger
    userPool.addTrigger(
      cognito.UserPoolOperation.POST_CONFIRMATION,
      postConfirmationFn,
    );

    // 5) Outputs for other stacks / frontends
    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: `SicUserPoolId-${envName}`,
    });

    new CfnOutput(this, 'UserPoolArn', {
      value: userPool.userPoolArn,
      exportName: `SicUserPoolArn-${envName}`,
    });

    new CfnOutput(this, 'ClubVivoWebClientId', {
      value: clubVivoWebClient.userPoolClientId,
      exportName: `ClubVivoWebClientId-${envName}`,
    });

    new CfnOutput(this, 'UserPoolDomain', {
      value: domain.baseUrl(),
      exportName: `SicUserPoolDomain-${envName}`,
    });
  }
}