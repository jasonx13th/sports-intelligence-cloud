# Week 5 Day 1 — Closeout Summary
Date: 2026-03-23  
Track: Club Vivo Basic (Coach Tier) → Sessions/Workouts (domain-first)

## Objective
Ship a tenant-safe Sessions domain v1 in Club Vivo:
- `POST /sessions` (create)
- `GET /sessions` (tenant-scoped list, time-ordered, paginated, summary-only)
- `GET /sessions/{sessionId}` (tenant-scoped get-by-id, full payload)

Non-negotiable: tenant identity derived from verified auth + entitlements only (fail closed).

---

## What We Built

### 1) Session validation (strict, fail-closed)
Implemented request validation for session creation:
- Required: `sport`, `ageBand`, `durationMin`, `activities`
- Optional: `objectiveTags`, `clubId`, `teamId`, `seasonId`
- Guardrails:
  - Unknown fields rejected (prevents tenantId injection)
  - Bounds on lengths/counts
  - `sum(activities[].minutes) <= durationMin`

**File:**
- `services/club-vivo/api/_lib/session-validate.js`

---

### 2) Session persistence (DynamoDB single-table, scan-free)
Implemented repository with tenant-partitioned single-table model and scan-free access patterns.

**Data model**
- **Session item**
  - `PK = TENANT#<tenantId>`
  - `SK = SESSION#<createdAtIso>#<sessionId>`
- **Lookup item (get-by-id without scan/GSI)**
  - `PK = TENANT#<tenantId>`
  - `SK = SESSIONLOOKUP#<sessionId>`
  - attributes: `targetPK`, `targetSK`

**Access patterns**
- Create: `TransactWriteItems` writes Session + Lookup atomically with conditional guards.
- List: `Query(PK, begins_with(SK,"SESSION#"))`, `ScanIndexForward=false`, `Limit` clamped, cursor via `LastEvaluatedKey` encoded as `nextToken`.
- Get-by-id: Get lookup → Get session (both tenant-scoped).

**File:**
- `services/club-vivo/api/_lib/session-repository.js`

---

### 3) Sessions handler (routes + contract)
Added handler consistent with existing platform conventions:
- Uses `withPlatform()` wrapper
- Uses `buildTenantContext()` (auth+entitlements derived tenant context)
- Uses `parseJsonBody()`
- Uses `SessionRepository` and `validateCreateSession()`
- Returns summary for list; full payload for get-by-id.

Routes:
- `POST /sessions`
- `GET /sessions`
- `GET /sessions/{sessionId}`

**File:**
- `services/club-vivo/api/sessions/handler.js`

---

### 4) CDK wiring (Lambda + routes + IAM least privilege)
Added Sessions Lambda and routes to `SicApiStack`:
- New Lambda: `SessionsFn` with env:
  - `TENANT_ENTITLEMENTS_TABLE`
  - `SIC_DOMAIN_TABLE`
- New routes:
  - `/sessions` GET + POST
  - `/sessions/{sessionId}` GET
- IAM policies:
  - Entitlements table: explicit allow-list (no Scan)
  - Domain table: allow-list for Query/GetItem/PutItem/TransactWriteItems (+ supporting Describe/BatchGet)

**File:**
- `infra/cdk/lib/sic-api-stack.ts`

---

## Bug Found & Fixed (Production Hardening)
### Issue
Malformed JSON for `POST /sessions` returned **500 platform.internal** (should be 400).

### Fix
Wrapped `parseJsonBody(event)` errors into a typed `BadRequestError` so the platform wrapper returns 400.

### Result
Malformed JSON now returns:
- HTTP **400**
- code: **invalid_json**

---

## Live Validation Evidence (Dev stack)
Stack deployed:
- `SicApiStack-Dev`
- `ClubVivoApiUrl = https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com/`
- `SicDomainTableName = sic-domain-dev`
- `TenantEntitlementsTableName = sic-tenant-entitlements-dev`

### Positive path
- `GET /me` → 200, returns `{ ok: true, userId, tenantId, role, tier }`
- `POST /sessions` → 201, returns session with `sessionId`
- `GET /sessions?limit=10` → 200 summary list (no activities), includes `activityCount`
- `GET /sessions/{sessionId}` → 200 full session including `activities[]`

### Fail-closed proofs
- Unauthenticated `GET /sessions` → **401**
- Malformed JSON POST → **400 invalid_json**
- Body tenant spoof attempt (includes `tenantId`) → **400** with details `{ unknown: ["tenantId"] }`

---

## Commits
- `6182c2b` — feat: add session create validation
- `420bcfe` — feat: add session repository persistence
- `25b16d4` — feat: add sessions routes and handler
- `<ADD_YOUR_FIX_COMMIT_HASH_HERE>` — fix: return 400 for invalid JSON in sessions create

> Note: Replace the placeholder with the actual commit hash for the invalid JSON fix.

---

## Decisions Made
- DynamoDB remains the operational store (tenant-partitioned single-table).
- Get-by-id implemented via lookup item (no scans, no GSI required).
- List endpoint returns summaries only (performance + cost).
- Tenant isolation is enforced from verified auth + entitlements; client input never controls tenant scope.

---

## Observability / Security / Cost Notes
- Security: strict tenant isolation; unknown fields rejected; explicit IAM allow-lists (no Scan).
- Cost: list uses bounded Query; summary responses reduce payload and read costs.
- Observability: existing platform logging used; sessions-specific dashboards/alarms not added yet.

---

## Next Session Starting Point (Week 5 Day 2)
Build Session Pack Generator v1 (deterministic template generation first), then later add PDF/GenAI:
- Add endpoint `POST /session-packs` (or equivalent)
- Validate generated output using `validateCreateSession` before returning
- Optional: decide persistence strategy (stateless vs stored packs)

---

## Certification Mapping
- **DVA-C02:** API Gateway HTTP API routing, Lambda handlers, DynamoDB Query vs Scan, TransactWriteItems, least-privilege IAM, CDK synth/diff/deploy workflow.
- **MLA-C01:** Creating structured, versioned, tenant-scoped training/event data for future analytics and ML pipelines.
- **AIF-C01:** Safe generation prerequisites: bounded inputs, deterministic baseline, audit-ready operational data foundation.
