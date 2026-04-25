# New SIC Starting Point Plan

## Why This Exists

SIC is moving away from week-based work and into a cleaner product, architecture, and repo organization phase.

Week-based progress notes remain useful historical evidence, but the next phase needs a clearer starting point for the active platform, the Club Vivo product surface, and GitHub presentation. This plan captures how SIC should continue after Week 21 and the first GitHub showcase cleanup checkpoint.

## Current State

- Week 21 was merged into `main`.
- The GitHub showcase cleanup checkpoint was completed.
- Product docs were reorganized from `docs/product/sic-coach-lite` to `docs/product/club-vivo`.
- KSC is now treated as pilot context under `docs/product/club-vivo/pilots/ksc`.
- Future and parked docs now live under `docs/product/club-vivo/future`.
- Generation profile docs now live under `docs/product/club-vivo/generation-profiles`.
- Major README coverage was added across docs, apps, services, infra, scripts, and datasets.
- The root `README.md` was refreshed to present SIC and Club Vivo more clearly.

## New Organizing Principle

- SIC is the platform.
- Club Vivo is the current coach-facing app and product surface.
- KSC is the first pilot/test club, not the product identity.
- `docs/progress` remains historical and progress evidence.
- Source-of-truth docs are living documents. They are not frozen forever, but changes should be deliberate, reviewed, and traceable.

## Planned Next Phases

1. Phase 1: review GitHub main after cleanup.
2. Phase 2: decide what to do with `docs/progress` historical history.
3. Phase 3: review preview/demo routes.
4. Phase 4: review README-only future app folders.
5. Phase 5: review unwired backend, lake, and export folders.
6. Phase 6: create visual architecture diagrams in Miro and draw.io.
7. Phase 7: continue product/runtime work from the new clean baseline.

## Guardrails

- No auth, tenancy, entitlements, IAM, or CDK changes without an explicit architecture decision.
- No client-supplied `tenant_id`, `tenantId`, or `x-tenant-id`.
- No separate KSC app.
- No separate admin app unless explicitly approved.
- Quick Session remains a shared-app lane, not a separate backend product.
- Future and parked docs must not be described as shipped runtime behavior.

## Immediate Next Decision

The next human decision is whether `docs/progress` should remain in GitHub main, be archived, or be summarized and reduced.
