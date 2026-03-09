// infra/cdk/lib/sic-auth-stack.ts

import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Stack, StackProps, CfnOutput, Duration, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class SicAuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const envName = this.node.tryGetContext('env') ?? 'dev';

    // Import the entitlements table name exported by SicApiStack
    const tenantEntitlementsTableName = Fn.importValue(
      `TenantEntitlementsTableName-${envName}`,
    );

    // Import a reference to the table so we can grant permissions
    const tenantEntitlementsTable = dynamodb.Table.fromTableName(
      this,
      'ImportedTenantEntitlementsTable',
      tenantEntitlementsTableName,
    );

    // 1) User Pool
    const userPool = new cognito.UserPool(this, 'SicUserPool', {
      userPoolName: `sic-user-pool-${envName}`,
      signInAliases: { email: true },
      selfSignUpEnabled: false,
      passwordPolicy: {
        minLength: 12,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(7),
      },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      customAttributes: {
        tenant_id: new cognito.StringAttribute({ mutable: true }),
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
        flows: { authorizationCodeGrant: true },
        callbackUrls: ['http://localhost:3000/callback'],
        logoutUrls: ['http://localhost:3000/logout'],
      },
    });

    // 3) Cognito domain (for Hosted UI)
    const domain = userPool.addDomain('ClubVivoDomain', {
      cognitoDomain: {
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

    // 4.5) Lambda: PostConfirmation trigger for default role assignment
    const postConfirmationFn = new lambda.Function(this, 'PostConfirmationFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      functionName: `sic-post-confirmation-${envName}`,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../../services/auth/post-confirmation'),
      ),
      environment: {
        LOG_LEVEL: 'info',
        TENANT_ENTITLEMENTS_TABLE: tenantEntitlementsTableName,
      },
    });

    // Allow PostConfirmation to write entitlements
    tenantEntitlementsTable.grantWriteData(postConfirmationFn);

    // Least privilege: scoped to this user pool only (tighten resources later)
    postConfirmationFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminAddUserToGroup'],
        resources: ['*'],
      }),
    );

    // 4.6) Lambda: Pre Token Generation trigger (inject tenant_id claim into JWT)
    const preTokenGenerationFn = new lambda.Function(this, 'PreTokenGenerationFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      functionName: `sic-pre-token-generation-${envName}`,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../../services/auth/pre-token-generation'),
      ),
      environment: {
        LOG_LEVEL: 'info',
      },
    });

    // Attach triggers
    userPool.addTrigger(
      cognito.UserPoolOperation.POST_CONFIRMATION,
      postConfirmationFn,
    );

    userPool.addTrigger(
      cognito.UserPoolOperation.PRE_TOKEN_GENERATION,
      preTokenGenerationFn,
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