# Week 2 — Day 2 — Tenant Isolation + Shared API Guardrails

**Date:** 2026-03-06  
**Goal:** Prove end-to-end tenant isolation at the application layer using a real Cognito JWT, shared API guardrails, and a production-grade tenant context boundary.

---

## Session objective

Build and validate a repeatable request pipeline for Club Vivo APIs:

API Gateway HTTP API → Cognito JWT Authorizer → Lambda → Tenant Context → Body Parse → Validation → Handler

Success criteria:
- ✅ Real JWT auth works end-to-end
- ✅ Tenant context is enforced consistently for every handler
- ✅ Guardrails return deterministic errors (no crashes on bad input)
- ✅ Evidence: curl output + DynamoDB proof + CDK diff/deploy outputs

---

## What was built / changed

### 1) Tenant middleware (Auth boundary)
**File:** `services/club-vivo/api/_lib/tenant-context.js`

**Before:** tenant_id/role/tier were expected from JWT custom claims.  
**After (Path 2):** access token proves identity (`sub`), and **tenant entitlements come from DynamoDB**:
- `userId` ← `claims.sub`
- `role` ← `cognito:groups` (MVP: first group wins)
- `tenantId`, `tier` ← DynamoDB lookup (`TENANT_ENTITLEMENTS_TABLE`)

**Enforcement:**
- Fail-closed when auth claims are missing
- Fail-closed when entitlements record is missing
- Tenant ID must match: `^tenant_[a-z0-9-]{3,}$`

---

### 2) Request validation utility
**File:** `services/club-vivo/api/_lib/validate.js`  
**Use:** `requireFields(body, ["name"])`

---

### 3) Safe JSON parsing utility
**File:** `services/club-vivo/api/_lib/parse-body.js`  
**Use:** `parseJsonBody(event)` returns `400 invalid_json` instead of crashing.

---

### 4) Shared code packaging fix
Packaged the entire API directory so `_lib` is included in all functions.

**Lambda code asset:** `services/club-vivo/api`  
**Handlers:**  
- `me/handler.handler`  
- `test-tenant/handler.handler`

---

### 5) New endpoint added
**Route:** `POST /test-tenant`  
**Lambda:** `TestTenantFn`

Purpose: demonstrate the production request pipeline and tenant boundary.

---

### 6) Entitlements Store (DynamoDB) added
**Stack:** `SicApiStack-Dev`  
**Table:** `sic-tenant-entitlements-dev`  
**PK:** `user_sub` (Cognito `sub`)  
**Attributes:** `tenant_id`, `tier`

**Lambda wiring:**
- `TENANT_ENTITLEMENTS_TABLE` env var set on `TestTenantFn`
- IAM: `TestTenantFn` granted read access

---

## Architecture decision record

### Decision: Path 2 authorization contract (server-side entitlements)
**We chose:** **Access token for authN**, and **DynamoDB entitlements lookup for authZ context**.

**Why:** authorization must be **revocable, auditable, centrally managed**, and not dependent on long-lived JWT claim contents. Entitlements in a DB allow instant upgrades/downgrades/locks without waiting for token expiry and avoid claim drift across clients.

Tenant ID standard:
- `tenant_<slug>-<unique>`  
Example used: `tenant_club-vivo-1234`

---

## Evidence

### A) DynamoDB seed + verification
**Table:** `sic-tenant-entitlements-dev`  
**User sub:** `64a8a4a8-00c1-7051-8508-85d4005cea6c`

Seed:
```bash
aws dynamodb put-item --table-name sic-tenant-entitlements-dev --item "{\"user_sub\":{\"S\":\"64a8a4a8-00c1-7051-8508-85d4005cea6c\"},\"tenant_id\":{\"S\":\"tenant_club-vivo-1234\"},\"tier\":{\"S\":\"dev\"}}"
```

Verify:
```bash
aws dynamodb get-item --table-name sic-tenant-entitlements-dev --key "{\"user_sub\":{\"S\":\"64a8a4a8-00c1-7051-8508-85d4005cea6c\"}}"
```

Expected:
- `tenant_id = tenant_club-vivo-1234`
- `tier = dev`

---

### B) Successful API call (real JWT)
**API URL:** `https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com/`  
**Endpoint:** `POST /test-tenant`

Request (token redacted):
```bash
curl -i -X POST "https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com/test-tenant"   -H "Authorization: Bearer eyJ...REDACTED"   -H "Content-Type: application/json"   -d "{\"name\":\"Jason\"}"
```

Response:
- `HTTP/1.1 200 OK`

```json
{
  "ok": true,
  "tenantId": "tenant_club-vivo-1234",
  "userId": "64a8a4a8-00c1-7051-8508-85d4005cea6c",
  "received": { "name": "Jason" }
}
```

---

## Operational / observability notes

- CloudWatch alarms maintained:
  - HTTP API 4xx / 5xx
  - Lambda errors / throttles for `MeFn` and `TestTenantFn`
- **Pitfall:** Windows CMD `curl` can break headers/tokens and mimic `invalid_token` failures. Fix: run curl as a single line and quote correctly.

---

## Known gaps / planned hardening

1) Add negative test evidence:
- malformed JSON → `400 invalid_json`
- missing field(s) → `400` validation error
- missing entitlements → `403 missing_entitlements`

2) Move role authority into entitlements store (optional), or formalize group→role mapping table.

3) Cost note:
- DynamoDB on-demand reads per request (cheap at dev scale; model cost before scaling).

---

## Certification mapping (covered today)

- **DVA-C02:** API Gateway HTTP API + Lambda integration, env vars, IAM permissions, CloudWatch alarms/log groups, DynamoDB read patterns.
- **AIF-C01:** separation of authN vs authZ, governance via identity + entitlements, least privilege access boundaries.
- **MLA-C01:** multi-tenant isolation discipline applicable to feature stores/training datasets/model access.

---

## Next session (Week 2 — Day 3)

- Add and document negative tests + alarms/metrics behavior under failure
- Write weekly architecture note + LinkedIn post
- Create an ADR for “Tenant Context Contract (Path 2)” and link it from docs
