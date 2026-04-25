# SIC Auth Lambdas

`services/auth` contains Cognito trigger Lambda source for Sports Intelligence Cloud.

## Important Folders

- `post-confirmation/`
  - Cognito Post Confirmation trigger.
  - Provisions default group membership and tenant entitlement records.
- `pre-token-generation/`
  - Cognito Pre Token Generation trigger.
  - Adds tenant, role, and tier claims when tenant data is available.

## What Belongs Here

- Auth trigger Lambda source.
- Auth trigger tests.
- Auth trigger package files.

## What Should Not Go Here

- Frontend login route code.
- API Gateway handler code.
- CDK stack definitions.
- Product docs.

## Tests

Post-confirmation tests are present.

From the repo root:

```powershell
npm test --prefix services/auth/post-confirmation
```

## Change Rules

- Auth, tenancy, entitlement, and claim-shape changes require deliberate architecture review.
- Keep tenant entitlement provisioning fail-closed and idempotent.
- Do not introduce client-controlled tenant identity.
- Keep Cognito resource definitions in `infra/cdk`.

