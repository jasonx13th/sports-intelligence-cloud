# SIC Repo Structure

This document defines the current repository layout for Sports Intelligence Cloud and where new files should live.

It is the canonical placement guide for tracked repo content.

When in doubt:
1. choose the narrowest existing folder that fits
2. prefer updating an existing file over creating a parallel file
3. avoid creating new top-level folders unless there is a clear reason

---

## Goals of this structure

The SIC repo should stay:

- product-first
- architecture-strong
- easy to navigate
- safe for multi-tenant work
- friendly to small, reviewable diffs

The structure should make it obvious:

- where app code lives
- where backend code lives
- where infra lives
- where tracked docs live
- where local-only material belongs

---

## Top-level layout

```text
.
├── .github/
├── apps/
├── datasets/
├── docs/
├── infra/
├── postman/
├── scripts/
├── services/
├── README.md
├── Makefile
├── .gitignore
└── .gitattributes
```

### Top-level folder meanings

- `.github/` -> tracked repo automation and AI/repo guidance
- `apps/` -> user-facing applications
- `services/` -> backend services and auth lambdas
- `infra/` -> infrastructure as code
- `docs/` -> tracked human-readable documentation
- `datasets/` -> machine-readable schemas and dataset artifacts
- `postman/` -> Postman assets and workflow docs
- `scripts/` -> repo utility scripts

---

## Applications

### `apps/club-vivo/`

Primary active coach-facing web application.

Use this for:
- Next.js routes
- UI components
- shared client utilities
- frontend session builder flows

Placement rules:
- shared UI components -> `apps/club-vivo/components/`
- shared client helpers and API utilities -> `apps/club-vivo/lib/`
- route-local helper files may stay inside a route folder when only used there

Examples:
- `apps/club-vivo/components/coach/`
- `apps/club-vivo/lib/session-builder-api.ts`
- `apps/club-vivo/app/(protected)/sessions/new/session-new-flow.tsx`

### `apps/athlete-evolution-ai/`

Reserved app area. Currently placeholder-level.

### `apps/ruta-viva/`

Reserved app area. Currently placeholder-level.

Do not expand placeholder apps unless the work is intentionally starting there.

---

## Services

### `services/club-vivo/api/`

Primary backend API service.

Structure:

```text
services/club-vivo/api/
├── athletes/
├── clubs/
├── exports-domain/
├── lake-etl/
├── lake-ingest/
├── me/
├── memberships/
├── methodology/
├── session-packs/
├── sessions/
├── teams/
├── templates/
├── src/
│   ├── domains/
│   └── platform/
└── _testHelpers/
```

#### Route entrypoints

Top-level route folders contain handler entrypoints.

Examples:
- `services/club-vivo/api/athletes/handler.js`
- `services/club-vivo/api/sessions/handler.js`
- `services/club-vivo/api/session-packs/handler.js`
- `services/club-vivo/api/teams/handler.js`
- `services/club-vivo/api/methodology/handler.js`

Keep handlers thin.

#### Shared backend platform code

Cross-cutting backend code lives in:

- `services/club-vivo/api/src/platform/tenancy/`
- `services/club-vivo/api/src/platform/http/`
- `services/club-vivo/api/src/platform/logging/`
- `services/club-vivo/api/src/platform/errors/`
- `services/club-vivo/api/src/platform/validation/`
- `services/club-vivo/api/src/platform/storage/`
- `services/club-vivo/api/src/platform/bedrock/`

Use `src/platform/` for:
- tenant context
- request wrapper logic
- parsing
- validation helpers
- logging
- shared platform errors
- shared storage adapters
- platform-owned external service adapters

Do not create new generic `_lib` folders.

#### Domain-owned backend logic

Business logic lives in:

- `services/club-vivo/api/src/domains/athletes/`
- `services/club-vivo/api/src/domains/clubs/`
- `services/club-vivo/api/src/domains/memberships/`
- `services/club-vivo/api/src/domains/methodology/`
- `services/club-vivo/api/src/domains/session-builder/`
- `services/club-vivo/api/src/domains/sessions/`
- `services/club-vivo/api/src/domains/teams/`
- `services/club-vivo/api/src/domains/templates/`

Use `src/domains/<domain>/` for:
- repositories
- validation tied to a domain
- generation pipelines
- domain-specific persistence logic
- domain-owned PDF/output helpers when they clearly belong to that domain

Examples:
- `src/domains/session-builder/session-builder-pipeline.js`
- `src/domains/session-builder/session-pack-validate.js`
- `src/domains/sessions/session-repository.js`
- `src/domains/sessions/pdf/session-pdf.js`
- `src/domains/teams/team-repository.js`
- `src/domains/methodology/methodology-service.js`

#### Test helpers

Shared service-local test helpers belong in:

- `services/club-vivo/api/_testHelpers/`

This is acceptable because it is specific to test support, not a catch-all production library.

### `services/auth/`

Auth-related lambdas live here.

Current structure:
- `services/auth/post-confirmation/`
- `services/auth/pre-token-generation/`

Keep each auth lambda in its own folder.

---

## Infrastructure

### `infra/cdk/`

Tracked infrastructure as code for SIC.

Use this for:
- CDK entrypoints in `bin/`
- stack definitions in `lib/`
- CDK config files
- tracked infra README and package metadata

Keep generated and local-only artifacts out of tracked source structure.

Tracked source shape should stay roughly like:

```text
infra/cdk/
├── bin/
├── lib/
├── cdk.json
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

### Local-only infra artifacts

Local operator artifacts belong in:

- `infra/cdk/.local/`

Examples:
- temporary DynamoDB lookup payloads
- local backups
- local CloudWatch export files

These should stay ignored and should not become tracked repo truth.

---

## Documentation

### `docs/api/`

API contracts and API-facing behavior.

Use this for:
- endpoint contracts
- request and response behavior
- platform error behavior
- API-facing rendering contracts
- human-readable API guidance

Examples:
- `docs/api/session-builder-v1-contract.md`
- `docs/api/session-pack-contract-v2.md`
- `docs/api/training-brief-v1-contract.md`
- `docs/api/diagram-rendering-contract-v1.md`
- `docs/api/platform-error-contract.md`
- `docs/api/error-handling.md`

Proposed contracts must be clearly labeled as proposed or not shipped runtime behavior when applicable.

### `docs/architecture/`

Platform and system architecture.

Use this for:
- architecture rules
- repo structure
- platform overviews
- tenancy model
- observability architecture
- system diagrams
- implementation architecture notes
- source maps and architecture placement guidance

Examples:
- `docs/architecture/architecture-principles.md`
- `docs/architecture/platform-constitution.md`
- `docs/architecture/platform-overview.md`
- `docs/architecture/repo-structure.md`
- `docs/architecture/club-vivo-source-map.md`

#### `docs/architecture/club-vivo/`

Current Club Vivo architecture area.

Use this for current Club Vivo architecture specs that are broader than one API contract or product doc.

Examples:
- `docs/architecture/club-vivo/diagram-sequence-spec-v1.md`

Use this folder for:
- current Club Vivo architecture specs
- diagram and rendering architecture that belongs to the active Club Vivo direction
- current architecture notes that support Session Builder, Training Prescription, teams, methodology, and diagram rendering

Do not use this folder for product scope docs. Product scope belongs under `docs/product/club-vivo/`.

#### `docs/architecture/coach-lite/`

Legacy naming that still contains useful architecture material.

This folder may contain durable ideas about:
- generation flow
- rendering architecture
- drill diagram specs
- tenant-safe methodology knowledge

Do not add new Club Vivo architecture here unless the work is explicitly a historical migration note.

Before archive or delete decisions:
1. review the useful material
2. migrate durable decisions into current Club Vivo or platform architecture docs
3. update references
4. validate that no active docs depend on the old path

### `docs/product/`

Product-specific tracked docs.

Use this for:
- product overviews
- scope docs
- user flows
- product roadmaps
- product specifications

Current product area:
- `docs/product/club-vivo/`

Use `docs/product/club-vivo/` for active Club Vivo product direction and product source-of-truth docs.

Examples:
- `docs/product/club-vivo/README.md`
- `docs/product/club-vivo/session-builder.md`
- `docs/product/club-vivo/coach-workspace.md`
- `docs/product/club-vivo/training-prescription-layer.md`
- `docs/product/club-vivo/session-generation-quality-standards.md`
- `docs/product/club-vivo/coaching-session-design-standard.md`
- `docs/product/club-vivo/methodology.md`

#### `docs/product/club-vivo/future/`

Use this for future or parked Club Vivo product planning that remains connected to the current Club Vivo product tree.

Future files must be clearly labeled as future or parked when they are not shipped behavior.

#### `docs/product/future/`

Use this for broader SIC future concepts outside the current Club Vivo execution path.

Examples:
- `docs/product/future/athlete-evolution-ai.md`
- `docs/product/future/ruta-viva.md`

#### `docs/product/sic-coach-lite/`

Legacy or leftover product material.

Do not add new active product docs here.

Before archive or delete decisions:
1. review whether the material has been migrated into `docs/product/club-vivo/`
2. update references
3. keep useful historical notes only if they explain past decisions

### `docs/adr/`

Architecture decision records.

Use this for:
- meaningful architectural decisions
- approved structural changes
- tenancy or auth decisions
- repository/data-access boundary decisions
- proposed direction decisions that affect long-lived architecture boundaries

Examples:
- `docs/adr/ADR-0011-soccer-only-training-prescription-layer.md`

### `docs/runbooks/`

Operational runbooks and support procedures.

Use this for:
- alarms
- triage
- incident response
- release hygiene
- smoke test operations
- operator procedures

Do not place week-specific demo scripts here if they are really historical build artifacts.

### `docs/exports/`

Human-readable export specs.

Use this for:
- export contracts
- export format specs
- export behavior docs

### `docs/progress/`

Build history, weekly work, closeouts, and long-running progress references.

Current cleaned progress structure includes:

```text
docs/progress/
├── README.md
├── architect-process-summary.md
├── new-sic/
└── weekly-progress-notes.md
```

Use this for:
- build history
- closeout summaries
- execution notes
- progress audits
- source-of-truth branch closeouts

Current New SIC closeouts live under:

- `docs/progress/new-sic/`

Keep historical notes historical. Do not rewrite old notes just to modernize past file paths unless there is a strong reason.

---

## Datasets

### `datasets/schemas/exports/v1/`

Machine-readable export schemas.

Use this for:
- JSON schemas
- versioned machine-readable export definitions

Keep machine-readable schemas here, not under `docs/`.

---

## Postman

### `postman/`

Postman assets and usage guidance.

Use this for:
- collections
- environments
- Postman workflow documentation

Current guidance doc:
- `postman/README.md`

Do not place Postman workflow docs under `docs/api/` unless they are truly API contract docs rather than tooling workflow docs.

---

## Scripts

### `scripts/`

Repo utility scripts.

Current example:
- `scripts/smoke/smoke.mjs`

Use this for:
- repo tooling
- validation helpers
- smoke and operational helper scripts

---

## GitHub repo guidance

### `.github/`

Tracked repository automation and repo-level AI guidance.

Current example:
- `.github/copilot-instructions.md`

Use this for:
- workflow automation
- repo-level assistant guidance that should be tracked
- shared repository guardrails

Do not put private, machine-specific, or personal workflow notes here.
Those belong in `.workspace/`.

## Naming rules

### Tracked docs

Prefer lowercase kebab-case file names.

Examples:
- `architecture-principles.md`
- `closeout-summary.md`
- `demo-script.md`
- `training-prescription-layer.md`
- `training-brief-v1-contract.md`
- `diagram-sequence-spec-v1.md`

Avoid:
- mixed case doc names
- apostrophes in folder names
- ad hoc names like `Day_01.md`
- generic names that do not explain purpose

### Week folders

Use padded week numbering when week folders are used:
- `week_00`
- `week_01`
- `week_02`

Not:
- `week_0`
- `week_1`

### Catch-all folders

Avoid generic production folders like:
- `_lib`
- `misc`
- `helpers` at repo level

Prefer the narrowest correct existing folder.

---

## Local-only material

Local-only helper material belongs outside tracked repo truth, primarily under:

- `.workspace/`
- `infra/cdk/.local/`

Examples:
- AI helper notes
- scratch files
- repo exports
- machine-specific working material
- temporary operator artifacts

Do not treat local-only files as canonical SIC documentation.

---

## Anti-patterns to avoid

- creating new generic `_lib` folders
- inventing parallel folder structures when a correct folder already exists
- placing product docs under architecture folders
- placing local-only notes in tracked docs
- putting operator artifacts beside tracked infra source
- keeping empty placeholder folders around after migration
- creating one-file top-level documentation categories without a strong reason
- adding new active Club Vivo product docs under legacy `sic-coach-lite` paths
- adding new active Club Vivo architecture docs under legacy `coach-lite` paths

---

## Placement decision rule

When deciding where a file should live, use this order:

1. Is there already a clear existing folder for this exact purpose?
2. Is this tracked repo truth or local-only helper material?
3. Is this product, architecture, API, runbook, or progress history?
4. Can this stay route-local or domain-local instead of becoming global?
5. Is the new location more specific and easier to understand than the old one?

If the answer is still unclear, choose the narrowest existing folder and keep the diff small.
