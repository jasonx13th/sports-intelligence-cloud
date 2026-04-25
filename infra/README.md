# SIC Infrastructure

This folder contains infrastructure-as-code source for Sports Intelligence Cloud.

Infrastructure is not runtime app code. Frontend app code lives under `apps/`, and backend Lambda implementation lives under `services/`.

## Important Folders

- `cdk/`
  - AWS CDK app for SIC API and auth infrastructure.

## What Belongs Here

- Infrastructure-as-code source.
- Infrastructure README files.
- CDK package configuration and stack entrypoints.

## What Should Not Go Here

- Runtime frontend or backend implementation.
- Local CDK outputs.
- Operator scratch files.
- Secrets, credentials, or account-specific private material.

## Change Rules

- Do not move or restructure infrastructure source without explicit architecture approval.
- Keep generated outputs such as `cdk.out/` out of tracked source.
- Review infra changes for IAM, tenancy, auth, observability, and cost impact.

## See Also

- `infra/cdk/README.md`

