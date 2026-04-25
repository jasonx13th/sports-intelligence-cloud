# SIC Services

This folder contains backend services and auth Lambda source for Sports Intelligence Cloud.

## Important Folders

- `club-vivo/`
  - Backend service area for Club Vivo.
- `auth/`
  - Cognito trigger Lambdas for provisioning and claim enrichment.

## What Belongs Here

- Backend service implementation.
- Lambda handler source.
- Domain logic and repository code.
- Service-level tests and package files.

## What Should Not Go Here

- Frontend app code.
- Product docs.
- CDK stack definitions.
- Historical progress notes.

## Change Rules

- Keep backend runtime behavior in service folders.
- Keep infrastructure resources in `infra/cdk`.
- Do not add client-controlled tenant identity paths.
- Preserve repository/data-access boundaries unless an ADR or explicit architecture decision approves a change.

