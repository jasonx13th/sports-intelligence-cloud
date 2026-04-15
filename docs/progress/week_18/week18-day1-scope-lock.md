# Week 18 Day 1 Scope Lock

## Status

Frozen Day 1 scope lock for the Week 18 GenAI Space and Setup Intake v1 planning slice.

This is a tracked progress artifact only.
It does not change runtime behavior, route behavior, UI behavior, persistence behavior, infra, IAM, auth, tenancy boundaries, entitlements, or Bedrock architecture.

Tracked SIC docs remain the source of truth for platform, tenancy, and product direction.

---

## Purpose

Freeze the smallest safe Week 18 Day 1 shape for image-assisted intake inside the existing Session Builder foundation.

This Day 1 scope lock exists to keep the next implementation slice:

- product-first
- architecture-strong
- tenant-safe
- reviewable
- deterministic
- cost-aware

This Day 1 scope lock freezes:

- the shared Session Builder shape
- the two v1 image analysis modes
- the narrow `EnvironmentProfile` contract
- the narrow `SetupProfile` contract
- the coach confirmation rule before generation
- the tenant-scoped image storage note
- the smallest approved Day 2 handoff

---

## Frozen Slice Shape

Week 18 v1 remains one shared Session Builder workflow.

Frozen Day 1 rules:

- no separate AI app
- no separate image-analysis product
- keep Session Builder as the shared core
- one image per analysis request in v1
- tenant scope remains server-derived from verified auth plus authoritative entitlements
- never accept `tenant_id`, `tenantId`, or `x-tenant-id` from body, query, or headers
- image storage must be tenant-scoped
- coach confirmation or edit is required before any generation step
- downstream save, list, detail, and export remain unchanged

Frozen v1 request-flow shape:

1. Coach uploads one image for one analysis request.
2. System stores the image under a tenant-scoped prefix derived from server-side tenant context.
3. System runs one narrow image analysis mode:
   - `environment_profile`
   - `setup_to_drill`
4. System returns a draft profile.
5. Coach confirms or edits the draft.
6. Only the confirmed profile may feed downstream Session Builder generation.

Frozen v1 boundary:

- `environment_profile` helps the system understand the environment only
- `setup_to_drill` is limited to one drill or activity seed only
- neither mode creates a separate persistence, save, list, detail, or export system

---

## Frozen Mode Definitions

### `environment_profile`

`environment_profile` is the image-assisted intake mode used to understand the coach's current training environment from one uploaded image.

Its purpose is limited to environment understanding such as:

- likely surface
- likely usable space shape
- visible equipment
- visible constraints
- visible safety considerations

Frozen Day 1 rule:

- `environment_profile` must not directly generate a session
- it may only produce a coach-editable draft profile that later feeds shared Session Builder normalization

### `setup_to_drill`

`setup_to_drill` is the image-assisted intake mode used to interpret one uploaded setup image as a possible drill layout.

Its purpose is limited to one drill or activity seed such as:

- likely setup shape
- visible equipment
- likely player organization
- likely focus tags

Frozen Day 1 rule:

- `setup_to_drill` is limited to one drill or activity seed only
- it must not directly generate a full session
- it still runs inside the shared Session Builder flow

---

## Frozen EnvironmentProfile Contract

The v1 `EnvironmentProfile` contract stays intentionally small and deterministic.

Suggested TypeScript-style contract:

```ts
type ImageAnalysisMode = "environment_profile" | "setup_to_drill";

type AnalysisStatus = "draft" | "confirmed";

type SourceImageMimeType = "image/jpeg" | "image/png" | "image/webp";

type SurfaceType = "grass" | "turf" | "indoor" | "hardcourt" | "unknown";

type SpaceSize = "small" | "medium" | "large" | "full" | "unknown";

type BoundaryType =
  | "small-grid"
  | "half-field"
  | "full-field"
  | "indoor-court"
  | "mixed"
  | "unknown";

type AnalysisConfidence = "low" | "medium" | "high";

interface EnvironmentProfile {
  mode: "environment_profile";
  schemaVersion: 1;
  analysisId: string;
  status: AnalysisStatus;
  sourceImageId: string;
  sourceImageMimeType: SourceImageMimeType;
  summary: string;
  surfaceType: SurfaceType;
  spaceSize: SpaceSize;
  boundaryType: BoundaryType;
  visibleEquipment: string[];
  constraints: string[];
  safetyNotes: string[];
  assumptions: string[];
  analysisConfidence: AnalysisConfidence;
}
```

Frozen interpretation guidance:

- `summary` should stay short and coach-readable
- `visibleEquipment` should list only what is reasonably visible or safely inferred
- `constraints` should stay practical and non-speculative
- `assumptions` should make uncertainty explicit instead of hiding it
- `analysisConfidence` is guidance for coach review, not automatic authorization for generation

---

## Frozen SetupProfile Contract

The v1 `SetupProfile` contract stays intentionally small and deterministic.

Suggested TypeScript-style contract:

```ts
type LayoutType =
  | "box"
  | "lane"
  | "channel"
  | "grid"
  | "half-pitch"
  | "unknown";

type PlayerOrganization =
  | "individual"
  | "pairs"
  | "small-groups"
  | "two-lines"
  | "two-teams"
  | "unknown";

interface SetupProfile {
  mode: "setup_to_drill";
  schemaVersion: 1;
  analysisId: string;
  status: AnalysisStatus;
  sourceImageId: string;
  sourceImageMimeType: SourceImageMimeType;
  summary: string;
  layoutType: LayoutType;
  spaceSize: SpaceSize;
  playerOrganization: PlayerOrganization;
  visibleEquipment: string[];
  focusTags: string[];
  constraints: string[];
  assumptions: string[];
  analysisConfidence: AnalysisConfidence;
}
```

Frozen interpretation guidance:

- `focusTags` should remain narrow and map to existing shared Session Builder vocabulary where possible
- `layoutType` and `playerOrganization` should stay descriptive, not diagram-perfect
- the confirmed output is only a seed for one drill or activity
- v1 should not widen this contract into a full session, multi-drill plan, or saved downstream session schema

---

## Coach Confirmation Rule

Coach confirmation or edit is required before any downstream generation step.

Frozen Day 1 rules:

- model output is draft-only at first return
- draft profile status starts as `draft`
- the coach must confirm or edit the profile before it is treated as authoritative input
- only the confirmed profile may feed shared Session Builder normalization or drill seeding
- silent auto-generation from raw image analysis is not allowed in v1

This applies to both:

- `environment_profile`
- `setup_to_drill`

---

## Tenant-Scoped Image Storage Note

Uploaded source images must be stored under a tenant-scoped S3 prefix derived from server-built tenant context only.

Frozen v1 prefix shape:

```text
tenant/<tenantId>/session-builder/image-intake/v1/<mode>/<analysisId>/...
```

Example object locations:

```text
tenant/<tenantId>/session-builder/image-intake/v1/environment_profile/<analysisId>/source/image.jpg
tenant/<tenantId>/session-builder/image-intake/v1/setup_to_drill/<analysisId>/source/image.jpg
tenant/<tenantId>/session-builder/image-intake/v1/environment_profile/<analysisId>/artifacts/profile.json
tenant/<tenantId>/session-builder/image-intake/v1/setup_to_drill/<analysisId>/artifacts/profile.json
```

Frozen storage rules:

- one image per analysis request in v1
- the server derives `<tenantId>` from verified auth plus authoritative entitlements
- the client does not choose tenant scope
- the client does not choose cross-tenant prefixes
- mode-specific artifacts stay under the same tenant and analysis prefix

Immutable metadata expectations for each analysis request:

- `analysisId`
- `mode`
- `sourceImageId`
- `sourceImageMimeType`
- `contentSha256`
- `storageKey`
- `uploadedAt`
- `uploadedBy`
- `tenantId`

Frozen metadata rules:

- immutable metadata is server-recorded
- immutable metadata is not editable by the client after analysis creation
- `tenantId` remains authoritative server metadata, not a client field
- the image object key and analysis metadata must stay aligned

---

## Day 2 Handoff

Day 2 remains implementation work and is not part of this Day 1 docs-only slice.

The smallest approved Day 2 vertical slice is:

- accept one uploaded image for one analysis request
- store that image in a tenant-scoped S3 prefix
- run one of the 2 frozen analysis modes
- return a draft `EnvironmentProfile` or draft `SetupProfile`
- require coach confirmation or edit
- feed only the confirmed profile into the shared Session Builder path

Frozen Day 2 shape for `environment_profile`:

- upload image
- analyze environment
- return draft `EnvironmentProfile`
- coach confirms or edits
- confirmed values feed shared Session Builder normalization
- downstream save, list, detail, and export remain unchanged

Frozen Day 2 shape for `setup_to_drill`:

- upload image
- analyze setup
- return draft `SetupProfile`
- coach confirms or edits
- confirmed values feed one drill or activity seed only
- downstream save, list, detail, and export remain unchanged

Day 2 must not:

- add a separate AI app
- add a separate image-analysis product surface
- redesign auth or tenancy
- redesign entitlements
- widen `setup_to_drill` into full-session generation
- widen downstream save, list, detail, or export contracts

---

## In Scope for Day 1

- freeze the Week 18 Day 1 slice shape
- freeze `environment_profile`
- freeze `setup_to_drill`
- freeze narrow `EnvironmentProfile` guidance
- freeze narrow `SetupProfile` guidance
- freeze coach confirmation requirements
- freeze tenant-scoped image storage guidance
- freeze immutable metadata expectations
- freeze the Day 2 implementation handoff
- document out-of-scope boundaries
- document stop flags

---

## Explicitly Out of Scope

- runtime behavior changes
- route changes
- UI changes
- persistence changes
- infra changes
- IAM changes
- CDK changes
- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- a separate AI app
- a separate image-analysis product
- multi-image analysis requests
- video intake
- player identification
- player tracking
- medical or biometric inference
- automatic generation without coach confirmation
- full-session generation from `setup_to_drill`
- downstream save, list, detail, or export redesign
- creating `docs/api/session-builder-image-intake-v1-contract.md` in this task

---

## Stop Flags

Stop and escalate instead of widening scope if this slice starts to require:

- infra changes
- IAM changes
- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- a separate AI app
- a separate image-analysis product
- acceptance of `tenant_id`, `tenantId`, or `x-tenant-id` from body, query, or headers
- cross-tenant image storage behavior
- multi-image analysis in v1
- automatic generation without coach confirmation
- full-session generation from `setup_to_drill`

If any of the above become necessary, this is no longer the smallest safe Week 18 slice and must be re-approved before implementation proceeds.

---

## Tenancy and Security Check

- Tenant scope remains server-derived from verified auth plus authoritative entitlements.
- Never accept `tenant_id`, `tenantId`, or `x-tenant-id` from body, query, or headers.
- Image storage must be tenant-scoped.
- The S3 prefix must be derived from server-side tenant context only.
- No scan-then-filter tenancy pattern is allowed.
- No separate auth path is allowed.
- No separate tenancy path is allowed.
- No entitlements-model change is allowed.
- Save, list, detail, and export remain unchanged downstream.

---

## Bedrock and Cost Note

Week 18 v1 keeps Bedrock use narrow, observable, and cost-aware.

Frozen Day 1 rules:

- Bedrock is limited to narrow image-assisted analysis inside the shared Session Builder workflow
- Bedrock output must be parsed into deterministic, reviewable contracts
- Bedrock output is draft-only until coach confirmation
- this slice must not expand into a broad opaque AI subsystem
- one image per analysis request in v1 helps bound cost and review complexity

This Day 1 scope lock does not approve new Bedrock architecture.
It only freezes the narrow intended product boundary for the next implementation slice.

---

## Observability Note

Week 18 Day 1 is documentation only.

This slice does not change:

- logs
- metrics
- alarms
- dashboards
- event schemas

For Day 2, the expected minimum observability shape remains narrow:

- analysis success
- analysis failure
- profile confirmed
- session generation from confirmed environment input
- drill generation from confirmed setup input

No broader observability expansion is part of this Day 1 scope lock.

---

## Product Impact Note

This Day 1 scope lock protects the shared Session Builder foundation while making room for the first practical image-assisted intake layer.

It keeps the Week 18 slice narrow by freezing:

- one shared Session Builder core
- two small analysis modes
- one image per analysis request
- coach confirmation before generation
- tenant-scoped image storage
- unchanged downstream save, list, detail, and export behavior

This keeps the vertical slice useful without widening SIC into a separate AI product or weakening the current tenancy model.
