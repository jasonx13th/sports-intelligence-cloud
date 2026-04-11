# Week 16 Demo Script

## Purpose

This demo shows the smallest realistic Attendance System v1 flow that SIC can support today.

It stays coach-centered and API-first:

- reuse or create one tenant-scoped team
- assign one existing saved session to that team
- record one real attendance occurrence
- verify attendance history for the team
- verify the current-week planning read
- show one stable negative case for conflicting replay

This demo does not require a new UI, a new endpoint, or any new infrastructure.

---

## Setup preconditions

Before running the demo, have:

- one saved session available
  - use an existing `sessionId`
  - if needed, create it through the already shipped Session Builder flow outside this demo
- one team available
  - either use an existing `teamId`
  - or have an admin-capable token available so a team can be created with `POST /teams`

Recommended working values:

- `baseUrl`
- `accessToken`
- `teamId`
- `sessionId`

Required setup assumptions:

- `{{baseUrl}}` is set
- `{{accessToken}}` is set
- `{{sessionId}}` already exists
- `{{teamId}}` already exists or can be created
- requests never send `tenant_id`, `tenantId`, or `x-tenant-id`
- tenant scope is server-derived only from verified auth plus authoritative entitlements

Demo date context for this script:

- current date context: April 11, 2026
- `weekStart = 2026-04-06`
- `weekEnd = 2026-04-12`
- recommended demo `sessionDate = 2026-04-10`

Why this date matters:

- the weekly planning route derives the current week server-side in UTC
- using `2026-04-10` keeps the attendance occurrence inside the example current-week window

Optional setup path if a team does not already exist:

1. Use an admin-capable token.
2. Call `POST /teams`.
3. Save the returned `teamId`.

If no admin-capable token is available, treat team creation as a pre-created setup condition and continue with an existing team.

---

## Demo flow

### 1. Reuse or create a team

Preferred call:

- `GET /teams`

Fallback setup call if needed:

- `POST /teams`

What to show:

- `GET /teams` returns `200 OK`
- the response contains an `items` array
- the target `teamId` is visible or can be selected from the returned list
- if team creation is needed, `POST /teams` returns `201 Created`
- the created team response includes `teamId`

### 2. Assign one existing saved session to the team

Call:

- `POST /teams/{teamId}/sessions/{sessionId}/assign`

Suggested body:

```json
{
  "notes": "Use Friday session"
}
```

What to show:

- `201 Created`
- the response contains `assignment`
- the payload includes:
  - `teamId`
  - `sessionId`
  - `assignedAt`
  - `assignedBy`
- if present, also show the current denormalized session summary fields:
  - `sessionCreatedAt`
  - `sport`
  - `ageBand`
  - `durationMin`
  - `objectiveTags`

### 3. Record one attendance occurrence

Call:

- `POST /teams/{teamId}/attendance`

Suggested body:

```json
{
  "sessionId": "{{sessionId}}",
  "sessionDate": "2026-04-10",
  "status": "completed",
  "notes": "Good intensity, full group"
}
```

What to show:

- `201 Created`
- the response contains `attendance`
- the payload includes:
  - `teamId`
  - `sessionId`
  - `sessionDate`
  - `status`
  - `notes`
  - `recordedAt`
  - `recordedBy`

### 4. Retrieve team attendance history

Call:

- `GET /teams/{teamId}/attendance`

What to show:

- `200 OK`
- the response contains an `items` array
- the list includes the recorded occurrence for:
  - `teamId`
  - `sessionId`
  - `sessionDate = 2026-04-10`
  - `status = completed`

### 5. Retrieve weekly planning

Use this direct API call if no Postman request exists yet:

```text
GET {{baseUrl}}/teams/{{teamId}}/planning/weekly
Authorization: Bearer {{accessToken}}
```

What to show:

- `200 OK`
- the response contains:
  - `teamId`
  - `weekStart`
  - `weekEnd`
  - `summary`
  - `items`
- the response week window matches:
  - `weekStart = 2026-04-06`
  - `weekEnd = 2026-04-12`
- the response includes an `attendance`-sourced item for the recorded occurrence
- the response summary includes at least:
  - `attendanceCount = 1`
  - `completedCount = 1`

### 6. Show one negative check

Call:

- `POST /teams/{teamId}/attendance - conflicting replay`

What to show:

- `409 Conflict`
- the error code is `teams.attendance_exists`

Why this is the recommended negative case:

- it stays inside the shipped Week 16 attendance slice
- it demonstrates stable duplicate-handling behavior
- it avoids widening the demo into auth, platform, or scheduling concerns

---

## Evidence to capture

### API responses

Capture or summarize the key responses for:

- `GET /teams`
- optional `POST /teams`
- `POST /teams/{teamId}/sessions/{sessionId}/assign`
- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`
- `GET /teams/{teamId}/planning/weekly`
- `POST /teams/{teamId}/attendance - conflicting replay`

### What the evidence should prove

The captured responses should make it easy to show that:

- the team is tenant-scoped and reusable
- one existing saved session can be assigned to one team
- one real attendance occurrence can be recorded for that team session occurrence
- attendance history returns the recorded occurrence
- weekly planning composes current assignments plus current-week attendance
- conflicting replay returns stable `409 teams.attendance_exists`

---

## One negative check

Run one small negative check only.

Recommended option:

- `POST /teams/{teamId}/attendance - conflicting replay` -> expect `409 teams.attendance_exists`

This is the strongest negative check for Week 16 because it proves the frozen natural-key conflict behavior without implying missing data, fake schedule semantics, or platform failure.

---

## Logs

If logs are already available in the current workflow, capture the relevant success events:

- `team_attendance_recorded`
- `team_attendance_listed`
- `team_weekly_planning_fetched`

If the negative check is run, also mention:

- the API error response is the primary evidence
- route-level logs are supporting evidence only

If logs are not convenient to show live, the demo can still rely on API responses as the primary evidence and mention the expected log events as supporting evidence.

---

## What is explicitly deferred

This demo does not include:

- scheduler semantics
- recurrence
- roster workflows
- athlete-level attendance
- analytics or reporting expansion
- infra expansion
- club-level planning views
- cross-team weekly planning
- timezone personalization
- new endpoints

If any part of the demo would require contract drift, new storage, or boundary changes, that part should be treated as deferred and not included in the Week 16 demo.

---

## Closeout message

The strongest closeout for this demo is:

- SIC can already attach one saved session to one tenant-scoped team
- SIC can already record one real attendance occurrence for that team session occurrence
- SIC can already return both attendance history and a thin current-week planning read without introducing fake schedule semantics
- SIC already preserves stable conflict behavior for conflicting replay on the same attendance natural key

That is enough evidence for the current Attendance System v1 slice without implying broader scheduling, roster, analytics, or platform readiness.
