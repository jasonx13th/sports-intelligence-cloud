# Weekly Progress Notes

This is the short GitHub-readable summary of SIC progress from Week 0 through Week 21.

Detailed week folders were removed from GitHub `main` after this summary layer was created. The full detailed history remains preserved in the archive branch/tag listed in `docs/progress/README.md`. Week 21 closed the old week-based work model, and the New SIC baseline began after the Week 21 merge and GitHub showcase cleanup checkpoint.

## Week 0 - AWS Sandbox And Security Orientation

- Outcome: Established the first safe AWS sandbox posture and security vocabulary for SIC.
- Key work: Captured AWS account/CLI setup, IAM user/MFA assumptions, early KMS/VPC/secrets thinking, and the first fail-closed tenant-isolation mindset.
- Evidence/source: archived detailed progress history and this summary.

## Week 1 - Multi-Tenant Auth Foundation

- Outcome: Framed Cognito, IAM, tenant identity, and API authorization as the backbone of SIC.
- Key work: Documented IAM users vs roles, Cognito groups, tenant claim flow, API Gateway token validation, and the rule that tenant identity comes from validated auth, not request input.
- Evidence/source: archived detailed progress history and this summary.

## Week 2 - Tenant Claim Contract And Early Guardrails

- Outcome: Began turning the tenancy model into enforceable platform contracts.
- Key work: Added tenant-claim contract direction, `/me` claim enforcement, access logs/alarms, least-privilege IAM tightening, and auth/API alarm runbook coverage.
- Evidence/source: archived detailed progress history and `docs/architecture/tenant-claim-contract.md`.

## Week 3 - Entitlements And Tenant-Scoped Data Access

- Outcome: Connected user provisioning, entitlements, tenant context, and tenant-scoped DynamoDB access.
- Key work: Added post-confirmation entitlement provisioning, tenant-safe repository patterns, fail-closed handler behavior, and structured request/error logging.
- Evidence/source: archived detailed progress history and this summary.

## Week 4 - Operability And Signal Hygiene

- Outcome: Improved operational readiness around logs, runbooks, and deployment hygiene.
- Key work: Added platform 5xx runbook coverage, linked observability signals to runbooks, clarified 4xx vs 5xx logging semantics, and restored public-safe deploy configuration.
- Evidence/source: archived detailed progress history and this summary.

## Week 5 - Reliability And Session-Pack Hardening

- Outcome: Tightened testability and deterministic Session Builder behavior while preserving the tenancy path.
- Key work: Added wrapper test coverage for fail-closed behavior and log levels, improved session-pack duration handling, and added API test runner support.
- Evidence/source: archived detailed progress history and this summary.

## Week 6 - Membership Domain And Upgrade Planning

- Outcome: Added the first membership-domain slice and documented upgrade/active-tenant-selection principles.
- Key work: Implemented tenant-scoped memberships endpoints, wired them into the API, added ADR-0008, and reinforced that memberships do not replace authoritative tenant entitlements.
- Evidence/source: archived detailed progress history and `docs/adr/ADR-0008-coach-basic-to-org-premium-upgrade-and-active-tenant-selection.md`.

## Week 7 - Domain Export Contract

- Outcome: Defined the lake-ready export contract and operator guidance for domain exports.
- Key work: Documented export manifest validation, tenant-prefixed S3 output, export lifecycle signals, and export failure/no-success alarms.
- Evidence/source: archived detailed progress history and this summary.

## Week 8 - CI, Smoke Tests, And Shipping Runbooks

- Outcome: Raised the repo quality bar with CI gates and repeatable smoke validation.
- Key work: Added CI tests, export schema parsing, tenant guardrails, manual smoke workflow, smoke script, `.gitattributes`, and shipping/CI/smoke runbooks.
- Evidence/source: archived detailed progress history and current runbooks.

## Week 9 - Tenant-Safe Lake Foundation

- Outcome: Established the tenant-safe S3 data lake foundation.
- Key work: Added the lake layout contract, secure lake bucket, event-driven ingest from domain exports to bronze partitions, idempotent ingest behavior, runbooks, and alarms.
- Evidence/source: archived detailed progress history and `docs/architecture/lake-layout.md`.

## Week 10 - Glue Catalog And ETL v1

- Outcome: Made the Week 9 lake pattern queryable and transformable for the first dataset.
- Key work: Added Glue Catalog v1 for bronze sessions, a bronze-to-silver sessions ETL path that preserves tenant partitions, and crawler/job runbooks and alarms.
- Evidence/source: archived detailed progress history, `docs/architecture/etl-v1.md`, and `docs/architecture/glue-catalog-v1.md`.

## Week 11 - Session Builder Hardening

- Outcome: Stabilized Session Builder as the coach-facing MVP core.
- Key work: Froze the v1 Session Builder contract, hardened validation, made the normalize/generate/validate/persist/export pipeline explicit, and documented the request flow.
- Evidence/source: archived detailed progress history and `docs/api/session-builder-v1-contract.md`.

## Week 12 - Web Application Foundation

- Outcome: Created the first protected Club Vivo web surface on top of Session Builder.
- Key work: Scaffolded the Next.js app, added Cognito Hosted UI auth with protected routes, built first session list/detail/create flows, and added a local Coach Lite preview bridge without creating a separate backend.
- Evidence/source: archived detailed progress history and current app source.

## Week 13 - Session Library And Templates

- Outcome: Delivered the first reuse loop for saved sessions.
- Key work: Added tenant-scoped templates, template create/list/generate routes, saved-session template metadata, live dev validation, and template success metrics/dashboard coverage.
- Evidence/source: archived detailed progress history and current API/app source.

## Week 14 - Coach Feedback Loop

- Outcome: Added structured coach feedback and a lightweight product review loop.
- Key work: Added `POST /sessions/{sessionId}/feedback`, feedback persistence, session event timeline writes, feedback API contract, architecture doc, and weekly review runbook.
- Evidence/source: archived detailed progress history and `docs/api/session-feedback-v1-contract.md`.

## Week 15 - Team Layer v1

- Outcome: Moved SIC from individual session planning toward team-level workflows.
- Key work: Added Team model/endpoints, team-session assignment routes, Team Layer contract/architecture docs, Postman coverage, and deployable CDK wiring.
- Evidence/source: archived detailed progress history and `docs/api/team-layer-v1-contract.md`.

## Week 16 - Attendance System v1

- Outcome: Added the first operational attendance and weekly planning slice for teams.
- Key work: Added occurrence-level attendance routes, duplicate/idempotent behavior, current-week planning read model, attendance contracts, failure/runbook docs, and demo evidence.
- Evidence/source: archived detailed progress history and current attendance API/runbook docs.

## Week 17 - Fut-Soccer Merge v1

- Outcome: Added Fut-Soccer as a narrow generation bias on the shared Session Builder foundation.
- Key work: Kept canonical `sport = "soccer"`, added generation-only `sportPackId` bias behavior, preserved save/list/detail/export paths, and documented that Fut-Soccer was not a separate product stack.
- Evidence/source: archived detailed progress history and current product/architecture docs.

## Week 18 - Image-Assisted Intake v1

- Outcome: Added a narrow image-assisted intake path inside the shared Session Builder workflow.
- Key work: Supported `environment_profile` and `setup_to_drill` analysis, tenant-scoped source image storage, Bedrock adapter boundary, parser/validator hardening, coach confirmation, and live validation. Broader AI surfaces were not shipped.
- Evidence/source: archived detailed progress history and `docs/architecture/session-builder-image-assisted-intake-v1.md`.

## Week 19 - AI Evaluation Harness

- Outcome: Defined a lightweight quality layer for the current AI-assisted Session Builder slice.
- Key work: Froze evaluation case categories, schema, coach-usefulness rubric, runner/result shapes, deterministic checks, failure classification, golden examples, and pilot-readiness thresholds.
- Evidence/source: archived detailed progress history and `docs/architecture/ai-evaluation-harness.md`.

## Week 20 - KSC Pilot Readiness

- Outcome: Prepared the current shared Session Builder flow for a narrow KSC pilot-readiness story.
- Key work: Created pilot-readiness docs, added/runtime-validated the coach login entry path, updated saved-session feedback capture, captured walkthrough evidence, and kept broader auth/tenancy/platform changes out of scope.
- Evidence/source: archived detailed progress history and current KSC pilot docs.

## Week 21 - Coach Workspace Hardening For KSC

- Outcome: Hardened Club Vivo into a more coherent shared coach workspace and closed the old week-based work model.
- Key work: Improved public/login/Home/Sessions/Teams/Methodology flows, split Quick Session as a fast lane while reusing shared generation/save paths, enforced coach-owned team/session behavior, added narrow methodology management and generation context groundwork, and improved saved-session output.
- Evidence/source: archived detailed progress history and `docs/architecture/sic-current-system-map.md`.

## New SIC Baseline

- Outcome: After Week 21, SIC moved away from week-based work into a cleaner product, architecture, and repo organization phase.
- Key work: Completed the GitHub showcase cleanup checkpoint, reorganized product docs around Club Vivo, moved KSC under pilot context, separated future docs, added README coverage, and created the progress-history audit and archive cleanup closeout.
- Evidence/source: `docs/progress/new-sic/`.
