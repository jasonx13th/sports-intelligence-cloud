# Runbook: Platform 5XX (API Gateway / Lambda / Handler Errors)

## 1) Trigger
- Alarm name(s):
  - `sic-dev-httpapi-5xx` (AWS/ApiGateway 5xx >= 1 in 5 min)
  - `sic-dev-athletesfn-errors` (AWS/Lambda Errors >= 1 in 5 min)
  - `sic-dev-mefn-errors` (AWS/Lambda Errors >= 1 in 5 min)
- Signals (from `docs/architecture/observability-signals.md`):
  - `apigw.5xx`
  - `lambda.errors`
  - `handler_error` (logs.eventType)
  - `dependency_error` (logs.eventType)
  - `ddb_error` (logs.eventType)

## 2) Impact
- Users may see `5xx` responses, timeouts, or degraded latency.
- A sustained 5xx spike is a **platform incident** until proven otherwise.
- Data integrity risk depends on the failing operation:
  - Reads: low integrity risk (availability issue).
  - Writes: risk of partial failure; idempotency reduces duplicate-write risk.

## 3) 5-minute triage (do these first)
1) Confirm whether failures are concentrated to one route (`/athletes`, `/me`) or system-wide.
2) Identify one failing request and capture `correlationId` + `requestId` for traceability.
3) Determine whether the failure is an unhandled exception (`handler_error`) or a classified dependency failure (`dependency_error`, `ddb_error`).

## 4) Deep dive

### A) Fast route isolation (what is failing?)
Use API Gateway metrics/alarm context to decide if this is route-specific.

### Logs Insights: recent 5xx-ish outcomes
```sql
fields @timestamp, level, eventType, message, http.path, http.statusCode, error.code, error.name, correlationId, requestId
| filter eventType in ["request_end","handler_error","dependency_error","ddb_error"]
| filter http.statusCode >= 500 or level="ERROR"
| sort @timestamp desc
| limit 200
```

### B) Trace one failing request end-to-end (correlationId)
```sql
fields @timestamp, level, eventType, message, tenantId, userId, requestId, correlationId, apigwRequestId, http.path, http.statusCode, latencyMs, error.code, error.name, error.retryable
| filter correlationId = "REPLACE_ME"
| sort @timestamp asc
```

### C) Classify: code bug vs dependency vs config
**Interpretation guide**
- `handler_error` + error.name like `TypeError`, `ReferenceError`, etc. → likely code bug/regression.
- `dependency_error` / `ddb_error` + retryable=true → likely transient dependency issue (DynamoDB, downstream).
- Spike begins immediately after deploy → suspect regression; consider rollback.

### D) DynamoDB specific investigation
```sql
fields @timestamp, eventType, message, tenantId, http.path, http.statusCode, error.name, error.code, correlationId
| filter eventType in ["ddb_error","dependency_error","handler_error"]
| filter error.name like /ProvisionedThroughputExceededException|ThrottlingException|InternalServerError|RequestLimitExceeded/
| sort @timestamp desc
| limit 200
```

## 5) Mitigation (stop the bleeding)
Pick the least risky mitigation first:

- **Rollback** the last change if the spike correlates with a deployment.
- If dependency/transient:
  - confirm clients are retrying only when `retryable=true`
  - ensure exponential backoff + jitter
  - reduce burst traffic (rate limiting, queueing where available)
- If DynamoDB throttling is present, follow `docs/runbooks/dynamo-throttling.md`.

**Do not** bypass tenant isolation rules or accept tenantId from client input.

## 6) Prevention / follow-ups
- Add/ensure dashboard panels for:
  - API Gateway `5xx` + latency
  - Lambda `Errors`, `Duration`, `Throttles`
  - `handler_error` count by `error.code`
- Add a metric filter for `eventType="handler_error"` once infra changes are approved (migrate legacy `eventCode` filters to `eventType`).
- Document rollback procedure and link from alarms.