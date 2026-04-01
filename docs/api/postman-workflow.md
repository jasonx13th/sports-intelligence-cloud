# Postman Workflow

## Purpose
Use Postman in VS Code as the primary API contract validation tool for SIC.

## Workspace
- Workspace: `SIC Platform`
- Collection: `sic-api`
- Environment template: `postman/environments/local.template.json`

## Security rules
- Never commit live secrets, passwords, or tokens
- Never commit the live `local` environment
- Never pass `tenant_id`, `tenantId`, or `x-tenant-id` in requests
- Tenant scope must come from verified auth plus server-side entitlements

## Auth flow
1. Run `Auth / Get Cognito Token`
2. Post-response script stores:
   - `accessToken`
   - `idToken`
3. Protected folders use `Bearer {{accessToken}}`

## Validated requests
- `GET /sessions`
- `GET /sessions/{sessionId}`
- `POST /sessions`
- `GET /sessions - no auth`
- `GET /sessions/{sessionId} - invalid id`

## Before running requests
- Set `{{baseUrl}}` to the local or target API endpoint.
- Set `{{sessionId}}` in the environment before running `GET /sessions/{sessionId}`.
- Do not add `tenant_id`, `tenantId`, or `x-tenant-id` to any request.
- Keep `accessToken` and `idToken` blank in the committed template.

## Negative tests
- `GET /sessions - no auth` verifies the API rejects missing auth with `401`.
- `GET /sessions/{sessionId} - invalid id` verifies the API rejects unknown session IDs with `404`.

## Expected security behavior
- Missing auth returns `401 Unauthorized`
- Invalid session id returns `404 Not Found`
- No client-provided tenant identifier is used
