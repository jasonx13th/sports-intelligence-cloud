# Session Builder Image-Assisted Intake v1

## Purpose

This note documents the Week 18 Day 3 architecture for image-assisted intake inside SIC Session Builder.

It explains the current v1 runtime shape for:

- `environment_profile`
- `setup_to_drill`

This is a shared Session Builder enhancement, not a separate AI product, not a separate image-analysis product, and not a new downstream save or export system.

## Position In SIC

Image-assisted intake sits inside the existing SIC Session Builder wedge.

It stays inside the current coach workflow:

- frontend entry: `/sessions/new`
- backend entry: `POST /session-packs`

The feature exists to improve intake quality before shared session generation. It does not introduce:

- a separate app
- a separate auth path
- a separate tenant boundary
- a separate persistence model for generated sessions

This keeps Week 18 aligned with the current SIC product wedge described in the platform constitution and vision: practical coach workflow value first, delivered as a thin vertical slice.

## Shared Runtime Flow

The current v1 runtime flow is:

1. Coach chooses one analysis mode:
   - `environment_profile`
   - `setup_to_drill`
2. Coach uploads one image for one analysis request.
3. The backend resolves tenant context from verified auth plus authoritative entitlements.
4. The backend stores the source image under a tenant-scoped S3 key.
5. The backend calls the narrow Bedrock image-analysis adapter.
6. The backend parses raw model output into a draft profile.
7. Deterministic validators enforce the frozen Week 18 v1 contract.
8. The draft profile returns to the coach for review and edit.
9. The coach confirms the profile.
10. Only the confirmed profile flows into shared Session Builder generation.

In v1:

- `environment_profile` improves environment understanding for shared generation
- `setup_to_drill` seeds one drill or activity only

## Tenant-Scoped Storage

Uploaded source images are stored under a tenant-scoped prefix derived from server-built tenant context only.

Current prefix shape:

```text
tenant/<tenantId>/session-builder/image-intake/v1/<mode>/<analysisId>/...
```

Example shape:

```text
tenant/<tenantId>/session-builder/image-intake/v1/environment_profile/<analysisId>/source/<imageId>.jpg
tenant/<tenantId>/session-builder/image-intake/v1/setup_to_drill/<analysisId>/source/<imageId>.png
```

The tenancy rule is unchanged from the wider SIC platform contract:

- tenant scope is server-derived from verified auth plus authoritative entitlements
- the client does not provide `tenant_id`, `tenantId`, or `x-tenant-id`
- the client does not choose cross-tenant prefixes
- storage keys are built by the server, not trusted from request input

This keeps S3 tenant isolation aligned with the same fail-closed principles used across the SIC API and data-access layers.

## Bedrock Adapter Boundary

The Bedrock boundary lives in shared backend platform code under:

- `services/club-vivo/api/src/platform/bedrock/`

Its responsibility is intentionally narrow:

- build the multimodal model request
- invoke the approved Bedrock model
- return raw model output to the Session Builder domain layer

It does not own:

- tenant resolution
- business rules
- downstream session generation
- save, list, detail, or export behavior

This is why Week 18 is not a broader AI subsystem. Bedrock is used as one internal capability inside Session Builder, with a clear service boundary, explicit failure handling, and narrow model scope.

## Deterministic Parsing And Validation

Deterministic parsing and validation live in Session Builder domain code under:

- `services/club-vivo/api/src/domains/session-builder/`

This layer is responsible for:

- converting raw model output into the frozen Week 18 v1 profile shape
- normalizing safe known variants into the approved contract
- rejecting or fail-closing unsupported output
- preserving the distinction between `environment_profile` and `setup_to_drill`

This keeps model output reviewable and bounded. The model does not write directly into shared generation or persistence without domain validation.

## Coach Confirmation Boundary

Coach confirmation is a required boundary in the current v1 flow.

The rule is:

- model output is draft-only on first return
- the coach may review and edit the draft
- only a confirmed profile may be used as shared generation input

This boundary lives in the existing `/sessions/new` experience, not in a separate review tool. It is the control that prevents unconfirmed model output from directly triggering generation.

## Shared Session Builder Downstream

What stays shared downstream is unchanged:

- Session Builder normalization
- Session Builder generation
- session save
- session list
- session detail
- session export

The Week 18 addition only changes intake. It does not create a separate downstream object model.

In v1:

- `environment_profile` feeds shared generation as better environment context
- `setup_to_drill` feeds one drill or activity seed only

Everything after confirmed-profile handoff stays on the existing shared Session Builder path.

## Observability And Cost Guardrails

Week 18 keeps Bedrock use narrow, observable, and cost-aware.

Current minimum operational signals are:

- image analysis success
- image analysis failure
- profile confirmed

Current cost and scope guardrails are:

- one image per request
- one narrow model boundary
- two fixed analysis modes
- deterministic validation before shared generation

This is intentionally not a generic "analyze anything" feature.

## Current V1 Limitations

Current Week 18 v1 limitations are explicit:

- one image per analysis request only
- no separate AI app or image-analysis product
- no multi-image or video intake
- no client-supplied tenant identity
- no automatic generation from unconfirmed output
- `setup_to_drill` does not generate a full session
- save, list, detail, and export remain unchanged downstream

## Fail-Closed Posture

Week 18 follows the same fail-closed posture as the broader SIC platform.

That means:

- tenant scope is never taken from client input
- unsupported request fields are rejected
- unsupported model output is normalized only when safely bounded
- otherwise validation fails closed
- ambiguous setup output does not widen the contract
- downstream generation only accepts confirmed, validated profiles

This keeps image-assisted intake aligned with SIC's non-negotiable multi-tenant and product-first architecture rules.
