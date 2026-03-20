# Runbook: DynamoDB & Lambda Throttling

## 1) Trigger
- Alarm name(s):
  - `sic-dev-athletesfn-throttles` (AWS/Lambda Throttles >= 1 in 5 min)
  - `sic-dev-mefn-throttles` (AWS/Lambda Throttles >= 1 in 5 min)
- Related signals (from `docs/architecture/observability-signals.md`):
  - `lambda.throttles`
  - `ddb_error` / `dependency_error` (if emitted)
  - `apigw.5xx` (if throttling causes upstream failures)

## 2) Impact
- Requests may fail with `429 Too Many Requests`, `5xx`, or increased latency/timeouts.
- Throttling can be:
  - **Lambda throttling** (concurrency / reserved concurrency limits), or
  - **DynamoDB throttling** (capacity limits / hot partition), or
  - Client retry storms amplifying either condition.
- Data integrity risk is usually low, but retry storms can increase cost and cause user-visible instability. Idempotency reduces duplicate-write risk.

## 3) 5-minute triage (do these first)
1) Identify **which layer** is throttling: Lambda vs DynamoDB.
2) Determine whether throttling is **tenant-specific** (hot key) or global.
3) Check whether clients are retrying aggressively (spike in repeated requests / replay).

## 4) Deep dive

### A) Lambda throttling (concurrency)
**What it means**
- Lambda is rejecting invocations due to concurrency limits (account, function, or reserved concurrency).

**Fast checks**
- CloudWatch Alarm: `sic-dev-*-throttles`
- CloudWatch metric: `AWS/Lambda Throttles` with dimension `FunctionName`

**Mitigation (safe)**
- Reduce burst traffic at the caller (client backoff, queueing, rate limiting).
- If a recent deploy increased load (loops, fan-out), rollback that change.
- If you have reserved concurrency set too low, plan an infra adjustment (requires approval).

### B) DynamoDB throttling (capacity / hot partition)
**What it means**
- DynamoDB is throttling reads/writes due to exceeding provisioned capacity or on-demand limits, often caused by **hot keys**.

**Logs Insights: look for DynamoDB throttling errors**
```sql
fields @timestamp, level, eventType, message, tenantId, http.path, http.statusCode, error.code, error.name, correlationId
| filter eventType in ["ddb_error","dependency_error","handler_error"]
| filter error.name like /ProvisionedThroughputExceededException|ThrottlingException/
| sort @timestamp desc
| limit 200
```

**Logs Insights: find tenant hot spots (if tenantId is present)**
```sql
fields @timestamp, tenantId, eventType, http.path, error.name
| filter error.name like /ProvisionedThroughputExceededException|ThrottlingException/
| stats count() as n by tenantId, http.path
| sort n desc
| limit 50
```

**Mitigation (safe)**
- Ensure clients use exponential backoff with jitter on retryable errors.
- Reduce write bursts (batching, queueing).
- Confirm access patterns are **Query/Get** scoped by tenant keys (no Scan-then-filter).
- If hot partition suspected: check whether too many operations target the same partition key (e.g., single tenant causing burst).
- Infra changes (capacity/index changes) require approval; document the proposed change and expected cost impact.

## 5) Mitigation (stop the bleeding)
- If Lambda throttling: reduce traffic, rollback load-increasing deploys, consider reserved concurrency tuning (approval required).
- If DynamoDB throttling: reduce burst + enforce backoff; identify hot tenant/key; consider capacity/index strategy (approval required).
- Communicate status: “degraded due to throttling; retries may succeed with backoff.”

## 6) Prevention / follow-ups
- Add dashboards that chart:
  - Lambda `Throttles`, `Duration`, `Errors`
  - DynamoDB `ThrottledRequests`, `ConsumedRead/WriteCapacityUnits`
- Add an explicit runbook link to `sic-dev-*-throttles` alarms.
- Add/verify client retry guidance:
  - retry only when `retryable=true`
  - exponential backoff + jitter
  - idempotency keys for writes
- Consider SQS buffering for bursty writes (design/ADR when ready).
