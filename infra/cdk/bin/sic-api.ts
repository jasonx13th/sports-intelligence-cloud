#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { SicApiStack } from "../lib/sic-api-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const userPoolId = process.env.SIC_USER_POOL_ID || "placeholder-user-pool-id";
const userPoolClientId =
  process.env.SIC_USER_POOL_CLIENT_ID || "placeholder-user-pool-client-id";

if (!process.env.SIC_USER_POOL_ID || !process.env.SIC_USER_POOL_CLIENT_ID) {
  console.warn(
    "Using placeholder SIC_USER_POOL_ID and/or SIC_USER_POOL_CLIENT_ID for SicApiStack-Dev synth/diff only."
  );
}

new SicApiStack(app, "SicApiStack-Dev", {
  env,
  userPoolId,
  userPoolClientId,
  description:
    "Sports Intelligence Cloud - API (HTTP API + JWT authorizer) for dev environment",
});
