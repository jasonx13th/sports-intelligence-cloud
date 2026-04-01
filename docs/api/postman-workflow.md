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
- `tenantId` appears only in the negative test for `POST /session-packs - invalid body` to verify unknown-field rejection, never in normal requests

## Auth flow
1. Run `Auth / Get Cognito Token`
2. Post-response script stores:
   - `accessToken`
   - `idToken`
3. Protected folders use `Bearer {{accessToken}}`

## Validated requests
- `GET /me`
- `GET /sessions`
- `GET /sessions/{sessionId}`
- `POST /sessions`
- `GET /sessions - no auth`
- `GET /sessions/{sessionId} - invalid id`
- `POST /session-packs`
- `POST /session-packs - invalid body`

## Before running requests
- Set `{{baseUrl}}` to the local or target API endpoint.
- Set `{{sessionId}}` in the environment before running `GET /sessions/{sessionId}`.
- Run `Auth / Get Cognito Token` again if protected requests start returning `401`.
- Do not add `tenant_id`, `tenantId`, or `x-tenant-id` to any normal request.
- Keep `accessToken` and `idToken` blank in the committed template.

## Negative tests
- `GET /sessions - no auth` verifies the API rejects missing auth with `401`.
- `GET /sessions/{sessionId} - invalid id` verifies the API rejects unknown session IDs with `404`.
- `POST /session-packs - invalid body` verifies the validator rejects unknown fields with `400`.
- In the invalid-body test only, `tenantId` is intentionally included to prove the API rejects client-supplied tenant-like fields.

## Expected security behavior
- Valid `GET /me` returns `200 OK`
- `GET /me` response includes `ok`, `userId`, `tenantId`, `role`, and `tier`
- Missing auth returns `401 Unauthorized`
- Invalid session id returns `404 Not Found`
- Valid `POST /session-packs` returns `201 Created`
- Invalid `POST /session-packs - invalid body` returns `400 Bad Request`
- No client-provided tenant identifier is used in normal requests
