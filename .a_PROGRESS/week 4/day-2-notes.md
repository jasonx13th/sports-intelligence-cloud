## Week 4 Day 2 — Closeout Summary  
**Theme:** Reliability Patterns + Error Contract (4XX vs 5XX)  
**Outcome:** Deterministic, platform-wide error envelope + verified reliability behaviors (bad input, missing entitlements, idempotency replay).

---

### What we built
- **Platform error contract** implemented (code + docs):
  - Standard error envelope: `error { code, message, retryable, details? } + correlationId + requestId`
  - Deterministic 4XX vs 5XX mapping via typed errors
- **Wrapper hardening (`withPlatform`)**
  - All error paths now go through `toErrorResponse()`
  - Correlation headers always returned on post-authorizer errors
  - Added Lambda proxy compatibility hardening (`isBase64Encoded=false`, body string normalization)
- **Tenant context reliability**
  - Fail-closed tenancy enforcement now throws typed errors:
    - 401 for missing/invalid auth context (post-authorizer scope)
    - 403 for authenticated-but-not-entitled (missing entitlements)
- **Athletes endpoints now use the contract**
  - Bad input returns deterministic 400 envelope
  - Not found returns deterministic 404 envelope
  - Misconfig returns deterministic 500 envelope (safe message)
  - Idempotency replay behavior preserved (no duplicate writes)

---

### Files changed (high-level)
- `services/club-vivo/api/_lib/errors.js` *(new)* — typed error classes + `toErrorResponse()`
- `services/club-vivo/api/_lib/with-platform.js` — standardized error handling + proxy response hardening
- `services/club-vivo/api/_lib/tenant-context.js` — typed 401/403/500 failures (fail-closed)
- `services/club-vivo/api/athletes/handler.js` — typed 400/404/500; removed legacy ad-hoc errors
- `docs/architecture/platform-error-contract.md` *(new)* — contract + status mapping + retry rules + authorizer scope note

---

### Key decisions made
- **Error taxonomy (namespaced):** `platform.*` for platform errors; domain errors allowed (e.g., `athletes.not_found`)
- **Retry policy is explicit:** clients retry only when `retryable=true` and operation is safe (idempotent for writes)
- **Auth-layer reality documented:** pre-Lambda authorizer 401s may not return contract body/headers; contract guarantees post-authorizer behavior
- **Fail-closed tenant boundary reinforced:** 403 for missing entitlements (authoritative entitlements store)

---

### Validation & evidence (what we proved)
- **400 Bad Request** (missing `Idempotency-Key`) returns deterministic envelope + correlationId + requestId
- **403 Forbidden** (missing entitlements) returns deterministic envelope + correlationId + requestId
- **Idempotency replay** deterministic:
  - first POST `/athletes`: `replayed=false` (created)
  - replay POST same key: `replayed=true` (no duplicate)
- **Logs evidence** confirms correlation chains and replay semantics in CloudWatch Logs Insights

---

### Issues encountered + fixes
- PowerShell `Invoke-WebRequest` error-body capture was misleading (stream consumed); used `Invoke-RestMethod` to reliably confirm body.
- Lambda proxy response nuance: hardened wrapper with `isBase64Encoded=false` and body normalization to reduce integration edge cases.
- Markdown rendering confusion resolved by using VS Code Markdown Preview for tables and keeping status mapping as a standard MD table.

---

### Observability / Security / Cost notes
- **Observability:** correlation headers and structured `handler_error` logs provide deterministic triage paths.
- **Security:** contract enforces safe messages; follow-up recommended to remove/gate any `details` fields that include identifiers (e.g., `userSub`) outside dev.
- **Cost:** contract reduces retry storms by preventing “retry everything”; idempotency makes safe retries feasible for writes.

---

### Next session starting point (Week 4 Day 3)
1) Commit work in clean commits (errors + wrapper + tenant-context + athletes + docs).  
2) Add “Definition of Done” checklist for endpoints (errors + logs + metrics + alarms + cost note).  
3) Update MetricFilters/Alarms to use `eventType` (stop legacy `eventCode`).  
4) Add throttling behavior notes to runbooks (429 handling + client backoff).  

---

### Certification mapping (required)
- **DVA-C02:** Lambda/API error handling, retries/backoff strategy, CloudWatch Logs Insights troubleshooting, API Gateway behaviors, idempotency patterns.  
- **MLA-C01:** production reliability posture for inference/data APIs (deterministic failures, monitoring readiness).  
- **AIF-C01:** safer system behavior via explicit contracts (no sensitive leakage, predictable client guidance).

---