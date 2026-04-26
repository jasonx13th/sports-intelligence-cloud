# Backend Export Lake Audit

## 1. Purpose

This audit supports the cleanup decision for backend, domain export, and lake folders that are present in the repo but not clearly part of the current Club Vivo runtime.

It is an audit document only. It does not delete, move, rename, or rewrite existing source files. It does not change runtime code, infrastructure, API contracts, auth, tenancy, entitlements, IAM, or CDK.

The goal is to decide whether these folders are active runtime, parked implementation, historical evidence, or safe candidates for later archive/removal from GitHub `main`.

Audited folders:

- `services/club-vivo/api/clubs/`
- `services/club-vivo/api/memberships/`
- `services/club-vivo/api/exports-domain/`
- `services/club-vivo/api/lake-ingest/`
- `services/club-vivo/api/lake-etl/`

## 2. Folder Inventory

| Folder | Files inside | Apparent purpose | CDK-wired? | Tests? | Referenced by docs? | Referenced by scripts/CI? | Audit classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `services/club-vivo/api/clubs/` | `handler.js`, `handler.test.js` | Tenant-scoped club governance API handling `POST /clubs` and `GET /clubs`. Uses `ClubRepository` and authoritative `tenantCtx`. | No matching Lambda or API route found in `infra/cdk/lib/sic-api-stack.ts`. | Yes. Node test file is under the API test tree. | Yes. Mentioned in repo inventory, system map, cleanup plan, API README, and Club Vivo session-builder product doc. | Covered by `npm test --prefix services/club-vivo/api` because Node test runner discovers `*.test.js`. | Parked implementation with tests; not active CDK runtime. |
| `services/club-vivo/api/memberships/` | `handler.js`, `handler.test.js` | Tenant-scoped membership API handling `POST /memberships` and `GET /memberships`. Requires admin role and ignores spoofable tenant input. | No matching Lambda or API route found in `infra/cdk/lib/sic-api-stack.ts`. | Yes. Node test file is under the API test tree. | Yes. Mentioned in repo inventory, system map, cleanup plan, API README, and product docs as next-phase governance. | Covered by `npm test --prefix services/club-vivo/api`. | Parked implementation with tests; not active CDK runtime. |
| `services/club-vivo/api/exports-domain/` | `handler.js`, `handler.test.js` | Admin-only domain export writer. Reads sessions, clubs, teams, and memberships through repositories and writes tenant-partitioned NDJSON plus manifest objects to `DOMAIN_EXPORT_BUCKET`. | No matching Lambda, API route, bucket, env var, or IAM grant found in source CDK. | Yes. Node test file is under the API test tree. | Yes. Strong references in export/lake docs and runbooks. | Covered by API Node tests; export schemas also checked separately by CI. | Parked or historical implementation; not active CDK runtime. |
| `services/club-vivo/api/lake-ingest/` | `handler.js`, `handler.test.js` | S3 event-style ingest handler. Copies domain export objects into bronze lake paths using `DOMAIN_EXPORT_BUCKET` and `LAKE_BUCKET`. | No matching Lambda, S3 notification, EventBridge rule, lake bucket, env vars, or IAM grants found in source CDK. | Yes, but test is a simple top-level Node assertion file rather than `node:test`. It still runs when discovered by Node's test command. | Yes. Lake architecture and runbooks reference the ingest concept. | Covered by API Node test discovery. | Parked or historical implementation; not active CDK runtime. |
| `services/club-vivo/api/lake-etl/` | `etl.py`, `etl_test.py` | Python Glue-style ETL script reading bronze session JSON and writing silver Parquet partitions. | No Glue job, crawler, database, table, IAM role, S3 lake bucket, or schedule found in source CDK. | Yes, local Python test file exists, but no CI workflow was found for it. | Yes. ETL, Glue, lake, and partition docs/runbooks reference this area conceptually. | No workflow reference to run `etl_test.py` was found. | Parked or historical implementation; not active CDK runtime. |

Notes:

- `services/club-vivo/api/src/domains/clubs/club-repository.js` and `services/club-vivo/api/src/domains/memberships/membership-repository.js` exist as domain repositories. They are used by parked handlers and by `exports-domain`.
- Generated CDK output folders under `infra/cdk/cdk.out...` include copied asset versions of these handlers, but they are not tracked source files and do not prove active live wiring. The source stack remains the authority for this audit.

## 3. CDK Route Wiring Check

Source inspected:

- `infra/cdk/lib/sic-api-stack.ts`
- `infra/cdk/lib/sic-auth-stack.ts`
- `infra/cdk/bin/`
- `infra/cdk/README.md`

Current source CDK-wired Lambda handlers in `SicApiStack`:

- `me/handler.handler`
- `athletes/handler.handler`
- `sessions/handler.handler`
- `templates/handler.handler`
- `session-packs/handler.handler`
- `teams/handler.handler`
- `methodology/handler.handler`

Current source CDK-wired API routes:

- `GET /me`
- `POST /athletes`, `GET /athletes`, `GET /athletes/{athleteId}`
- `POST /sessions`, `GET /sessions`, `GET /sessions/{sessionId}`, `GET /sessions/{sessionId}/pdf`, `POST /sessions/{sessionId}/feedback`
- `POST /templates`, `GET /templates`, `POST /templates/{templateId}/generate`
- `POST /session-packs`
- `POST /teams`, `GET /teams`, `GET /teams/{teamId}`, `PUT /teams/{teamId}`, `GET /teams/{teamId}/sessions`, `POST /teams/{teamId}/sessions/{sessionId}/assign`
- `GET /methodology/{scope}`, `PUT /methodology/{scope}`, `POST /methodology/{scope}/publish`

Wiring answers:

- None of the audited folders are wired to API Gateway/Lambda in source CDK.
- No `clubs` Lambda or `/clubs` route is defined in source CDK.
- No `memberships` Lambda or `/memberships` route is defined in source CDK.
- No `exports-domain` Lambda or `/exports/domain` route is defined in source CDK.
- No `lake-ingest` Lambda, S3 notification, or EventBridge path is defined in source CDK.
- No `lake-etl` Glue job, crawler, database, table, Athena resource, or schedule is defined in source CDK.

Export/lake infrastructure answers:

- `DOMAIN_EXPORT_BUCKET` is required by `exports-domain/handler.js` and `lake-ingest/handler.js`, but no source CDK environment variable assignment was found.
- `LAKE_BUCKET` is required by `lake-ingest/handler.js` and `lake-etl/etl.py`, but no source CDK environment variable assignment was found.
- No domain export bucket was found in source CDK.
- No lake bucket was found in source CDK.
- No Glue/Athena/lake resources were found in source CDK.
- No EventBridge resources were found in source CDK for export or lake workflows.
- Current CDK S3 usage is limited to `SessionPdfBucket`, which supports PDF export and image-intake storage for current app flows.

## 4. Import And Dependency Check

### Active code imports

No active CDK-wired handler was found importing the top-level audited handler folders directly.

Repository imports found:

- `clubs/handler.js` imports `src/domains/clubs/club-repository.js`.
- `memberships/handler.js` imports `src/domains/memberships/membership-repository.js`.
- `exports-domain/handler.js` imports session, club, team, and membership repositories.
- `lake-ingest/handler.js` imports AWS S3 client commands.
- `lake-etl/etl.py` imports Glue/PySpark modules inside runtime functions.

The `ClubRepository` and `MembershipRepository` are real domain source files, but current source CDK does not wire the top-level `clubs/` or `memberships/` handlers.

### Test code imports

Test references found:

- `clubs/handler.test.js` imports `createClubsInner` from `./handler`.
- `memberships/handler.test.js` imports `createMembershipsInner` from `./handler`.
- `exports-domain/handler.test.js` imports `createExportsDomainInner` from `./handler`.
- `lake-ingest/handler.test.js` tests a local copy of the key parsing/mapping behavior.
- `lake-etl/etl_test.py` imports helpers from `etl.py`.

The JS tests are likely part of the existing API test run because `.github/workflows/ci-tests.yml` runs `npm test --prefix services/club-vivo/api`, and the API package script uses Node's test runner over the full API tree.

No CI workflow was found for the Python ETL test.

### Frontend calls

No frontend calls were found to:

- `/clubs`
- `/memberships`
- `/exports/domain`
- `lake-ingest`
- `lake-etl`

Current frontend API callers appear focused on current Club Vivo app flows such as sessions, session packs, teams, methodology, and auth.

### Scripts and workflows

- `scripts/smoke/smoke.mjs` exists, but no dependency on the audited routes was found in the targeted search.
- `.github/workflows/ci-tests.yml` runs the full Club Vivo API Node tests and parses export schema JSON.
- `.github/workflows/ci-tests.yml` does not deploy or exercise export/lake infrastructure.
- No workflow was found for Glue, Athena, lake ingest, or `lake-etl/etl_test.py`.

## 5. Docs And Reference Check

### Current architecture or repo-status references

These current docs identify the audited folders as needing review or not CDK-wired:

- `docs/architecture/sic-current-system-map.md`
- `docs/architecture/sic-repo-inventory.md`
- `docs/architecture/github-showcase-cleanup-plan.md`
- `docs/architecture/diagrams/sic-current-system-blueprint.md`
- `services/club-vivo/api/README.md`

These should be treated as current cleanup/status docs, not proof that the folders are active runtime.

### Domain export and lake architecture references

These docs describe the export/lake architecture or operational model:

- `docs/exports/domain-export-spec-v1.md`
- `docs/architecture/lake-layout.md`
- `docs/architecture/glue-catalog-v1.md`
- `docs/architecture/etl-v1.md`
- `docs/runbooks/domain-exports.md`
- `docs/runbooks/lake-ingest-failure.md`
- `docs/runbooks/lake-access-denied.md`
- `docs/runbooks/lake-volume-anomaly.md`
- `docs/runbooks/lake-isolation-proof.md`
- `docs/runbooks/glue-crawler-failure.md`
- `docs/runbooks/etl-job-failure.md`
- `docs/runbooks/partition-mismatch.md`

Based on CDK source, these appear to describe planned, historical, or parked export/lake workflows rather than currently deployed resources in this stack.

### Current shipped product references

Current shipped app docs include PDF export and session workflow references that are separate from domain export/lake:

- `docs/architecture/sic-current-system-map.md`
- `docs/architecture/feedback-loop-architecture.md`
- `docs/runbooks/weekly-feedback-review.md`
- `services/club-vivo/api/sessions/handler.js`
- `services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.js`

These should not be conflated with `exports-domain/` or the lake folders. PDF export is active CDK-wired runtime; domain export/lake does not appear active in source CDK.

### Historical or future references

The following docs include older roadmap, progress, platform, or future wording around lake, Glue, Athena, ETL, or domain export:

- `docs/progress/weekly-progress-notes.md`
- `docs/progress/architect-process-summary.md`
- `docs/progress/new-sic/new-sic-starting-point-plan.md`
- `docs/progress/new-sic/closeout-summary-1.md`
- `docs/architecture/platform-constitution.md`
- `docs/architecture/foundations/source-of-truth-manifest.md`
- `docs/product/future/ruta-viva.md`

These are useful for history or governance context but should not be interpreted as proof of shipped runtime.

## 6. Data And Schema Check

Dataset files found:

- `datasets/README.md`
- `datasets/schemas/exports/v1/club.schema.json`
- `datasets/schemas/exports/v1/membership.schema.json`
- `datasets/schemas/exports/v1/session.schema.json`
- `datasets/schemas/exports/v1/team.schema.json`

CI references:

- `.github/workflows/ci-tests.yml` has an `export-schemas-parse` job that parses every `datasets/schemas/exports/v1/*.json` file.

Docs references:

- `datasets/README.md`
- `docs/runbooks/ci.md`
- `docs/runbooks/how-to-ship.md`
- `docs/runbooks/domain-exports.md`
- `docs/exports/domain-export-spec-v1.md`
- `docs/architecture/github-showcase-cleanup-plan.md`
- `docs/architecture/repo-structure.md`
- `docs/architecture/sic-repo-inventory.md`

Data/schema answers:

- `datasets/schemas/exports/v1` still supports active CI and docs, even if the domain export/lake handlers are parked.
- Export schemas should stay for now because CI explicitly checks them and multiple docs reference them.
- If export/lake handlers are archived later, schemas may still be useful as stable data contracts or portfolio evidence.
- Do not move or remove export schemas without updating `.github/workflows/ci-tests.yml`, `docs/runbooks/ci.md`, `docs/runbooks/how-to-ship.md`, `datasets/README.md`, and export/lake docs.

## 7. Cleanup Options

### Option A: Keep All Folders In `main` And Label Status Clearly

Keep all audited folders in GitHub `main`, but update README/inventory docs so they are clearly labeled as not currently CDK-wired.

Pros:

- Lowest risk for tests and historical context.
- Preserves useful domain export/lake code and contracts.
- Avoids breaking API Node test discovery.

Cons:

- Keeps GitHub `main` heavier.
- May continue to confuse readers about active runtime scope.
- Requires clear labeling to prevent accidental assumptions.

### Option B: Archive/Remove Only Clearly Unwired Handler Folders, Keep Domain Docs/Schemas

After a follow-up dependency review, remove or archive only top-level handler folders that are not wired by source CDK, while keeping docs and export schemas.

Pros:

- Cleans runtime-looking folders from `services/`.
- Keeps stable export contracts and architecture context.
- Reduces confusion around deployed routes.

Cons:

- JS tests currently cover these folders; removing them changes the API test set.
- Some domain repositories are shared with export-domain and should be reviewed separately.
- Docs must be updated carefully to avoid stale route/runbook claims.

### Option C: Archive Broader Export/Lake Implementation From `main`

Archive or remove export/lake implementation folders from `main`, keeping only architecture summaries and export schemas if still useful.

Pros:

- Stronger current-product presentation.
- Removes parked lake implementation from active source tree.
- Keeps data contracts available if schemas remain.

Cons:

- Requires coordinated updates to many export/lake docs and runbooks.
- Could lose useful implementation evidence unless archive references are clear.
- Should not be done before deciding what to do with `docs/exports`, lake runbooks, and CI schema checks.

### Option D: Keep Clubs/Memberships, Archive Export/Lake Only

Keep `clubs/`, `memberships/`, and their domain repositories as future active domain model work, but archive or remove `exports-domain/`, `lake-ingest/`, and `lake-etl/` after docs/schema review.

Pros:

- Preserves governance/domain model work that may become active near-term.
- Focuses cleanup on the least-current lake/export runtime.
- Aligns with current Club Vivo team/session ownership direction.

Cons:

- `clubs/` and `memberships/` still are not CDK-wired today.
- Product/docs currently mention membership endpoints as next phase, not shipped.
- Export-domain depends on club and membership repositories, so archive boundaries need care.

## 8. Recommendation

Based on current evidence, do not delete any audited folder yet.

Evidence summary:

- None of the audited top-level folders appear wired to API Gateway/Lambda or lake infrastructure in source CDK.
- `clubs/`, `memberships/`, `exports-domain/`, and `lake-ingest/` have JS tests that are likely included in the current API CI test run.
- `lake-etl/` has a Python test, but no CI workflow was found for it.
- Export/lake docs and runbooks are numerous and would become stale if implementation folders were removed without a coordinated docs pass.
- Export schemas are actively referenced by CI and should not be removed or moved now.

Safest recommendation:

- Start with Option A for this branch: keep all folders in `main` and label their status clearly.
- Then consider Option D as the first actual cleanup option: keep clubs/memberships for future domain model review, and separately decide whether export/lake implementation should be archived after docs/runbooks are reduced or relabeled.

Do not recommend deletion yet because tests, docs, and CI schema checks still depend on the surrounding context, even though source CDK does not wire these folders as deployed runtime.

## 9. Proposed Next Action

Make one small follow-up documentation change:

- Update `services/club-vivo/api/README.md` or `docs/architecture/sic-repo-inventory.md` to label these folders as `not currently CDK-wired` and separate them from current active handler folders.

Then run the API test suite and decide whether the parked handler tests should remain as portfolio evidence, move to archive, or be replaced by summarized architecture docs before any source removal.

## 10. Must Not Remove Yet

Do not remove these without a coordinated follow-up:

- `datasets/schemas/exports/v1/`
  - CI parses these schema files.
- `.github/workflows/ci-tests.yml` export schema parse job
  - Must be updated if schemas move.
- `docs/exports/domain-export-spec-v1.md`
  - Defines the export contract that the schemas support.
- `docs/runbooks/ci.md` and `docs/runbooks/how-to-ship.md`
  - Reference export schema validation.
- Domain export and lake runbooks
  - Need relabeling or archiving if implementation is removed.
- `services/club-vivo/api/clubs/` and `services/club-vivo/api/memberships/`
  - Have tests and may represent near-term domain model work.
- `services/club-vivo/api/src/domains/clubs/` and `services/club-vivo/api/src/domains/memberships/`
  - Used by parked handlers and `exports-domain`; review separately from top-level handler cleanup.
