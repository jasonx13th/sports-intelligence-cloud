# Week 2 — Day 3 Notes (Fail-Closed + Deterministic Negative Tests)

## Goal
Finish Week 2 strong by proving the system is **fail-closed** and **consistent**, with **deterministic negative tests** and **ops-grade logs**.

**Targets**
- Consistency: `/me` and `/test-tenant` both use the same `buildTenantContext(event)` path.
- Negative tests (deterministic):
  - malformed JSON → **400** `invalid_json`
  - missing required field(s) → **400** `missing_fields`
  - missing entitlements row → **403** `missing_entitlements`
- Observability: logs show `requestId`, `userId`, `tenantId`, and `error.code` so ops can diagnose quickly.

---

## What we did (and why)

### 1) Stabilized token minting (eliminate random 401s)
**Why:** A **401 Unauthorized** means the request never reached Lambda (API Gateway authorizer rejected it). That blocks all Day 3 negative tests because we can’t reliably hit the Lambda code path.

**How we fixed it**
- Verified AWS identity + region:
  - `aws sts get-caller-identity` (Account: `<redacted-account-id>`)
  - region: `us-east-1`
- Pulled Cognito App Client ID from CloudFormation outputs (source of truth):
  - `aws cloudformation describe-stacks --stack-name <redacted-auth-stack> ...`
  - Found correct client id: `<redacted-client-id>` (we had a typo earlier)
- Fixed PowerShell issues:
  - Password contains `$`, so we had to use single quotes: `'<example-password>'`
  - `--auth-parameters` passed as a single string:
    - `USERNAME=<redacted>,PASSWORD=<redacted>`
- Result: repeatable `initiate-auth` producing valid tokens.
  - Confirmed with token lengths:
    - `ID_TOKEN.Length = 1301`
    - `ACCESS_TOKEN.Length = 1115`

**Outcome:** We eliminated flakiness and removed “random 401” from the loop.

---

### 2) Proved fail-closed behavior for missing entitlements (403)
**Why:** This is the core authorization failure mode. We must prove that if entitlements are missing, the system denies access deterministically.

**How**
- Identified entitlements table from API stack output:
  - `<redacted-entitlements-table>`
- Deleted entitlements row (and later confirmed table empty via scan):
  - `aws dynamodb delete-item ...`
  - `aws dynamodb scan --table-name <redacted-entitlements-table> ...` → `Count: 0`
- Called `/me` with a valid JWT:
  - Response: **403** with `error: missing_entitlements`

**Evidence (response)**
- `/me` → `403` `{ "ok": false, "error": "missing_entitlements", ... }`

---

### 3) Enabled deterministic 400 tests by restoring entitlements temporarily
**Why:** `/test-tenant` runs `buildTenantContext(event)` before parsing the JSON body. If entitlements are missing, we always get **403** and never reach JSON parsing/validation.

**How we confirmed root cause**
- Searched repo with recursive PowerShell search (globstar didn’t work reliably on Windows).
- Found the throw site in `tenant-context.js`:
  - `authError(403, "missing_entitlements", "No tenant entitlements for user")`

**How we restored entitlements**
- Decoded the `tenant_id` and `sub` from the JWT payload (to know what key we needed).
- Verified DynamoDB key schema:
  - PK = `user_sub`
- Inserted a minimal entitlements row (tenant_id/role/tier required by context builder):
  - Used file-based JSON (`item.json`) to avoid PowerShell quoting problems.
- Verified the row existed using file-based key (`key.json`).

**Outcome:** `/test-tenant` could now pass authZ and reach JSON parsing → deterministic 400s.

---

### 4) Captured deterministic 400 negative tests on `/test-tenant`
**Why:** Prove handler-level input validation is consistent and fail-closed.

**How**
- Malformed JSON body:
  - POST `/test-tenant` with broken JSON
  - Response: **400** `invalid_json`
- Missing required fields:
  - POST `/test-tenant` with `{}` (missing `name`)
  - Response: **400** `missing_fields`

**Evidence (responses)**
- `/test-tenant` malformed JSON → `400` `invalid_json`
- `/test-tenant` `{}` → `400` `missing_fields`

---

### 5) Upgraded observability (structured error logs with context fields)
**Why:** Even with correct behavior, ops needs fast diagnosis: correlate a failure to request/user/tenant and error code.

**What was missing initially**
- Logs had `requestId` + `code`, but did not consistently include `userId` and `tenantId`.

**How we fixed it**
- Updated both handlers to log a consistent structured object:
  - `/me` logs:
    - `requestId`, `userId` (from claims.sub), `tenantId: null`, `code`, `statusCode`
  - `/test-tenant` logs:
    - `requestId`, `userId`, `tenantId` (when buildTenantContext succeeds), `code`, `statusCode`
- Deployed updates:
  - Required fixing PowerShell execution policy (npx blocked):
    - `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
  - `npx cdk deploy <redacted-api-stack>`

**Evidence (CloudWatch logs)**
- `/test-tenant` log now includes:
  - `requestId`, `userId`, `tenantId`, `code: invalid_json`, `statusCode: 400`
- `/me` log now includes:
  - `requestId`, `userId`, `tenantId: null`, `code: missing_entitlements`, `statusCode: 403`

---

## Final State (end of Day 3)
- API is deployed and stable.
- Tokens can be minted repeatably.
- **Fail-closed** posture restored:
  - entitlements table is empty again (`Count: 0`)
- Deterministic negative tests proven:
  - 403 missing_entitlements
  - 400 invalid_json
  - 400 missing_fields
- Logs are ops-grade for debugging:
  - include `requestId`, `userId`, `tenantId` (null when unknown), and `error.code`

---

## What we learned (high signal)
1) **401 vs 403 boundary matters**
   - 401 means authorizer rejected token; Lambda didn’t run → not useful for our negative tests.
   - 403 means token valid and Lambda enforced authZ fail-closed → desired behavior.
2) **CloudFormation outputs are the source of truth**
   - Wrong Cognito client id caused “client does not exist” failures.
3) **PowerShell traps that waste hours**
   - `$` in passwords must be single-quoted: `'<example-password>'`
   - Use file-based JSON (`file://item.json`, `file://key.json`) for DynamoDB CLI to avoid quoting issues.
   - Execution policy can block `npx.ps1` until `RemoteSigned` is set for CurrentUser.
4) **Order of operations in handlers affects which error you see**
   - If `buildTenantContext` runs before body parsing, missing entitlements will mask invalid JSON tests.
   - You must set up state (entitlements present) to test validation paths (400s).
5) **Observability is a feature**
   - Structured error logs with context fields are part of “done,” not optional.

---

## Evidence to include in the repo (checklist)
- [ ] Response: `/me` → 403 missing_entitlements
- [ ] Response: `/test-tenant` → 400 invalid_json
- [ ] Response: `/test-tenant` → 400 missing_fields
- [ ] Log: `/me` shows requestId + userId + tenantId(null) + code
- [ ] Log: `/test-tenant` shows requestId + userId + tenantId + code
- [ ] DynamoDB scan: entitlements table Count: 0

---

## Next steps (Week 3 direction)
- Add metric filters / alarms on `error.code` rates (400/403 spikes).
- Formalize an “error contract” doc for APIs (codes, meanings, and examples).
- Add CI checks for:
  - consistent use of `buildTenantContext(event)`
  - handler log schema presence
