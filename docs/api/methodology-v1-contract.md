# Methodology v1 Contract

## Purpose

This document defines the narrow Methodology v1 backend domain and route contract for SIC Coach Workspace.

This is still a narrow backend slice. It adds only the first text-only methodology routes and does not add frontend pages, file uploads, version history, or generation-context wiring.

Methodology is an explicit product concept in the shared app direction. Coach-admin methodology ownership is intended to live inside that shared tenant-scoped product direction.

`durationMin` remains request-owned and unrelated to Methodology ownership. Quick Session and Session Builder still choose duration per request, and Methodology v1 does not change that rule.

---

## 1. Routes

Methodology v1 currently includes only:

- `GET /methodology/{scope}`
- `PUT /methodology/{scope}`
- `POST /methodology/{scope}/publish`

This step does not add:

- list routes
- delete routes
- upload routes
- version history routes
- generation-context usage

All three routes are authenticated and tenant-scoped by construction.

- `GET /methodology/{scope}` is authenticated and tenant-scoped.
- `PUT /methodology/{scope}` is admin-only.
- `POST /methodology/{scope}/publish` is admin-only.

No auth model, tenancy model, or duration ownership rules change in this step.

---

## 2. Domain Shape

Stored methodology records use one tenant-scoped item per scope:

- `PK = TENANT#<tenantId>`
- `SK = METHODOLOGY#<scope>`
- `entityType = "METHODOLOGY"`
- `scope`
- `title`
- `content`
- `status`
- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`

Supported scope values:

- `shared`
- `travel`
- `ost`

Supported status values:

- `draft`
- `published`

Methodology remains text-only in this slice. No upload/file fields are part of Methodology v1 here.

---

## 3. Request Contracts

### 3.1 `GET /methodology/{scope}`

- `scope` is a required path parameter
- `scope` must be one of:
  - `shared`
  - `travel`
  - `ost`
- no request body

### 3.2 `PUT /methodology/{scope}`

- `scope` is a required path parameter
- `scope` is path-owned, not body-owned
- allowed body fields only:
  - `title` required string
  - `content` required string
- unknown body fields are rejected
- client tenant-like fields are rejected
- `durationMin` is unrelated and must not appear here

Save behavior:

- save or update the scoped methodology record for the resolved tenant
- `status` is written as `draft` on save
- existing `createdAt` and `createdBy` are preserved on update

### 3.3 `POST /methodology/{scope}/publish`

- `scope` is a required path parameter
- `scope` is path-owned
- request body must be empty
- requires an existing scoped methodology record

Publish behavior:

- marks `status = published`
- updates `updatedAt`
- updates `updatedBy`

---

## 4. Validation Rules

- unknown fields are rejected
- tenant-like client fields are rejected from headers, query params, and bodies:
  - `tenant_id`
  - `tenantId`
  - `x-tenant-id`
- unsupported scope values are rejected
- `title` must be a trimmed non-empty string with max length `160`
- `content` must be a trimmed non-empty string with max length `50000`
- `status` supports only:
  - `draft`
  - `published`
- `status` defaults to `draft` in the domain
- `PUT /methodology/{scope}` does not accept `scope` or `status` in the body
- `durationMin` is not part of Methodology v1

---

## 5. Success Responses

### 5.1 `GET /methodology/{scope}`

- `200 OK`

```json
{
  "methodology": {
    "scope": "shared",
    "title": "Shared Possession Model",
    "content": "Principles for decision-making in possession.",
    "status": "draft",
    "createdAt": "2026-04-22T12:00:00.000Z",
    "updatedAt": "2026-04-22T12:00:00.000Z",
    "createdBy": "user-123",
    "updatedBy": "user-123"
  }
}
```

### 5.2 `PUT /methodology/{scope}`

- `200 OK`

```json
{
  "methodology": {
    "scope": "travel",
    "title": "Travel Game Model",
    "content": "Travel methodology content.",
    "status": "draft",
    "createdAt": "2026-04-22T12:00:00.000Z",
    "updatedAt": "2026-04-22T12:00:00.000Z",
    "createdBy": "user-123",
    "updatedBy": "user-123"
  }
}
```

### 5.3 `POST /methodology/{scope}/publish`

- `200 OK`

```json
{
  "methodology": {
    "scope": "shared",
    "title": "Shared Possession Model",
    "content": "Principles for decision-making in possession.",
    "status": "published",
    "createdAt": "2026-04-21T10:00:00.000Z",
    "updatedAt": "2026-04-22T14:00:00.000Z",
    "createdBy": "user-123",
    "updatedBy": "user-123"
  }
}
```

---

## 6. Error Semantics

The routes use the platform error envelope.

### 6.1 `400 platform.bad_request`

Used for:

- invalid path scope
- invalid JSON
- missing required body fields
- unknown body fields
- client-supplied tenant-like inputs
- invalid publish body

```json
{
  "error": {
    "code": "platform.bad_request",
    "message": "Bad request",
    "details": {
      "unknown": ["scope"]
    }
  }
}
```

### 6.2 `403 methodology.admin_required`

Used when a non-admin user calls:

- `PUT /methodology/{scope}`
- `POST /methodology/{scope}/publish`

```json
{
  "error": {
    "code": "methodology.admin_required",
    "message": "Forbidden",
    "details": {
      "requiredRole": "admin"
    }
  }
}
```

### 6.3 `404 methodology.not_found`

Used when the resolved tenant does not have a methodology record for the requested scope.

```json
{
  "error": {
    "code": "methodology.not_found",
    "message": "Not found",
    "details": {
      "entityType": "METHODOLOGY",
      "scope": "shared"
    }
  }
}
```

---

## 7. Non-Goals

This step does not add:

- frontend pages
- file upload handling
- auth changes
- tenancy changes
- IAM/CDK changes beyond the minimal route wiring for these three endpoints
- generation-context integration
- methodology-driven duration behavior
- methodology history or versioning
