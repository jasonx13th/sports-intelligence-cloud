# Team Attendance v1 Contract

## Purpose

This document freezes the Week 16 Attendance v1 API contract for:

- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`

This is the smallest operational attendance slice for SIC's Team Layer.

Attendance in this v1 contract is tracked at the team session occurrence level only. It records whether a team session occurrence was planned, completed, or cancelled for one team and one saved session on one session date.

This is a product/API contract freeze only. It does not introduce runtime code changes, new infrastructure, new IAM, new auth rules, tenancy-boundary changes, or entitlements-model changes.

## Contract rules

- Auth is required.
- Tenant scope is server-derived only.
- Tenant identity is never accepted from client input.
- Requests must not include `tenant_id`, `tenantId`, or `x-tenant-id`.
- Tenant scope must come only from verified auth plus authoritative entitlements.
- Team and session lookups must remain tenant-scoped by construction.
- No scan-then-filter tenancy pattern is allowed.
- Attendance is recorded at the team session occurrence level only.
- `recordedAt` and `recordedBy` are server-set fields.
- The natural key for duplicate handling is `teamId + sessionDate + sessionId`.

---

## 1. Routes

### `POST /teams/{teamId}/attendance`

Purpose:
- Record one tenant-scoped attendance occurrence for one team, one saved session, and one session date.
- Preserve idempotent replay behavior for exact normalized duplicate submissions.

### `GET /teams/{teamId}/attendance`

Purpose:
- List tenant-scoped attendance occurrences for one team.
- Support a small date-range filter for operational team workflow.

### Auth requirement

- Both routes are protected by the existing JWT authorizer.
- Verified identity comes from auth.
- Authoritative tenant scope comes from server-side entitlements.
- `401` and `403` behavior remains governed by the current auth and entitlements contract.

### Tenancy note

Tenant identity is never accepted from:

- request body
- query params
- headers such as `x-tenant-id`

The implementation must reject client-supplied tenant-like fields and use tenant-scoped repository access by construction.

---

## 2. Request Contract

### 2.1 `POST /teams/{teamId}/attendance`

- `teamId` required path parameter
- Content type: JSON
- Allowed body fields only:
  - `sessionId` required string
  - `sessionDate` required string
  - `status` required string enum
  - `notes` optional string

Unknown body fields are rejected.

#### Create request example

```json
{
  "sessionId": "session-123",
  "sessionDate": "2026-04-15",
  "status": "completed",
  "notes": "Good intensity, full group"
}
```

### 2.2 `GET /teams/{teamId}/attendance`

- `teamId` required path parameter
- No request body
- Optional query params:
  - `startDate`
  - `endDate`
  - `limit`
  - `nextToken`

Unknown query params are rejected.

#### List request example

```text
GET /teams/team-123/attendance?startDate=2026-04-01&endDate=2026-04-30&limit=20
```

Note:
- Current repo list conventions already use `nextToken`, so this frozen contract includes it.
- This frozen attendance v1 contract does not document `cursor` aliases.

---

## 3. Validation Rules

### 3.1 Shared rejection rules

- `tenant_id`, `tenantId`, and `x-tenant-id` are rejected from:
  - request body
  - query params
  - headers

### 3.2 `POST /teams/{teamId}/attendance`

- `teamId` path param is required
- `sessionId` must be a trimmed non-empty string with max length `128`
- `sessionDate` must be a valid date string in `YYYY-MM-DD` format
- `status` must be one of:
  - `planned`
  - `completed`
  - `cancelled`
- `notes` is optional, trimmed when present, max length `1000`
- blank or whitespace-only `notes` is omitted from the stored payload
- unknown body fields are rejected
- the referenced `teamId` must exist inside resolved tenant scope
- the referenced `sessionId` must exist inside resolved tenant scope

### 3.3 Duplicate replay rule

Natural key:

- `teamId + sessionDate + sessionId`

Behavior:

- first create returns `201 Created`
- exact normalized replay of the same natural key and same normalized payload returns `200 OK`
- conflicting replay of the same natural key with a materially different normalized payload returns `409 Conflict`

For replay comparison, the normalized payload is:

- `teamId`
- `sessionId`
- `sessionDate`
- `status`
- `notes` when present

Server-set fields such as `recordedAt` and `recordedBy` do not change the duplicate comparison rule.

### 3.4 `GET /teams/{teamId}/attendance`

- `teamId` path param is required
- `startDate` is optional and must be `YYYY-MM-DD` when present
- `endDate` is optional and must be `YYYY-MM-DD` when present
- when both are present, `startDate` must be less than or equal to `endDate`
- `limit` is optional and follows current repo list conventions:
  - integer
  - minimum `1`
  - maximum `50`
- `nextToken` is optional and opaque
- no request body is used
- unknown query params are rejected
- the target `teamId` must exist inside resolved tenant scope
- listing must remain tenant-scoped by construction and must not rely on scan-then-filter behavior

---

## 4. Success Responses

### 4.1 `POST /teams/{teamId}/attendance`

First successful create:

- `201 Created`

```json
{
  "attendance": {
    "teamId": "team-123",
    "sessionId": "session-123",
    "sessionDate": "2026-04-15",
    "status": "completed",
    "notes": "Good intensity, full group",
    "recordedAt": "2026-04-15T23:00:00.000Z",
    "recordedBy": "user-123"
  }
}
```

Exact normalized replay:

- `200 OK`

```json
{
  "attendance": {
    "teamId": "team-123",
    "sessionId": "session-123",
    "sessionDate": "2026-04-15",
    "status": "completed",
    "notes": "Good intensity, full group",
    "recordedAt": "2026-04-15T23:00:00.000Z",
    "recordedBy": "user-123"
  }
}
```

Notes:

- `recordedAt` is set by the server
- `recordedBy` is set by the server from the authenticated principal

### 4.2 `GET /teams/{teamId}/attendance`

- `200 OK`

```json
{
  "items": [
    {
      "teamId": "team-123",
      "sessionId": "session-123",
      "sessionDate": "2026-04-15",
      "status": "completed",
      "notes": "Good intensity, full group",
      "recordedAt": "2026-04-15T23:00:00.000Z",
      "recordedBy": "user-123"
    }
  ],
  "nextToken": "opaque-token"
}
```

Note:

- `nextToken` is omitted when there is no next page

---

## 5. Error Semantics

The routes use the current platform error envelope.

### 5.1 `400 platform.bad_request`

Used for:

- invalid JSON
- missing required fields
- missing required path params
- invalid field types or values
- invalid date filter inputs
- unknown request fields
- client-supplied tenant-like inputs

Example:

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "field": "status"
    }
  }
}
```

### 5.2 `401 platform.unauthorized`

Used when verified authenticated identity cannot be established from the current auth path.

### 5.3 `403 platform.forbidden`

Used when the authenticated caller cannot be authorized under the current entitlements contract.

This includes current fail-closed entitlements behavior such as missing or invalid tenant authorization state.

### 5.4 `404 teams.not_found`

Used when the target team cannot be found inside the resolved tenant scope for:

- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`

```json
{
  "error": {
    "code": "teams.not_found",
    "message": "Not found",
    "details": {
      "entityType": "TEAM",
      "teamId": "team-404"
    }
  }
}
```

### 5.5 `404 sessions.not_found`

Used when `POST /teams/{teamId}/attendance` cannot find the referenced saved session inside the resolved tenant scope.

```json
{
  "error": {
    "code": "sessions.not_found",
    "message": "Not found",
    "details": {
      "entityType": "SESSION",
      "sessionId": "session-404"
    }
  }
}
```

### 5.6 `409 teams.attendance_exists`

Used when the same natural key is submitted again with a conflicting normalized payload.

```json
{
  "error": {
    "code": "teams.attendance_exists",
    "message": "Conflict",
    "details": {
      "entityType": "TEAM_ATTENDANCE",
      "teamId": "team-123",
      "sessionId": "session-123",
      "sessionDate": "2026-04-15"
    }
  }
}
```

---

## 6. Occurrence-Level Scope Note

Attendance in this v1 contract is tracked at the team session occurrence level only.

That means the unit of record is:

- one team
- one saved session
- one session date

This keeps the slice thin, operational, and aligned with the current Team Layer path without introducing broader planning or roster systems.

---

## 7. Explicit Deferrals

These items are intentionally out of scope for Team Attendance v1:

- no athlete-level attendance
- no roster dependency
- no schedule engine
- no notifications
- no broader team authorization redesign
- no infra, IAM, auth-boundary, tenancy-boundary, or entitlements-model changes

Future attendance depth should be treated as follow-on work, not implied by this frozen v1 contract.
