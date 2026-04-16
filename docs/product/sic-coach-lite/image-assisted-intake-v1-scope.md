# Image-Assisted Intake v1 Scope

## Purpose

This note defines the Week 18 Day 3 product scope for image-assisted intake v1 inside SIC Session Builder.

It explains what Week 18 adds, what it does not add, and which boundaries keep the feature narrow, reviewable, and aligned with the shared Session Builder core.

## What Week 18 Adds

Week 18 adds one practical image-assisted intake layer inside the existing Session Builder workflow.

In product terms, that means coaches can now use one uploaded image in two narrow ways:

- `environment_profile`
  - turn one environment image into a draft structured profile of the current training space
- `setup_to_drill`
  - turn one setup image into a draft structured profile that can seed one drill or activity

The point of this feature is to improve coach input quality before generation.

It helps the coach move from:

- incomplete or hard-to-describe real-world constraints

to:

- a structured draft profile that can be reviewed and then used inside the shared Session Builder flow

## What Week 18 Does Not Add

Week 18 does not add:

- a separate AI app
- a separate image-analysis product
- a chatbot rebuild
- a broad conversational AI surface
- a new save flow
- a new list flow
- a new detail flow
- a new export flow
- multi-image analysis
- video intake
- full-session generation directly from raw setup-image output

This remains one thin Session Builder enhancement, not a product fork.

## Why Image-Assisted Intake Exists

Image-assisted intake exists to improve the quality of coach-provided input inside Session Builder.

It is useful when:

- the coach can show the available space faster than they can describe it
- the coach wants help capturing visible equipment and constraints
- the coach has a real setup already laid out and wants to seed one drill from it

The feature does not replace Session Builder.
It improves the intake step that feeds Session Builder.

## Why Coach Confirmation Is Required

Coach confirmation is required because model output is not authoritative on first return.

The product rule is:

- image analysis returns a draft profile
- the coach may review and edit that draft
- only a confirmed profile may be used for generation

This protects product quality in a simple way:

- the coach stays in control
- ambiguous or incomplete model output does not silently become generation input
- the system does not auto-generate from raw model output

## Why Outputs Stay Structured And Validated

Week 18 outputs stay structured, validated, and fail-closed on purpose.

This means:

- output must fit the frozen Week 18 v1 profile shape
- output is not accepted as freeform text
- safe normalizations may be applied for known variants
- unsupported or ambiguous output does not widen the contract
- invalid output fails closed instead of silently becoming new behavior

This keeps the feature reviewable and safe to connect to the shared Session Builder generation path.

## Why This Is Not A Separate AI Product

Week 18 is not a separate AI product because the coach is still using Session Builder, not switching into a different product surface.

The feature stays inside the existing coach workflow:

- upload and review happen in `/sessions/new`
- generation still runs through the shared `POST /session-packs` path
- downstream save, list, detail, and export remain the same

Bedrock is only an internal capability used to improve intake quality.
It is not presented as a separate product, a general assistant, or a broad conversational layer.

## Current V1 Limitations

Current Week 18 v1 limitations are explicit:

- one image per analysis request only
- two fixed analysis modes only:
  - `environment_profile`
  - `setup_to_drill`
- no multi-image comparison
- no video
- no player identification or tracking
- no direct generation from unconfirmed output
- `setup_to_drill` is limited to one drill or activity seed only
- no downstream save, list, detail, or export redesign

These limitations are intentional. They keep the slice small, useful, and aligned with Session Builder as the shared core.

## Shared Session Builder Alignment

Session Builder remains the shared core before and after Week 18.

Week 18 changes intake quality, not the broader product boundary.

What remains shared downstream:

- normalization
- generation
- save
- list
- detail
- export

This is why Week 18 should be understood as an intake enhancement inside Session Builder, not as a separate product line.

## Guardrails

Week 18 keeps the following non-negotiable product guardrails:

- no separate AI app or image-analysis product
- coach confirmation required before generation
- structured outputs only
- fail-closed validation behavior
- tenant scope remains server-derived from verified auth plus authoritative entitlements
- no `tenant_id`, `tenantId`, or `x-tenant-id` from client contracts
- no contract widening beyond Week 18 v1

These guardrails keep the feature narrow, product-led, and tenant-safe.
