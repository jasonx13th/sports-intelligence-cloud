# Week 18 Closeout Summary

## Overview

Week 18 shipped Image-Assisted Intake v1 as a thin enhancement inside the shared SIC Session Builder workflow.

In plain product terms, coaches can now use one image in two narrow ways:

- `environment_profile`
  - turn one environment image into a draft structured profile, confirm it, and use it for shared session generation
- `setup_to_drill`
  - turn one setup image into a draft structured profile, confirm it, and use it to seed one drill or activity

This week did not create a separate AI app, a separate image-analysis product, or a separate downstream save or export path.

Instead, Week 18 froze the slice on Day 1, shipped the narrow runtime on Day 2, hardened the parser locally during live verification, and added Day 3 architecture, product, failure, demo, and closeout evidence around the verified implementation.

## Week 18 Goal

Add one image-assisted intake path inside the existing Session Builder workflow while preserving:

- the shared Session Builder foundation
- coach confirmation before generation
- tenant-safe server-derived scope
- unchanged downstream save, list, detail, and export behavior
- a tight v1 boundary with no broad AI or chatbot surface

## What Changed

### Day 1 scope lock

Week 18 Day 1 froze the approved image-intake slice in:

- `docs/progress/week_18/week18-day1-scope-lock.md`

Key Day 1 decisions:

- image-assisted intake is a shared Session Builder enhancement
- the only approved v1 modes are:
  - `environment_profile`
  - `setup_to_drill`
- one image per analysis request in v1
- coach confirmation is required before generation
- `setup_to_drill` is limited to one drill or activity seed only
- save, list, detail, and export remain shared and unchanged downstream

### Implementation and deploy path

Week 18 required a narrow implementation and deploy path before the runtime slice could work end to end.

That path was:

1. freeze the v1 contracts and boundaries
2. unblock tenant-scoped image storage on the existing `SessionPacksFn` runtime
3. unblock a narrow Bedrock model call on the same runtime
4. correct the model choice to a vision-capable in-region Bedrock model
5. ship the Day 2 runtime slice inside:
   - `/sessions/new`
   - `POST /session-packs`
6. verify live behavior
7. harden parser normalization locally where real model output exposed bounded gaps
8. add Day 3 architecture, product, runbook, demo, and closeout docs

### Day 2 runtime slice

Week 18 Day 2 shipped the narrow runtime support for image-assisted intake.

Shipped runtime behavior:

- one image upload entry path inside the existing `/sessions/new` flow
- one image-analysis branch on the existing `POST /session-packs` route
- two narrow modes:
  - `environment_profile`
  - `setup_to_drill`
- tenant-scoped image storage under a server-built prefix
- one narrow Bedrock adapter boundary
- deterministic parsing and validation into frozen Week 18 profile shapes
- coach review, edit, and confirmation before generation
- confirmed profile handoff into the shared Session Builder generation path

### Day 3 docs and demo evidence

Week 18 Day 3 added the smallest documentation and evidence slice around the shipped behavior:

- architecture note
- product-scope note
- failure-mode runbook
- Week 18 demo script
- Week 18 closeout summary

## Why It Changed

Week 18 changed the intake step because coaches often know the training environment or drill setup visually faster than they can describe it in structured form.

The feature exists to improve coach input quality inside Session Builder without widening SIC into a separate AI surface.

The product reason for the slice is simple:

- make real-world constraints easier to capture
- keep the coach in control
- preserve the shared downstream Session Builder foundation
- keep the slice narrow, reviewable, and tenant-safe

## What Was Validated

### Real verification evidence

Week 18 verification included both focused test coverage and live checks against the shipped flow.

Confirmed during live verification:

- non-image regression pass
- `environment_profile` pass
- `setup_to_drill` pass
- tenant spoof rejection pass

What those passes proved:

- the existing non-image Session Builder path still works
- `environment_profile` works end to end through draft -> confirm -> shared generation
- `setup_to_drill` works end to end through draft -> confirm -> one drill/activity seed
- spoofed tenant-like input remains rejected

### Focused validation surfaces

Week 18 also validated:

- mode validation
- unsupported mode fail-closed behavior
- parser and validator behavior
- tenant-scoped storage key derivation
- confirmed-profile handoff into generation
- unchanged save, list, detail, and export assumptions

## Live Verification And Parser Hardening

An important Week 18 outcome is that parser-local hardening was discovered during live verification and fixed without widening the frozen contracts.

This did not change the product boundary.
It tightened the existing bounded parser behavior so real Bedrock draft output could normalize safely into the approved contracts.

Environment-profile hardening discovered during live checks included:

- `surfaceType`
- `spaceSize`
- `boundaryType`
- `constraints`
- `safetyNotes`
- `assumptions`
- `analysisConfidence`

Setup-to-drill hardening discovered during live checks included:

- `layoutType`
- `constraints`
- `assumptions`

Why this matters:

- the parser stayed deterministic
- unsupported or ambiguous values still fail closed
- the contract did not widen
- the fixes were local hardening, not a redesign

## How To Validate It

The smallest real validation path for Week 18 is:

1. run the existing non-image Session Builder flow and confirm it still works
2. in `/sessions/new`, upload one environment image
3. confirm a draft `environment_profile` returns
4. review or edit the draft
5. confirm the draft
6. generate a session from the confirmed profile
7. save the generated result and optionally export it
8. repeat with one setup image using `setup_to_drill`
9. confirm generation produces one drill or activity seed path, not a full-session rewrite
10. run one negative tenant spoof check and confirm it fails closed

Supporting evidence now exists in:

- `docs/runbooks/session-builder-image-assisted-intake-v1-failures.md`
- `docs/progress/week_18/demo-script.md`

## Tenancy And Security Confirmation

Week 18 stayed aligned with SIC's non-negotiables.

Confirmed:

- tenant scope remains server-derived from verified auth plus authoritative entitlements
- `tenant_id`, `tenantId`, and `x-tenant-id` remain forbidden from client input
- tenant spoof rejection was validated live
- image storage remains tenant-scoped by server-built key derivation
- no request-derived tenant scope is accepted
- no scan-then-filter pattern was introduced
- no auth-boundary change was introduced
- no tenancy-boundary change was introduced
- no entitlements-model change was introduced

## Observability Note

Week 18 remained intentionally narrow and real on observability.

Current evidence surfaces are:

- focused tests around the Day 2 runtime slice
- existing route-level logging
- Week 18 architecture, product, failure, demo, and closeout docs

Current Week 18 route-level image-intake events include:

- `session_image_analysis_success`
- `session_image_analysis_failure`
- `session_image_profile_confirmed`

No broader observability subsystem, dashboard, or alarm surface was added in this slice.

## Cost Note

Week 18 kept cost guardrails explicit and narrow.

Current cost controls:

- one image per analysis request
- one narrow Bedrock model boundary
- two fixed analysis modes only
- confirmation before generation
- deterministic parsing and validation before shared generation

This keeps the slice useful without expanding into a generic analyze-anything or chat-heavy surface.

## Product Impact

Week 18 gives SIC Coach Lite a more practical intake step without changing the shared Session Builder foundation.

A coach can now:

- use one environment image to improve session input quality
- use one setup image to seed one drill or activity
- review and edit model output before using it
- stay inside the same app and same session workflow
- keep using the same downstream save and export behavior

That is a meaningful product improvement while still keeping the slice thin, tenant-safe, and grounded in shipped behavior.

## Explicit V1 Limitations

The current v1 limitations are intentional and documented:

- one image per analysis request only
- two fixed modes only:
  - `environment_profile`
  - `setup_to_drill`
- no separate AI app or image-analysis product
- no chatbot or broad conversational AI layer
- no multi-image comparison
- no video intake
- no direct generation from unconfirmed output
- `setup_to_drill` is limited to one drill or activity seed only
- save, list, detail, and export remain unchanged downstream

## Evidence Created

Key Week 18 artifacts now include:

- `docs/progress/week_18/week18-day1-scope-lock.md`
- `docs/architecture/session-builder-image-assisted-intake-v1.md`
- `docs/product/sic-coach-lite/image-assisted-intake-v1-scope.md`
- `docs/runbooks/session-builder-image-assisted-intake-v1-failures.md`
- `docs/progress/week_18/demo-script.md`
- `docs/progress/week_18/closeout-summary.md`

## Next Step Into Week 19

The recommended next step is to start Week 19 with a plan-only pass and keep the next slice as disciplined as Week 18.

Week 19 should build on the shipped Week 18 foundation rather than widen it abruptly.

The safest entry point is:

- improve the confirmed-profile experience, validation clarity, or narrow observability around the shipped image-intake flow

The next step should not assume:

- a separate AI product
- a broader chatbot surface
- auth redesign
- tenancy redesign
- entitlements redesign
- save/export redesign
