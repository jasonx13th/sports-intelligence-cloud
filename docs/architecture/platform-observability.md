# Platform Observability Contract

## Purpose
Describe the SIC platform-wide logging, correlation, and error semantics contract so every service is operable by default.

## Non-negotiables

### Tenancy and identity
- Tenant identity **must never** be taken from client input (body/query/headers like `x-tenant-id`).
- `tenantId` may only be logged **after** `buildTenantContext(...)` resolves it from verified auth + entitlements.
- Fail closed: if tenant context cannot be resolved, treat as unauthorized/forbidden per policy.

### PII and secrets safety
- Never log: raw JWTs/tokens, `Authorization` header, cookies/`Set-Cookie`, secrets, full request bodies containing user/athlete data.
- Prefer logging shapes/hashes over payloads.
- Redact or omit any sensitive fields.

---

## Log event schema

## Required fields (must appear on every log line)
- `timestamp` (ISO-8601 string)
- `level` (`DEBUG` | `INFO` | `WARN` | `ERROR`)
- `service` (e.g., `sic-api`)
- `env` (`dev` | `stage` | `prod`)
- `eventType` (stable enum-like string)
- `message` (short, stable text)
- `requestId` (canonical request identifier)
- `correlationId` (end-to-end trace identifier)

### eventType values (initial set)
- `request_start`
- `tenant_context_resolved`
- `request_end`
- `validation_failed`
- `auth_forbidden`
- `auth_unauthenticated`
- `correlation_invalid`
- `handler_error`
- `dependency_error`
- `ddb_error`
- `athlete_created`
- `athlete_listed`
- `athlete_fetched`
- `athlete_not_found`
- `route_not_found`

## Conditionally required fields
- `http.method` (required for request lifecycle events)
- `http.path` (required for request lifecycle events)
- `http.statusCode` (required for `request_end` and error responses)
- `latencyMs` (required for `request_end`)

## Optional context fields (only when safe/available)
- `tenantId` (ONLY after `buildTenantContext` succeeds)
- `userId` (from verified auth claims, e.g., Cognito `sub`)
- `idempotencyKey` (writes, when provided)
- `resource` (safe identifiers only; no payloads)
  - `entityType`
  - `entityId`
  - `pk` / `sk` (only if not sensitive and helps diagnosis)

## Error object (required on error logs)
- `error.code` (platform error code)
- `error.name` (exception class/name)
- `error.retryable` (boolean, if known)

---

## Correlation and request IDs

## Canonical sources
- `requestId` = Lambda `context.awsRequestId` (canonical, always present)
- `apigwRequestId` = `event.requestContext.requestId` (log when available)
- `correlationId`:
  - If `x-correlation-id` is present and valid, use it.
  - Otherwise set `correlationId = requestId`.

## Validation rules for `x-correlation-id`
- Valid iff it matches: `^[A-Za-z0-9._-]{8,128}$`
- If invalid: ignore and fallback; emit `WARN` `eventType="correlation_invalid"` without echoing the raw value (log only length and a short hash if needed).

## Response propagation
- Always return `x-correlation-id` on responses.

---

## Error semantics

## Error response shape (minimum)
- Body: `{ "error": { "code": "...", "message": "..." }, "requestId": "...", "correlationId": "..." }`
- Header: `x-correlation-id: ...`

## Error code namespace (initial)
- `AUTH_UNAUTHENTICATED` (401)
- `AUTH_FORBIDDEN` (403)
- `TENANT_CONTEXT_MISSING` (fail-closed; 403 default)
- `ENTITLEMENTS_NOT_FOUND` (403)
- `VALIDATION_FAILED` (400)
- `INTERNAL_ERROR` (500)

## Log levels guidance
- `INFO`: request lifecycle + normal domain events
- `WARN`: expected failures caused by caller input/permissions (validation/authz)
- `ERROR`: unexpected failures, dependency failures, unhandled exceptions

---

## Examples

## request_start
```json
{
  "timestamp": "2026-03-16T12:34:56.789Z",
  "level": "INFO",
  "service": "sic-api",
  "env": "dev",
  "eventType": "request_start",
  "message": "request started",
  "requestId": "awsRequestId-123",
  "correlationId": "awsRequestId-123",
  "http": { "method": "GET", "path": "/athletes" }
}
```

## tenant_context_resolved
```json
{
  "timestamp": "2026-03-16T12:34:56.900Z",
  "level": "INFO",
  "service": "sic-api",
  "env": "dev",
  "eventType": "tenant_context_resolved",
  "message": "tenant context resolved",
  "requestId": "awsRequestId-123",
  "correlationId": "awsRequestId-123",
  "tenantId": "tenant-abc",
  "userId": "cognito-sub-xyz"
}
```

## error
```json
{
  "timestamp": "2026-03-16T12:34:57.100Z",
  "level": "ERROR",
  "service": "sic-api",
  "env": "dev",
  "eventType": "handler_error",
  "message": "request failed",
  "requestId": "awsRequestId-123",
  "correlationId": "awsRequestId-123",
  "http": { "method": "POST", "path": "/athletes", "statusCode": 500 },
  "latencyMs": 311,
  "error": { "code": "INTERNAL_ERROR", "name": "Error", "retryable": false }
}
```

---

## CloudWatch Logs Insights queries

## Find one request by correlationId
```sql
fields @timestamp, level, eventType, message, tenantId, userId, requestId, correlationId, http.path, http.statusCode, error.code
| filter correlationId = "REPLACE_ME"
| sort @timestamp asc
```

## Count errors by code
```sql
fields error.code
| filter level="ERROR" and ispresent(error.code)
| stats count() as n by error.code
| sort n desc
```

## Tenant-scoped investigation
```sql
fields @timestamp, level, eventType, message, correlationId, http.path, http.statusCode, error.code
| filter tenantId = "REPLACE_ME"
| sort @timestamp desc
| limit 200
```

### Saved evidence queries (Week 4 Day 1)

#### A) Trace one correlation across the request story
```sql
fields @timestamp, level, eventType, message, tenantId, userId, requestId, correlationId, apigwRequestId, http.statusCode, latencyMs, replayed, idempotencyKey
| filter correlationId = "abc_def-1234"
| sort @timestamp asc
```

#### B) Find invalid correlation IDs
```sql
fields @timestamp, level, eventType, message, requestId, correlationId, apigwRequestId, suppliedLength
| filter eventType = "correlation_invalid"
| sort @timestamp desc
| limit 20
```

