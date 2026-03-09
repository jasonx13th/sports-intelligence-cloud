# Week 2 — Day 2 — Tenant Isolation + Shared API Guardrails

**Date:** 2026-03-06  
**Outcome:** ✅ End-to-end multi-tenant request pipeline works with a real Cognito JWT, and tenant isolation is enforced consistently.

---

## What Day 2 was supposed to accomplish
Build a repeatable, production-style request pipeline for Club Vivo APIs:

**API Gateway HTTP API → Cognito JWT Authorizer → Lambda → Tenant Context → Body Parse → Validation → Handler**

Key requirement: **every request is tenant-scoped and fail-closed**.

---

## What we built (and what’s now true)

### 1) Tenant Context Boundary (Path 2 — DB-backed entitlements)
**File:** `services/club-vivo/api/_lib/tenant-context.js`  
**Now:** tenant context is resolved like this:

- **AuthN (who):** from JWT claims (`sub`)
- **AuthZ context (what tenant/tier/role):** from DynamoDB entitlements table

**Source of truth:**
- `userId` ← `claims.sub`
- `tenantId` ← DynamoDB `tenant_id`
- `tier` ← DynamoDB `tier`
- `role` ← DynamoDB `role` (authoritative)

**Fail-closed rules:**
- missing claims → 401/403
- missing entitlements → `403 missing_entitlements`
- invalid tenant format → `403 invalid_tenant_claim`
- missing role/tier → `403 missing_role_claim` / `403 missing_tier_claim`

Tenant format enforced: `^tenant_[a-z0-9-]{3,}$`

---

### 2) Shared Guardrails (_lib)
Added shared utilities used by handlers:
- `services/club-vivo/api/_lib/parse-body.js` (safe JSON parse → deterministic `400 invalid_json`)
- `services/club-vivo/api/_lib/validate.js` (required fields → consistent `400` errors)

---

### 3) Packaging fix so shared code is always deployed
**CDK:** package the whole `services/club-vivo/api` directory so `_lib` is included.

Handlers standardized:
- `me/handler.handler`
- `test-tenant/handler.handler`

---

### 4) New endpoint to prove the full pipeline
**Route:** `POST /test-tenant`  
**Purpose:** prove tenant boundary + parsing + validation end-to-end.

✅ Successful call returned:
- `tenantId: tenant_club-vivo-1234`
- `userId: 64a8a4a8-00c1-7051-8508-85d4005cea6c`

---

### 5) Tenant entitlements DynamoDB table
**Table:** `sic-tenant-entitlements-dev`  
**PK:** `user_sub`  
**Fields used:** `tenant_id`, `tier`, `role`

**Wiring:**
- `TENANT_ENTITLEMENTS_TABLE` env var added to Lambda(s)
- IAM read permission granted via CDK (`grantReadData`)

---

## Why we chose Path 2 (DB-backed entitlements)
Path 2 is the production contract because it gives you:

- **Instant revocation** (change entitlements without waiting for token expiry)
- **Central authority** (no reliance on client-visible JWT claims)
- **Auditability** (entitlements can be tracked/controlled like real SaaS access control)
- **Stronger tenant isolation** (tenant boundary decisions come from server-side data)

---

## Evidence we captured today
- ✅ Real JWT request succeeds (200 OK) with tenant context resolved
- ✅ Fail-closed behavior verified:
  - delete entitlements → `403 missing_entitlements`
  - bad tenant value → `403 invalid_tenant_claim`
  - missing role field → `403 missing_role_claim`
- ✅ CDK diff/deploy proved infra changes were applied
- ✅ DynamoDB get/put proved entitlements state controls access

---

## Next tasks (Week 2 — Day 3)
1) **Harden consistency**
- Ensure both `/me` and `/test-tenant` use `await buildTenantContext(event)` everywhere.

2) **Add clean “negative test suite” notes**
- malformed JSON → `400 invalid_json`
- missing required field(s) → `400`
- missing entitlements → `403 missing_entitlements`

3) **Observability upgrades**
- structured logs include `requestId`, `userId`, `tenantId`, `error.code`
- add metric filters / alarms for top auth failures (optional but recommended)

4) **Docs**
- Add ADR: “Tenant Context Contract (Path 2)”
- Add Week 2 Day 3 notes after implementing above

---