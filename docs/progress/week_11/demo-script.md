# Club Vivo Week 11 Demo Runbook

## Purpose

This runbook is a short demo script for the hardened Week 11 Session Builder flow.

It shows the current coach-facing runtime:

- generate a session pack
- save one session
- list sessions
- fetch one session
- export one session PDF

## Preconditions

- authenticated access is available through the normal SIC auth flow
- a sanitized local or Postman setup is ready
- no live secrets, tokens, or tenant identifiers are stored in committed files
- tenant scope comes only from verified auth plus server-side entitlements

## Non-Negotiable Tenant Rule

Never send or trust:

- `tenant_id`
- `tenantId`
- `x-tenant-id`

Normal demo requests use bearer auth only. Tenant scope is derived server-side from verified auth and entitlements.

## Suggested demo setup

- Use a sanitized `{{baseUrl}}`
- Use a valid bearer token from the normal auth flow
- Keep request examples free of live user, tenant, or environment values
- Capture responses with secrets redacted

## Demo flow

### 1. Generate a session pack

Call `POST /session-packs` with a valid Week 11 request.

Example body:

```json
{
  "sport": "soccer",
  "ageBand": "u14",
  "durationMin": 60,
  "theme": "pressing",
  "sessionsCount": 2,
  "equipment": ["cones", "balls"]
}
```

What to show:

- request succeeds with `201`
- response includes `pack`
- generated sessions are present
- total generated session duration is valid

### 2. Save one valid session

Pick one generated session and send it to `POST /sessions`.

Example body:

```json
{
  "sport": "soccer",
  "ageBand": "u14",
  "durationMin": 60,
  "objectiveTags": ["pressing"],
  "equipment": ["cones", "balls"],
  "activities": [
    {
      "name": "Warm-up",
      "minutes": 10,
      "description": "Mobility and activation"
    },
    {
      "name": "Pressing Game",
      "minutes": 50,
      "description": "Conditioned game for pressing triggers"
    }
  ]
}
```

What to show:

- request succeeds with `201`
- response includes `{ "session": { ... } }`
- capture the returned `sessionId`

### 3. List sessions

Call `GET /sessions`.

What to show:

- request succeeds with `200`
- summary list includes the newly created session
- list response stays summary-only

### 4. Fetch one session

Call `GET /sessions/{sessionId}` using the created session id.

What to show:

- request succeeds with `200`
- full session detail is returned
- detail includes `activities`

### 5. Export one session PDF

Call `GET /sessions/{sessionId}/pdf`.

What to show:

- request succeeds with `200`
- response includes `url`
- response includes `expiresInSeconds`

## Negative checks to mention

### Unsupported `ageBand`

Show that an unsupported `ageBand` such as `u7` fails cleanly with a bad request response.

### Incompatible equipment

Show that an incompatible request fails cleanly when explicit equipment cannot support the requested session-pack theme or activities.

### No client tenant fields

Show that normal requests do not send:

- `tenant_id`
- `tenantId`
- `x-tenant-id`

If needed, mention that tenant-like fields are rejected rather than trusted.

## Expected evidence to capture

- screenshot or sanitized log of successful `POST /session-packs`
- screenshot or sanitized log of successful `POST /sessions`
- captured `sessionId`
- screenshot or sanitized log of successful `GET /sessions`
- screenshot or sanitized log of successful `GET /sessions/{sessionId}`
- screenshot or sanitized log of successful `GET /sessions/{sessionId}/pdf`
- returned PDF URL response

## Intentionally not shown

This Week 11 demo does not cover:

- admin/domain export flow
- team assignment
- club layer workflows
- broader team or club management behavior

## References

- `docs/api/session-builder-v1-contract.md`
- `docs/architecture/session-builder-week11.md`
- `postman/README.md`
