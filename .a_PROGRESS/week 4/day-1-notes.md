# Week 4 Day 1 — Closeout Summary
PHASE 4 — PRODUCTION READINESS PASS #1  
Theme: Logging + Correlation + Diagnostic Quality  
Date: 2026-03-16

---

## What we built

### 1) Platform Observability Contract (docs)
A platform-wide contract that standardizes:
- structured JSON logging fields (required/optional)
- correlation + request id semantics
- error semantics (safe client errors + structured error logs)
- initial `eventType` set including domain events for athletes
- CloudWatch Logs Insights evidence queries

**Doc path**
- `docs/architecture/platform-observability.md`

### 2) Shared logger utility (service-local core)
Implemented a CommonJS structured logger with:
- single-line JSON emission
- child logger context enrichment
- correlation id resolver with validation contract (`^[A-Za-z0-9._-]{8,128}$`)
- normalized error logging (`error: { name, code, retryable }`) with safe defaults

**Path**
- `services/club-vivo/api/_lib/logger.js`

### 3) Platform wrapper middleware for Lambdas (“operable by default”)
Created a wrapper that standardizes every handler:
- lifecycle logs: `request_start`, `tenant_context_resolved`, `request_end`
- error log: `handler_error` (structured, normalized)
- correlation propagation and validation (warn on invalid client correlation id)
- response always includes correlation headers
  - `x-correlation-id`
  - `X-Correlation-Id`
- tenant isolation enforcement: `tenantId` not logged until `buildTenantContext` succeeds

**Path**
- `services/club-vivo/api/_lib/with-platform.js`

### 4) Wrapped endpoints
- `/me` handler refactored to use the platform wrapper
  - `services/club-vivo/api/me/handler.js`

- `/athletes` handler refactored to use the platform wrapper + domain eventTypes
  - `services/club-vivo/api/athletes/handler.js`
  - lazy init repository for local require-safety + Lambda container reuse

### 5) Packaging fix for AWS SDK v3 deps (service-local)
Added API-local dependencies required by `_lib/*` modules:
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/util-dynamodb`

**Path**
- `services/club-vivo/api/package.json`
- `services/club-vivo/api/package-lock.json`

### 6) Timeout hardening
Observed `/me` timing out at 3s under cold start + DDB calls; increased timeouts:
- `/me`: 10s
- `/athletes`: 15s

**Path**
- `infra/cdk/lib/sic-api-stack.ts`

### 7) Tenant context diagnostics + apigwRequestId clarity
Added tenant-context diagnostics to pinpoint where tenant resolution time is spent:
- `tenant_context_start`
- `tenant_context_entitlements_loaded` with `ddbLatencyMs`
And clarified `apigwRequestId` in diagnostics to prevent confusion with canonical Lambda `requestId`.

**Path**
- `services/club-vivo/api/_lib/tenant-context.js`

---

## Files changed (high-level)
- `docs/architecture/platform-observability.md`
- `services/club-vivo/api/_lib/logger.js`
- `services/club-vivo/api/_lib/with-platform.js`
- `services/club-vivo/api/_lib/tenant-context.js`
- `services/club-vivo/api/me/handler.js`
- `services/club-vivo/api/athletes/handler.js`
- `services/club-vivo/api/package.json`
- `services/club-vivo/api/package-lock.json`
- `infra/cdk/lib/sic-api-stack.ts`
- `.gitignore` (ignore snapshot zips)
- `.a_PROGRESS/Q&A's/Questions_answers.md` (session notes)

---

## Errors encountered and fixes

### 1) Local module load failures
- `Cannot find module '@aws-sdk/client-dynamodb'`
  - Fix: introduced API-local `package.json` + installed AWS SDK deps.

- Local require failures due to env-required init (`SIC_DOMAIN_TABLE`)
  - Fix: lazy initialize `AthleteRepository` in handler.

### 2) Correlation header not present in HTTP responses
- Initial wrapper added `x-correlation-id` but it didn’t appear in client response headers.
  - Fix: set both `x-correlation-id` and `X-Correlation-Id` in success and error paths.

### 3) `/me` returning 500 due to Lambda timeout
- CloudWatch showed `Status: timeout` at 3000ms.
  - Fix: set explicit Lambda timeouts in CDK (`10s`, `15s`) and redeploy.

### 4) Deployment tooling
- `cdk` command not found on PATH.
  - Fix: run CDK via `npx cdk` from `infra/cdk` (project-local install).

### 5) Cognito Hosted UI redirect mismatch
- Fix: queried allowed CallbackURLs via AWS CLI; used `http://localhost:3000/callback`.

### 6) PowerShell `curl` alias gotcha
- PowerShell aliases `curl` to `Invoke-WebRequest` (different flags).
  - Fix: use `Invoke-RestMethod` for token exchange and `Invoke-WebRequest -UseBasicParsing` for API calls.

---

## Decisions made (ADR triggers / design commitments)

### A) Canonical request identifiers
- `requestId` is canonical Lambda `context.awsRequestId`.
- `apigwRequestId` is logged separately when available.

### B) Correlation policy
- Use valid `x-correlation-id` if present, else fallback to `requestId`.
- On invalid correlation header: log `correlation_invalid` with safe metadata (no echo of raw).

### C) Tenant isolation enforcement
- Tenant identity is backend-derived only (verified auth + entitlements).
- Never accept tenant_id from request body, query, or headers.
- `tenantId` must not appear in logs until tenant context is resolved.

### D) Lifecycle vs domain eventTypes
- Lifecycle eventTypes are owned by wrapper.
- Domain eventTypes live in handler logic (e.g., `athlete_created`, `athlete_listed`, `athlete_fetched`).

---

## Validation and evidence (what we proved)

### API URL (Dev)
- `https://<api-id>.execute-api.us-east-1.amazonaws.com/`

### Correlation propagation
- `/me` returned:
  - `x-correlation-id: abc_def-1234`
  - `X-Correlation-Id: abc_def-1234`

- `/athletes` without client correlation returned generated correlation id.

- Invalid correlation input produced:
  - `correlation_invalid` WARN
  - correlation fallback to requestId-derived correlation id

### Log story completeness
For correlationId `abc_def-1234` we observed (athletes):
- `request_start`
- `tenant_context_resolved`
- `athlete_created` (201, replayed=false)
- `request_end`
and for replay:
- `athlete_created` (200, replayed=true)
- `request_end`

### Latency diagnostics
Tenant context logs included:
- `ddbLatencyMs` for entitlements lookup
- cold-start behavior accounted for by increasing timeouts

---

## Observability / Security / Cost notes

### Observability
- Structured logs are now queryable by:
  - `correlationId`, `requestId`, `apigwRequestId`, `tenantId`, `userId`
- Evidence queries stored in doc:
  - `docs/architecture/platform-observability.md` → “Saved evidence queries (Week 4 Day 1)”

### Security
- Tenant boundary is enforced (fail-closed):
  - `tenantId` derived only from entitlements store
- Sensitive data policy established:
  - never log tokens, Authorization headers, or full request bodies

### Cost
- Lambda timeouts increased to avoid false failures under cold start + DDB.
- Metric filters/alarms already exist, but note: legacy filters rely on `eventCode` (old scheme). We migrated to `eventType`; metric filters should be updated in a later pass.

---

## Commits (chronological, relevant highlights)
- `a4603fb` docs: add platform observability contract
- `6a11fcb` chore: ignore local snapshot zips
- `c2973a4` notes: update session Q&A log
- `ce5fdc0` feat(obs): add structured logger utility
- `f214f34` feat(obs): add correlation id resolver
- `8dd8fdb` feat(obs): normalize structured error logs
- `b526e70` fix(obs): lazy-load tenant context in platform wrapper
- `b723fcf` refactor(obs): wrap me handler with platform middleware
- `d902dd0` chore(api): add aws sdk deps for local dev and packaging
- `e9a4c63` refactor(obs): wrap athletes handler with platform middleware
- `16ca642` chore(obs): align athletes eventTypes with platform contract
- `95efa5b` fix(obs): always return correlation id header
- `8052fca` fix(obs): increase api timeouts and add tenant-context diagnostics
- `af29a05` chore(obs): clarify apigwRequestId in tenant context logs and save insights queries

---

## Next session starting point (Week 4 Day 2)
Focus: reliability + metrics + alarms aligned to new `eventType` contract.

Priority TODOs:
1) Update CloudWatch MetricFilters/Alarms to match `eventType` fields (stop relying on legacy `eventCode`).
2) Decide and document error code taxonomy expansion (domain errors vs platform errors).
3) Add structured `http.method/path/statusCode` consistently for domain events where appropriate (or keep domain events minimal).
4) Consider adopting AWS Lambda Powertools for Node.js (if allowed) or keep lightweight custom logger.

---

## Certification mapping paragraph

### DVA-C02 (Developer Associate)
Implemented operational best practices for serverless:
- standardized structured logging
- correlation and request tracing
- API Gateway + Lambda integration behavior validation
- CloudWatch log groups, metric filters, alarms, dashboard awareness
- deployment via CDK and troubleshooting runtime failures (timeouts, packaging, env config)

### MLA-C01 (Machine Learning Engineer Associate)
Platform groundwork for ML systems:
- multi-tenant identity enforcement (critical for feature stores, inference endpoints, and data partitioning)
- observability contract enabling reliable ML pipeline and inference debugging via correlation IDs and structured logs

### AIF-C01 (AI Fundamentals / Practitioner)
Established safe operational controls foundational to AI systems:
- privacy-safe logging rules (no tokens/PII)
- traceability (correlation IDs) to support accountable debugging and incident response across AI-enabled services

---