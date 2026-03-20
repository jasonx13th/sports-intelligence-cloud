# Runbook: Auth Failures (401/403)

## 1) Trigger
- Alarm name(s):
  - `sic-dev-httpapi-4xx` (AWS/ApiGateway 4xx >= 10 in 5 min)
- Signals (from `docs/architecture/observability-signals.md`):
  - `apigw.4xx`
  - `auth_unauthenticated` (post-authorizer)
  - `auth_forbidden` (post-authorizer)

## 2) Impact
- Users may see `401 Unauthorized` or `403 Forbidden`.
- Some 401s occur **before** Lambda (authorizer rejection) and may not return SIC’s standard error envelope or correlation headers.
- No data integrity risk expected (fail-closed), but elevated auth failures can look like an outage.

## 3) 5-minute triage (do these first)
1) Determine whether failures are **authorizer-layer** or **post-authorizer**.
2) Check if the spike is **tenant-specific** or global.
3) Verify whether correlation IDs are present on responses for the failing path.

## 4) Deep dive

### A) Distinguish authorizer-layer vs post-authorizer failures
**Rule of thumb**
- If CloudWatch logs show **no matching request_start / handler_error / request_end** for the timeframe, suspect **authorizer-layer** failures.
- If you see `eventType` logs like `auth_unauthenticated` / `auth_forbidden`, it’s **post-authorizer**.

### Logs Insights (copy/paste): auth failures by eventType
```sql
fields @timestamp, level, eventType, message, correlationId, requestId, apigwRequestId, tenantId, userId, http.path, http.statusCode, error.code
| filter eventType in ["auth_unauthenticated","auth_forbidden","handler_error","request_end"]
| sort @timestamp desc
| limit 200
```

### Logs Insights: tenant-specific vs global
```sql
fields @timestamp, eventType, tenantId, http.path, http.statusCode, error.code, correlationId
| filter eventType in ["auth_unauthenticated","auth_forbidden"]
| stats count() as n by tenantId, http.path, eventType
| sort n desc
```

### B) If this is authorizer-layer (pre-Lambda)
**What “good” looks like**
- Legitimate bad tokens rejected.
- Only a specific client/app version affected.

**What “bad” looks like**
- Sudden global spike after a deploy/config change.
- All requests failing with 401 and **no Lambda logs**.

**Mitigation (safe)**
- Validate client is sending the correct token type (ID token vs Access token) per API docs.
- Validate Cognito User Pool / authorizer config didn’t change unintentionally (audience/client id, issuer, region).
- If a recent deploy changed auth settings, rollback that change.

### C) If this is post-authorizer 401/403 (our code)
Common causes:
- Missing/invalid auth context mapping into the handler wrapper
- Entitlements missing or not found (403 fail-closed)
- Tenant context resolution errors

**Mitigation (safe)**
- For 403 spikes tied to one tenant: verify entitlements record exists and matches expected tenant/roles.
- If all tenants: check entitlements store availability/errors; check recent deployments for tenant-context changes.
- Do not bypass tenancy rules; do not accept tenantId from client input.

## 5) Mitigation (stop the bleeding)
- If it’s a bad client rollout: communicate to client owners and recommend backoff + token refresh.
- If it’s misconfig: rollback the configuration change.
- If it’s entitlements: restore correct entitlements records (authoritative store), then re-test.

## 6) Prevention / follow-ups
- Add a dedicated alarm for `auth_forbidden` and `auth_unauthenticated` (post-authorizer) once infra changes are approved.
- Improve dashboards to separate:
  - authorizer-layer 401s
  - post-authorizer 401/403 with error envelope
- Ensure runbook links are attached to every alarm.
