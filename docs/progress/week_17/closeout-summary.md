# Week 17 Closeout Summary

## Overview

Week 17 shipped Fut-Soccer Merge v1 as a thin extension of the existing SIC Session Builder foundation.

This week did not create a separate Fut-Soccer product stack.
Instead, it froze the merge shape on Day 1, shipped the narrow runtime slice on Day 2, and added Day 3 architecture, product, and demo evidence around the already verified implementation.

## Week 17 goal

Merge Fut-Soccer into SIC as a first-class coaching flow on top of Session Builder while preserving:

- canonical `sport = "soccer"`
- the shared Session Builder foundation
- the same save, list, detail, and export path
- tenant-safe platform rules
- a tight v1 boundary with no futsal behavior

## What shipped

### Day 1 scope lock

Week 17 Day 1 froze the approved merge shape in:

- `docs/progress/week_17/week17-day1-scope-lock.md`

Key Day 1 decisions:

- Fut-Soccer is both a backend/domain sport pack and a Club Vivo product flavor
- canonical representation is:
  - `sport = "soccer"`
  - `sportPackId = "fut-soccer"`
- Fut-Soccer must not be modeled as `sport = "fut-soccer"`
- futsal remains unresolved and out of scope
- save, list, detail, and export remain shared

### Day 2 runtime slice

Week 17 Day 2 shipped the narrow runtime support for Fut-Soccer-biased generation.

Shipped runtime behavior:

- `POST /session-packs` accepts optional `sportPackId`
- the only supported v1 sport-pack combination is:
  - `sport = "soccer"`
  - `sportPackId = "fut-soccer"`
- standard soccer generation remains valid with omitted `sportPackId`
- deterministic Fut-Soccer bias applies only in the shared Session Builder generation path
- the existing `/sessions/new` flow offers `Soccer` and `Fut-Soccer`
- save, list, detail, and export remain unchanged
- futsal does not appear in UI or runtime behavior

### Day 3 docs and demo evidence

Week 17 Day 3 added the smallest documentation and evidence slice around the shipped behavior:

- architecture note for the current merge shape
- product-scope note for Fut-Soccer in Coach Lite v1
- Week 17 demo script
- Week 17 closeout summary

Day 3 did not change runtime code because no approved-scope mismatch was found in the verified Day 2 implementation.

Important Week 17 product note:

- Week 17 solves the architecture merge safely, but it does not represent the final intended coach UX
- the visible `Soccer` / `Fut-Soccer` selector is a bridge slice
- future work should absorb Fut-Soccer more invisibly into a soccer-first assistant flow rather than keep a permanent visible product split

## What was validated

### Focused runtime checks already verified

The Week 17 Day 2 runtime slice was already verified before Day 3 closeout.

Focused tests covered:

- valid omitted `sportPackId`
- valid `sport = "soccer"` with `sportPackId = "fut-soccer"`
- rejected unsupported `sportPackId`
- rejected mismatched `sport` and `sportPackId`
- deterministic Fut-Soccer passing bias
- deterministic Fut-Soccer pressing bias
- preserved public `POST /session-packs` response shape
- unchanged downstream save behavior

### Day 3 documentation checks

Day 3 documentation work confirms:

- architecture note lives under `docs/architecture/`
- product-scope note lives under `docs/product/sic-coach-lite/`
- demo script and closeout live under `docs/progress/week_17/`
- wording stays aligned to the shipped Week 17 behavior

## Key product decisions

### 1. Fut-Soccer is a bias, not a separate sport

Week 17 explicitly keeps:

- canonical `sport = "soccer"`

Fut-Soccer is introduced only as:

- `sportPackId = "fut-soccer"` on generation

This keeps the product soccer-first while still exposing a distinct coached flavor.

### 2. Generation path first, save path unchanged

Week 17 deliberately keeps `sportPackId` generation-only in v1.

That means:

- `POST /session-packs` is the only widened request surface
- `POST /sessions` remains unchanged
- saved sessions remain canonically `sport = "soccer"`

### 3. Futsal remains out of scope

Week 17 does not infer or invent futsal behavior.

Not shipped:

- futsal selection
- futsal templates
- futsal defaults
- futsal validation rules

### 4. Shared Session Builder foundation stays intact

Week 17 keeps one shared foundation for:

- app flow
- generation
- save
- list
- detail
- export

No separate Fut-Soccer stack was introduced.

## Tenancy and security confirmation

Week 17 stayed aligned with SIC's non-negotiables.

Confirmed:

- tenant scope remains server-derived from verified auth plus authoritative entitlements
- `tenant_id`, `tenantId`, and `x-tenant-id` remain forbidden from client input
- no request-derived tenant scope is accepted
- no scan-then-filter pattern was introduced
- no auth-boundary change was introduced
- no tenancy-boundary change was introduced
- no entitlements-model change was introduced
- no separate Fut-Soccer tenancy or persistence path was introduced

## Observability note

Week 17 remained intentionally minimal and real on observability.

Current evidence surfaces are:

- focused validator, template, pipeline, and handler tests for the Day 2 slice
- existing route-level logging
- the Day 3 architecture, product, demo, and closeout docs

No new dashboards, alarms, or metric filters were added for this slice.

## Architecture summary

Week 17 currently consists of:

- one shared Club Vivo session creation flow
- one shared `POST /session-packs` route with optional generation-only `sportPackId`
- one shared `POST /sessions` save path
- one shared session list path
- one shared session detail path
- one shared PDF export path

The effective runtime rule is:

- standard soccer remains the default path
- Fut-Soccer adds a deterministic generation bias for the approved v1 example paths
- saved sessions remain plain soccer sessions downstream

## Demo evidence prepared

The Week 17 demo script now covers:

1. the shared `/sessions/new` entry point
2. the standard Soccer flow
3. unchanged save/list/detail/export behavior for Soccer
4. the Fut-Soccer passing flow
5. the Fut-Soccer pressing flow
6. unchanged save/list/detail/export behavior for a Fut-Soccer-generated session
7. explicit confirmation that no `Futsal` option appears

## Evidence created

Key Week 17 artifacts now include:

- `docs/progress/week_17/week17-day1-scope-lock.md`
- `docs/architecture/fut-soccer-merge-v1.md`
- `docs/product/sic-coach-lite/fut-soccer-scope-v1.md`
- `docs/progress/week_17/demo-script.md`
- `docs/progress/week_17/closeout-summary.md`

## Explicit v1 limitation

The current v1 limitation is intentional and documented:

- `sportPackId` is generation-only in v1
- saved sessions remain canonically `sport = "soccer"`
- `sportPackId` is not persisted through save/list/detail/export in this slice

## What remains deferred

Still out of scope after Week 17:

- futsal behavior
- futsal UI selection
- futsal templates and validation
- persisted `sportPackId`
- save-route widening
- tenant-configured Fut-Soccer defaults
- separate Fut-Soccer stack or storage model
- broader multi-sport redesign
- infra, IAM, CDK, auth, tenancy, or entitlements expansion

## Product impact

Week 17 gives SIC Coach Lite a more specific soccer coaching path without breaking the current product foundation.

A coach can now:

- generate standard soccer sessions
- generate Fut-Soccer-biased sessions
- stay inside the same app and same session workflow
- keep using the same save, list, detail, and export surfaces

That is a meaningful product expansion while still keeping the slice thin, tenant-safe, and grounded in the shipped implementation.
