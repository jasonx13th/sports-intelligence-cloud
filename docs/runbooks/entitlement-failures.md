# Runbook: Entitlement Failures (403)

## 1) Trigger
- Alarm name(s):
  - Often surfaces via `sic-dev-httpapi-4xx` (AWS/ApiGateway 4xx >= 10 in 5 min)
- Signals (from `docs/architecture/observability-signals.md`):
  - `auth_forbidden` (post-authorizer)
  - `apigw.4xx`

## 2) Impact
- Users receive `403 Forbidden`.
- This is expected when a user is authenticated but **not entitled** for the tenant/resource.
- No data integrity risk expected (fail-closed), but a sudden spike may indicate entitlements regression or store outage.

## 3) 5-minute triage (do these first)
1) Confirm this is **post-authorizer** (you see SIC logs with `eventType="auth_forbidden"`).
2) Determine whether it’s isolated to **one tenant** vs **many tenants**.
3) Check for **entitlements store errors** (timeouts, dependency errors) masquerading as forbidden.

## 4) Deep dive

### Logs Insights: 403s by tenant + path
```sql
fields @timestamp, level, eventType, message, tenantId, userId, http.path, http.statusCode, error.code, correlationId
| filter eventType in ["auth_forbidden","handler_error","request_end"]
| stats count() as n by tenantId, http.path, eventType, http.statusCode, error.code
| sort n desc
| limit 100
```

### Logs Insights: trace a single request by correlationId
```sql
fields @timestamp, level, eventType, message, tenantId, userId, requestId, correlationId, apigwRequestId, http.path, http.statusCode, error.code
| filter correlationId = "REPLACE_ME"
| sort @timestamp asc
```

### What “good” looks like
- 403s are low volume and correlated with real permission boundaries (expected).
- Spikes are limited to a single tenant due to onboarding/config drift.

### What “bad” looks like
- Broad spike across multiple tenants immediately after a deploy.
- `handler_error` or `dependency_error` events around the same time (could be entitlements lookup failure causing fail-closed).
- Missing `tenantId` in logs for the failing requests (tenant context never resolved).

## 5) Mitigation (stop the bleeding)
- If **one tenant** is impacted:
  - Verify the authoritative entitlements record exists for that tenant.
  - Verify the user/role mappings are correct (no accidental role removal).
- If **many tenants** are impacted:
  - Check entitlements store health (timeouts/errors).
  - Inspect recent deployments affecting `tenant-context` / entitlements client.
  - Roll back the change if a regression is suspected.
- Never “work around” by accepting `tenantId` from request input. Fail-closed is intentional.

## 6) Prevention / follow-ups
- Add a dedicated metric/alarm for `eventType="auth_forbidden"` once infra changes are approved.
- Add an onboarding validation checklist step: “entitlements record present + read test passes”.
- Ensure runbook links are attached to relevant alarms and dashboard panels.
