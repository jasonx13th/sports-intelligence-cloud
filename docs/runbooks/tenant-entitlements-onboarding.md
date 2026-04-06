# Runbook — Tenant Entitlements Onboarding (Club Vivo)

## Purpose
This runbook explains how SIC provisions and verifies the **tenant entitlements record** required for API tenant isolation.

The SIC API tenant context uses:
- **JWT `claims.sub`** as the canonical user identifier
- A DynamoDB entitlements row keyed by **`user_sub = claims.sub`**
- Authoritative entitlements attributes: `tenant_id`, `role`, `tier`

If entitlements are missing, the API must **fail closed** (403).

---

## Architecture Summary
### Auth → Entitlements provisioning
**Cognito PostConfirmation trigger** provisions entitlements in DynamoDB:

- Reads `custom:tenant_id` from Cognito user attributes
- Assigns user to a default group (e.g., `cv-athlete`)
- Writes entitlements row:
  - `user_sub` (partition key) = user `sub`
  - `tenant_id` = `custom:tenant_id`
  - `role` = derived (default: athlete)
  - `tier` = default (e.g., free)

### API → Tenant context resolution
API handlers call tenant context builder (e.g., `buildTenantContext(event)`), which:
- Reads `claims` from API Gateway JWT authorizer
- Extracts `claims.sub`
- Fetches entitlements with `GetItem(Key: { user_sub: sub })`
- Validates tenantId format and returns `{ tenantId, role, tier, userId, ... }`

---

## Symptoms & Errors
### `/me` or other protected routes return 403
Common error codes (examples):
- `missing_entitlements` (403) — no entitlements row exists for this user
- `missing_tenant_id` / `invalid_tenant_id` — entitlements row missing/invalid tenant id
- `missing_auth_claims` / `missing_sub_claim` — authorizer misconfigured or token invalid

---

## Quick Checks (Fast Triage)
### 1) Confirm JWT has a `sub`
- Ensure API Gateway JWT authorizer is configured for the correct issuer and audience.
- Confirm the calling token includes `sub`.

### 2) Verify DynamoDB entitlements row exists
Open DynamoDB table:
- `sic-tenant-entitlements-<env>`

Query/lookup by partition key:
- `user_sub = <claims.sub>`

Required attributes:
- `tenant_id` (string)
- `role` (string)
- `tier` (string)

### 3) Confirm Cognito user has `custom:tenant_id`
In Cognito user details:
- Ensure `custom:tenant_id` exists and matches the expected format.

---

## Recovery Procedures
### A) Backfill entitlements for an existing confirmed user (one-time)
Use the PostConfirmation Lambda test event to write the entitlements row (safe for backfill):

1) Find user `sub` in Cognito user details.
2) Invoke `sic-post-confirmation-<env>` with a test payload including:
   - `request.userAttributes.sub = <real sub>`
   - `request.userAttributes.custom:tenant_id = <tenant id>`
3) Verify DynamoDB item exists.

> Note: Editing user attributes does **not** re-trigger PostConfirmation automatically once a user is already confirmed.

### B) If PostConfirmation is failing
Check:
- Lambda environment variable: `TENANT_ENTITLEMENTS_TABLE` is set
- Lambda IAM permissions allow writing to the entitlements table
- CloudWatch logs for the PostConfirmation Lambda for errors

---

## Security Notes (Non-negotiable)
- Tenant identity must not come from client input (`body`, `query`, `x-tenant-id`).
- Entitlements table is authoritative; API must fail closed if missing.
- Least privilege: PostConfirmation should have only the minimal DynamoDB permissions required.

---

## Validation Checklist
After changes:
- `cdk synth -c env=<env>`
- `cdk diff -c env=<env>`
- Deploy only after reviewing diffs
- Create a real entitlements row and validate:
  - DynamoDB item exists for `user_sub = claims.sub`
  - `/me` returns `{ ok: true, tenantId, role, tier }`

---

## Pointers (Key Files)
- Infra:
  - `infra/cdk/lib/sic-api-stack.ts` (entitlements table output)
  - `infra/cdk/lib/sic-auth-stack.ts` (PostConfirmation env + table permissions)
- Auth:
  - `services/auth/post-confirmation/handler.js` (writes entitlements)
- API:
  - `services/club-vivo/api/src/platform/tenancy/tenant-context.js` (reads entitlements)
  - `services/club-vivo/api/me/handler.js` (calls tenant context)