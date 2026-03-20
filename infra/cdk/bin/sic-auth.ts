#!/usr/bin/env node

// Entry point for the Sports Intelligence Cloud CDK app.
// This wires up SicAuthStack + SicApiStack (Auth + API).

import { SicApiStack } from "../lib/sic-api-stack";
import { SicAuthStack } from "../lib/sic-auth-stack";
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

const app = new cdk.App();

// Later we can pass stage (dev/stage/prod) via context or env vars.
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Auth stack (dev)
new SicAuthStack(app, "SicAuthStack-Dev", {
  env,
  description: "Sports Intelligence Cloud - Auth (Cognito & IAM) for dev environment",
});

// API stack (dev) — inject sensitive IDs via environment variables (NOT committed)
const userPoolId = process.env.SIC_USER_POOL_ID;
const userPoolClientId = process.env.SIC_USER_POOL_CLIENT_ID;

if (!userPoolId || !userPoolClientId) {
  throw new Error(
    "Missing required env vars for CDK deploy: SIC_USER_POOL_ID and/or SIC_USER_POOL_CLIENT_ID"
  );
}

new SicApiStack(app, "SicApiStack-Dev", {
  env,
  userPoolId,
  userPoolClientId,
  description:
    "Sports Intelligence Cloud - API (HTTP API + JWT authorizer) for dev environment",
});
