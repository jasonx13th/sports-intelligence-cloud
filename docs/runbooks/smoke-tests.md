# Runbook — Smoke Tests

## Purpose
This runbook explains how to run the repository's manual smoke test workflow and how to obtain a valid API access token safely. It also documents current expected behavior and failure modes.

## Workflow overview
The current smoke test workflow is:

- `.github/workflows/smoke-tests.yml`
- Trigger: `workflow_dispatch`
- Inputs:
  - `base_url` — Base URL for the API, e.g. `https://xxxx.execute-api.us-east-1.amazonaws.com`
  - `token` — Bearer access token provided securely

The smoke job runs `node scripts/smoke/smoke.mjs` using the provided `BASE_URL` and `TOKEN`.

## What the smoke tests verify
The smoke script checks:

- `GET /me` with a valid token returns `200`
- `GET /me` without a token returns `401` or `403`
- a nonexistent route returns `404`

## Access token guidance

### Use an access token, not an id token
- `TOKEN` must be a valid bearer access token.
- An `id_token` may fail because the API expects the runtime authorization flow used by the platform.
- If the token is expired, the API should return `401 Unauthorized`.

### Safety rules for token use
- Do not commit tokens to source control.
- Do not paste tokens into public channels.
- Treat the token as a secret bearer credential.
- Prefer short-lived dev/test tokens stored in a secure vault or local secure note.

### Tenant safety reminder
The smoke tests do not send `tenant_id`, `tenantId`, or `x-tenant-id` in the request. Tenant scope must come from verified auth context and entitlements only.

## Running smoke tests manually in GitHub Actions

1. Open the repository Actions page.
2. Select the `Smoke Tests (manual)` workflow.
3. Click `Run workflow`.
4. Provide:
   - `base_url`
   - `token`
5. Start the workflow and inspect the resulting logs.

## Running smoke tests locally

```bash
cd <repo-root>
BASE_URL="https://xxxx.execute-api.us-east-1.amazonaws.com" TOKEN="Bearer ey..." node scripts/smoke/smoke.mjs
```

If `TOKEN` does not already include the `Bearer ` prefix, the script will add it automatically.

## Expected responses
- Valid token: `GET /me` should return `200`.
- Missing token: `GET /me` should return `401` or `403`.
- Expired token: should return `401`.
- Unknown route: should return `404`.

## Troubleshooting

### If `/me` fails with `401` or `403`
- Confirm the token is an access token, not an id token.
- Confirm the token issuer/audience matches the API's authorizer configuration.
- Confirm the token is not expired.
- Confirm the API base URL is correct and points to the proper stage.

### If the unknown route does not return `404`
- Confirm the base URL is correct.
- Confirm the API Gateway route configuration for the target stage.

### If the workflow fails before tests run
- Inspect the workflow logs for missing input values.
- Confirm `base_url` and `token` were provided in `workflow_dispatch`.

## Commands to run

```bash
cd <repo-root>
BASE_URL="https://xxxx.execute-api.us-east-1.amazonaws.com" TOKEN="Bearer ey..." node scripts/smoke/smoke.mjs
```

## Related runbooks
- `docs/runbooks/ci.md` — CI workflow behavior and debugging.
- `docs/runbooks/how-to-ship.md` — release hygiene and definition of done.
