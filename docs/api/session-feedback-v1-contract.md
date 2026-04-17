# Session Feedback v1 Contract

## Purpose

This document defines the Week 20 backend-first API contract for:

- `POST /sessions/{sessionId}/feedback`

This is a narrow, product-first pilot feedback slice for the coach workflow.

It documents the current implementation only. It does not introduce infra, IAM, auth-boundary, tenancy-boundary, entitlements-model, or event-timeline changes.

## Contract rules

- Auth is required.
- Tenant scope is server-derived only.
- Tenant identity is never accepted from client input.
- Requests must not include `tenant_id`, `tenantId`, or `x-tenant-id`.
- Feedback is single-submit in this route: one feedback record per session.
- Second submission for the same session returns `409`.
- Session existence must be verified in the same tenant scope before feedback is written.

---

## 1. Route

- Method: `POST`
- Path: `/sessions/{sessionId}/feedback`

### Purpose

Capture bounded Week 20 pilot feedback for an existing saved session.

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

- `sessionQuality` required integer
- `drillUsefulness` required integer
- `imageAnalysisAccuracy` required string enum
- `missingFeatures` required string
- `flowMode` optional string enum

Unknown fields are rejected.

### 2.3 Request example

```json
{
  "sessionQuality": 4,
  "drillUsefulness": 5,
  "imageAnalysisAccuracy": "high",
  "missingFeatures": "Wanted easier drill editing.",
  "flowMode": "setup_to_drill"
}
```

---

## 3. Validation Rules

- `sessionQuality` must be an integer from `1` to `5`
- `drillUsefulness` must be an integer from `1` to `5`
- `imageAnalysisAccuracy` must be one of:
  - `not_used`
  - `low`
  - `medium`
  - `high`
- `missingFeatures` must be a string, is trimmed, and must be `1..280` chars after trim
- `flowMode` when present must be one of:
  - `session_builder`
  - `environment_profile`
  - `setup_to_drill`
- Unknown body fields are rejected
- `tenant_id`, `tenantId`, and `x-tenant-id` are rejected from request input

`imageAnalysisAccuracy = not_used` is valid for non-image flow.

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
    "sessionQuality": 4,
    "drillUsefulness": 5,
    "imageAnalysisAccuracy": "high",
    "missingFeatures": "Wanted easier drill editing.",
    "flowMode": "setup_to_drill",
    "schemaVersion": 2
  }
}
```

Optional fields are omitted when not supplied.

### 4.2 Persistence rule

The persistence model remains intentionally small:

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
  "sessionQuality": 4,
  "drillUsefulness": 5,
  "imageAnalysisAccuracy": "not_used",
  "missingFeatures": "Wanted easier drill editing.",
  "tenantId": "should-not-be-here"
}
```

Expected result:

- `400 platform.bad_request`
- `details.unknown` includes `tenantId`

This is negative-test coverage only, not valid request shape.

---

## 7. Out of Scope for Week 20

The following are intentionally out of scope for this contract:

- feedback timeline or event-stream read work
- feedback read/list endpoints
- feedback update/delete behavior
- app UI for feedback capture
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
