# Session Builder v1 Contract

## Purpose

This document freezes the Week 11 v1 API contract for the Session Builder surface already present in the repo.

It defines the documented v1 contracts for:

- `Session`
- `SessionPack`
- `POST /sessions`
- `GET /sessions`
- `GET /sessions/{sessionId}`
- `POST /session-packs`

This is a product/API contract freeze, not an infrastructure, auth, tenancy, or entitlements change.

## Contract rules

- Tenant scope is server-derived only.
- Tenant identity is never accepted from client input.
- Requests must not include `tenant_id`, `tenantId`, or `x-tenant-id`.
- `POST /session-packs` remains stateless in v1.
- `ageBand` is the v1 field name.
- `clubId`, `teamId`, and `seasonId` are not part of the frozen documented v1 contract.

Note: some legacy optional runtime-tolerated fields may still exist in current implementation, but they are not part of the frozen v1 API contract unless documented here.

---

## 1. Session v1 Contract

### 1.1 Request shape

Used by `POST /sessions`.

```json
{
  "sport": "soccer",
  "ageBand": "u14",
  "durationMin": 45,
  "objectiveTags": ["pressing"],
  "equipment": ["cones", "balls"],
  "activities": [
    {
      "name": "Warm-up",
      "minutes": 10,
      "description": "Dynamic movement prep"
    },
    {
      "name": "Pressing game",
      "minutes": 20,
      "description": "Small-sided pressing exercise"
    }
  ]
}
```

### 1.2 Response shape

Used by `POST /sessions` and `GET /sessions/{sessionId}`.

```json
{
  "sessionId": "uuid",
  "createdAt": "2026-04-01T00:00:00.000Z",
  "createdBy": "user-sub-or-null",
  "sport": "soccer",
  "ageBand": "u14",
  "durationMin": 45,
  "objectiveTags": ["pressing"],
  "equipment": ["cones", "balls"],
  "activities": [
    {
      "name": "Warm-up",
      "minutes": 10,
      "description": "Dynamic movement prep"
    },
    {
      "name": "Pressing game",
      "minutes": 20,
      "description": "Small-sided pressing exercise"
    }
  ],
  "schemaVersion": 1
}
```

### 1.3 List summary shape

Used by `GET /sessions`.

```json
{
  "sessionId": "uuid",
  "createdAt": "2026-04-01T00:00:00.000Z",
  "sport": "soccer",
  "ageBand": "u14",
  "durationMin": 45,
  "objectiveTags": ["pressing"],
  "activityCount": 2
}
```

### 1.4 Persisted shape

The persisted Session domain shape for v1 is:

```json
{
  "sessionId": "uuid",
  "createdAt": "date-time",
  "createdBy": "string|null",
  "sport": "string",
  "ageBand": "string",
  "durationMin": 45,
  "objectiveTags": ["string"],
  "equipment": ["string"],
  "activities": [
    {
      "name": "string",
      "minutes": 10,
      "description": "string"
    }
  ],
  "schemaVersion": 1
}
```

Fields outside this documented shape are not part of the frozen Session Builder v1 contract.

---

## 2. SessionPack v1 Contract

### 2.1 Request shape

Used by `POST /session-packs`.

```json
{
  "sport": "soccer",
  "sportPackId": "fut-soccer",
  "ageBand": "u14",
  "durationMin": 60,
  "theme": "pressing",
  "sessionsCount": 3,
  "equipment": ["cones", "balls"]
}
```

### 2.2 Generated shape

`SessionPack` is generated and returned in v1. It is not persisted as a domain object in this contract.

```json
{
  "packId": "uuid",
  "createdAt": "2026-04-01T00:00:00.000Z",
  "sport": "soccer",
  "ageBand": "u14",
  "durationMin": 60,
  "theme": "pressing",
  "sessionsCount": 3,
  "equipment": ["cones", "balls"],
  "sessions": [
    {
      "sport": "soccer",
      "ageBand": "u14",
      "durationMin": 60,
      "objectiveTags": ["pressing", "transition"],
      "equipment": ["cones", "balls"],
      "activities": [
        {
          "name": "Warm-up",
          "minutes": 10,
          "description": "Dynamic movement prep"
        }
      ]
    }
  ]
}
```

### 2.3 Persistence rule

- `POST /session-packs` is stateless in v1.
- No persisted `SessionPack` contract is defined in Week 11 v1.

---

## 3. Endpoint Contracts

## 3.1 POST /sessions

### Request

- Content type: JSON
- Body fields:
  - `sport` required string
  - `ageBand` required string
  - `durationMin` required integer
  - `activities` required non-empty array
  - `objectiveTags` optional array of strings
  - `equipment` optional array of strings

Unknown fields are rejected.

### Response

- `201 Created`

```json
{
  "session": {
    "sessionId": "uuid",
    "createdAt": "date-time",
    "createdBy": "string|null",
    "sport": "string",
    "ageBand": "string",
    "durationMin": 45,
    "objectiveTags": ["string"],
    "equipment": ["string"],
    "activities": [
      {
        "name": "string",
        "minutes": 10,
        "description": "string"
      }
    ],
    "schemaVersion": 1
  }
}
```

## 3.2 GET /sessions

### Request

- No request body
- Optional query params:
  - `limit`
  - `nextToken`

### Response

- `200 OK`

```json
{
  "items": [
    {
      "sessionId": "uuid",
      "createdAt": "date-time",
      "sport": "string",
      "ageBand": "string",
      "durationMin": 45,
      "objectiveTags": ["string"],
      "activityCount": 2
    }
  ],
  "nextToken": "opaque-string-or-null"
}
```

List responses are summary-only and do not include `activities`.

## 3.3 GET /sessions/{sessionId}

### Request

- Path param:
  - `sessionId` required string

### Response

- `200 OK`

```json
{
  "session": {
    "sessionId": "uuid",
    "createdAt": "date-time",
    "createdBy": "string|null",
    "sport": "string",
    "ageBand": "string",
    "durationMin": 45,
    "objectiveTags": ["string"],
    "equipment": ["string"],
    "activities": [
      {
        "name": "string",
        "minutes": 10,
        "description": "string"
      }
    ],
    "schemaVersion": 1
  }
}
```

## 3.4 POST /session-packs

### Request

- Content type: JSON
- Body fields:
  - `sport` required string
  - `sportPackId` optional string
  - `ageBand` required string
  - `durationMin` required integer
  - `theme` required string
  - `sessionsCount` optional integer, default server-defined
  - `equipment` optional array of strings

Unknown fields are rejected.

Week 17 Day 2 narrow addition:

- `sportPackId` is accepted only on `POST /session-packs`
- omitted `sportPackId` remains valid
- the only allowed v1 pack combination is:
  - `sport = "soccer"`
  - `sportPackId = "fut-soccer"`
- save, list, detail, and export routes remain unchanged
- generated and saved sessions remain canonically `sport = "soccer"` in v1

### Response

- `201 Created`

```json
{
  "pack": {
    "packId": "uuid",
    "createdAt": "date-time",
    "sport": "string",
    "ageBand": "string",
    "durationMin": 60,
    "theme": "string",
    "sessionsCount": 3,
    "equipment": ["string"],
    "sessions": [
      {
        "sport": "string",
        "ageBand": "string",
        "durationMin": 60,
        "objectiveTags": ["string"],
        "equipment": ["string"],
        "activities": [
          {
            "name": "string",
            "minutes": 10,
            "description": "string"
          }
        ]
      }
    ]
  }
}
```

---

## 4. Stable Validation and Error Semantics

The API uses a stable error envelope with a generic message and specific machine-readable details.

### 4.1 Error envelope

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {}
  }
}
```

### 4.2 Stable request-shape semantics

Use:

- `platform.bad_request`
- message: `Bad request`

With stable detail semantics:

- missing required fields:

```json
{
  "missing": ["fieldName"]
}
```

- unknown fields:

```json
{
  "unknown": ["fieldName"]
}
```

- invalid field:

```json
{
  "field": "fieldName"
}
```

### 4.3 Duration totals

#### POST /sessions

Rule:

- `sum(activities[].minutes)` must be less than or equal to `durationMin`

Error:

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "reason": "invalid_duration_total",
      "durationMin": 60,
      "totalMinutes": 75
    }
  }
}
```

#### POST /session-packs

Rule:

- each generated session must total exactly `durationMin` after deterministic padding

Error:

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "reason": "invalid_generated_duration_total",
      "durationMin": 60,
      "totalMinutes": 55
    }
  }
}
```

### 4.4 Equipment compatibility

Rule:

- if `equipment` is provided, activities or generated sessions must not require equipment outside the provided set
- if `equipment` is omitted, v1 may use safe baseline assumptions instead of failing

Error:

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "reason": "incompatible_equipment",
      "field": "equipment",
      "missingEquipment": ["goals"]
    }
  }
}
```

### 4.5 ageBand constraints

Rule:

- `ageBand` remains the v1 age field name
- requests must use a supported `ageBand`
- explicit deterministic age-band safety rules may reject incompatible activities or generated sessions

Unsupported ageBand error:

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "reason": "unsupported_age_band",
      "field": "ageBand",
      "value": "u4"
    }
  }
}
```

Age-band mismatch error:

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "reason": "age_band_activity_mismatch",
      "field": "activities",
      "index": 1,
      "ageBand": "u8"
    }
  }
}
```

### 4.6 Not found semantics

For unknown or tenant-inaccessible sessions:

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

### 4.7 Route not found semantics

```json
{
  "error": {
    "code": "platform.not_found",
    "message": "Not found"
  }
}
```

---

## 5. Explicit Out-of-Scope Fields for Week 11 v1

The following are out of scope for the frozen Week 11 Session Builder v1 contract:

- `tenant_id`
- `tenantId`
- `x-tenant-id`
- `clubId`
- `teamId`
- `seasonId`
- `level`
- `space`
- `intensity`
- `objective` narrative text
- `coachingPoints`
- `progressions`
- `regressions`
- `commonMistakes`
- `organization`
- `safetyNotes`
- `successCriteria`
- `assumptions`
- SessionPack persistence
- SessionPack export or PDF contract

Out of scope means they are not part of the documented frozen v1 API contract in Week 11, even if some existing runtime tolerance or future roadmap work mentions them elsewhere.

---

## 6. Tenancy Note

Tenant scope remains server-derived only.

This contract does not change the existing tenancy model:

- verified auth establishes identity
- server-side entitlements establish tenant scope
- repositories and storage remain tenant-scoped by construction

Client requests must never supply tenant identity fields, and the API contract does not accept them.
