# Week 14 — Closeout Summary
## Coach Feedback Loop

## Goal
Capture structured coach feedback for learning and improvement, extend the product event timeline with meaningful session lifecycle events, and document a lightweight weekly review workflow that is realistic for the current SIC stage.

---

## Scope Completed

### Day 1 — Feedback endpoint
Delivered a new authenticated endpoint:

- `POST /sessions/{sessionId}/feedback`

Implemented behavior:

- accepts only the approved feedback fields:
  - `rating`
  - `runStatus`
  - `objectiveMet`
  - `difficulty`
  - `wouldReuse`
  - `notes`
  - `changesNextTime`
- rejects unknown fields
- rejects `tenant_id`, `tenantId`, and `x-tenant-id` from request input
- validates:
  - `rating` as integer `1..5`
  - `runStatus` as `ran_as_planned | ran_with_changes | not_run`
  - `difficulty` as `too_easy | about_right | too_hard`
  - `notes` and `changesNextTime` as trimmed strings up to `1000` chars
- enforces one feedback submission per session in v1
- returns stable error behavior:
  - `400 platform.bad_request`
  - `404 sessions.not_found`
  - `409 sessions.feedback_exists`

Persistence model added:

- feedback items are tenant-scoped by construction
- key shape:
  - `PK = TENANT#<tenantId>`
  - `SK = SESSIONFEEDBACK#<sessionId>`

This required one approved infra change only:

- minimal CDK route registration for `POST /sessions/{sessionId}/feedback` wired to the existing `SessionsFn` with existing JWT authorizer
- no broader application IAM expansion, no auth model change, no tenancy model change, and no entitlements change

---

### Day 2 — Product event timeline writes
Implemented durable session event items in the existing domain table with no new infrastructure.

Supported event types:

- `session_generated`
- `session_exported`
- `session_run_confirmed`
- `feedback_submitted`

Event item shape:

- `PK = TENANT#<tenantId>`
- `SK = SESSIONEVENT#<sessionId>#<occurredAt>#<eventType>`
- `type = SESSION_EVENT`
- `eventId`
- `sessionId`
- `eventType`
- `occurredAt`
- `actorUserId`
- `schemaVersion = 1`
- optional shallow `metadata`

Write points implemented:

- `feedback_submitted`
  - written on successful feedback submission
- `session_run_confirmed`
  - written only when feedback `runStatus` is `ran_as_planned` or `ran_with_changes`
  - not written when `runStatus = not_run`
- `session_exported`
  - written only after successful PDF export/presign preparation
- `session_generated`
  - written only for persisted template-based session generation
  - not written for stateless `POST /session-packs`

Consistency choices:

- feedback and its related event writes are committed in the same transaction
- template-generated session creation and `session_generated` are committed in the same transaction
- export event remains a standalone tenant-scoped write after successful export preparation

This keeps the Week 14 timeline work aligned with a thin product slice and avoids premature analytics infrastructure.

---

### Day 3 — Documentation and weekly review workflow
Delivered:

- `docs/api/session-feedback-v1-contract.md`
- `docs/architecture/feedback-loop-architecture.md`
- `docs/runbooks/weekly-feedback-review.md`
- `docs/progress/week_14/day1-feedback-endpoint.md`
- `docs/progress/week_14/day3-feedback-architecture-and-review-workflow.md`

Documented areas:

- feedback API contract
- feedback persistence model
- session event model
- exact event write points
- failure behavior and consistency notes
- observability notes limited to what exists today
- tenancy and security rules
- current limitations and explicit deferrals
- manual-first weekly review workflow for a solo builder

Weekly review workflow established as current-state operations:

1. review recent feedback records for one tenant at a time
2. review recent session event items for the same tenant
3. cross-check structured logs for failures and patterns
4. run a short Postman/manual smoke pass on core flows
5. write a short weekly note with:
   - what coaches ran
   - what they reused
   - common friction themes
   - 1–3 follow-up product actions

This remains manual-first by design and avoids introducing dashboards, scheduled jobs, or heavy analytics before the product stage justifies them.
---

## Files Changed

### Infrastructure
- `infra/cdk/lib/sic-api-stack.ts`

### API / domain / tests
- `services/club-vivo/api/sessions/handler.js`
- `services/club-vivo/api/sessions/handler.test.js`
- `services/club-vivo/api/src/domains/sessions/session-feedback-service.js`
- `services/club-vivo/api/src/domains/sessions/session-feedback-service.test.js`
- `services/club-vivo/api/src/domains/sessions/session-feedback-validate.js`
- `services/club-vivo/api/src/domains/sessions/session-feedback-validate.test.js`
- `services/club-vivo/api/src/domains/sessions/session-repository.js`
- `services/club-vivo/api/src/domains/sessions/session-repository.test.js`
- `services/club-vivo/api/src/domains/templates/template-pipeline.js`
- `services/club-vivo/api/src/domains/templates/template-pipeline.test.js`

### Postman
- `postman/collections/sic-api.collection.json`

### Docs
- `docs/api/session-feedback-v1-contract.md`
- `docs/architecture/feedback-loop-architecture.md`
- `docs/runbooks/weekly-feedback-review.md`
- `docs/progress/week_14/day1-feedback-endpoint.md`
- `docs/progress/week_14/day3-feedback-architecture-and-review-workflow.md`
---

## Validation

### Infra verification
- `cdk synth` succeeded
- `cdk diff` succeeded
- diff showed only the approved feedback route registration plus the expected API Gateway invoke permission for that route

### Test verification
Passed test suites:

- feedback validator: `4/4`
- feedback service: `2/2`
- session repository: `12/12`
- sessions handler: `10/10`
- template pipeline: `5/5`
- template handler: `5/5`

Total:

- `38/38` tests passed
### Postman coverage added
Added or updated requests for:

- `POST /sessions/{sessionId}/feedback`
- `POST /sessions/{sessionId}/feedback - invalid body (intentional tenantId rejection coverage only)`
- `POST /sessions/{sessionId}/feedback - invalid session`
- `POST /sessions/{sessionId}/feedback - duplicate submission`
- `POST /sessions/{sessionId}/feedback - no auth`

---

## Tenancy and Security Check

Week 14 remained aligned with SIC non-negotiables:

- tenant scope still comes only from verified auth plus authoritative entitlements
- no `tenant_id`, `tenantId`, or `x-tenant-id` is trusted from body, query, or headers
- feedback writes are tenant-scoped by construction
- event writes are tenant-scoped by construction
- no scan-then-filter patterns were introduced
- no unintended auth-boundary, tenancy-boundary, or entitlements-model drift was introduced
- the only infra change was the explicitly approved route registration required to expose the new feedback endpoint
---

## Observability Note

Current observability for this slice remains intentionally minimal and real:

- structured success/error logs
- durable session event items in the domain table
- existing success log events such as:
  - `session_feedback_created`
  - `session_pdf_exported`
  - `template_generated`

Not added in Week 14:

- dashboard
- alarm
- scheduled review job
- timeline read endpoint
- analytics pipeline

---

## Product Impact

Week 14 closes an important product loop for SIC:

- coaches can now generate sessions
- export sessions
- submit structured feedback on what happened
- implicitly confirm whether the session was actually run
- produce durable product signals for weekly review

This is a strong coach-first improvement because it captures real usage and quality feedback without overbuilding analytics or platform depth too early. It also sets up better future product learning while staying realistic for a solo builder.

---

## What Was Intentionally Deferred

Kept out of scope for Week 14:

- timeline/history read endpoint
- coach-facing timeline UI
- dashboards and scheduled summaries
- Athena/QuickSight reporting
- cross-tenant rollups
- ML/RAG-style analysis
- standalone run-confirmation endpoint separate from feedback
- broader infra, IAM, auth, tenancy, or entitlements expansion

---

## Final Assessment

Week 14 met the roadmap goal:

- structured feedback captured
- product timeline events added
- architecture documented
- weekly review workflow established

The slice stayed product-first, architecture-strong, low-cost, multi-tenant by design, and realistic for the current SIC stage.

---

## Recommended Next Step
Move into **Week 15 — Team Layer v1** with a plan-only pass for:

- Team model
- `POST /teams`
- `GET /teams`
- `GET /teams/{teamId}`

while preserving the same tenancy and product-slice discipline used in Week 14.
