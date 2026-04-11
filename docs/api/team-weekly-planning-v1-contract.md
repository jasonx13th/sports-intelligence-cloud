# Team Weekly Planning v1 Contract

## Purpose

This document freezes the Week 16 Day 2 Hour 1 API contract for:

- `GET /teams/{teamId}/planning/weekly`

This is the smallest operational weekly planning read for SIC's Team Layer.

It composes existing tenant-scoped team, team-session assignment, and attendance reads into one current-week response for one team. It does not introduce a scheduler, recurrence engine, analytics layer, new storage surface, or Day 1 attendance contract drift.

## Contract rules

- Auth is required.
- Tenant scope is server-derived only.
- Tenant identity is never accepted from client input.
- Requests must not include `tenant_id`, `tenantId`, or `x-tenant-id`.
- Requests must not include `weekStart`, `weekEnd`, `startDate`, `endDate`, `limit`, `nextToken`, or `cursor` in v1.
- Tenant scope must come only from verified auth plus authoritative entitlements.
- Team, assignment, and attendance reads must remain tenant-scoped by construction.
- No scan-then-filter tenancy pattern is allowed.
- Current week is derived server-side only using UTC Monday-through-Sunday bounds.
- The route returns a thin operational composition only and does not create schedule semantics.

---

## 1. Route

### `GET /teams/{teamId}/planning/weekly`

Purpose:
- Return the current operational weekly planning view for one tenant-scoped team.
- Combine real attendance occurrences in the current week with currently assigned sessions that do not yet have a weekly attendance occurrence.

### Auth requirement

- The route is protected by the existing JWT authorizer.
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

### 2.1 `GET /teams/{teamId}/planning/weekly`

- `teamId` required path parameter
- No request body
- No supported query params in v1

Forbidden query params in v1:

- `weekStart`
- `weekEnd`
- `startDate`
- `endDate`
- `limit`
- `nextToken`
- `cursor`

Unknown query params are rejected.

---

## 3. Week Window Rules

### 3.1 Current week determination

- current week is derived server-side only
- current week uses UTC
- week starts on Monday
- week ends on Sunday

Example:

- if the server-side UTC date falls on `2026-04-11`, the returned week window is:
  - `weekStart = 2026-04-06`
  - `weekEnd = 2026-04-12`

### 3.2 Data sources

The route composes only these existing tenant-scoped reads:

- team existence in tenant scope
- current team-session assignments in tenant scope
- attendance occurrences in tenant scope for `weekStart..weekEnd`
- optional `sessionSummary` fields sourced only from existing assignment/session summary data already present in the repo

The route must not fetch or expose:

- full session detail
- `activities[]`

---

## 4. Response Contract

### 4.1 Top-level response

- `teamId`
- `weekStart`
- `weekEnd`
- `summary`
- `items`

### 4.2 Summary shape

`summary` includes:

- `attendanceCount`
- `assignmentOnlyCount`
- `completedCount`
- `plannedCount`
- `cancelledCount`

### 4.3 Item shape

`source` enum is:

- `attendance`
- `assignment`

Rules:

- emit one `attendance` item per real attendance occurrence in the current week
- emit one `assignment` item per currently assigned session with no attendance occurrence in the current week
- never invent `sessionDate` or `status` for assignment-only items
- `sessionSummary` is optional
- `sessionSummary` may only reflect summary fields already present in current assignment/session data
- no `tenantId` appears in the response

Allowed `sessionSummary` fields:

- `sessionCreatedAt`
- `sport`
- `ageBand`
- `durationMin`
- `objectiveTags`

### 4.4 Response example

```json
{
  "teamId": "team-123",
  "weekStart": "2026-04-06",
  "weekEnd": "2026-04-12",
  "summary": {
    "attendanceCount": 1,
    "assignmentOnlyCount": 1,
    "completedCount": 1,
    "plannedCount": 0,
    "cancelledCount": 0
  },
  "items": [
    {
      "sessionId": "session-123",
      "source": "attendance",
      "sessionDate": "2026-04-08",
      "status": "completed",
      "notes": "Good intensity",
      "recordedAt": "2026-04-08T22:15:00.000Z",
      "recordedBy": "user-123",
      "sessionSummary": {
        "sport": "soccer",
        "ageBand": "U14",
        "durationMin": 45
      }
    },
    {
      "sessionId": "session-456",
      "source": "assignment",
      "assignedAt": "2026-04-05T18:00:00.000Z",
      "assignedBy": "user-123",
      "sessionSummary": {
        "sport": "soccer",
        "ageBand": "U14",
        "durationMin": 60
      }
    }
  ]
}
```

---

## 5. Merge Rules

The weekly planning view is a composition read, not a schedule engine.

Merge behavior:

- attendance-backed items come from real current-week attendance occurrences
- assignment-only items come from currently assigned sessions with no current-week attendance occurrence
- the same `sessionId` may appear multiple times when multiple real attendance occurrences exist in the current week
- assignment-only items must not imply recurrence, cadence, or a scheduled occurrence date

This route must not invent:

- scheduled dates
- recurring events
- attendance statuses for assignment-only items
- planning analytics beyond the returned summary counts

---

## 6. Validation Rules

### 6.1 Shared rejection rules

- `tenant_id`, `tenantId`, and `x-tenant-id` are rejected from:
  - request body
  - query params
  - headers

### 6.2 `GET /teams/{teamId}/planning/weekly`

- `teamId` path param is required
- no request body is used
- no query params are supported in v1
- forbidden query params are rejected:
  - `weekStart`
  - `weekEnd`
  - `startDate`
  - `endDate`
  - `limit`
  - `nextToken`
  - `cursor`
- unknown query params are rejected
- the target `teamId` must exist inside resolved tenant scope
- all data access must remain tenant-scoped by construction and must not rely on scan-then-filter behavior

---

## 7. Success Responses

### 7.1 `GET /teams/{teamId}/planning/weekly`

- `200 OK`

The response always includes:

- `teamId`
- `weekStart`
- `weekEnd`
- `summary`
- `items`

`items` may be empty.

---

## 8. Error Semantics

The route uses the current platform error envelope.

### 8.1 `400 platform.bad_request`

Used for:

- missing required path params
- forbidden query params
- unknown query params
- client-supplied tenant-like inputs

Example:

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "unknown": ["weekStart"]
    }
  }
}
```

### 8.2 `401 platform.unauthorized`

Used when verified authenticated identity cannot be established from the current auth path.

### 8.3 `403 platform.forbidden`

Used when the authenticated caller cannot be authorized under the current entitlements contract.

This includes current fail-closed entitlements behavior such as missing or invalid tenant authorization state.

### 8.4 `404 teams.not_found`

Used when the target team cannot be found inside the resolved tenant scope.

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

---

## 9. Explicit Deferrals

These items are intentionally out of scope for Team Weekly Planning v1:

- no schedule engine
- no recurrence system
- no timezone personalization
- no athlete-level attendance
- no roster dependency
- no analytics or reporting expansion
- no full session detail view
- no `activities[]` exposure
- no infra, IAM, auth-boundary, tenancy-boundary, entitlements-model, table, or GSI changes

Future weekly planning depth should be treated as follow-on work, not implied by this frozen v1 contract.
