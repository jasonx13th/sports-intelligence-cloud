# Week 4 Day 1 — Closeout Summary
PHASE 4 — PRODUCTION READINESS PASS #1  
Theme: Logging + Correlation + Diagnostic Quality  
Date: 2026-03-16

---

## What we built

### 1) Platform Observability Contract (docs)
Standardized, platform-wide contract for:
- structured JSON logging fields (required/optional)
- correlation + requestId semantics
- error semantics (safe client errors + structured error logs)
- initial `eventType` set including domain events for athletes
- CloudWatch Logs Insights evidence queries

**Doc**
- `docs/architecture/platform-observability.md`

### 2) Shared logger utility (service-local)
CommonJS logger utility providing:
- single-line JSON logs to stdout
- child context enrichment
- correlationId resolver + validation (`^[A-Za-z0-9._-]{8,128}$`)
- normalized structured error logging: `error: { name, code, retryable }`

**Code**
- `services/club-vivo/api/_lib/logger.js`

### 3) Platform wrapper middleware (“operable by default”)
Wrapper standardizes every handler:
- lifecycle logs: `request_start`, `tenant_context_resolved`, `request_end`
- structured error logs: `handler_error`
- correlation propagation + invalid correlation handling (`correlation_invalid`)
- response always includes correlation headers:
  - `x-correlation-id`
  - `X-Correlation-Id`
- tenant isolation enforcement: `tenantId` not logged before tenant context resolves

**Code**
- `services/club-vivo/api/_lib/with-platform.js`

### 4) Wrapped endpoints
- `/me` now wrapped:
  - `services/club-vivo/api/me/handler.js`
- `/athletes` now wrapped + uses domain eventTypes + lazy repo init:
  - `services/club-vivo/api/athletes/handler.js`

### 5) Service-local packaging for AWS SDK v3
Added required deps for runtime modules:
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/util-dynamodb`

**Code**
- `services/club-vivo/api/package.json`
- `services/club-vivo/api/package-lock.json`

### 6) Timeout hardening (realistic cold start + DDB)
Observed `/me` timeout at 3s; increased:
- `/me`: 10s
- `/athletes`: 15s

**Infra**
- `infra/cdk/lib/sic-api-stack.ts`

### 7) Tenant context diagnostics + apigwRequestId clarity
Added diagnostics for tenant context resolution:
- `tenant_context_start`
- `tenant_context_entitlements_loaded` incl `ddbLatencyMs`
Clarified API Gateway request id in diagnostics as `apigwRequestId`.

**Code**
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
- `.gitignore`
- `.a_PROGRESS/...` session notes

---

## Errors encountered and fixes

1) **Local module load failures**
- Missing AWS SDK modules (`@aws-sdk/client-dynamodb`)
  - Fix: API-local `package.json` + deps install.
- Local require-time env failures (`SIC_DOMAIN_TABLE`)
  - Fix: lazy init `AthleteRepository`.

2) **Correlation header missing in responses**
- Fix: set both `x-correlation-id` and `X-Correlation-Id` in success + error paths.

3) **/me timing out (3s)**
- Fix: explicit Lambda timeouts (10s/15s) + redeploy.
- Added tenant-context diagnostics to confirm DDB latency.

4) **CDK not on PATH**
- Fix: deploy via `npx cdk` from `infra/cdk`.

5) **Cognito redirect mismatch**
- Fix: read callback URLs via CLI; used `http://localhost:3000/callback`.

6) **PowerShell curl alias**
- Fix: token exchange via `Invoke-RestMethod`; API calls via `Invoke-WebRequest -UseBasicParsing`.

---

## Decisions made (platform commitments)

- `requestId` canonical = Lambda `context.awsRequestId`
- `apigwRequestId` logged separately when available
- `correlationId`:
  - accept validated client `x-correlation-id`
  - otherwise fallback to `requestId`
  - log `correlation_invalid` safely (no echo)
- Tenant isolation enforced:
  - tenantId derived only from verified claims + entitlements
  - never from client input
  - never logged before tenant context resolves
- Lifecycle vs domain events:
  - wrapper owns lifecycle events
  - handlers emit domain events (`athlete_created`, etc.)

---

## Validation and evidence

### Dev API + Logs
- API URL: `https://<api-id>.execute-api.us-east-1.amazonaws.com/`
- Log groups:
  - `/aws/lambda/sic-club-vivo-me-dev`
  - `/aws/lambda/sic-club-vivo-athletes-dev`

### Correlation propagation
- `/me` returns:
  - `x-correlation-id: abc_def-1234`
  - `X-Correlation-Id: abc_def-1234`
- `/athletes` without correlation returns generated id.
- Invalid correlation input triggers:
  - `correlation_invalid` WARN
  - fallback correlationId

### Domain + lifecycle chain (athletes)
For correlationId `abc_def-1234`:
- create: `athlete_created` (201, replayed=false) + `request_end`
- replay: `athlete_created` (200, replayed=true) + `request_end`

### Latency diagnostics
Tenant context logs include `ddbLatencyMs` and show cold-start impact; timeouts adjusted accordingly.

### Evidence queries (saved)
See:
- `docs/architecture/platform-observability.md` → “Saved evidence queries (Week 4 Day 1)”

---

## Cost / Observability / Security notes

### Observability
- Logs are queryable by: `correlationId`, `requestId`, `apigwRequestId`, `tenantId`, `userId`
- Evidence queries are stored in the platform doc.

### Security
- Fail-closed tenant boundary with entitlements as source of truth.
- No credentials/PII logging policy established.

### Cost
- Increased timeouts to reduce false failure rate from cold starts + DDB latency.
- Follow-up required: metric filters still reference legacy `eventCode`; migrate to `eventType`.

---

## Commits (high-level highlights)
- `logger.js` + correlation resolver + normalized error logs
- platform wrapper (`with-platform.js`)
- `/me` + `/athletes` wrapped
- API-local AWS SDK deps
- lambda timeout hardening + diagnostics
- platform doc updated with saved evidence queries
- `apigwRequestId` clarity change deployed

---

## Next session (Week 4 Day 2) starting point
1) Update CloudWatch MetricFilters/Alarms to match `eventType` (stop using legacy `eventCode`).
2) Decide error code taxonomy expansion (platform vs domain error namespace).
3) Formalize a small “operability Definition of Done” checklist for every new endpoint.
4) (Optional) Evaluate Powertools for Node.js vs staying lightweight custom logging.

---

## Certification mapping

### DVA-C02
Serverless operational maturity:
- CloudWatch logging, metrics, alarms
- API Gateway + Lambda integration debugging
- CDK deployments and runtime troubleshooting (timeouts, packaging)

### MLA-C01
Platform foundations for multi-tenant ML systems:
- strict tenant isolation
- traceable request/correlation patterns supporting ML pipelines and inference debugging

### AIF-C01
Operational safety fundamentals:
- privacy-safe logging
- traceability for incident response and accountability