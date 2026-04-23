# Team Layer v1 Contract

## Purpose

This document defines the current Team Layer v1 API contract for:

- `POST /teams`
- `GET /teams`
- `GET /teams/{teamId}`
- `POST /teams/{teamId}/sessions/{sessionId}/assign`
- `GET /teams/{teamId}/sessions`

This is the current smallest Team Layer v1 slice for creating, listing, and viewing tenant-scoped teams, then attaching an existing saved session to a tenant-scoped team and listing those current assignments.

It documents the current implementation only. It does not introduce new auth rules, new tenancy rules, attendance flows, or broader team workflow behavior beyond the implemented routes.

## Contract rules

- Auth is required.
- Tenant scope is server-derived only.
- Tenant identity is never accepted from client input.
- Requests must not include `tenant_id`, `tenantId`, or `x-tenant-id`.
- `POST /teams` is currently admin-only.
- Team reads and writes are tenant-scoped by construction.
- Team session assignment routes are authenticated but do not currently add a new role gate beyond the existing JWT-protected tenant context.
- Team list and detail access use query-by-construction patterns only.
- Session assignment persists one current mapping per `teamId` + `sessionId` inside tenant scope.
- Duplicate assignment replay is currently idempotent and returns the existing assignment payload.

---

## 1. Routes

### `POST /teams`

Purpose:
- Create a tenant-scoped team record.

### `GET /teams`

Purpose:
- List tenant-scoped teams.

### `GET /teams/{teamId}`

Purpose:
- Fetch one tenant-scoped team by id.

### `POST /teams/{teamId}/sessions/{sessionId}/assign`

Purpose:
- Assign one existing saved session to one tenant-scoped team.
- Persist a tenant-scoped team-session mapping and return the normalized assignment payload.
- Preserve idempotent duplicate replay behavior for repeated calls against the same `teamId` + `sessionId`.

### `GET /teams/{teamId}/sessions`

Purpose:
- List the current tenant-scoped sessions assigned to one team.
- Return the currently stored assignment payloads, including the small denormalized session summary fields that the implementation persists today.

### Auth requirement

- All five routes are protected by the existing JWT authorizer.
- Verified identity comes from auth.
- Authoritative tenant scope comes from server-side entitlements.
- `POST /teams` remains admin-only.
- `POST /teams/{teamId}/sessions/{sessionId}/assign` currently requires authentication but does not add a separate team-role restriction in the current implementation.
- `GET /teams/{teamId}/sessions` currently requires authentication but does not add a separate team-role restriction in the current implementation.

### Tenancy note

Tenant identity is never accepted from:

- request body
- query params
- headers such as `x-tenant-id`

The implementation rejects client-supplied tenant-like fields and uses tenant-scoped repository access by construction.

---

## 2. Request Contract

### 2.1 `POST /teams`

Allowed body fields only:

- `name` required string
- `sport` required string
- `ageBand` required string
- `level` optional string
- `notes` optional string
- `status` optional string enum

Unknown fields are rejected.

`durationMin` is not a Team field. Session duration is chosen per request in Quick Session or Session Builder, so `POST /teams` rejects `durationMin` as an unknown field.

#### Create request example

```json
{
  "name": "U14 Blue",
  "sport": "soccer",
  "ageBand": "U14",
  "level": "competitive",
  "notes": "Strong group"
}
```

### 2.2 `GET /teams`

- No request body
- Optional query params:
  - `limit`
  - `nextToken`
  - `cursor`

Tenant-like query parameters are rejected.

### 2.3 `GET /teams/{teamId}`

- `teamId` required path parameter
- No request body

### 2.4 `POST /teams/{teamId}/sessions/{sessionId}/assign`

- `teamId` required path parameter
- `sessionId` required path parameter
- No query parameters are used
- Optional body fields only:
  - `notes` optional string

Unknown body fields are rejected.

#### Assign request example

```json
{
  "notes": "Use next Tuesday"
}
```

An empty object is also valid:

```json
{}
```

### 2.5 `GET /teams/{teamId}/sessions`

- `teamId` required path parameter
- No request body
- No supported query parameters in the current implementation

---

## 3. Validation Rules

### 3.1 `POST /teams`

- `name` must be a trimmed non-empty string with max length `120`
- `sport` must be a trimmed non-empty string with max length `64`
- `ageBand` must be a trimmed non-empty string with max length `32`
- `level` is optional, trimmed when present, max length `32`
- `notes` is optional, trimmed when present, max length `1000`
- `status` is optional and must be one of:
  - `active`
  - `archived`
- `status` defaults to `active`
- `durationMin` is not part of the Team model
- session duration is request-owned and chosen in Quick Session or Session Builder, not on Team
- `durationMin` is rejected on `POST /teams` as an unknown field
- Unknown body fields are rejected

### 3.2 Tenant-scope rejection rules

- `tenant_id`, `tenantId`, and `x-tenant-id` are rejected from:
  - request body
  - query params
  - headers

### 3.3 `POST /teams/{teamId}/sessions/{sessionId}/assign`

- `teamId` path param is required
- `sessionId` path param is required
- `notes` is optional, trimmed when present, max length `1000`
- blank or whitespace-only `notes` is omitted from the stored payload
- unknown body fields are rejected

### 3.4 `GET /teams/{teamId}/sessions`

- `teamId` path param is required
- no request body is used
- client-supplied tenant-like query or header fields are rejected

### 3.5 Current auth / role rule

`POST /teams` is currently restricted to `tenantCtx.role === "admin"`.

That admin-only behavior is part of the implemented contract and is not changed by this doc.

---

## 4. Success Responses

### 4.1 `POST /teams`

- `201 Created`

```json
{
  "team": {
    "teamId": "team-123",
    "tenantId": "tenant_authoritative",
    "name": "U14 Blue",
    "sport": "soccer",
    "ageBand": "U14",
    "level": "competitive",
    "notes": "Strong group",
    "status": "active",
    "createdAt": "2026-04-10T00:00:00.000Z",
    "updatedAt": "2026-04-10T00:00:00.000Z",
    "createdBy": "user-123"
  }
}
```

Note:
- `tenantId` is included in the current response because that is how the implementation normalizes team records today.

### 4.2 `GET /teams`

- `200 OK`

```json
{
  "items": [
    {
      "teamId": "team-123",
      "tenantId": "tenant_authoritative",
      "name": "U14 Blue",
      "sport": "soccer",
      "ageBand": "U14",
      "level": "competitive",
      "notes": "Strong group",
      "status": "active",
      "createdAt": "2026-04-10T00:00:00.000Z",
      "updatedAt": "2026-04-10T00:00:00.000Z",
      "createdBy": "user-123"
    }
  ],
  "nextToken": "opaque-token"
}
```

Note:
- `nextToken` is omitted when there is no next page.

### 4.3 `GET /teams/{teamId}`

- `200 OK`

```json
{
  "team": {
    "teamId": "team-123",
    "tenantId": "tenant_authoritative",
    "name": "U14 Blue",
    "sport": "soccer",
    "ageBand": "U14",
    "level": "competitive",
    "notes": "Strong group",
    "status": "active",
    "createdAt": "2026-04-10T00:00:00.000Z",
    "updatedAt": "2026-04-10T00:00:00.000Z",
    "createdBy": "user-123"
  }
}
```

### 4.4 `POST /teams/{teamId}/sessions/{sessionId}/assign`

First successful assignment:

- `201 Created`

```json
{
  "assignment": {
    "teamId": "team-123",
    "sessionId": "session-123",
    "assignedAt": "2026-04-10T00:00:00.000Z",
    "assignedBy": "user-123",
    "notes": "Use next Tuesday",
    "sessionCreatedAt": "2026-04-01T00:00:00.000Z",
    "sport": "soccer",
    "ageBand": "U14",
    "durationMin": 45,
    "objectiveTags": ["pressing"]
  }
}
```

Duplicate replay of the same assignment:

- `200 OK`

```json
{
  "assignment": {
    "teamId": "team-123",
    "sessionId": "session-123",
    "assignedAt": "2026-04-10T00:00:00.000Z",
    "assignedBy": "user-123",
    "notes": "Use next Tuesday",
    "sessionCreatedAt": "2026-04-01T00:00:00.000Z",
    "sport": "soccer",
    "ageBand": "U14",
    "durationMin": 45,
    "objectiveTags": ["pressing"]
  }
}
```

Notes:
- The current implementation is idempotent for duplicate replay of the same `teamId` + `sessionId`.
- The assignment payload currently includes the denormalized session summary fields persisted at assignment time when present:
  - `sessionCreatedAt`
  - `sport`
  - `ageBand`
  - `durationMin`
  - `objectiveTags`

### 4.5 `GET /teams/{teamId}/sessions`

- `200 OK`

```json
{
  "items": [
    {
      "teamId": "team-123",
      "sessionId": "session-123",
      "assignedAt": "2026-04-10T00:00:00.000Z",
      "assignedBy": "user-123",
      "notes": "Use next Tuesday",
      "sessionCreatedAt": "2026-04-01T00:00:00.000Z",
      "sport": "soccer",
      "ageBand": "U14",
      "durationMin": 45,
      "objectiveTags": ["pressing"]
    }
  ]
}
```

---

## 5. Error Semantics

The routes use the platform error envelope.

### 5.1 `400 platform.bad_request`

Used for:

- invalid JSON
- missing required fields
- missing required path params
- invalid field types or values
- unknown body fields
- client-supplied tenant-like inputs
- missing `teamId` path param for detail route

Example:

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "unknown": ["tenantId"]
    }
  }
}
```

### 5.2 `403 teams.admin_required`

Used when a non-admin user calls `POST /teams`.

```json
{
  "error": {
    "code": "teams.admin_required",
    "message": "Forbidden",
    "details": {
      "requiredRole": "admin"
    }
  }
}
```

### 5.3 `404 teams.not_found`

Used when one of these routes cannot find the target team inside the resolved tenant scope:

- `GET /teams/{teamId}`
- `POST /teams/{teamId}/sessions/{sessionId}/assign`
- `GET /teams/{teamId}/sessions`

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

### 5.4 `404 sessions.not_found`

Used when `POST /teams/{teamId}/sessions/{sessionId}/assign` cannot find the target saved session inside the resolved tenant scope.

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

---

## 6. Intentional Negative Test Example

The contract does not accept client tenant identity fields.

An intentional rejection test may include `tenantId` only to verify that rejection path, for example on `POST /teams/{teamId}/sessions/{sessionId}/assign`:

```json
{
  "tenantId": "should-not-be-here"
}
```

That negative example is for test coverage only, never for normal requests.
