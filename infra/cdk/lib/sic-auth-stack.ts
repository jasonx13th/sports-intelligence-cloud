import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// NOTE: We'll import actual Cognito/IAM modules later when we implement.
// import * as cognito from 'aws-cdk-lib/aws-cognito';
// import * as iam from 'aws-cdk-lib/aws-iam';

export interface SicAuthStackProps extends cdk.StackProps {
  // Later we can add props like stage ('dev' | 'staging' | 'prod')
  // or domainName for hosted UI, etc.
}

/**
 * SicAuthStack
 *
 * High-level responsibilities:
 * - Cognito User Pool for SIC end-users (Club Vivo first).
 * - Cognito User Pool Client(s) for the web frontend.
 * - Cognito Groups for roles (director, coach, athlete).
 * - Custom attribute for tenant_id in Cognito.
 * - (Optional later) Identity Pool and IAM roles for direct S3 access.
 */
export class SicAuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: SicAuthStackProps) {
    super(scope, id, props);

    // (All the TODO / PSEUDO-CODE comments go here, like we had before.)
  }
}