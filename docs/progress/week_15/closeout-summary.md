```markdown
# Week 15 — Closeout Summary
## Team Layer v1

## Goal
Move SIC from individual session planning into the first real team workflow layer by adding tenant-safe team creation and retrieval, session-to-team assignment, and documentation/demo support for the shipped Team Layer v1 slice.

## Scope Completed

### Day 1 — Team model and core endpoints
Delivered the first Team Layer API surface:

- `POST /teams`
- `GET /teams`
- `GET /teams/{teamId}`

Implemented behavior:

- `POST /teams` remains admin-only
- request validation accepts only Team v1 fields:
  - `name`
  - `sport`
  - `ageBand`
  - `level`
  - `notes`
  - `status`
- validation enforces:
  - `name` required
  - `sport` required
  - `ageBand` required
  - `status` defaults to `active`
  - `status` allowed values: `active | archived`
- rejects unknown fields
- rejects `tenant_id`, `tenantId`, and `x-tenant-id` from body, query, and headers
- `GET /teams` remains query-based and tenant-scoped
- `GET /teams/{teamId}` now supports tenant-scoped team detail lookup with stable `404 teams.not_found` behavior

Storage model used:

- `PK = TENANT#<tenantId>`
- `SK = TEAM#<teamId>`

No scan-based access was introduced.

### Day 2 — Session assignment workflow
Delivered the first team-session workflow surface:

- `POST /teams/{teamId}/sessions/{sessionId}/assign`
- `GET /teams/{teamId}/sessions`

Implemented behavior:

- assignment is tenant-scoped by construction
- assignment path requires:
  - `teamId`
  - `sessionId`
- request body accepts only:
  - `notes`
- rejects unknown fields
- rejects `tenant_id`, `tenantId`, and `x-tenant-id` from body, query, and headers
- verifies the team exists inside the same tenant scope
- verifies the session exists inside the same tenant scope
- performs those checks using query-only access, avoiding `GetItem` expansion for the Teams Lambda
- persists assignment items with:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAMSESSION#<teamId>#<sessionId>`
  - `type = TEAM_SESSION_ASSIGNMENT`

Assignment behavior shipped:

- first assignment returns `201`
- duplicate replay of the same `teamId + sessionId` returns `200`
- replay returns the existing assignment payload instead of treating retries as errors

Returned assignment payload includes the stored mapping plus current denormalized session summary fields:

- `sessionCreatedAt`
- `sport`
- `ageBand`
- `durationMin`
- `objectiveTags`

This keeps the slice useful for coach workflow without introducing scheduling, attendance, or calendar complexity.

### Day 3 — Architecture and demo flow
Delivered Team Layer v1 documentation and demo support:

- `docs/architecture/team-layer-v1.md`
- `docs/progress/week_15/demo-script.md`

Documented:

- the five shipped Team Layer routes
- current team model
- current assignment model
- request flow
- failure behavior
- tenancy/security rules
- current observability surface
- explicit deferred scope
- one focused sequence diagram for assignment flow

Created a lightweight demo script covering:

- setup preconditions
- team list/detail flow
- assignment flow
- duplicate replay demonstration
- assigned-session list flow
- one negative check
- evidence to capture from responses and logs

The docs stay aligned with the actually shipped Team Layer v1 rather than inventing broader team-platform scope.

## Infrastructure and API Wiring
Week 15 required approved infrastructure wiring to make the new Team Layer deployable.

Added in CDK:

- `TeamsFn`
- `POST /teams`
- `GET /teams`
- `GET /teams/{teamId}`
- `POST /teams/{teamId}/sessions/{sessionId}/assign`
- `GET /teams/{teamId}/sessions`

Least-privilege access for `TeamsFn` remains limited to:

- `dynamodb:GetItem` on the entitlements table
- `dynamodb:Query` on the domain table
- `dynamodb:PutItem` on the domain table

Not added:

- `Scan`
- `GetItem` on the domain table for team/session detail reads
- broader IAM or cross-domain access

Routes use the existing JWT authorizer and keep the current auth/tenancy model intact.

## Files Changed

### Infrastructure
- `infra/cdk/lib/sic-api-stack.ts`

### API, domain, and tests
- `services/club-vivo/api/teams/handler.js`
- `services/club-vivo/api/teams/handler.test.js`
- `services/club-vivo/api/src/domains/teams/team-validate.js`
- `services/club-vivo/api/src/domains/teams/team-validate.test.js`
- `services/club-vivo/api/src/domains/teams/team-session-assignment-validate.js`
- `services/club-vivo/api/src/domains/teams/team-session-assignment-validate.test.js`
- `services/club-vivo/api/src/domains/teams/team-repository.js`
- `services/club-vivo/api/src/domains/teams/team-repository.test.js`

### Postman
- `postman/collections/sic-api.collection.json`
- `postman/environments/local.template.json`

### Docs
- `docs/api/team-layer-v1-contract.md`
- `docs/architecture/team-layer-v1.md`
- `docs/progress/week_15/day1-team-model-and-core-endpoints.md`
- `docs/progress/week_15/day2-session-assignment-workflow.md`
- `docs/progress/week_15/demo-script.md`

## Validation

### Code verification
Passed test suites:

- `team-validate.test.js` → `3/3`
- `team-session-assignment-validate.test.js` → `3/3`
- `team-repository.test.js` → `8/8`
- `teams/handler.test.js` → `14/14`

Total:

- `28/28` passed
- `0` failed

### Postman verification prepared
Added or updated collection coverage for:

- `POST /teams`
- `POST /teams - non-admin`
- `POST /teams - invalid body (intentional tenantId rejection coverage only)`
- `GET /teams`
- `GET /teams/{teamId}`
- `GET /teams/{teamId} - missing`
- `POST /teams/{teamId}/sessions/{sessionId}/assign`
- `POST /teams/{teamId}/sessions/{sessionId}/assign - duplicate replay`
- `POST /teams/{teamId}/sessions/{sessionId}/assign - invalid body (intentional tenantId rejection coverage only)`
- `POST /teams/{teamId}/sessions/{sessionId}/assign - missing session`
- `GET /teams/{teamId}/sessions`
- `GET /teams/{teamId}/sessions - missing team`

Environment template remained sanitized and includes blank placeholders for `nonAdminAccessToken` and `teamId`.

## Tenancy and Security Check
Week 15 remained aligned with SIC’s non-negotiables:

- tenant scope still comes only from verified auth plus authoritative entitlements
- no `tenant_id`, `tenantId`, or `x-tenant-id` is trusted from body, query, or headers
- `POST /teams` remains admin-only
- all team and assignment records are tenant-scoped by construction
- no scan-then-filter pattern was introduced
- teams infrastructure uses the existing authorizer
- no unintended auth, tenancy, entitlements, or IAM drift was introduced beyond the approved Teams Lambda and route registrations

## Observability Note
Current observability remains intentionally minimal and route-level.

Verified Team Layer success events:

- `team_created`
- `team_listed`
- `team_fetched`
- `team_session_assigned`
- `team_session_assignment_replayed`
- `team_sessions_listed`

Not added in Week 15:

- dashboards
- alarms
- analytics or reporting expansion
- broader metrics infrastructure

## Product Impact
Week 15 gives SIC a small but real Team Layer v1:

- admins can create tenant-scoped teams
- authenticated users can list and view teams
- authenticated users can assign an existing saved session to a team
- assignment replay is safe and idempotent
- assigned sessions can be listed back per team

This is an important coach-first bridge from saved session content into actual team workflow without jumping ahead into attendance, scheduling, club-wide structure, or broader platform expansion. It stays aligned with SIC’s product-first, low-cost, multi-tenant-by-design direction.

## What Was Intentionally Deferred
Kept out of scope for Week 15:

- unassign flows
- assignment replacement semantics
- session ordering or scheduling
- attendance or completion workflows
- roster management
- broader team authorization redesign
- new UI for team workflows
- club or platform expansion
- dashboards, analytics, and reporting
- new infra, IAM, auth-boundary, tenancy-boundary, or entitlements-model work beyond the approved Team Layer wiring

## Final Assessment
Week 15 met the roadmap goal:

- Team model implemented
- core team endpoints shipped
- session assignment flow shipped
- Team Layer architecture documented
- demo flow created

The slice remained thin, product-relevant, tenant-safe, and realistic for the current SIC stage. It is a strong capstone-quality step because it shows disciplined platform extension, least-privilege thinking, and a credible progression from coach workflows into team workflows.

## Recommended Next Step
Move into **Week 16 — Attendance System** with a plan-only pass for:

- attendance model
- `POST /teams/{teamId}/attendance`
- `GET /teams/{teamId}/attendance`

while preserving the same thin-slice, tenant-safe discipline used in Weeks 14 and 15.
```
