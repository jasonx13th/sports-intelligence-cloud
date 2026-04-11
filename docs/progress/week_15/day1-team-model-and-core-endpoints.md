# Week 15 Day 1 - Team Model and Core Endpoints

## What changed

Week 15 Day 1 added the first Team Layer backend slice:

- `POST /teams`
- `GET /teams`
- `GET /teams/{teamId}`

The slice also hardened the team request contract so that:

- `POST /teams` remains admin-only
- tenant-like request fields are explicitly rejected
- Team v1 fields are validated consistently
- list and detail reads stay tenant-scoped by construction

## Why it changed

The current SIC roadmap calls for a small Team Layer step after the coach-first session flows.

This Day 1 slice adds the smallest usable team model without widening scope into assignments, attendance, or broader team workflow logic. The goal is to give SIC a real tenant-scoped team record surface that later Week 15 work can build on.

## How it was validated

The implementation was validated with focused unit tests for:

- team request validation
- team repository create / list / detail behavior
- team handler create / list / detail behavior
- admin-only `POST /teams` behavior
- `400` tenant-like input rejection
- `404 teams.not_found` detail behavior

The working verification commands were:

```powershell
node -e "require('./services/club-vivo/api/src/domains/teams/team-validate.test.js')"
node -e "require('./services/club-vivo/api/src/domains/teams/team-repository.test.js')"
node -e "require('./services/club-vivo/api/teams/handler.test.js')"
```

At the time of implementation, all team-slice tests passed.

## Tenancy / security check

- Tenant scope still comes only from verified auth plus server-side entitlements.
- The routes do not accept `tenant_id`, `tenantId`, or `x-tenant-id` from body, query, or headers.
- Team records remain tenant-scoped by construction:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAM#<teamId>`
- `GET /teams` remains query-based.
- `GET /teams/{teamId}` uses an exact-key tenant-scoped query.
- No scan or scan-then-filter pattern was introduced.

## Observability note

This slice uses the existing platform logging path and currently emits route-level success events only:

- `team_created`
- `team_listed`
- `team_fetched`

No new dashboard, alarm, or expanded observability surface was added in this Day 1 slice.

## Product impact note

SIC now has a minimal Team Layer foundation that is usable and realistic for the current stage:

- admins can create teams
- authenticated tenant users can list teams
- authenticated tenant users can view a team detail

This creates the first durable team model that later Week 15 steps can reference for assignment and planning workflows.

## Intentionally deferred

Deferred to later Week 15 work:

- assignment endpoints
- attendance endpoints
- team-session mapping flows
- richer team authorization beyond the current admin-only create rule
- docs for later Team Layer routes
- any analytics, dashboard, or reporting expansion
