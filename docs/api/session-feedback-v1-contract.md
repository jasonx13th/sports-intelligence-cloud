# Session Feedback v1 Contract

## Purpose

This document defines the Week 14 Day 1 API contract for:

- `POST /sessions/{sessionId}/feedback`

This is a narrow, product-first feedback loop slice for the coach workflow.

It documents the current implementation only. It does not introduce infra, IAM, auth-boundary, tenancy-boundary, entitlements-model, or event-timeline changes.

## Contract rules

- Auth is required.
- Tenant scope is server-derived only.
- Tenant identity is never accepted from client input.
- Requests must not include `tenant_id`, `tenantId`, or `x-tenant-id`.
- Feedback is single-submit in v1: one feedback record per session.
- Second submission for the same session returns `409`.
- Session existence must be verified in the same tenant scope before feedback is written.

---

## 1. Route

- Method: `POST`
- Path: `/sessions/{sessionId}/feedback`

### Purpose

Capture structured coach feedback for an existing saved session.

### Auth requirement

- The route is protected by the existing JWT authorizer.
- Verified identity comes from auth.
- Authoritative tenant scope comes from server-side entitlements.

### Tenancy note

Tenant identity is never accepted from:

- request body
- query params
- headers such as `x-tenant-id`

The implementation rejects client-supplied tenant-like fields and uses tenant-scoped repository access by construction.

---

## 2. Request Contract

### 2.1 Path params

- `sessionId` required string

### 2.2 Body fields

Allowed body fields only:

- `rating` required integer
- `runStatus` required string enum
- `objectiveMet` optional boolean
- `difficulty` optional string enum
- `wouldReuse` optional boolean
- `notes` optional string
- `changesNextTime` optional string

Unknown fields are rejected.

### 2.3 Request example

```json
{
  "rating": 4,
  "runStatus": "ran_with_changes",
  "objectiveMet": true,
  "difficulty": "about_right",
  "wouldReuse": true,
  "notes": "Useful session.",
  "changesNextTime": "Add more finishing."
}
```

---

## 3. Validation Rules

- `rating` must be an integer from `1` to `5`
- `runStatus` must be one of:
  - `ran_as_planned`
  - `ran_with_changes`
  - `not_run`
- `objectiveMet` must be boolean when present
- `difficulty` must be one of:
  - `too_easy`
  - `about_right`
  - `too_hard`
- `wouldReuse` must be boolean when present
- `notes` is trimmed when present and must be at most `1000` characters
- `changesNextTime` is trimmed when present and must be at most `1000` characters
- If `runStatus = not_run`, `objectiveMet` and `difficulty` are rejected as inconsistent
- Unknown body fields are rejected
- `tenant_id`, `tenantId`, and `x-tenant-id` are rejected from request input

---

## 4. Success Response

### 4.1 Response shape

- `201 Created`

```json
{
  "feedback": {
    "sessionId": "session-123",
    "submittedAt": "2026-04-10T00:00:00.000Z",
    "submittedBy": "user-123",
    "rating": 4,
    "runStatus": "ran_with_changes",
    "objectiveMet": true,
    "difficulty": "about_right",
    "wouldReuse": true,
    "notes": "Useful session.",
    "changesNextTime": "Add more finishing.",
    "schemaVersion": 1
  }
}
```

Optional fields are omitted when not supplied.

### 4.2 Persistence rule

The v1 persistence model is intentionally small:

- one feedback record per session
- one tenant-scoped feedback record key per session
- duplicate submission is rejected

---

## 5. Error Semantics

The route uses the platform error envelope.

### 5.1 `400 platform.bad_request`

Used for:

- missing `sessionId`
- invalid JSON
- unknown fields
- invalid field types or values
- inconsistent combinations such as `runStatus = not_run` with `objectiveMet`
- client-supplied tenant-like inputs

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

### 5.2 `404 sessions.not_found`

Used when the target session does not exist in the resolved tenant scope.

```json
{
  "error": {
    "code": "sessions.not_found",
    "message": "Not found",
    "details": {
      "entityType": "SESSION"
    }
  }
}
```

### 5.3 `409 sessions.feedback_exists`

Used when feedback already exists for the same session.

```json
{
  "error": {
    "code": "sessions.feedback_exists",
    "message": "Conflict",
    "details": {
      "entityType": "SESSION_FEEDBACK",
      "sessionId": "session-123"
    }
  }
}
```

---

## 6. Intentional Negative Test Example

The contract does not accept client tenant identity fields.

An intentional rejection test may include `tenantId` only to verify that rejection path:

```json
{
  "rating": 4,
  "runStatus": "ran_as_planned",
  "tenantId": "should-not-be-here"
}
```

Expected result:

- `400 platform.bad_request`
- `details.unknown` includes `tenantId`

This is negative-test coverage only, not valid request shape.

---

## 7. Out of Scope for Week 14 Day 1

The following are intentionally out of scope for this contract:

- feedback timeline or event-stream work
- feedback read/list endpoints
- feedback update/delete behavior
- dashboards or alarms for feedback
- Postman workflow details
- broader learning/review workflow documentation

---

## 8. Tenancy and Data Access Note

This contract does not change the SIC tenancy model:

- verified auth establishes identity
- entitlements establish tenant scope
- repositories enforce tenant-scoped access by construction
- no scan-then-filter pattern is used for this endpoint

