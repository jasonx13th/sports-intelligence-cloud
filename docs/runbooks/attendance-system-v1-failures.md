# Runbook: Attendance System v1 Failures

## Purpose

This runbook explains how to reason about the current Attendance System v1 slice when it fails or appears confusing in production-like use.

It covers only the current implemented Week 16 behavior for:

- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`
- `GET /teams/{teamId}/planning/weekly`

This is a practical current-state runbook, not a redesign document.

## Scope and non-negotiable safety rules

This runbook applies only to the current Attendance System v1 implementation and the frozen Week 16 contracts.

Non-negotiable safety rules:

- tenant scope must come only from verified auth plus authoritative entitlements
- no request-derived tenant scope is allowed
- never accept `tenant_id`, `tenantId`, or `x-tenant-id` from client input
- no scan-then-filter troubleshooting pattern is allowed
- treat `404`, `400`, `200` replay, `409`, and empty weekly-planning results as expected product behavior unless there is an unusual spike or regression

Current scope limits:

- no dedicated Attendance System dashboard yet
- no dedicated alarm surface yet for this slice
- no infra, IAM, auth-boundary, tenancy-boundary, entitlements-model, table, or GSI changes are part of this runbook

Explicitly out of scope:

- scheduler behavior
- recurrence behavior
- timezone personalization redesign
- athlete-level attendance
- roster dependency
- analytics or reporting expansion
- cross-team weekly planning redesign
- new table or GSI proposals
- infra, IAM, auth, tenancy, or entitlements redesign
- Day 1 or Day 2 contract redesign
- any suggestion to try another client-supplied tenant identifier

## 1) Trigger

- A coach reports an unexpected attendance or weekly planning result.
- A developer sees confusing `400`, `404`, `409`, `401`, or `403` responses on attendance routes.
- The current route-level success events drop unexpectedly:
  - `team_attendance_recorded`
  - `team_attendance_replayed`
  - `team_attendance_listed`
  - `team_weekly_planning_fetched`
- Existing platform/auth failure signals or logs suggest auth or entitlements regression:
  - `auth_unauthenticated`
  - `auth_forbidden`
  - `handler_error`
  - `request_end`

## 2) Impact

- Coaches may be unable to record attendance for a team session occurrence.
- Coaches may see an empty or partial current-week planning view.
- Some responses that look like failures are expected and safe:
  - `404 teams.not_found`
  - `404 sessions.not_found`
  - `400 platform.bad_request`
  - `200` exact replay
  - `409 teams.attendance_exists`
  - `200` weekly planning with empty `items`
  - `200` weekly planning with assignment-only items
- Data integrity risk is low when the system is behaving as designed because:
  - writes are tenant-scoped by construction
  - duplicate create attempts use replay-safe handling
  - weekly planning is read-only composition

## 3) 5-minute triage (do these first)

1. Identify the route:
   - `POST /teams/{teamId}/attendance`
   - `GET /teams/{teamId}/attendance`
   - `GET /teams/{teamId}/planning/weekly`
2. Identify the response class:
   - expected product behavior
   - suspicious spike
   - possible platform/auth issue
3. Determine whether the response is one of the expected outcomes listed in this runbook before treating it as an incident.
4. Check whether the behavior is isolated to one team or tenant versus broad across many tenants.
5. Check recent route-level logs and the current platform/auth error path for the same route and time window.
6. Do not attempt any workaround that relies on client-supplied tenant identifiers.

## 4) Failure map by route

### `POST /teams/{teamId}/attendance`

Expected outcomes:

- `201` first create
- `200` exact normalized replay
- `400 platform.bad_request` invalid payload or spoofed tenant-like input
- `404 teams.not_found`
- `404 sessions.not_found`
- `409 teams.attendance_exists`
- `401/403` current auth or entitlements behavior

### `GET /teams/{teamId}/attendance`

Expected outcomes:

- `200` with attendance history
- `200` with empty `items`
- `400 platform.bad_request` invalid query or spoofed tenant-like input
- `404 teams.not_found`
- `401/403` current auth or entitlements behavior

### `GET /teams/{teamId}/planning/weekly`

Expected outcomes:

- `200` with attendance-backed items
- `200` with assignment-only items
- `200` with empty `items`
- `400 platform.bad_request` forbidden query params or spoofed tenant-like input
- `404 teams.not_found`
- `401/403` current auth or entitlements behavior

## 5) Scenario playbooks

### Team not found

Expected client behavior:

- `404 teams.not_found` is expected when the requested team does not exist inside the resolved tenant scope.

Operator note:

- Treat this as normal product behavior by default.
- Investigate only if `teams.not_found` spikes unexpectedly for known-good teams or after a recent deploy or seed-data change.

### Session not found

Expected client behavior:

- `404 sessions.not_found` is expected on `POST /teams/{teamId}/attendance` when the referenced saved session is missing in the resolved tenant scope.

Operator note:

- Treat this as normal product behavior by default.
- Investigate only if a known saved session suddenly starts failing across multiple requests or tenants.

### Invalid attendance payload

Expected client behavior:

- `400 platform.bad_request` is expected for:
  - invalid `status`
  - invalid `sessionDate`
  - unknown request fields
  - forbidden tenant-like inputs such as `tenantId`

Operator note:

- Treat isolated `400` responses as expected client-side mistakes.
- Investigate only if `400` volume spikes after a client rollout or if a previously valid request shape starts failing.

### Duplicate replay behavior

Expected client behavior:

- `200` is expected when the same natural key is replayed with the same normalized payload.
- `409 teams.attendance_exists` is expected when the same natural key is replayed with a different normalized payload.

Operator note:

- Replays are not incidents by default.
- Investigate only if replay volume spikes unexpectedly, or if clients appear to be looping retries without backoff.

### Missing current-week data

Expected client behavior:

- `200` with empty `items` is expected when the current UTC Monday-through-Sunday window has no assignments and no attendance for the team.

Operator note:

- Treat empty current-week results as expected unless a team is known to have current-week attendance or assignments that are not appearing.
- Check whether the question is really about a different week before assuming a system fault.

### Weekly planning composition behavior

Expected client behavior:

- `200` with assignment-only items is expected when the team has current assignments but no current-week attendance occurrence yet.
- Multiple attendance items for the same `sessionId` are expected when multiple real attendance occurrences exist in the same current week.
- Assignment-only items intentionally do not include invented `sessionDate` or `status`.

Operator note:

- Treat “missing scheduled date” complaints as expected current product behavior, not a bug by default.
- Investigate only if weekly planning stops showing known attendance-backed occurrences or if assignment enrichment drops unexpectedly.

### Auth failure

Expected client behavior:

- `401` or `403` is expected when auth is missing, invalid, expired, or otherwise rejected by the current auth path.

Operator note:

- Use the existing auth failure runbook for deep operator handling:
  - `docs/runbooks/auth-failures.md`
- Treat a broad spike across many tenants as a platform/auth investigation, not an attendance-specific bug.

### Entitlements failure

Expected client behavior:

- `403` is expected when the authenticated principal lacks valid authoritative entitlements for tenant scope or capabilities.

Operator note:

- Use the existing entitlement failure runbook for deep operator handling:
  - `docs/runbooks/entitlement-failures.md`
- Do not work around this by accepting client-supplied tenant identifiers.

## 6) Logs Insights queries

### Attendance route outcomes

```sql
fields @timestamp, eventType, tenantId, userId, correlationId, http.path, http.statusCode, error.code
| filter eventType in ["team_attendance_recorded","team_attendance_replayed","team_attendance_listed","handler_error","request_end"]
| stats count() as n by eventType, tenantId, http.path, http.statusCode, error.code
| sort n desc
| limit 100
```

### Weekly planning route outcomes

```sql
fields @timestamp, eventType, tenantId, userId, correlationId, http.path, http.statusCode, error.code
| filter http.path like /\/teams\/.*\/planning\/weekly/
| filter eventType in ["team_weekly_planning_fetched","handler_error","request_end"]
| stats count() as n by tenantId, eventType, http.statusCode, error.code
| sort n desc
| limit 100
```

### Auth and entitlements correlation

```sql
fields @timestamp, eventType, tenantId, userId, correlationId, http.path, http.statusCode, error.code
| filter eventType in ["auth_unauthenticated","auth_forbidden","handler_error","request_end"]
| stats count() as n by eventType, tenantId, http.path, http.statusCode, error.code
| sort n desc
| limit 100
```

### Trace one request

```sql
fields @timestamp, level, eventType, message, tenantId, userId, requestId, correlationId, http.path, http.statusCode, error.code
| filter correlationId = "REPLACE_ME"
| sort @timestamp asc
```

## 7) Safe mitigation

- First decide whether the reported behavior is expected product behavior before treating it as an incident.
- If the issue is isolated to one team or one client workflow, reproduce the exact route and request shape against the frozen contract.
- If the issue is auth-related or entitlements-related, route triage through the existing auth and entitlement runbooks.
- If replay volume appears abnormally high, check client retry behavior before changing server behavior.
- If weekly planning looks empty, verify whether the current UTC week really contains data before escalating.
- Keep mitigation safe and reversible.
- Do not suggest client-side tenant overrides.
- Do not use scan-then-filter inspection patterns to troubleshoot tenant-scoped data.

## 8) Prevention / follow-ups

- Add a link to this runbook from future Attendance System dashboard or alarm surfaces once they exist.
- Keep route-level log names stable so this runbook remains usable.
- Add a short client-facing troubleshooting note later if repeated confusion appears around:
  - exact replay `200`
  - conflicting replay `409`
  - empty current-week planning responses
  - assignment-only weekly planning items
- Revisit this runbook if the Attendance System grows beyond the current Week 16 slice.

## Related docs

- `docs/api/team-attendance-v1-contract.md`
- `docs/api/team-weekly-planning-v1-contract.md`
- `docs/progress/week_16/attendance-storage-design.md`
- `docs/architecture/attendance-system-v1.md`
- `docs/runbooks/auth-failures.md`
- `docs/runbooks/entitlement-failures.md`
