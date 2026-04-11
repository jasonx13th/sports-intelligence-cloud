# Week 15 Demo Script

## Purpose

This demo shows the smallest realistic Team Layer flow that SIC can support today.

It stays coach-centered and API-first:

- confirm that teams can be listed and read
- assign one existing saved session to one existing team
- show that duplicate replay is idempotent
- verify the assigned-session list

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

Optional setup path if a team does not already exist:

1. Use an admin-capable token.
2. Call `POST /teams`.
3. Save the returned `teamId`.

If no admin-capable token is available, treat team creation as a pre-created setup condition and continue with an existing team.

---

## Demo flow

### 1. Confirm teams are available

Call:

- `GET /teams`

What to show:

- `200 OK`
- the response contains an `items` array
- the target `teamId` is visible or can be selected from the returned list

### 2. Confirm the specific team detail

Call:

- `GET /teams/{teamId}`

What to show:

- `200 OK`
- the returned team is tenant-scoped
- the returned team matches the expected `teamId`

### 3. Assign the saved session to the team

Call:

- `POST /teams/{teamId}/sessions/{sessionId}/assign`

Suggested body:

```json
{
  "notes": "Use next Tuesday"
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

### 4. Repeat the same assign request

Call the same endpoint again:

- `POST /teams/{teamId}/sessions/{sessionId}/assign`

What to show:

- `200 OK`
- the response still contains the assignment payload
- duplicate replay is idempotent and does not widen scope into a second assignment model

### 5. Confirm the team assignment list

Call:

- `GET /teams/{teamId}/sessions`

What to show:

- `200 OK`
- the response contains an `items` array
- the list includes the assigned `teamId + sessionId` pair

---

## Evidence to capture

### API responses

Capture or summarize the key responses for:

- `GET /teams`
- `GET /teams/{teamId}`
- first `POST /teams/{teamId}/sessions/{sessionId}/assign`
- second `POST /teams/{teamId}/sessions/{sessionId}/assign`
- `GET /teams/{teamId}/sessions`

### One negative check

Run one small negative check only.

Recommended option:

- `GET /teams/{teamId}/sessions` with a missing team id -> expect `404 teams.not_found`

Acceptable alternative:

- `POST /teams/{teamId}/sessions/{sessionId}/assign` with a missing session id -> expect `404 sessions.not_found`

### Logs

If logs are already available in the current workflow, capture the relevant success events:

- `team_listed`
- `team_fetched`
- `team_session_assigned`
- `team_session_assignment_replayed`
- `team_sessions_listed`

If logs are not convenient to show live, the demo can still rely on API responses as the primary evidence and mention the expected log events as supporting evidence.

---

## What is explicitly deferred

This demo does not include:

- a new Team Layer UI
- attendance flows
- scheduling or calendar flows
- unassign flows
- replacement or ordering semantics for assignments
- team analytics, dashboards, or reporting
- club-level workflows
- new endpoints
- new infrastructure, IAM, auth-boundary, tenancy-boundary, or entitlements-model changes

If any part of the demo would require a new UI, a new endpoint, or infra changes, that part should be treated as deferred and not included in the Week 15 demo.

---

## Closeout message

The strongest closeout for this demo is:

- SIC can already create and read tenant-scoped teams
- SIC can already connect a saved session to a team with a tenant-safe assignment path
- SIC already preserves idempotent replay behavior for repeated assignment calls

That is enough evidence for the current Team Layer v1 slice without implying broader team/platform readiness.
