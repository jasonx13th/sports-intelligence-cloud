# Week 3 Day 4 — Session Plan + Closeout Summary (SIC)

> **Context:** This was an extra “Day 4” beyond the roadmap. Focus was operational maturity: auditability mindset, fail-closed tenancy, and observable system behavior.

---

## Session Plan (What we set out to do today)

### Session objective
Ship a production-minded ops baseline and validate SIC’s **fail-closed multi-tenant** behavior end-to-end:
- Remove insecure/temporary endpoints.
- Establish dashboard-level operational signals.
- Validate auth → entitlements → tenant context → data access.
- Standardize API contract (pagination naming).
- Capture architectural contracts in docs.

### Concept mastery (what we practiced while building)
- **Fail-closed tenancy**: no entitlements → no access; invalid tenant_id → no access.
- **Operational signals** vs logs:
  - Logs are verbose evidence; signals are actionable counters/trends.
- **Idempotency as a production contract**: repeat-safe writes with deterministic replay behavior.
- **Contract-driven engineering**:
  - Tenant ID format is a contract.
  - Pagination token naming is a contract.
  - Required request fields are a contract.

### Architecture thinking prompt (design before code)
- Identify “control points” where tenancy can break:
  1) Auth claims extraction
  2) Entitlements lookup
  3) Tenant id format validation
  4) Data-layer scoping (PK = TENANT#<tenantId>)
- Identify “signal points” for ops:
  - create success / replay / failure counters
  - alarms for failure thresholds
  - dashboards to visualize recent behavior

### Implementation plan (incremental execution)
1) **Cleanup**
   - Remove `/test-tenant` endpoint + wiring (route, lambda, IAM, alarms, handler).
2) **Ops baseline**
   - Add CloudWatch dashboard `sic-dev-ops` with 3 domain metrics:
     - `athlete_create_success`
     - `athlete_create_idempotent_replay`
     - `athlete_create_failure`
3) **Deploy + validate**
   - Deploy updated API stack (dev).
   - Force real traffic through API to generate metrics.
4) **Contract standardization**
   - Standardize pagination request param to `nextToken` (accept `cursor` temporarily as alias).
   - Update API docs.
5) **Document tenancy contract**
   - Add tenant_id format validation contract to architecture docs.

### Production hardening checklist (what “done” included)
- **Security:** remove non-prod/test endpoints.
- **Observability:** dashboard exists and shows real datapoints.
- **Cost awareness:** CloudWatch metrics/alarms/log ingestion costs noted; DynamoDB PAY_PER_REQUEST scaling awareness.
- **Failure-mode thinking:** confirm the system fails closed and errors are explicit (`missing_entitlements`, `invalid_tenant_id`, etc).

### Stress test questions (answered by execution)
- What happens with **no JWT**? → 401 Unauthorized (API Gateway/JWT authorizer)
- What happens with **JWT but no entitlements**? → 403 `missing_entitlements`
- What happens with **invalid tenant_id format**? → 403 `invalid_tenant_id`
- What happens with **missing Idempotency-Key**? → 400 `invalid_request`
- What happens with **missing required fields**? → 400 `missing_fields`

---

## Closeout Summary (What we shipped today)

### What we built
- Removed `/test-tenant` endpoint end-to-end.
- Added CloudWatch dashboard baseline (`sic-dev-ops`) for create success/replay/failure signals.
- Deployed to `SicApiStack-Dev` and validated operational signals with real traffic.
- Standardized pagination token naming to `nextToken` (with temporary `cursor` alias).
- Documented the tenant_id format contract in architecture docs.

### Files changed (high level)
- `infra/cdk/lib/sic-api-stack.ts`
  - Remove `/test-tenant` route/lambda/IAM/alarms
  - Add dashboard `sic-<env>-ops`
- `services/club-vivo/api/athletes/handler.js`
  - Accept `nextToken` + `cursor` alias; pass to repo as `nextToken`
- `docs/api/athletes.md`
  - Use `nextToken` as the primary pagination parameter; document `cursor` alias
- `docs/architecture/tenancy-model.md`
  - Document tenant_id format contract and error behavior

### Deployment / validation evidence
- Deployed:
  - `npx cdk deploy SicApiStack-Dev -c env=dev`
- Output API base URL (dev):
  - `https://ekth4bq6ze.execute-api.us-east-1.amazonaws.com/`
- Dashboard:
  - `sic-dev-ops` visible in CloudWatch Dashboards.
- Verified behavior:
  - POST `/athletes` **201 Created** on first write (`replayed:false`)
  - POST `/athletes` **200 OK** on replay (`replayed:true`)
  - Dashboard shows datapoints after refresh (success/replay/failure).

### Errors encountered + fixes (learning highlights)
- **CDK CLI app not found** when running from repo root:
  - Fixed by running from `infra/cdk` where `cdk.json` defines the app.
- **PowerShell curl alias** issues (`curl` → `Invoke-WebRequest`):
  - Fixed by using `curl.exe` explicitly and file-based payloads.
- **Entitlements missing**:
  - Created entitlement record in `sic-tenant-entitlements-dev` keyed by `user_sub`.
- **Tenant id invalid**:
  - Updated entitlement `tenant_id` to match contract: `^tenant_[a-z0-9-]{3,}$`.
- **Idempotency required**:
  - Added `Idempotency-Key` header.
- **Required field missing**:
  - Sent `displayName` to satisfy request contract.

### Decisions made (ADR triggers)
- **Pagination contract:** Standardize on `nextToken` (AWS-aligned); accept `cursor` temporarily for back-compat.
- **Tenant id contract:** Enforce strict format in `buildTenantContext(event)`; document regex and examples.
- **Ops baseline:** Start with domain signals (success/replay/failure) before expanding infra health metrics.

### Observability / security / cost notes
- **Observability:** domain-level metric filters + dashboard provide quick health readout for core mutation.
- **Security:** removing `/test-tenant` eliminates isolation bypass risk surface.
- **Cost:** CloudWatch dashboards/alarms/logs scale with usage; DynamoDB PAY_PER_REQUEST scales with traffic and idempotency/audit writes.

### Commits (evidence)
- `2197c67` — `chore(api): remove /test-tenant endpoint`
- `bfd1c5b` — `ops(cloudwatch): add ops dashboard baseline`
- `3032ef5` — `refactor(api): standardize pagination token as nextToken`
- `7d8d35b` — `docs(tenancy): document tenant_id format contract`

### Next session starting point
Choose one next:
1) **Audit events v1**: dedicated audit table + `emitAuditEvent()` wired to all mutations.
2) **Alarms baseline expansion**: API 5xx, Lambda duration p95, DynamoDB throttles, auth failure spike.
3) **Dev tooling**: safe local scripts for token minting + API calls (no manual console steps).

### Certification mapping (DVA-C02 + MLA-C01 + AIF-C01)
- **DVA-C02:** CDK deploy/diff mindset, Lambda/API Gateway troubleshooting, CloudWatch dashboards/alarms, DynamoDB access patterns, and operational debugging.
- **MLA-C01:** monitoring foundations and secure data access patterns that later support ML pipelines (lineage hooks, governance, ops readiness).
- **AIF-C01:** governance-by-design behaviors (tenant isolation, access control, audit-ready architecture) foundational for responsible AI systems.

---