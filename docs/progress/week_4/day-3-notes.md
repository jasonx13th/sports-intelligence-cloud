# Week 4 Day 3 — Closeout Summary (Operability + Signal Hygiene)

**Theme:** Operability by default — runbooks + signal catalog + logging semantics + public-safe deploy posture  
**Outcome:** Runbooks are runnable, signals are mapped, 4XX vs 5XX semantics are correct in logs, and CDK deploy no longer breaks due to redaction drift.

---

## What we built

### 1) New runbook: Platform 5XX
- Added **`docs/runbooks/platform-5xx.md`**
- Covers: API Gateway 5xx + Lambda Errors + `handler_error` / dependency triage with copy/paste Logs Insights queries.

### 2) Signals catalog now maps to runbooks
- Updated **`docs/architecture/observability-signals.md`**
- Added runbook guidance note and linked:
  - `handler_error`, `dependency_error` → `docs/runbooks/platform-5xx.md`
  - `lambda.errors` → `docs/runbooks/platform-5xx.md`
  - `apigw.5xx` → `docs/runbooks/platform-5xx.md`
  - `athlete_create_failure` → `docs/runbooks/dynamo-throttling.md`

### 3) Logging semantics fix (4XX ≠ handler_error)
- Updated **`services/club-vivo/api/_lib/with-platform.js`**
- New behavior:
  - **4XX** → log **WARN** with eventType `validation_failed` / `auth_*` / `request_failed`
  - **5XX** → log **ERROR** with eventType `handler_error`
- Verified via CloudWatch correlation trace: missing Idempotency-Key returns 400 and **does not emit** `handler_error`.

### 4) Public-safe repo deploy pattern restored
- Updated **`infra/cdk/bin/sic-auth.ts`**
- Removed hardcoded/redacted Cognito identifiers from code.
- CDK now reads:
  - `SIC_USER_POOL_ID`
  - `SIC_USER_POOL_CLIENT_ID`
  - and fails closed if missing.
- Verified via `npx cdk diff SicApiStack-Dev`: **authorizer drift eliminated**, only Lambda code changes remained.

### 5) Repo docs hygiene
- Updated:
  - `README.md`
  - `docs/runbooks/repo-public-safety.md`

---

## Key decisions made
- **Public repo ≠ broken deploys:** never commit real identifiers; inject via env/SSM/secrets at deploy time.
- **Signal semantics are sacred:** `handler_error` reserved for unexpected failures / 5XX; 4XX stays WARN and uses expected-failure eventTypes.

---

## Validation & evidence (what we proved)
- Logs Insights correlation story works end-to-end for requestId/correlationId:
  - `request_start` → `tenant_context_resolved` → `validation_failed` → `validation_failed (request failed)`
  - **No `handler_error`** for 400 after the fix.
- Auth eventTypes query returned **0 matches** in last 3 days (expected; not triggered recently).
- `cdk diff` showed only Lambda code S3Key updates after env injection fix.
- `cdk deploy SicApiStack-Dev` succeeded; API URL confirmed.

---

## Files changed (high-level)
- `docs/architecture/observability-signals.md`
- `docs/runbooks/platform-5xx.md` *(new)*
- `services/club-vivo/api/_lib/with-platform.js`
- `infra/cdk/bin/sic-auth.ts`
- `docs/runbooks/repo-public-safety.md`
- `README.md`

---

## Deployment notes
- CDK CLI used via `npx cdk` (global `cdk` not on PATH).
- Deploy output included:
  - `SicApiStack-Dev.ClubVivoApiUrl`

---

## Commit(s)
- `3ed8775 ops(runbooks): add platform 5xx runbook; link signals; fix 4xx logging; env-inject Cognito ids`

---

## Next session starting point (Week 5 Day 1)
1) Add “Endpoint Definition of Done” checklist doc (errors + logs + metrics + alarms + cost note).
2) Add runbook: **429 / client backoff** (ties into throttling + idempotency).
3) Write infra migration plan (docs/ADR): metric filters from `$.eventCode` → `$.eventType` (approval + `cdk diff` evidence).

---

## Certification mapping (required)
- **DVA-C02:** CloudWatch Logs Insights, Lambda error handling, CDK diff/deploy discipline, retries/backoff and idempotency, operational runbooks.
- **MLA-C01:** production observability and reliability posture for future ML/inference endpoints.
- **AIF-C01:** safer systems via predictable contracts, non-leaky error handling, and documented incident response.
