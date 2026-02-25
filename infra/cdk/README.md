# Sports Intelligence Cloud – Auth CDK App

This CDK app will manage the **authentication and identity** layer for the Sports Intelligence Cloud (starting with the Club Vivo pillar).

## Scope of `SicAuthStack`

Planned responsibilities:

- Cognito **User Pool** for end-users (club directors, coaches, athletes).
- Cognito **User Pool Client(s)** for the web frontend.
- Cognito **Groups** that represent roles:
  - `director-group-cv`
  - `coach-group-cv`
  - `athlete-group-cv`
- Custom Cognito attribute for `tenant_id` to support multi-tenant isolation.
- (Later) Cognito **Identity Pool** and IAM roles for direct S3 access from the frontend.
- Stack **outputs** (UserPoolId, ClientId, etc.) that other stacks (API, data) can use to configure API Gateway authorizers.

This app is part of the overall `infra/` layout for the Sports Intelligence Cloud, and must follow the SIC architecture principles (multi-tenant first, security by default, observability is not optional).