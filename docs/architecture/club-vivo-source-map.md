# Club Vivo Source Map

This map explains how to read the current Club Vivo/SIC repository without moving, renaming, or deleting files. It is a source-orientation guide only.

## How To Use This Map

Use this file when deciding where a Club Vivo change belongs.

- If the change affects coach-facing screens, start in `apps/club-vivo/`.
- If the change affects API behavior, start in `services/club-vivo/api/`.
- If the change affects product direction, start in `docs/product/club-vivo/`.
- If the change affects contracts, start in `docs/api/`.
- If the change affects architecture, tenancy, diagrams, or repo structure, start in `docs/architecture/`.
- If the change affects AWS resources, start in `infra/cdk/`.

This map is not a replacement for `repo-structure.md`; it is a Club Vivo-specific reading guide.

## Frontend App

- `apps/club-vivo/` is the Club Vivo web app.
- `apps/club-vivo/app/` contains Next.js routes, including login/logout, protected workspace pages, sessions, methodology, teams, club, and equipment.
- `apps/club-vivo/components/coach/` contains reusable coach workspace UI components.
- `apps/club-vivo/lib/` contains frontend API clients, auth helpers, role helpers, team/methodology/session-builder helpers, local cookie handling, and shared frontend types.

## Backend API

- `services/club-vivo/api/` is the main Club Vivo backend API package.
- Top-level handler folders such as `athletes/`, `clubs/`, `memberships/`, `methodology/`, `sessions/`, `session-packs/`, `teams/`, `templates/`, `exports-domain/`, and `lake-ingest/` expose Lambda-style API entry points.
- `services/club-vivo/api/src/platform/` contains shared backend platform code for HTTP handling, errors, logging, validation, tenancy, Bedrock integration, and storage.
- `services/club-vivo/api/lake-etl/` contains the Python lake ETL job.

## Session Builder

- Frontend session builder routes live under `apps/club-vivo/app/(protected)/sessions/`, especially `new/`, `quick/`, `quick-review/`, and `[sessionId]/`.
- Frontend session builder helpers live in `apps/club-vivo/lib/session-builder-api.ts`, `quick-session-*`, `session-builder-context-hints.ts`, `session-origin-hints.ts`, and `builder-session-label.ts`.
- Backend session builder domain logic lives in `services/club-vivo/api/src/domains/session-builder/`.
- Session persistence, feedback, and PDF export support live in `services/club-vivo/api/src/domains/sessions/`.
- Template generation support lives in `services/club-vivo/api/src/domains/templates/`.

## Diagram Rendering

- Frontend diagram display lives in `apps/club-vivo/components/coach/DrillDiagramView.tsx` and `DiagramPlaceholder.tsx`.
- Shared frontend diagram typing lives in `apps/club-vivo/lib/types/drill-diagram-spec.ts`.
- Backend diagram validation lives in `services/club-vivo/api/src/domains/session-builder/diagram-spec-validate.js`.
- `docs/architecture/club-vivo/diagram-sequence-spec-v1.md` is the current proposed DiagramSequence v1 spec for structured diagram and future animation data.
- Current diagram contracts and architecture notes live in `docs/api/diagram-rendering-contract-v1.md`, `docs/architecture/coach-lite/diagram-rendering-architecture.md`, and `docs/architecture/coach-lite/drill-diagram-spec-v1.md`.

## Methodology

- Frontend methodology pages live in `apps/club-vivo/app/(protected)/methodology/`.
- Frontend methodology API helpers live in `apps/club-vivo/lib/methodology-api.ts`.
- Backend methodology handlers and domain logic live in `services/club-vivo/api/methodology/` and `services/club-vivo/api/src/domains/methodology/`.
- Product methodology docs now live under `docs/product/club-vivo/`, especially `methodology.md`, `generation-profiles/`, and `pilots/ksc/program-types-and-methodology.md`.

## Teams

- Frontend team workspace code lives in `apps/club-vivo/app/(protected)/teams/page.tsx`, `apps/club-vivo/components/coach/TeamSelector.tsx`, and `apps/club-vivo/lib/team-api.ts`.
- Backend team handlers and domain logic live in `services/club-vivo/api/teams/` and `services/club-vivo/api/src/domains/teams/`.
- Team API contracts live in `docs/api/team-layer-v1-contract.md`, `team-attendance-v1-contract.md`, and `team-weekly-planning-v1-contract.md`.
- Team architecture docs live in `docs/architecture/team-layer-v1.md` and `attendance-system-v1.md`.

## Auth and Tenancy

- Frontend auth routes and helpers live in `apps/club-vivo/app/login/`, `callback/`, `logout/`, `middleware.ts`, and `apps/club-vivo/lib/auth.ts`, `pkce.ts`, `roles.ts`, `get-current-user*.ts`, and `workspace-local-cookies.ts`.
- Auth Lambdas live in `services/auth/post-confirmation/` and `services/auth/pre-token-generation/`.
- Backend tenant enforcement lives in `services/club-vivo/api/src/platform/tenancy/`.
- Tenancy and auth architecture lives in `docs/architecture/tenancy-model.md`, `tenant-claim-contract.md`, and ADRs `0002`, `0003`, `0005`, `0007`, `0008`, and `0010`.

## Infrastructure

- CDK infrastructure lives in `infra/cdk/`.
- CI workflows live in `.github/workflows/`.
- Operational scripts live in `scripts/`.
- Runbooks live in `docs/runbooks/`.
- Dataset schemas live in `datasets/schemas/exports/v1/`.
- Postman collections and environments live in `postman/`.

## Product Docs

- Active Club Vivo product docs now live under `docs/product/club-vivo/`.
- `docs/product/club-vivo/future/` contains future product planning that is still within the active Club Vivo product-doc tree.
- `docs/product/future/` contains broader future concepts outside the current Club Vivo execution path.
- `docs/product/sic-coach-lite/` is legacy/leftover material and should be reviewed later before any archive/delete decision.
- `docs/vision.md` and `docs/product/README.md` provide broader product orientation.

## API Contracts

- API contracts live in `docs/api/`.
- Export schemas live in `datasets/schemas/exports/v1/`.
- Domain export specification lives in `docs/exports/domain-export-spec-v1.md`.

## Architecture Docs

- Current architecture docs live in `docs/architecture/`.
- `docs/architecture/club-vivo/` is the current Club Vivo architecture area.
- ADRs live in `docs/adr/`.
- `docs/architecture/diagrams/` contains rendered or source diagram notes.
- `docs/architecture/foundations/` contains foundation/source-of-truth material.
- `docs/architecture/coach-lite/` is legacy naming that still contains useful architecture material and should be reviewed and migrated before any archive/delete decision.

## Progress/History Docs

- Progress and historical execution notes live in `docs/progress/`.
- New SIC build history lives in `docs/progress/new-sic/`.
- Weekly notes live in `docs/progress/weekly-progress-notes.md`.

## Future/Parked Material

- Product parking lots and future planning live in `docs/product/club-vivo/future/` and `docs/product/future/`.
- Architecture items that may represent future or cleanup work include `docs/architecture/session-builder-image-assisted-intake-v1.md`, `github-showcase-cleanup-plan.md`, and `fut-soccer-merge-v1.md`.
- Related failure/runbook coverage may exist before the feature is fully active, for example `docs/runbooks/session-builder-image-assisted-intake-v1-failures.md`.

## Local-Only/Generated Material

- Tracked generated or dependency lock files include `package-lock.json` files, `apps/club-vivo/next-env.d.ts`, and generated-style schema/collection artifacts under `datasets/` and `postman/`.
- Local-only material is intentionally not listed by `git ls-files`; check `.gitignore` files at the repo root, `apps/club-vivo/`, and `infra/cdk/` for ignored local outputs such as dependency directories, build outputs, environment files, and CDK output.
- This document does not imply any file should be moved, renamed, archived, or deleted.
