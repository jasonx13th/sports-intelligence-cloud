# New SIC Closeout Summary 3

## Theme

GitHub main cleanup, active Club Vivo focus, and unwired backend/export/lake audit.

## Completed In This Checkpoint

- Detailed week-by-week progress history was removed from GitHub `main`.
- Concise progress summaries remain in `main`.
- Full detailed history remains preserved in the archive branch/tag.
- README-only future app folders were moved out of `apps/`.
- Ruta Viva and Athlete Evolution AI were preserved under `docs/product/future/`.
- Coach Lite preview route was audited and removed from the active Club Vivo app tree.
- Coach Lite architecture docs were kept for future migration or relabeling.
- Backend/export/lake folders were audited.
- `clubs`, `memberships`, `exports-domain`, `lake-ingest`, and `lake-etl` were labeled as not currently CDK-wired.
- Budget discipline was clarified: keep unused AWS resources unwired until needed and approved.
- Current `main` remains focused on active Club Vivo runtime.

## Current GitHub Main Shape

GitHub `main` now focuses on:

- `apps/club-vivo`
- `services/club-vivo/api` active wired routes
- `services/auth`
- `infra/cdk`
- `docs/api`
- `docs/architecture`
- `docs/product/club-vivo`
- `docs/product/future`
- `docs/progress` concise summaries and `new-sic` notes
- scripts, datasets, and Postman only where still useful

## What Stayed Protected

- Runtime behavior
- Backend behavior
- Infrastructure
- API contracts
- Auth
- Tenancy
- Entitlements
- IAM/CDK
- Tenant-safety guardrails

The only app runtime cleanup in this checkpoint was removing the obsolete isolated Coach Lite preview route.

## Archive Safety

Detailed historical files removed from `main` remain preserved by:

- branch: `archive/pre-showcase-cleanup`
- tag: `pre-showcase-cleanup-2026-04-25`

## Remaining Cleanup Targets

- Coach Lite architecture docs migration/relabeling
- Postman and datasets review
- Export/lake docs and runbooks review
- Decide whether clubs/memberships should become active future domain work or stay parked
- Final visual architecture diagrams in Miro/draw.io
- Final GitHub README polish if needed

## Recommended Next Step

The next session should start by reviewing Coach Lite architecture docs and migrating useful decisions into current Club Vivo/platform docs before archiving the old Coach Lite architecture folder.

## Closing Note

SIC now has a cleaner GitHub `main` and a stronger active-product story around Club Vivo, while preserving future ideas and historical detail safely.
