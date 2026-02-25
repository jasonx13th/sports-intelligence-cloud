#!/usr/bin/env node

// Entry point for the Sports Intelligence Cloud Auth CDK app.
// This wires up the SicAuthStack (Cognito + IAM for Club Vivo and other pillars).

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SicAuthStack } from '../lib/sic-auth-stack';

const app = new cdk.App();

// Later we can pass stage (dev/stage/prod) via context or env vars.
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// For now we just define a dev stack for SIC auth.
new SicAuthStack(app, 'SicAuthStack-Dev', {
  env,
  description:
    'Sports Intelligence Cloud - Auth (Cognito & IAM) for dev environment',
});