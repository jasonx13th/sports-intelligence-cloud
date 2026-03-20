# Athletes API

Base URL (dev): `https://<api-id>.execute-api.us-east-1.amazonaws.com`

All endpoints require a valid **Cognito JWT** (Authorization header).

---

## Auth

**Header**
- `Authorization: Bearer <JWT>` (required)

**Token**
- Use a Cognito **ID token** (JWT) in the Authorization header.

**Tenancy**
- Tenant context is derived server-side via `buildTenantContext(event)` and the entitlements store.
- **Tenant ID is never accepted from client input** (no body/query/header tenant_id).

---

## POST /athletes

Create an athlete with **idempotency** (safe retries).

### Headers
- `Authorization: Bearer <JWT>` (required)
- `Content-Type: application/json` (required)
- `Idempotency-Key: <string>` (required, max 200 chars)

### Body
```json
{
  "displayName": "Maria"
}
```

### Responses

#### 201 Created (first write)
```json
{
  "athlete": {
    "athleteId": "uuid",
    "displayName": "Maria",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  },
  "replayed": false
}
```

#### 200 OK (idempotent replay)
```json
{
  "athlete": {
    "athleteId": "uuid",
    "displayName": "Maria",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  },
  "replayed": true
}
```

#### 400 Bad Request
Common cases:
- Missing `Idempotency-Key`
- Invalid JSON body
- Missing required fields (e.g., `displayName`)

Example:
```json
{ "code": "invalid_request", "message": "Missing Idempotency-Key" }
```

#### 500 Internal Server Error
Example:
```json
{ "code": "internal_error", "message": "Internal error" }
```

---

## GET /athletes

List athletes for the authenticated tenant (Query-based, no Scan).

### Headers
- `Authorization: Bearer <JWT>` (required)

### Query params (optional)
- `nextToken` (string): opaque pagination token
- `limit` (number): clamped to `1..50` (default `25`)

**Backward compatibility**
- `cursor` is accepted temporarily as an alias for `nextToken` (clients should migrate to `nextToken`).

### Response (200 OK)
```json
{
  "items": [
    {
      "athleteId": "uuid",
      "displayName": "Maria",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ],
  "nextToken": "opaque-string-or-null"
}
```

---

## GET /athletes/{athleteId}

Fetch a single athlete (tenant-safe lookup).

### Headers
- `Authorization: Bearer <JWT>` (required)

### Response (200 OK)
```json
{
  "athlete": {
    "athleteId": "uuid",
    "displayName": "Maria",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

### Response (404 Not Found)
```json
{ "code": "athlete_not_found", "message": "Athlete not found" }
```

---

## Observability Signals (CloudWatch)

### Structured logs (source of truth)
Handlers emit structured logs with the field:

- `eventType` (stable enum-like string)

Examples used by this API:
- `athlete_created`
- `validation_failed`
- `athlete_not_found`
- `handler_error`
- `request_start` / `request_end`

See: `docs/architecture/platform-observability.md` for the platform-wide schema and queries.

### Metrics (current state)
**Current deployed metric filters** for athlete create are still based on a legacy field name (`eventCode`) and produce these custom metrics:

- `SIC/ClubVivo` namespace
- `athlete_create_success`
- `athlete_create_idempotent_replay`
- `athlete_create_failure`

Alarm:
- `sic-<env>-athlete-create-failures` triggers on `athlete_create_failure >= 1` (5 min window)

Dashboard:
- `sic-<env>-ops` shows baseline panels for create success / replay / failure.

> Migration note: metric filters will be updated to use `eventType` once the infra change is approved and deployed. Until then, custom metrics may not reflect the new structured logging field names.

---

## Audit Events (DynamoDB)

On successful **first-write** create, an audit record is written atomically (same transaction):

- `PK = TENANT#<tenantId>`
- `SK = AUDIT#<timestamp>#CREATE_ATHLETE#<athleteId>`
- `action = CREATE_ATHLETE`
- `entityType = ATHLETE`
- `entityId = <athleteId>`
- `replayed = false`

Replays do **not** create a second audit record.

---

## Security & Data Access Notes

- Tenant isolation enforced by DynamoDB keying:
  - `PK = TENANT#<tenantId>`
  - `SK = ATHLETE#<athleteId>`
- Allowed operations: `Query`, `GetItem`, `PutItem`, `TransactWriteItems` (no Scan).
- API returns **normalized** athlete objects (no internal `PK`/`SK` exposure).