# SIC Copilot Instructions

This file is tracked repository guidance for AI coding assistance in Sports Intelligence Cloud.

When there is any conflict, follow the tracked SIC docs first.

Primary tracked references:
- `docs/architecture/architecture-principles.md`
- `docs/architecture/platform-constitution.md`
- `docs/architecture/tenant-claim-contract.md`
- `docs/architecture/repo-structure.md`
- `docs/vision.md`

Supporting references:
- `README.md`
- `postman/README.md`
- `docs/progress/README.md`

## Repo structure rules

Match the current SIC repo structure exactly.

### Top-level
- `apps/` -> user-facing applications
- `services/` -> backend services and auth lambdas
- `infra/` -> infrastructure as code
- `docs/` -> tracked human-readable documentation
- `datasets/` -> machine-readable schemas and dataset artifacts
- `postman/` -> Postman collections, environments, and workflow docs
- `scripts/` -> repo utility scripts

### Backend placement
- shared platform code -> `services/club-vivo/api/src/platform/`
- domain-owned business logic -> `services/club-vivo/api/src/domains/<domain>/`
- route entrypoints -> top-level handler folders under `services/club-vivo/api/`
- auth lambdas -> `services/auth/<lambda-name>/`
- do not create new generic `_lib` folders
- do not create new top-level folders unless explicitly asked

### Frontend placement
- active coach web app -> `apps/club-vivo/`
- shared components -> `apps/club-vivo/components/`
- shared client utilities and API helpers -> `apps/club-vivo/lib/`
- route-local helper files may stay inside a route folder when only used there

### Documentation placement
- API contracts and API-facing behavior -> `docs/api/`
- platform and system architecture -> `docs/architecture/`
- product docs -> `docs/product/`
- ADRs -> `docs/adr/`
- runbooks -> `docs/runbooks/`
- export specs -> `docs/exports/`
- build history and weekly notes -> `docs/progress/`

### Progress doc placement
- padded week folders only: `week_00`, `week_01`, `week_12`
- weekly closeouts -> `closeout-summary.md`
- week demo walkthroughs -> `demo-script.md`
- progress Q and A material -> `docs/progress/qa/`
- long-running roadmap and architect log -> `docs/progress/build-progress/`

### Tooling docs placement
- Postman workflow doc -> `postman/README.md`
- local-only helper material -> `.workspace/`
- do not treat `.workspace/` files as tracked repo truth

## Safety rules

Always preserve these:

- never accept `tenant_id` or `tenantId` from body, query, or headers
- never trust `x-tenant-id`
- tenant scope must come from verified auth and server-side entitlements
- keep fail-closed behavior intact
- keep tenant-scoped access by construction
- avoid scan-then-filter tenancy patterns
- do not weaken validation, auth, or observability

## Working style

- prefer small, safe diffs
- keep handlers thin
- prefer explicit code over clever code
- preserve existing contracts unless asked to change them
- update docs when structure, behavior, or file placement changes meaningfully

## Avoid

- inventing new architecture without instruction
- creating duplicate docs for the same concept
- moving many files without a clear reason
- placing local-only notes outside `.workspace/`
