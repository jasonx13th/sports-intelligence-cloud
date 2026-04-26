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
- `apps/club-vivo/app/sessions/new/session-new-flow.tsx`

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
├── session-packs/
├── sessions/
├── teams/
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

Keep handlers thin.

#### Shared backend platform code
Cross-cutting backend code lives in:

- `services/club-vivo/api/src/platform/tenancy/`
- `services/club-vivo/api/src/platform/http/`
- `services/club-vivo/api/src/platform/logging/`
- `services/club-vivo/api/src/platform/errors/`
- `services/club-vivo/api/src/platform/validation/`

Use `src/platform/` for:
- tenant context
- request wrapper logic
- parsing
- validation helpers
- logging
- shared platform errors

Do not create new generic `_lib` folders.

#### Domain-owned backend logic
Business logic lives in:

- `services/club-vivo/api/src/domains/athletes/`
- `services/club-vivo/api/src/domains/clubs/`
- `services/club-vivo/api/src/domains/memberships/`
- `services/club-vivo/api/src/domains/session-builder/`
- `services/club-vivo/api/src/domains/sessions/`
- `services/club-vivo/api/src/domains/teams/`

Use `src/domains/<domain>/` for:
- repositories
- validation tied to a domain
- generation pipelines
- domain-specific persistence logic
- domain-owned PDF/output helpers when they clearly belong to that domain

Examples:
- `src/domains/session-builder/session-builder-pipeline.js`
- `src/domains/sessions/session-repository.js`
- `src/domains/sessions/pdf/session-pdf.js`

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
- `docs/api/platform-error-contract.md`
- `docs/api/error-handling.md`

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

Examples:
- `docs/architecture/architecture-principles.md`
- `docs/architecture/platform-constitution.md`
- `docs/architecture/platform-overview.md`
- `docs/architecture/repo-structure.md`

#### `docs/architecture/coach-lite/`
Use this only for Coach Lite architecture material, not product scope docs.

Examples:
- generation flow
- rendering architecture
- diagram spec
- tenant-safe methodology knowledge

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

### `docs/adr/`
Architecture decision records.

Use this for:
- meaningful architectural decisions
- approved structural changes
- tenancy or auth decisions
- repository/data-access boundary decisions

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
Concise progress summaries and New SIC cleanup notes.

Structure:

```text
docs/progress/
├── README.md
├── architect-process-summary.md
├── weekly-progress-notes.md
└── new-sic/
```

#### Progress placement rules
- GitHub-facing progress history should stay concise.
- Use `docs/progress/weekly-progress-notes.md` for the public week-by-week summary.
- Use `docs/progress/architect-process-summary.md` for the public architecture/process summary.
- Use `docs/progress/new-sic/` for cleanup plans, audits, and closeouts.

Detailed historical progress files are preserved in the archive branch/tag listed in `docs/progress/README.md`, not in GitHub `main`.

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

Avoid:
- mixed case doc names
- apostrophes in folder names
- ad hoc names like `Day_01.md`
- generic names that do not explain purpose

### Progress summaries
Keep progress summaries lowercase and descriptive.

Examples:
- `weekly-progress-notes.md`
- `architect-process-summary.md`

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

---

## Placement decision rule

When deciding where a file should live, use this order:

1. Is there already a clear existing folder for this exact purpose?
2. Is this tracked repo truth or local-only helper material?
3. Is this product, architecture, API, runbook, or progress history?
4. Can this stay route-local or domain-local instead of becoming global?
5. Is the new location more specific and easier to understand than the old one?

If the answer is still unclear, choose the narrowest existing folder and keep the diff small.
