# Architect Process Log

Audit-oriented summary of architecture progress and decisions derived from `docs/progress/week_00/` through `docs/progress/week_15/` notes.

## Running index

- [Week 0](#week-0)
- [Week 1](#week-1)
- [Week 2](#week-2)
- [Week 3](#week-3)
- [Week 4](#week-4)
- [Week 5](#week-5)
- [Week 6](#week-6)
- [Week 7](#week-7)
- [Week 8](#week-8)
- [Week 9](#week-9)
- [Week 10](#week-10)
- [Week 11](#week-11)
- [Week 12](#week-12)
- [Week 13](#week-13)
- [Week 14](#week-14)
- [Week 15](#week-15)

## Week 0

Week 0 notes are sparse and mostly foundational. This section stays minimal on purpose.

### Goals

- Establish a safe AWS sandbox baseline for early SIC work.

### Work completed

- Initial scaffolding and early repo setup.
- Early exploration of AWS account/roles and basic project framing.

### Tenancy/security checks

- Early posture: “fail closed” mindset established; tenant scope to come from auth+entitlements store.

### Observability notes

- Not yet in scope.

### Evidence

- Week 0 notes in `docs/progress/week_00/`.

### Next steps

- Start Week 1: build initial auth/tenant boundaries and API scaffolding.


## Week 1

Week 1 introduces the initial “tenant-aware” backbone. Focus is on basic auth plumbing and an early API scaffold.

### Goals

- Establish authentication primitives and a tenant-aware request flow.
- Start the API surface with strict tenancy guardrails.

### Work completed

- Initial auth and API scaffolding work.
- Introduced early tenant-boundary conventions and documentation.

### Tenancy/security checks

- Reinforced: tenant scope must come from verified auth context + entitlements.
- Avoid accepting tenant IDs from client inputs.

### Observability notes

- Early logging conventions established.

### Evidence

- Week 1 notes in `docs/progress/week_01/`.

### Next steps

- Expand API surface and continue hardening tenancy boundaries in Week 2.


## Week 2

Week 2 builds on the foundation: tenant context propagation and safer data access patterns.

### Goals

- Make tenant scoping “by construction” in handlers and data access.
- Improve guardrails and documentation.

### Work completed

- Tenant-aware patterns refined in code and docs.
- Additional scaffolding to support future domain features.

### Tenancy/security checks

- Continued emphasis on fail-closed tenant context.
- Avoid scan-then-filter patterns.

### Observability notes

- Improved structured logging conventions.

### Evidence

- Week 2 notes in `docs/progress/week_02/`.

### Next steps

- Add domain endpoints and keep tenancy strict in Week 3.


## Week 3

Week 3 adds more domain capability while preserving strict tenant boundaries.

### Goals

- Introduce domain data shapes and CRUD-ish flows.
- Ensure tenant scoping remains enforced.

### Work completed

- Domain table modeling direction clarified.
- Early endpoints/runbooks and supporting docs expanded.

### Tenancy/security checks

- Tenant ID derived only from auth context + entitlements.
- Domain keys incorporate tenant scope.

### Observability notes

- Start thinking about alarms/runbooks for domain flows.

### Evidence

- Week 3 notes in `docs/progress/week_03/`.

### Next steps

- Prepare for export → lake workflow and reliability work.


## Week 4

Week 4 continues domain iteration and prepares for later export/lake work.

### Goals

- Improve domain workflows and data layout.
- Reduce operational foot-guns.

### Work completed

- Domain modeling iteration and endpoint improvements.
- Documentation improvements.

### Tenancy/security checks

- Kept tenant isolation “by construction” in data access.
- Avoid accepting tenant ID from request input.

### Observability notes

- Continued runbook/ops notes improvements.

### Evidence

- Week 4 notes in `docs/progress/week_04/`.

### Next steps

- Move toward export contracts and lake readiness in Week 5–7.


## Week 5

Week 5 focuses on tightening reliability and readiness for exports.

### Goals

- Establish export direction and operational hygiene.
- Keep tenancy strict in all new paths.

### Work completed

- Export planning and early implementation direction captured.
- Additional repo hygiene and documentation updates.

### Tenancy/security checks

- Export flows must remain tenant-scoped.
- No cross-tenant browsing or admin-only shortcuts in v1.

### Observability notes

- More runbook patterns introduced.

### Evidence

- Week 5 notes in `docs/progress/week_05/`.

### Next steps

- Week 6: more concrete domain export wiring and operability.


## Week 6

Week 6 closes the “domain” groundwork and tees up lake ingestion.

### Goals

- Harden domain flows and export readiness.
- Improve documentation quality and ops hygiene.

### Work completed

- Additional docs/runbooks and repo hygiene improvements.
- Prepared groundwork for Week 7–10 lake/catalog/ETL work.

### Tenancy/security checks

- Reinforced “no request-derived tenant id” doctrine.
- Focused on least-privilege access patterns.

### Observability notes

- Increased emphasis on alarms/runbooks as part of “done”.

### Evidence

- Week 6 notes in `docs/progress/week_06/`.

### Next steps

- Week 7: finalize export contract direction and schema expectations.
- Week 8: repo hygiene + smoke workflow improvements.
- Week 9: lake foundations + ingest.
- Week 10: Glue catalog + ETL v1 + ops.


## Week 7 — Domain export contract (lake-ready)

### Goals
- Define a stable domain export contract that can feed the lake ingestion pipeline.
- Establish schema expectations/versioning for exported datasets.

### Work completed
- Documented export contract direction and schema expectations for lake-ready domain data.
- Prepared the repo for export→lake foundation work in Week 9.

### Tenancy/security checks
- Tenant identity remains server-derived (verified auth + entitlements), not request input.
- Export contract aligns with tenant-partitioned storage expectations.

### Observability notes
- Focus remained on contract correctness; operational signals were planned for later lake ingest.

### Evidence
- Week 7 artifacts and docs captured in repo history (schema/contract paths per Week 7 notes).

### Next steps
- Implement lake foundations and ingestion pipeline (Week 9).


## Week 8 — Repo hygiene + smoke workflow + documentation

### Goals
- Improve operational readiness and developer ergonomics (smoke workflows, docs hygiene).
- Reduce drift risk with guardrails and clearer runbooks.

### Work completed
- Repo/workflow improvements (smoke scripts/workflows and documentation hygiene).
- Ops/runbook documentation improvements to support ongoing delivery.

### Tenancy/security checks
- Continued reinforcement of “no request-derived tenant_id” doctrine.
- No new cross-tenant access paths introduced by Week 8 hygiene work.

### Observability notes
- Worked toward repeatable validation and operational playbooks.

### Evidence
- Repo commits/PRs for Week 8 workflow/scripts and docs updates.

### Next steps
- Start lake foundations (Week 9).


## Week 9 — S3 Data Lake foundations (tenant-safe)

### Goals
- Establish a tenant-safe data lake layout and enforcement contract.
- Add lake bucket and wire an ingest pipeline from domain exports into bronze.
- Add runbooks + alarms so ingestion is operable.

### Work completed
- Lake layout contract + invariants and access model (app-only v1).
- Added lake bucket in CDK with secure defaults and outputs.
- Event-driven ingest from DomainExportBucket to LakeBucket bronze partition layout.
- Runbooks + log metric filters + alarms for ingestion failures and “no success in 24h”.

### Tenancy/security checks
- No tenant_id accepted from request body/query/headers.
- Tenant isolation enforced by construction in S3 keys: `tenant_id=<TENANT_ID>` and `dt=YYYY-MM-DD`.
- Ingest derives tenant only from internal export object key layout.
- IAM prefix-scoped (no wildcards in app roles).

### Observability notes
- Metric filters + alarms for lake ingest success/failure and “no success in 24h”.
- Runbooks for access denied, ingest failure, and volume anomalies.

### Evidence
- PR #9: week9(day1) — lake bucket + layout docs
- PR #10: week9(day2) — lake ingest pipeline + unit test
- PR #11: week9(day3) — lake ops runbooks + alarms

### Next steps
- Make lake queryable via Glue catalog + ETL (Week 10).


## Week 10 — Glue Catalog + ETL v1 + Ops (tenant-safe)

### Goals
- Catalog bronze data in Glue (partitioned by tenant_id/dt).
- Build ETL v1: bronze NDJSON → silver Parquet preserving tenant partitions.
- Add ops runbooks + alarms for crawler/job failures.

### Work completed
- Glue Catalog v1:
  - Glue Database `sic_lake_<env>`
  - Glue Crawler for bronze sessions at `bronze/sessions/v=1/`
- ETL v1 (sessions):
  - Glue Job converts bronze NDJSON → silver Parquet
  - Output partitioned by `tenant_id` and `dt` by construction
  - Local unit test validates path/partition mapping
  - Docs: `docs/architecture/etl-v1.md`
- Ops:
  - Runbooks: crawler failure, job failure, partition mismatch
  - Alarms: crawler failures and ETL job failures

### Tenancy/security checks
- Tenant partition values derived from S3 path (`tenant_id`, `dt`), not request input.
- IAM prefix-scoped:
  - Read: `bronze/sessions/v=1/*`
  - Write: `silver/sessions/v=1/*`
  - ListBucket restricted via `s3:prefix` to bronze/silver prefixes
- Ops-only changes introduced no new S3 access paths.
- No wildcard IAM in application roles.

### Observability notes
- CloudWatch alarms for bronze sessions crawler failures and bronze→silver ETL job failures.
- Runbooks describe safe triage + mitigations without cross-tenant data access.

### Evidence
- PR #12: week10(day1) — Glue Catalog v1 (crawler + database)
- PR #13: week10(day2) — ETL v1 bronze→silver (sessions)
- PR #14: week10(day3) — ops runbooks + Glue alarms

### Next steps
- Expand catalog + ETL coverage to additional datasets.
- Add scheduling if “no success in 24h” alarms are desired/meaningful.
- Add DQ metrics (row counts, schema drift) per dataset.


## Week 11 — Session Builder hardening

### Goals
- Stabilize the Session Builder into a production-ready MVP core.
- Freeze the coach-facing API contract, harden validation, and make the runtime pipeline explicit.

### Work completed
- Frozen Session Builder v1 API contract covering:
  - `POST /session-packs`
  - `POST /sessions`
  - `GET /sessions`
  - `GET /sessions/{sessionId}`
  - `GET /sessions/{sessionId}/pdf`
- Hardened validation behavior for:
  - duration totals
  - supported `ageBand` values
  - narrow deterministic equipment compatibility
- Made the explicit coach-facing runtime boundaries clear across existing endpoints:
  - `POST /session-packs` = normalize → generate → validate
  - `POST /sessions` = persist
  - `GET /sessions/{sessionId}/pdf` = export
- Kept the frozen v1 contract and the Week 11 runtime note separate so the public API surface and the current runtime interpretation are documented distinctly.
- Added architecture and demo evidence documenting the Week 11 runtime and request flow.

### Tenancy/security checks
- No request contract accepts `tenant_id`, `tenantId`, or `x-tenant-id`.
- Tenant scope remains server-derived from verified auth plus authoritative entitlements.
- Session repository and PDF export paths remain tenant-scoped by construction.
- Admin domain export remains separate from the coach-facing Session Builder flow.

### Observability notes
- Week 11 did not introduce a new observability subsystem.
- Existing structured logging remains the main runtime evidence surface for session generation, persistence, and PDF export outcomes.
- No new alarms or dashboards were required for this slice.

### Evidence
- `docs/api/session-builder-v1-contract.md`
- `docs/progress/week_11/session-builder-week11.md`
- `docs/architecture/architecture-diagrams.md`
- `docs/progress/week_11/demo-script.md`
- `docs/progress/week_11/closeout-summary.md`
- `docs/adr/ADR-0009-session-builder-runtime-boundaries-and-explicit-coach-flow.md`

### Next steps
- Begin Week 12 web application foundation work against the frozen Week 11 Session Builder API.
- Build the first protected coach-facing UI for session generation, session create/list/detail, and basic PDF export entry points.


## Week 12 - Web Application Foundation

### Goals
- Create the first protected coach-facing web surface on top of the hardened Week 11 Session Builder API.
- Add localhost web authentication and the first dashboard and session flows.
- Extend the Week 12 web surface with a safe Coach Lite preview bridge without changing the public Session Builder contract.

### Work completed
- Created the frontend app scaffold in `apps/club-vivo` using Next.js app router, React, TypeScript, and Tailwind.
- Added localhost Cognito Hosted UI authentication using authorization code flow, PKCE, and HttpOnly cookies.
- Added protected route handling for:
  - `/dashboard`
  - `/sessions`
  - `/sessions/new`
  - `/sessions/[sessionId]`
- Added server-rendered dashboard hydration from `GET /me`.
- Added the first session list, session detail, and generate-then-save flow against the existing Session Builder endpoints.
- Added canonical Coach Lite frontend contract types and presentational components inside `apps/club-vivo`.
- Added internal Coach Lite draft validators and extended the existing Session Builder pipeline to derive and validate an internal Coach Lite draft while preserving the public `POST /session-packs` response shape.
- Added a standalone authenticated local preview route at `/sessions/coach-lite-preview`.
- Upgraded the preview route from mock-only to real generated content through a preview-only server-side adapter that reuses the existing authenticated Session Builder path and keeps mock fallback behavior.
- Added Week 12 architecture notes and closeout documentation documenting the scope lock, implemented web foundation, and Coach Lite preview bridge outcomes.

### Tenancy/security checks
- No `tenant_id`, `tenantId`, or `x-tenant-id` accepted from the web app.
- Tenant scope remains server-derived from verified auth plus authoritative entitlements.
- Auth failures remain fail closed.
- The web app uses server-side API calls and does not derive tenant, role, or tier from client input or client-side cookie parsing.
- No AWS/CDK, IAM, auth-boundary, tenancy-boundary, or entitlements-model changes were introduced as part of the Coach Lite bridge.
- The preview bridge stays isolated to `/sessions/coach-lite-preview` and does not change the live `/sessions` or `/sessions/new` flows.

### Observability notes
- Week 12 did not introduce a new observability subsystem.
- Evidence is local app validation plus the existing backend logging surface.
- The preview route gained local-only debug output to surface nested API validation details quickly while preserving backend contracts.
- No new alarms or dashboards were added as part of this slice.

### Evidence
- `docs/progress/week_12/week12-scope-lock.md`
- `docs/progress/week_12/week12-web-foundation.md`
- `docs/progress/week_12/closeout-summary.md`
- `docs/adr/ADR-0010-club-vivo-web-auth-and-server-side-api-access.md`
- Local validation confirmed:
  - `/sessions/coach-lite-preview`
  - `/sessions`
  - `/sessions/new`
- Public `POST /session-packs` remained unchanged while the local Coach Lite preview rendered real generated content.

### Next steps
- Begin Week 13 session-library and template work only where backed by explicit backend endpoints.
- Keep Coach Lite product-first and preview-only while deciding the smallest stable bridge boundary for richer preview data.
- Tighten app-layer validation and user feedback while preserving the existing tenant and auth boundary.


## Week 13 — Session Library and Templates

### Goals
- Enable reuse and repeat usage through Session Library and Templates.
- Complete Week 13 model work, safe `/templates` deployment, and Day 3 usage metrics/dashboard coverage.

### Work completed
- Day 1 template domain/model work was completed in app code, including the template domain and saved-session metadata support needed for reuse flows.
- Day 2 `/templates` routes were safely isolated and deployed to dev:
  - `POST /templates`
  - `GET /templates`
  - `POST /templates/{templateId}/generate`
- Initial live `POST /templates` failed until `TemplatesFn` domain-table IAM was corrected with `dynamodb:PutItem`.
- Tracked Week 13 notes record that live validation proved:
  - template creation from a saved session
  - template generation into a saved session
  - generated sessions stamp `sourceTemplateId`
  - `usageCount` increments
  - `lastGeneratedAt` populates
- Day 3 completed the thin observability slice with:
  - `template_create_success`
  - `template_generate_success`
  - dashboard coverage updated for Week 13 usage signals
- Broader undeployed memberships/export/lake/Glue drift was not shipped as part of Week 13.

### Tenancy/security checks
- No `tenant_id`, `tenantId`, or `x-tenant-id` were used in request contracts.
- Tenant context remained server-derived from verified auth plus entitlements.
- Template routes stayed JWT-protected and tenant-scoped by construction.
- No auth-boundary or entitlements-model change was introduced.
- No wildcard IAM was introduced.

### Observability notes
- CloudWatch logs were used to isolate the initial `POST /templates` failure.
- Template creation and template generation are now measurable.
- Dashboard coverage was updated for Week 13 usage signals.
- No new alarms are recorded as part of the Week 13 slice.

### Evidence
- Tracked Week 13 notes record the roadmap intent for Session Library and Templates in `docs/progress/build-progress/roadmap-vnext.md`.
- Tracked Week 13 notes record the Day 2 deployment blocker and the decision not to ship broader undeployed memberships/export/lake/Glue drift in `docs/progress/week_13/day2-api-wiring-blocker.md`.
- Tracked Week 13 notes record the app-layer model completion, safe `/templates` deployment, the narrow `TemplatesFn` IAM correction, live route validation, and the Day 3 metrics/dashboard outcome in `docs/progress/week_13/closeout-summary.md`.

### Next steps
- Proceed to Week 14 feedback-loop planning.
- Keep tooling debt and broader infra drift separate from Week 13 completion.


## Week 14 - Coach Feedback Loop

### Goals
- Capture structured coach feedback for learning and improvement.
- Extend the session event timeline with meaningful product events.
- Document the feedback architecture and establish a lightweight weekly review workflow.

### Work completed
- Added the authenticated feedback endpoint:
  - `POST /sessions/{sessionId}/feedback`
- Hardened the feedback request contract around the approved v1 feedback fields, unknown-field rejection, and stable error behavior.
- Added tenant-scoped feedback persistence and tenant-scoped session event timeline writes in the existing domain table.
- Shipped the current Week 14 event timeline additions:
  - `feedback_submitted`
  - `session_run_confirmed`
  - `session_exported`
  - `session_generated`
- Kept feedback and feedback-related event writes transactional while leaving export events as standalone tenant-scoped writes after successful export preparation.
- Documented the feedback architecture and the current manual-first weekly review workflow.

### Tenancy/security checks
- Tenant scope remained server-derived from verified auth plus entitlements.
- No `tenant_id`, `tenantId`, or `x-tenant-id` was accepted from body, query, or headers.
- Feedback records and session event items remained tenant-scoped by construction.
- Session existence checks remained tenant-scoped.
- No scan-then-filter pattern was introduced for feedback or session events.
- The only approved infra change was the route wiring required to expose the feedback endpoint on the existing authenticated sessions surface.

### Observability notes
- Week 14 stayed intentionally minimal and real on observability.
- Current evidence surfaces are:
  - structured success/error logs
  - durable `SESSION_EVENT` items in the domain table
  - current success events such as:
    - `session_feedback_created`
    - `session_pdf_exported`
    - `template_generated`
- No dashboard, alarm, scheduled review job, or timeline read endpoint was added in this slice.

### Evidence
- `docs/api/session-feedback-v1-contract.md`
- `docs/architecture/feedback-loop-architecture.md`
- `docs/runbooks/weekly-feedback-review.md`
- `docs/progress/week_14/day1-feedback-endpoint.md`
- `docs/progress/week_14/day3-feedback-architecture-and-review-workflow.md`
- `docs/progress/week_14/closeout-summary.md`

### Next steps
- Move into Week 15 Team Layer v1.
- Add the smallest tenant-safe team model and assignment workflow without expanding into attendance, scheduling, or broader team-platform scope.


## Week 15 - Team Layer v1

### Goals
- Add the first real Team Layer backend surface on top of the coach-first session workflow.
- Ship tenant-safe team create/list/detail behavior plus a small team-session assignment workflow.
- Document the Team Layer architecture and create a lightweight demo flow for the shipped slice.

### Work completed
- Added the first Team Layer core endpoints:
  - `POST /teams`
  - `GET /teams`
  - `GET /teams/{teamId}`
- Kept `POST /teams` admin-only in the current implementation.
- Added the first Team Layer session workflow:
  - `POST /teams/{teamId}/sessions/{sessionId}/assign`
  - `GET /teams/{teamId}/sessions`
- Shipped idempotent duplicate assignment replay behavior:
  - first assign returns `201`
  - duplicate replay returns `200` with the existing assignment payload
- Kept the assignment payload aligned to the implemented denormalized session summary fields:
  - `sessionCreatedAt`
  - `sport`
  - `ageBand`
  - `durationMin`
  - `objectiveTags`
- Added Team Layer API and architecture documentation plus a lightweight Week 15 demo flow.

### Tenancy/security checks
- Tenant scope remained server-derived from verified auth plus entitlements.
- No `tenant_id`, `tenantId`, or `x-tenant-id` was accepted from body, query, or headers.
- Team records remained tenant-scoped by construction:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAM#<teamId>`
- Team-session assignment records remained tenant-scoped by construction:
  - `PK = TENANT#<tenantId>`
  - `SK = TEAMSESSION#<teamId>#<sessionId>`
- Team existence and session existence checks remained inside tenant scope before assignment writes.
- No scan-then-filter pattern was introduced.
- No auth-boundary, tenancy-boundary, or entitlements-model change was introduced beyond the approved Teams Lambda and route registrations.

### Observability notes
- Week 15 remained route-level and intentionally minimal on observability.
- Current Team Layer success events are:
  - `team_created`
  - `team_listed`
  - `team_fetched`
  - `team_session_assigned`
  - `team_session_assignment_replayed`
  - `team_sessions_listed`
- No dashboard, alarm, analytics expansion, or new reporting surface was added in this slice.

### Evidence
- `docs/api/team-layer-v1-contract.md`
- `docs/architecture/team-layer-v1.md`
- `docs/progress/week_15/day1-team-model-and-core-endpoints.md`
- `docs/progress/week_15/day2-session-assignment-workflow.md`
- `docs/progress/week_15/demo-script.md`

### Next steps
- Move into Week 16 attendance planning without widening Week 15 into broader team or platform behavior.
- Keep future team work narrow: attendance, scheduling, roster, UI, analytics, and broader authorization should remain separate follow-on slices rather than being implied by current Team Layer v1.
