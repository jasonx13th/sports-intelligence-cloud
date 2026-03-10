# Week 3 — Day 1 Unified Closeout Summary (including pre–Day 1 work)

This closeout merges the **Pre-session (before Week 3 Day 1)** progress and the **Week 3 Day 1** outcomes into one consolidated record.

---

## What we built

### A) VS Code guardrails (pre–Day 1)
- Set up `.github/copilot-instructions.md`
- Set up `.github/hooks/sic-hooks.json`
- Verified hooks fire in Copilot output

**Outcome:** In-editor guidance and reminders now reinforce SIC rules (tenant isolation, fail-closed, no unsafe infra changes).

---

### B) Tenant entitlements onboarding (pre–Day 1)
**Problem:** API required an entitlements row keyed by `claims.sub`, but nothing created it automatically.

**Fixes**
- Updated `SicAuthStack` to:
  - import `TenantEntitlementsTableName-<env>`
  - set `TENANT_ENTITLEMENTS_TABLE` env var on the PostConfirmation Lambda
  - grant DynamoDB write permissions (for entitlements provisioning)

**Provisioning behavior**
- PostConfirmation Lambda now:
  - adds user to `cv-athlete`
  - writes entitlements row `{ user_sub, tenant_id, role, tier }`
  - fail-soft for `UserNotFoundException` during console tests

**Validation**
- `cdk synth` ✅
- `cdk diff` ✅ (only Auth stack changed)
- `cdk deploy SicAuthStack-Dev` ✅
- DynamoDB entitlements row created ✅
- `/me` returns tenant context ✅

---

### C) Tenant-safe DynamoDB repository boundary (Week 3 Day 1)
**`AthleteRepository.listAthletes`** enforces tenant isolation by construction:
- `PK = TENANT#<tenantId>` + `begins_with(SK, "ATHLETE#")`
- Pagination via `nextToken` cursor (`base64(JSON(LastEvaluatedKey))`)
- Deterministic `400 invalid_next_token` (in repo)

---

### D) Fail-closed API path in `/test-tenant` (Week 3 Day 1)
- Added `op: "list_athletes"` flow:
  - Returns deterministic `500 missing_domain_table` until the domain table exists
  - Retains existing `{ "name": "ping" }` behavior

---

### E) Ops-grade logs (Week 3 Day 1)
Confirmed CloudWatch logs include:
- `requestId`, `userId`, `tenantId`, `code`, `statusCode`

This supports deterministic debugging and aligns with “observability is a feature.”

---

## Files changed (high-level)

### Pre–Day 1 (guardrails + entitlements onboarding)
- `.github/copilot-instructions.md`
- `.github/hooks/sic-hooks.json`
- Auth stack + PostConfirmation Lambda updates to provision entitlements (and set `TENANT_ENTITLEMENTS_TABLE`)

### Week 3 Day 1 (data model + repo boundary + handler behavior)
- `docs/architecture/tenancy-model.md`
  - Added env/table contract: `TENANT_ENTITLEMENTS_TABLE`, `SIC_DOMAIN_TABLE`
- `services/club-vivo/api/_lib/athlete-repository.js`
  - New repository packaged correctly for Lambda
- `services/club-vivo/api/test-tenant/handler.js`
  - Added `op` branch + deterministic fail-closed behavior
- Repository file moved/renamed into `_lib`
  - Packaging fix (previous location wasn’t included in Lambda bundle)

---

## Key decisions (architecture)

### Single-table, tenant-partitioned model
- `PK = TENANT#<tenantId>`
- `SK = ATHLETE#<athleteId>` (and similar for other entities)

### Tenant identity source of truth
- Tenant identity remains authoritative from entitlements via `buildTenantContext(event)`
- Tenant id is **never** accepted from client input

---

## Validation evidence run

### Pre–Day 1 (Auth/entitlements)
- `cdk synth` ✅
- `cdk diff` ✅
- `cdk deploy SicAuthStack-Dev` ✅
- Entitlements row created ✅
- `/me` returns tenant context ✅

### Week 3 Day 1 (API + repo boundary)
- `cdk deploy SicApiStack-Dev` ✅
- `/test-tenant` with ACCESS token + `{ "name":"ping" }` ✅ `200`
- `/test-tenant` with `{ "op":"list_athletes" }` ✅ deterministic fail-closed: `missing_domain_table`
- CloudWatch log line ✅ includes request/user/tenant/error code

---

## Open items / next hardening

### 1) Make entitlements creation automatic for real signups
Today we had to backfill via Lambda test because the user was already confirmed and didn’t have `custom:tenant_id` at creation.

Decision needed: true source of `tenant_id` at signup:
- admin-created users?
- invitation flow?
- tenant registry?

### 2) Security tightening (Auth stack)
- Replace `resources: ["*"]` for `cognito-idp:AdminAddUserToGroup` with the specific UserPool ARN
- Add conditional IAM where possible

### 3) Operational discipline
- Add CloudWatch alarm for PostConfirmation errors
- Add runbook entry:
  - “If `/me` returns `missing_entitlements`, check DynamoDB row keyed by `sub`.”

---

## Next session starting point (Week 3 Day 2)
We need to introduce the **domain DynamoDB table** and set `SIC_DOMAIN_TABLE` in the API Lambdas.

This is an infra change → we will do it with explicit approval and show:
- `cdk synth`
- `cdk diff`
- then deploy

---

## Certification mapping

- **DVA-C02:** DynamoDB Query vs Scan, pagination with `LastEvaluatedKey`, Lambda packaging/runtime errors, CloudWatch log-driven debugging, CDK deploy discipline.
- **MLA-C01:** Partitioning strategy groundwork for tenant-scoped datasets (future ML pipelines).
- **AIF-C01:** Governance + access control foundations (fail-closed, authoritative tenant context, auditability via logs).