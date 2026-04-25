# SIC CDK App

`infra/cdk` contains the AWS CDK source for Sports Intelligence Cloud infrastructure.

Infrastructure code belongs here. Runtime frontend and backend source code belongs in `apps/` and `services/`.

## Important Files

- `bin/sic-api.ts`
  - CDK entrypoint for the API stack.
- `bin/sic-auth.ts`
  - CDK entrypoint for the auth stack and optional API stack composition.
- `lib/sic-api-stack.ts`
  - Defines the Club Vivo HTTP API, API Lambda functions, DynamoDB tables, S3 bucket, Bedrock permission, IAM grants, CloudWatch logs, dashboards, and alarms.
- `lib/sic-auth-stack.ts`
  - Defines Cognito user pool, app client, hosted domain, groups, and auth trigger Lambdas.
- `package.json`
  - CDK build/synth/deploy scripts.

## Commands

From `infra/cdk`:

- `npm run build`
  - Compile TypeScript.
- `npm run synth`
  - Build and synthesize CDK.
- `npm run diff`
  - Build and show CDK diff.
- `npm run deploy`
  - Build and deploy.

## What Belongs Here

- CDK stack source.
- CDK entrypoints.
- Infrastructure package configuration.

## What Should Not Go Here

- Runtime app code.
- Lambda handler implementation changes outside CDK packaging needs.
- Local CDK outputs or operator artifacts.
- Secrets or environment-specific credentials.

## Change Rules

- Do not move or restructure CDK source without explicit architecture approval.
- Infrastructure changes should be reviewed for auth, tenancy, IAM, data, cost, and observability impact.
- Keep generated outputs such as `cdk.out/` and verification synth/deploy output directories out of tracked source.
