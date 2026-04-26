# SIC Repo Inventory

This inventory is a source-based map of the current Sports Intelligence Cloud repository. It is intended as the starting point for a later architecture and repo reorganization phase.

It does not propose file moves, deletions, renames, runtime changes, auth changes, tenancy changes, entitlement changes, IAM changes, CDK changes, API contract changes, or app behavior changes.

## 1. Active Frontend Runtime

### Main app

- `apps/club-vivo/` is the active coach-facing web runtime.
- Framework and tooling are defined by:
  - `apps/club-vivo/package.json`
  - `apps/club-vivo/next.config.mjs`
  - `apps/club-vivo/tsconfig.json`
  - `apps/club-vivo/postcss.config.mjs`
  - `apps/club-vivo/app/globals.css`
- The app currently uses Next.js, React, Tailwind/PostCSS, and TypeScript.

### Public and auth routes

- `apps/club-vivo/app/page.tsx`
  - Public SIC / Club Vivo entry page.
- `apps/club-vivo/app/login/page.tsx`
  - Public sign-in page.
- `apps/club-vivo/app/login/start/route.ts`
  - Starts Cognito Hosted UI auth with PKCE cookies.
- `apps/club-vivo/app/callback/route.ts`
  - Exchanges Cognito authorization code, sets access/id token cookies, redirects to `/home`.
- `apps/club-vivo/app/logout/route.ts`
  - Clears auth cookies and redirects to login.
- `apps/club-vivo/middleware.ts`
  - Cookie gate for selected protected paths. Current matcher includes dashboard, profile, teams, and sessions paths.

### Protected app shell

- `apps/club-vivo/app/(protected)/layout.tsx`
  - Wraps protected pages in `CoachAppShell`.
- `apps/club-vivo/components/coach/CoachAppShell.tsx`
  - Shared coach workspace shell.
- `apps/club-vivo/components/coach/CoachPrimaryNav.tsx`
  - Primary nav for Home, Session Builder, Methodology, Teams, Equipment, and Sessions.
- `apps/club-vivo/components/coach/CoachPageHeader.tsx`
  - Shared page header.

### Protected pages and routes

- `apps/club-vivo/app/(protected)/home/page.tsx`
  - Coach workspace landing page, Quick Session entry, recent sessions.
- `apps/club-vivo/app/(protected)/dashboard/page.tsx`
  - Secondary dashboard route.
- `apps/club-vivo/app/(protected)/profile/page.tsx`
  - Redirects to `/teams`.
- `apps/club-vivo/app/(protected)/teams/page.tsx`
  - Coach-facing Team Manager backed by `apps/club-vivo/lib/team-api.ts`.
- `apps/club-vivo/app/(protected)/equipment/page.tsx`
  - Browser-local Equipment/Essentials manager.
- `apps/club-vivo/app/(protected)/methodology/page.tsx`
  - Methodology workspace route backed by `apps/club-vivo/lib/methodology-api.ts`.
- `apps/club-vivo/app/(protected)/methodology/methodology-workspace.tsx`
  - Client methodology editor/viewer component.
- `apps/club-vivo/app/(protected)/sessions/page.tsx`
  - Saved sessions library.
- `apps/club-vivo/app/(protected)/sessions/new/page.tsx`
  - Session Builder page.
- `apps/club-vivo/app/(protected)/sessions/new/session-new-flow.tsx`
  - Client Session Builder flow and review state.
- `apps/club-vivo/app/(protected)/sessions/new/session-new-actions.ts`
  - Server actions for image analysis and session pack generation.
- `apps/club-vivo/app/(protected)/sessions/quick/page.tsx`
  - Quick Session prompt route.
- `apps/club-vivo/app/(protected)/sessions/quick-session-actions.ts`
  - Quick Session generation action. It builds app-layer intent and calls shared session-pack generation.
- `apps/club-vivo/app/(protected)/sessions/quick-review/page.tsx`
  - Quick Session review route.
- `apps/club-vivo/app/(protected)/sessions/quick-review/quick-session-review.tsx`
  - Quick Session review and save UI.
- `apps/club-vivo/app/(protected)/sessions/session-actions.ts`
  - Shared save-generated-session action.
- `apps/club-vivo/app/(protected)/sessions/[sessionId]/page.tsx`
  - Saved-session detail, origin-aware rendering, PDF export server action, feedback server action.
- `apps/club-vivo/app/(protected)/sessions/[sessionId]/session-export-button.tsx`
  - Client export form/button.
- `apps/club-vivo/app/(protected)/sessions/[sessionId]/session-feedback-panel.tsx`
  - Client feedback panel.
- `apps/club-vivo/app/(protected)/sessions/[sessionId]/quick-session-title-editor.tsx`
  - Client title editor for saved Quick Session display hints.
- Coach Lite preview route
  - Removed from the active Club Vivo app tree after audit. Useful Coach Lite architecture docs remain under `docs/architecture/coach-lite/` for later review or migration.

### Coach UI components

Active coach UI components live under `apps/club-vivo/components/coach/`:

- app shell and nav: `CoachAppShell.tsx`, `CoachPrimaryNav.tsx`, `CoachPageHeader.tsx`
- Session Builder inputs: `SessionBuilderTopBlock.tsx`, `TeamSelector.tsx`, `ModeSelector.tsx`, `DurationSelector.tsx`, `ObjectiveConstraintsInputs.tsx`
- Home and library: `HomeSessionStartCard.tsx`, `RecentSessionsPanel.tsx`, `ReuseFromLibraryEntry.tsx`
- Teams and Equipment: `TeamsSetupManager.tsx`, `EquipmentEssentialsManager.tsx`
- session output rendering: `SessionPackView.tsx`, `DrillDiagramView.tsx`

### Frontend libraries

Active frontend support code lives under `apps/club-vivo/lib/`:

- auth and API access: `auth.ts`, `api.ts`, `pkce.ts`, `get-current-user.ts`, `get-current-user-identity.ts`
- backend API clients: `session-builder-api.ts`, `team-api.ts`, `methodology-api.ts`
- Session Builder server bridge: `session-builder-server.ts`
- selected-team cookie helpers: `selected-team.ts`
- Quick Session helpers: `quick-session-intent.ts`, `quick-session-payload.ts`, `quick-session-title-hints.ts`
- saved-session display hints: `session-origin-hints.ts`, `session-builder-context-hints.ts`, `builder-session-label.ts`
- browser-local planning hints: `coach-team-hints.ts`, `equipment-hints.ts`
- shared types: `types/session-pack.ts`, `types/drill-diagram-spec.ts`

## 2. Active Backend API / Lambda Handlers

Backend API handler source lives under `services/club-vivo/api/`.

### CDK-wired API handlers in current `SicApiStack`

The current CDK API stack wires these Lambda handlers and API Gateway routes:

- `services/club-vivo/api/me/handler.js`
  - `GET /me`
- `services/club-vivo/api/athletes/handler.js`
  - `POST /athletes`
  - `GET /athletes`
  - `GET /athletes/{athleteId}`
- `services/club-vivo/api/sessions/handler.js`
  - `POST /sessions`
  - `GET /sessions`
  - `GET /sessions/{sessionId}`
  - `GET /sessions/{sessionId}/pdf`
  - `POST /sessions/{sessionId}/feedback`
- `services/club-vivo/api/templates/handler.js`
  - `POST /templates`
  - `GET /templates`
  - `POST /templates/{templateId}/generate`
- `services/club-vivo/api/session-packs/handler.js`
  - `POST /session-packs`
- `services/club-vivo/api/teams/handler.js`
  - `POST /teams`
  - `GET /teams`
  - `GET /teams/{teamId}`
  - `PUT /teams/{teamId}`
  - `GET /teams/{teamId}/sessions`
  - `POST /teams/{teamId}/sessions/{sessionId}/assign`
  - The handler also contains attendance and weekly planning route handlers, but those routes were not found in the current `infra/cdk/lib/sic-api-stack.ts` route list.
- `services/club-vivo/api/methodology/handler.js`
  - `GET /methodology/{scope}`
  - `PUT /methodology/{scope}`
  - `POST /methodology/{scope}/publish`

### Handler source present but not found in current CDK route wiring

These handler folders exist and have tests or implementation, but current `infra/cdk/lib/sic-api-stack.ts` does not show matching Lambda functions/routes for them:

- `services/club-vivo/api/clubs/handler.js`
  - Source handles `POST /clubs` and `GET /clubs`.
- `services/club-vivo/api/memberships/handler.js`
  - Source handles `POST /memberships` and `GET /memberships`.
- `services/club-vivo/api/exports-domain/handler.js`
  - Source creates tenant-scoped domain exports to S3 using sessions, clubs, teams, and memberships repositories.
- `services/club-vivo/api/lake-ingest/handler.js`
  - Source copies domain export objects into lake bronze paths.
- `services/club-vivo/api/lake-etl/etl.py`
  - Python ETL source for lake movement.

These should not be deleted or moved without deeper review because docs and runbooks still reference domain exports and lake workflows.

## 3. Active Backend Domain Logic

Backend domain logic lives under `services/club-vivo/api/src/domains/`.

### Session Builder

`services/club-vivo/api/src/domains/session-builder/` contains:

- `session-builder-pipeline.js`
  - Normalizes session-pack input, builds generation context, loads optional lookups, resolves context, generates packs, validates generated sessions, processes image analysis requests, persists sessions, and exports persisted sessions.
- `session-pack-templates.js`
  - Template-based pack generation.
- `session-pack-validate.js`
  - Session pack request/output validation.
- `session-validate.js`
  - Saved session create validation.
- `generation-context.js`
  - Generation Context v1 builder.
- `generation-context-lookups.js`
  - Optional team and published methodology lookup loading.
- `generation-context-resolver.js`
  - Resolved Generation Context v1 resolver.
- `image-intake-validate.js`, `image-intake-parser.js`
  - Image-assisted intake request validation and model output parsing.
- `diagram-spec-validate.js`
  - Drill diagram spec validation.

### Sessions

`services/club-vivo/api/src/domains/sessions/` contains:

- `session-repository.js`
  - DynamoDB persistence, list/detail, ownership filtering, feedback records, and session events.
- `session-feedback-validate.js`
  - Feedback request validation.
- `session-feedback-service.js`
  - Feedback submission service.
- `pdf/session-pdf.js`
  - Minimal PDF buffer creation.
- `pdf/session-pdf-storage.js`
  - S3 put and presigned GET URL behavior for session PDFs.

### Teams

`services/club-vivo/api/src/domains/teams/` contains:

- `team-repository.js`
  - DynamoDB team records, list/get/update, session assignments, attendance, and weekly planning reads.
- `team-validate.js`
  - Team create/update validation.
- `team-session-assignment-validate.js`
  - Team-session assignment validation.
- `team-attendance-validate.js`
  - Attendance validation.
- `team-weekly-planning-validate.js`
  - Weekly planning query validation.

### Methodology

`services/club-vivo/api/src/domains/methodology/` contains:

- `methodology-repository.js`
  - DynamoDB get/put by tenant and methodology scope.
- `methodology-service.js`
  - Methodology read/save/publish service behavior.
- `methodology-validate.js`
  - Scope, draft save, and publish validation.

### Other domain folders

- `services/club-vivo/api/src/domains/athletes/`
  - Athlete repository.
- `services/club-vivo/api/src/domains/templates/`
  - Template repository, validation, and pipeline logic.
- `services/club-vivo/api/src/domains/clubs/`
  - Club repository.
- `services/club-vivo/api/src/domains/memberships/`
  - Membership repository.

## 4. DynamoDB Repositories / Data Access

### Domain repositories

- `services/club-vivo/api/src/domains/athletes/athlete-repository.js`
  - Stores and reads tenant-scoped athlete records and idempotency/audit records in `SIC_DOMAIN_TABLE`.
- `services/club-vivo/api/src/domains/clubs/club-repository.js`
  - Stores and reads one club record under tenant scope.
- `services/club-vivo/api/src/domains/memberships/membership-repository.js`
  - Stores and lists tenant-scoped membership records.
- `services/club-vivo/api/src/domains/methodology/methodology-repository.js`
  - Stores and reads tenant-scoped methodology records under `METHODOLOGY#<scope>`.
- `services/club-vivo/api/src/domains/sessions/session-repository.js`
  - Stores sessions, session lookup records, feedback records, and session event records. It also owner-filters saved sessions for coach users.
- `services/club-vivo/api/src/domains/teams/team-repository.js`
  - Stores teams, team-session assignments, attendance, and team planning reads. It also owner-filters teams for coach users.
- `services/club-vivo/api/src/domains/templates/template-repository.js`
  - Stores templates and lookup records, lists templates, fetches templates by ID, and marks generation usage.

### Entitlements data access

- `services/club-vivo/api/src/platform/tenancy/tenant-context.js`
  - Reads `TENANT_ENTITLEMENTS_TABLE` directly by Cognito `sub`/`user_sub`.
- `services/auth/post-confirmation/handler.js`
  - Writes the initial entitlements row to `TENANT_ENTITLEMENTS_TABLE`.

There is no separate repository class for tenant entitlements in the current source.

## 5. Platform Backend Utilities

Platform backend utilities live under `services/club-vivo/api/src/platform/`.

- `http/with-platform.js`
  - Common Lambda wrapper for tenant-context resolution, structured logging, correlation IDs, normalized error responses, and proxy response shape.
- `http/parse-body.js`
  - JSON body parsing.
- `tenancy/tenant-context.js`
  - Builds tenant context from API Gateway JWT claims plus DynamoDB entitlements. It fails closed when identity or entitlements are missing/invalid.
- `errors/errors.js`
  - App error classes and error response mapping.
- `logging/logger.js`
  - Structured logger, correlation resolution, error normalization.
- `validation/validate.js`
  - Shared validation helpers.
- `bedrock/session-builder-image-analysis.js`
  - Bedrock Runtime integration for image analysis.
- `storage/session-builder-image-storage.js`
  - S3 source-image storage for image-assisted intake.

## 6. Infrastructure / AWS Resources

Infrastructure source lives under `infra/cdk/`.

### CDK entrypoints

- `infra/cdk/bin/sic-api.ts`
  - Instantiates `SicApiStack` with supplied Cognito user pool/client IDs or placeholders for synth/diff.
- `infra/cdk/bin/sic-auth.ts`
  - Instantiates `SicAuthStack` and conditionally `SicApiStack` when auth IDs are supplied.

### API stack

`infra/cdk/lib/sic-api-stack.ts` defines:

- API Gateway HTTP API:
  - `ClubVivoHttpApi`
  - Cognito JWT authorizer
  - routes for `/me`, `/athletes`, `/sessions`, `/templates`, `/session-packs`, `/teams`, and `/methodology`
- Lambda functions:
  - `MeFn`
  - `AthletesFn`
  - `SessionsFn`
  - `TemplatesFn`
  - `SessionPacksFn`
  - `TeamsFn`
  - `MethodologyFn`
- DynamoDB:
  - `TenantEntitlementsTable`
  - `SicDomainTable`
- S3:
  - `SessionPdfBucket`
  - The same bucket name is also passed to `SESSION_IMAGE_BUCKET_NAME` for the current image-intake storage path.
- Bedrock:
  - Session image analysis model ID `amazon.nova-lite-v1:0`
  - IAM permission `bedrock:InvokeModel` granted to `SessionPacksFn`.
- CloudWatch:
  - API Gateway access log group.
  - metric filters, dashboards, and alarms for athlete create, session create, templates, session packs, PDF export, handler errors, API 4xx/5xx, and Lambda errors/throttles.
- IAM:
  - Explicit DynamoDB and S3 permissions for the Lambda functions.

### Auth stack

`infra/cdk/lib/sic-auth-stack.ts` defines:

- Cognito User Pool.
- Club Vivo web app client.
- Cognito hosted domain.
- Cognito groups:
  - `cv-admin`
  - `cv-coach`
  - `cv-medical`
  - `cv-athlete`
- Post Confirmation Lambda trigger.
- Pre Token Generation Lambda trigger.
- Imports the tenant entitlements table exported by the API stack.

### Resources referenced by source but not found in current CDK stack

The current source includes domain export and lake code that expects:

- `DOMAIN_EXPORT_BUCKET`
- `LAKE_BUCKET`

The current `infra/cdk/lib/sic-api-stack.ts` searched in this pass does not define `DomainExportBucket`, `LakeBucket`, an exports-domain Lambda, a lake-ingest Lambda, Glue resources, or Athena resources. Existing runbooks and docs mention these areas, so they need deeper review before any cleanup.

## 7. Auth Lambdas

Auth Lambda source lives under `services/auth/`.

- `services/auth/post-confirmation/handler.js`
  - Cognito Post Confirmation trigger.
  - Adds the user to the default `cv-coach` group.
  - Writes an idempotent entitlement row to the tenant entitlements DynamoDB table.
- `services/auth/post-confirmation/handler.test.js`
  - Tests tenant ID generation and idempotent entitlement behavior.
- `services/auth/pre-token-generation/handler.js`
  - Cognito Pre Token Generation trigger.
  - Adds tenant and role/tier claims to ID and access tokens when tenant data is available in user attributes/groups.

## 8. API Contracts

API contract docs live under `docs/api/`:

- `athletes.md`
- `chat-contract-v1.md`
- `diagram-rendering-contract-v1.md`
- `error-handling.md`
- `generation-context-v1-contract.md`
- `methodology-v1-contract.md`
- `platform-error-contract.md`
- `resolved-generation-context-v1-contract.md`
- `session-builder-v1-contract.md`
- `session-feedback-v1-contract.md`
- `session-pack-contract-v2.md`
- `team-attendance-v1-contract.md`
- `team-layer-v1-contract.md`
- `team-weekly-planning-v1-contract.md`

These are contract/reference docs, not runtime code.

## 9. Product Docs

Club Vivo product docs live under `docs/product/club-vivo/`:

- `README.md`
- `session-builder.md`
- `coach-workspace.md`
- `methodology.md`
- `user-flows.md`
- `generation-profiles/README.md`
- `generation-profiles/soccer.md`
- `generation-profiles/fut-soccer.md`
- `pilots/README.md`
- `pilots/ksc/README.md`
- `pilots/ksc/program-types-and-methodology.md`
- `future/README.md`
- `future/image-assisted-intake-v1-scope.md`
- `future/image-assisted-intake-parking-lot.md`
- `future/methodology-source-mode-planning.md`
- `future/roadmap-phases.md`

The product docs include current Club Vivo product framing, KSC pilot material, and future planning. Pilot and future docs should not be treated as generic shipped runtime scope.

## 10. Architecture Docs

Architecture docs live under `docs/architecture/`:

- platform and principles:
  - `platform-overview.md`
  - `platform-constitution.md`
  - `architecture-principles.md`
  - `architecture-diagrams.md`
  - `repo-structure.md`
- tenancy and auth:
  - `tenancy-model.md`
  - `tenant-claim-contract.md`
- observability:
  - `platform-observability.md`
  - `observability-signals.md`
- coach/session architecture:
  - `coach-lite/coach-lite-generation-flow.md`
  - `coach-lite/diagram-rendering-architecture.md`
  - `coach-lite/drill-diagram-spec-v1.md`
  - `coach-lite/tenant-methodology-knowledge.md`
  - `session-builder-image-assisted-intake-v1.md`
  - `feedback-loop-architecture.md`
  - `team-layer-v1.md`
  - `attendance-system-v1.md`
  - `fut-soccer-merge-v1.md`
  - `ai-evaluation-harness.md`
- lake/ETL:
  - `lake-layout.md`
  - `etl-v1.md`
  - `glue-catalog-v1.md`
- this new file:
  - `sic-repo-inventory.md`

## 11. Historical Progress Docs

Build history lives under `docs/progress/`.

- `docs/progress/README.md` explains the current progress-history status and points GitHub readers to concise summaries.
- `docs/progress/weekly-progress-notes.md` is the short week-by-week summary for GitHub readers.
- `docs/progress/architect-process-summary.md` is the short architecture/process story.
- `docs/progress/new-sic/` contains the New SIC cleanup plan, progress-history audit, and closeout summaries.

These files are build history and planning evidence. They are not active runtime code.

## 12. Parked/Future Planning Docs

Known parked or future-only planning docs include:

- `docs/product/club-vivo/future/image-assisted-intake-parking-lot.md`
  - Explicitly marked as parked/future exploration.
- `docs/product/club-vivo/future/methodology-source-mode-planning.md`
  - Explicitly describes future source-mode decisions and does not implement upload, source switching, RAG, or admin configuration.
- `docs/product/club-vivo/coach-workspace.md`
  - Includes future direction such as Quick Drill direction and coach-admin governance direction.
- A Week 21 class-session planning note in the detailed progress history.
  - Planning/class-session document; includes future-oriented product concepts.
- `docs/product/future/ruta-viva.md`
  - Future product concept for cycling/active mobility analytics.
- `docs/product/future/athlete-evolution-ai.md`
  - Future product concept for ML/GenAI athlete insights.

These should not be presented as active shipped runtime surfaces.

## 13. Tests

### Backend tests

Backend tests are mostly Node test files colocated with handlers and domain modules:

- handler tests:
  - `services/club-vivo/api/*/handler.test.js`
  - examples: sessions, session-packs, teams, methodology, templates, clubs, memberships, exports-domain, lake-ingest
- platform tests:
  - `services/club-vivo/api/src/platform/http/with-platform.test.js`
  - `services/club-vivo/api/src/platform/tenancy/tenant-context.test.js`
  - `services/club-vivo/api/src/platform/storage/session-builder-image-storage.test.js`
- domain tests:
  - `services/club-vivo/api/src/domains/**/*.test.js`
- auth tests:
  - `services/auth/post-confirmation/handler.test.js`
- API test command:
  - `npm test --prefix services/club-vivo/api`
- post-confirmation test command from `Makefile`:
  - `npm test --prefix services/auth/post-confirmation`

### Frontend validation

No frontend unit test folder was found in this pass. Frontend validation currently appears to rely on:

- `cmd /c npx tsc --noEmit` from `apps/club-vivo`
- manual/browser validation captured in progress docs

### CI and smoke checks

- `.github/workflows/ci-tests.yml`
  - Runs Club Vivo API tests and parses export schemas.
- `.github/workflows/tenant-guardrails.yml`
  - Scans code roots for banned client-controlled tenant-scope patterns.
- `.github/workflows/smoke-tests.yml`
  - Manual workflow for `scripts/smoke/smoke.mjs`.
- `Makefile`
  - Provides `check`, `check-fast`, `check-api`, `guard`, `test`, and `cdk-build`.

## 14. Local-Only / Generated Files

The repo root `.gitignore` already lists local/generated patterns including:

- `node_modules/`
- `*.log`
- `.env`, `.env.*`, key/cert formats
- `cdk.out/`
- `replace.txt`
- `tmp_alarms.json`
- `sic-test.txt`
- `infra/cdk/git`
- `.venv/`
- `.workspace/`
- `repo-export/`
- `*.local.md`
- `.tmp-methodology-smoke/`
- `infra/cdk/cdk.out.methodology-verify-deploy/`
- `infra/cdk/cdk.out.methodology-verify-synth/`

Visible local/generated directories during this inventory included:

- `.tmp-methodology-smoke/`
- `.venv/`
- `.workspace/`
- `cdk.out/`

No `.gitignore` change is made in this inventory.

## 15. Candidate Cleanup Items For Later Human Review

These are candidates for later review only. Do not delete, move, or rename them from this inventory.

- `docs/architecture/repo-structure.md` and this inventory overlap; decide whether both should remain or whether one becomes the canonical repo map.
- Coach Lite preview route was removed from the active Club Vivo app tree after audit; useful Coach Lite architecture docs remain for later review or migration.
- Ruta Viva and Athlete Evolution AI are preserved as future product concepts under `docs/product/future/`.
- `services/club-vivo/api/clubs/`, `memberships/`, `exports-domain/`, `lake-ingest/`, and `lake-etl/` contain implementation/tests but are not wired in the current `SicApiStack` route list found during this pass.
- Domain export and lake runbooks/docs reference resources not found in current CDK source; review whether these are historical, planned, or maintained outside the current stack.
- `apps/club-vivo/lib/coach-team-hints.ts` appears browser-local and may be legacy after backend Teams became active.
- `apps/club-vivo/lib/selected-team.ts` has read/clear usage in `session-builder-server.ts`; `setSelectedTeamId` was not found outside its own module during this pass.
- Some progress/product docs contain future Quick Drill or upload/source-mode language; keep them clearly separated from shipped runtime docs.
- `postman/` contains useful workflow assets; decide if it should remain top-level for GitHub presentation or move under docs/tools.
- `datasets/schemas/exports/v1/` is currently checked by CI; do not move without updating the CI workflow and export docs.

## Concept Map

### Where are the APIs?

- API Gateway routes are defined in `infra/cdk/lib/sic-api-stack.ts`.
- Lambda handler entrypoints live under `services/club-vivo/api/<route-folder>/handler.js`.
- Frontend API callers live under:
  - `apps/club-vivo/lib/session-builder-api.ts`
  - `apps/club-vivo/lib/team-api.ts`
  - `apps/club-vivo/lib/methodology-api.ts`
  - `apps/club-vivo/lib/api.ts`

### Where are the Lambda functions?

- Club Vivo API Lambda resources are defined in `infra/cdk/lib/sic-api-stack.ts`.
- Club Vivo API handler code is in `services/club-vivo/api/`.
- Auth trigger Lambda resources are defined in `infra/cdk/lib/sic-auth-stack.ts`.
- Auth trigger handler code is in `services/auth/post-confirmation/` and `services/auth/pre-token-generation/`.

### Where are the DynamoDB repositories?

- Domain repositories are under `services/club-vivo/api/src/domains/*/*-repository.js`.
- Tenant entitlements access is direct in:
  - `services/club-vivo/api/src/platform/tenancy/tenant-context.js`
  - `services/auth/post-confirmation/handler.js`

### Where are S3 buckets defined?

- `SessionPdfBucket` is defined in `infra/cdk/lib/sic-api-stack.ts`.
- Session PDF storage uses `services/club-vivo/api/src/domains/sessions/pdf/session-pdf-storage.js`.
- Session image source storage uses `services/club-vivo/api/src/platform/storage/session-builder-image-storage.js`.
- Domain export/lake code expects `DOMAIN_EXPORT_BUCKET` and `LAKE_BUCKET`, but matching bucket definitions were not found in the current CDK stack during this pass.

### Where is Bedrock used or permitted?

- Bedrock Runtime use is implemented in `services/club-vivo/api/src/platform/bedrock/session-builder-image-analysis.js`.
- `services/club-vivo/api/session-packs/handler.js` creates image analysis/storage dependencies for `requestType: "image-analysis"`.
- `infra/cdk/lib/sic-api-stack.ts` grants `bedrock:InvokeModel` to the SessionPacks Lambda for `amazon.nova-lite-v1:0`.

### Where is Cognito/auth handled?

- Cognito user pool, app client, hosted domain, groups, and triggers are in `infra/cdk/lib/sic-auth-stack.ts`.
- Post-confirmation provisioning is in `services/auth/post-confirmation/handler.js`.
- Pre-token-generation claim enrichment is in `services/auth/pre-token-generation/handler.js`.
- Frontend auth flow is in:
  - `apps/club-vivo/lib/auth.ts`
  - `apps/club-vivo/lib/pkce.ts`
  - `apps/club-vivo/app/login/start/route.ts`
  - `apps/club-vivo/app/callback/route.ts`
  - `apps/club-vivo/app/logout/route.ts`
  - `apps/club-vivo/middleware.ts`
- API request tenant context is built in `services/club-vivo/api/src/platform/tenancy/tenant-context.js`.

### Where does Quick Session live in frontend and backend?

- Frontend:
  - `apps/club-vivo/app/(protected)/home/page.tsx`
  - `apps/club-vivo/components/coach/HomeSessionStartCard.tsx`
  - `apps/club-vivo/app/(protected)/sessions/quick/page.tsx`
  - `apps/club-vivo/app/(protected)/sessions/quick-session-actions.ts`
  - `apps/club-vivo/app/(protected)/sessions/quick-review/page.tsx`
  - `apps/club-vivo/app/(protected)/sessions/quick-review/quick-session-review.tsx`
  - `apps/club-vivo/lib/quick-session-intent.ts`
  - `apps/club-vivo/lib/quick-session-payload.ts`
  - `apps/club-vivo/lib/quick-session-title-hints.ts`
- Backend:
  - Quick Session reuses `POST /session-packs` through `services/club-vivo/api/session-packs/handler.js`.
  - Saving reuses `POST /sessions` through `services/club-vivo/api/sessions/handler.js`.
  - There is no separate Quick Session backend product in the current source.

### Where does Session Builder live in frontend and backend?

- Frontend:
  - `apps/club-vivo/app/(protected)/sessions/new/page.tsx`
  - `apps/club-vivo/app/(protected)/sessions/new/session-new-flow.tsx`
  - `apps/club-vivo/app/(protected)/sessions/new/session-new-actions.ts`
  - `apps/club-vivo/components/coach/SessionBuilderTopBlock.tsx`
  - `apps/club-vivo/lib/session-builder-server.ts`
  - `apps/club-vivo/lib/session-builder-api.ts`
- Backend:
  - `services/club-vivo/api/session-packs/handler.js`
  - `services/club-vivo/api/src/domains/session-builder/`
  - saved output uses `services/club-vivo/api/sessions/handler.js`

### Where are saved sessions handled?

- Frontend:
  - `apps/club-vivo/lib/session-builder-api.ts`
  - `apps/club-vivo/app/(protected)/sessions/page.tsx`
  - `apps/club-vivo/app/(protected)/sessions/session-actions.ts`
  - `apps/club-vivo/app/(protected)/sessions/[sessionId]/page.tsx`
- Backend:
  - `services/club-vivo/api/sessions/handler.js`
  - `services/club-vivo/api/src/domains/sessions/session-repository.js`
  - `services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.js`

### Where are Teams handled?

- Frontend:
  - `apps/club-vivo/app/(protected)/teams/page.tsx`
  - `apps/club-vivo/lib/team-api.ts`
  - `apps/club-vivo/components/coach/TeamSelector.tsx`
  - `apps/club-vivo/components/coach/SessionBuilderTopBlock.tsx`
- Backend:
  - `services/club-vivo/api/teams/handler.js`
  - `services/club-vivo/api/src/domains/teams/`
  - `services/club-vivo/api/src/domains/session-builder/generation-context-lookups.js`

### Where is Methodology handled?

- Frontend:
  - `apps/club-vivo/app/(protected)/methodology/page.tsx`
  - `apps/club-vivo/app/(protected)/methodology/methodology-workspace.tsx`
  - `apps/club-vivo/lib/methodology-api.ts`
- Backend:
  - `services/club-vivo/api/methodology/handler.js`
  - `services/club-vivo/api/src/domains/methodology/`
  - `services/club-vivo/api/src/domains/session-builder/generation-context-lookups.js`
  - `services/club-vivo/api/src/domains/session-builder/generation-context-resolver.js`

### Where is feedback handled?

- Frontend:
  - `apps/club-vivo/app/(protected)/sessions/[sessionId]/page.tsx`
  - `apps/club-vivo/app/(protected)/sessions/[sessionId]/session-feedback-panel.tsx`
  - `apps/club-vivo/lib/session-builder-api.ts`
- Backend:
  - `services/club-vivo/api/sessions/handler.js`
  - `services/club-vivo/api/src/domains/sessions/session-feedback-validate.js`
  - `services/club-vivo/api/src/domains/sessions/session-feedback-service.js`
  - `services/club-vivo/api/src/domains/sessions/session-repository.js`

### Where is PDF export handled?

- Frontend:
  - `apps/club-vivo/app/(protected)/sessions/[sessionId]/page.tsx`
  - `apps/club-vivo/app/(protected)/sessions/[sessionId]/session-export-button.tsx`
  - `apps/club-vivo/lib/session-builder-api.ts`
- Backend:
  - `services/club-vivo/api/sessions/handler.js`
  - `services/club-vivo/api/src/domains/sessions/pdf/session-pdf.js`
  - `services/club-vivo/api/src/domains/sessions/pdf/session-pdf-storage.js`
  - `services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.js`
- Infrastructure:
  - `SessionPdfBucket` and related IAM permissions in `infra/cdk/lib/sic-api-stack.ts`

## Safe To Reorganize Later

- Historical detailed progress docs, if link targets and process references are preserved.
- Local-only ignored directories and generated outputs, using `.gitignore` as the source of truth.
- Future product concept docs, after a human decision about portfolio/GitHub presentation.
- Progress templates and QA notes, after preserving any references.

## Needs Deeper Review Before Moving

- `services/club-vivo/api/clubs/`, `memberships/`, `exports-domain/`, `lake-ingest/`, and `lake-etl/`.
- Domain export and lake docs/runbooks.
- Old Coach Lite architecture docs, after useful generation, diagram, and methodology decisions are migrated or summarized.
- Browser-local hint helpers that may overlap with newer backend-backed Teams and Sessions behavior.
- Any docs that currently mix shipped scope with future product direction.

## Should Not Move Without ADR

- `infra/cdk/`.
- `services/club-vivo/api/src/platform/tenancy/tenant-context.js`.
- `services/club-vivo/api/src/platform/http/with-platform.js`.
- `services/club-vivo/api/src/platform/errors/errors.js`.
- `services/club-vivo/api/src/domains/*/*-repository.js`.
- `services/auth/`.
- `docs/api/` contract files.
- `docs/adr/`.
- API handler route folders that are currently CDK-wired.

## Historical Only

- Detailed `week_*` folders under `docs/progress/`.
- Older demo scripts and closeout notes under `docs/progress/`.
- `docs/progress/weekly-progress-notes.md` as concise public progress history.
- `docs/progress/architect-process-summary.md` as concise public architecture/process history.
- detailed progress history preserved by the archive branch/tag listed in `docs/progress/README.md`.

## Parked/Future Only

- `docs/product/club-vivo/future/image-assisted-intake-parking-lot.md`.
- `docs/product/club-vivo/future/methodology-source-mode-planning.md`.
- Future product concepts:
  - `docs/product/future/ruta-viva.md`
  - `docs/product/future/athlete-evolution-ai.md`
- Future product-direction content around Quick Drill, methodology source-mode, document upload, RAG/vector ingestion, and separate analytics/ML pillars until explicitly rescoped.
