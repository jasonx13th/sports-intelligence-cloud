# Runbook: Idempotency Replays

## 1) Trigger
- Signals (from `docs/architecture/observability-signals.md`):
  - `athlete_create_idempotent_replay` (custom metric, current deployed state)
  - `apigw.4xx` / `apigw.5xx` (if retries are causing upstream errors)
- Dashboard:
  - `sic-dev-ops` panel: `SIC/ClubVivo athlete_create_idempotent_replay`
- Related alarms (if replay correlates with failures):
  - `sic-dev-athlete-create-failures`

## 2) Impact
- Idempotency replays are usually **healthy**: they prevent duplicate writes during safe retries.
- A sustained spike can indicate:
  - Client retry loop (bug)
  - Network instability causing repeated retries
  - Overly aggressive retry policy (no backoff/jitter)
- Data integrity is protected (no duplicate writes), but cost and latency may increase.

## 3) 5-minute triage (do these first)
1) Check whether replay spike aligns with **failures** (`athlete_create_failure`) or is mostly replays with stable success.
2) Determine whether replays are concentrated to a **single tenant** or client cohort.
3) Confirm clients are using exponential backoff + jitter and only retrying when safe.

## 4) Deep dive

### A) Logs Insights: count replays over time
```sql
fields @timestamp, eventType, tenantId, http.path, replayed, idempotencyKey, correlationId
| filter eventType = "request_end" and http.path = "/athletes" and ispresent(replayed)
| stats
    count() as total,
    sum(replayed) as replayCount,
    (sum(replayed) * 100.0 / count()) as replayPct
  by bin(5m)
| sort @timestamp desc
```

### B) Logs Insights: top tenants by replay volume
```sql
fields @timestamp, tenantId, replayed
| filter eventType = "request_end" and ispresent(replayed) and replayed = 1
| stats count() as n by tenantId
| sort n desc
| limit 50
```

### C) Logs Insights: trace a single correlation
```sql
fields @timestamp, level, eventType, message, tenantId, userId, requestId, correlationId, http.statusCode, replayed, idempotencyKey, error.code
| filter correlationId = "REPLACE_ME"
| sort @timestamp asc
```

### What “good” looks like
- Low to moderate replay rate during transient network issues.
- Replay rate spikes during a deployment or brief outage and then returns to baseline.
- Replays are spread across tenants and correlate with brief 5xx spikes (transient).

### What “bad” looks like
- Replay rate stays high (e.g., >30–50%) for prolonged periods.
- Replays are dominated by one tenant/client version (suggests client loop).
- Replay spike without corresponding failures (suggests client is retrying even on success).

## 5) Mitigation (stop the bleeding)
- Notify client owners with guidance:
  - retry only when `retryable=true` (and operation is safe)
  - exponential backoff + jitter
  - cap retries and implement circuit breaking
- If a single tenant/client is causing load: rate-limit at the edge (if available) and communicate remediation.
- If replays correlate with platform 5xx: fix the underlying 5xx cause first (see error runbooks).

## 6) Prevention / follow-ups
- Add a runbook link from the ops dashboard panel to this doc.
- Add an alarm on replay percentage (rate-based) once infra changes are approved.
- Document client retry guidance in API docs and SDK examples.
