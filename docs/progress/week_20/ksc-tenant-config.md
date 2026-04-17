# Week 20 Day 1 — KSC Tenant Configuration

## Theme

KSC Pilot Readiness

## Purpose

Define the smallest safe tenant configuration shape needed for the Kensington Soccer Club pilot.

This note freezes what KSC needs for the current pilot and prevents Week 20 from turning into a broad organization settings framework.

## Why this config exists

Week 20 requires a KSC tenant configuration that supports a real coach-facing pilot using the current SIC Session Builder flow, including Fut-Soccer bias and image-assisted session creation.

The config must support pilot readiness without changing:

- the current tenant boundary model
- the current auth model
- the current entitlements model
- the current product wedge
- the current low-cost operating posture

## Configuration goals

The KSC tenant config should do only four things:

1. identify the pilot tenant clearly
2. set the smallest useful coach-facing defaults
3. enable the specific pilot features already in scope
4. keep future club-level expansion out of Week 20

## Configuration boundary

This config is for the current pilot only.

It should define:

- tenant identity metadata already expected by the platform
- sport-pack defaults for KSC pilot usage
- narrow feature flags for the current coach flow
- image-assisted intake assumptions relevant to the pilot
- safe coach workflow defaults

It should not define:

- a broad club administration model
- complex multi-team policy controls
- advanced analytics settings
- broad export governance
- billing logic
- broad AI knowledge configuration
- a generic organization settings platform

## Core tenant safety rules

The KSC tenant config must not weaken the SIC multi-tenant contract.

That means:

- tenant scope remains server-derived from verified auth plus authoritative entitlements
- this config does not authorize tenant identity
- this config does not replace role, tier, or entitlements
- no client-supplied `tenant_id`, `tenantId`, or `x-tenant-id` is ever trusted
- any data access still remains tenant-scoped by construction

## Required KSC config sections

The KSC config should remain small and explicit.

### 1. Tenant identity metadata

Purpose:
Provide the minimum display and identification values needed for the pilot.

Fields:

- `tenantId`
- `tenantDisplayName`
- `status`
- `pilotLabel`

Notes:

- `tenantId` must follow the current valid tenant format
- `status` should stay simple for pilot use
- `pilotLabel` is informational, not authorization

### 2. Product flavor defaults

Purpose:
Set the primary KSC pilot defaults for coach-facing session creation.

Fields:

- `defaultSportPack`
- `defaultSessionMode`
- `defaultTerminology`

Notes:

- `defaultSportPack` should bias toward `fut-soccer`
- `defaultSessionMode` should remain aligned to the shared Session Builder flow
- terminology should stay lightweight and coach-friendly

### 3. Feature flags

Purpose:
Enable only the product capabilities needed for the Week 20 pilot.

Fields:

- `sessionBuilder`
- `imageAssistedIntake`
- `environmentProfile`
- `setupToDrill`
- `pilotFeedbackCapture`

Notes:

- feature flags should be narrow and descriptive
- feature flags should not imply hidden platform expansion
- disabled features should remain explicitly disabled where useful

### 4. Coach workflow defaults

Purpose:
Set safe defaults that reduce friction for pilot coaches.

Fields:

- `defaultIntensityMode`
- `defaultExportEnabled`
- `defaultSaveEnabled`
- `defaultPromptStyle`

Notes:

- defaults should support the current coach path, not future club governance
- these are product defaults, not entitlements

### 5. Image-assisted assumptions

Purpose:
Make current pilot expectations clear for image-assisted flows.

Fields:

- `imageUploadEnabled`
- `environmentPhotoSupported`
- `setupPhotoSupported`
- `coachConfirmationRequired`

Notes:

- coach confirmation must remain required before image-derived data drives generation
- this config does not bypass validation or safety checks

## Recommended KSC config shape

The following example is intentionally narrow and sanitized.

```json
{
  "tenantId": "tenant_ksc-pilot",
  "tenantDisplayName": "Kensington Soccer Club",
  "status": "pilot-ready",
  "pilotLabel": "week20-ksc",
  "defaultSportPack": "fut-soccer",
  "defaultSessionMode": "session-builder",
  "defaultTerminology": "coach-friendly",
  "featureFlags": {
    "sessionBuilder": true,
    "imageAssistedIntake": true,
    "environmentProfile": true,
    "setupToDrill": true,
    "pilotFeedbackCapture": true
  },
  "coachWorkflowDefaults": {
    "defaultIntensityMode": "balanced",
    "defaultExportEnabled": true,
    "defaultSaveEnabled": true,
    "defaultPromptStyle": "structured"
  },
  "imageAssistedAssumptions": {
    "imageUploadEnabled": true,
    "environmentPhotoSupported": true,
    "setupPhotoSupported": true,
    "coachConfirmationRequired": true
  }
}
```

This example is a pilot-shape reference only. Final implementation should match the repo’s actual config patterns and current product behavior.

## Field-by-field guidance

### `tenantId`

Use:
- stable tenant identifier in the current format

Do not use:
- human-edited client request values
- display names as identifiers
- alternate tenant lookup sources

### `tenantDisplayName`

Use:
- clear coach-facing or operator-facing display value

Do not use:
- hidden auth meaning
- entitlement meaning

### `status`

Use:
- simple pilot lifecycle wording such as `pilot-ready`

Do not use:
- operational state machines beyond current need

### `pilotLabel`

Use:
- an internal pilot tracking label

Do not use:
- anything that changes authorization behavior

### `defaultSportPack`

Use:
- `fut-soccer` for the KSC pilot unless approved otherwise

Do not use:
- multiple competing defaults in Week 20

### `featureFlags`

Use:
- only currently supported pilot features

Do not use:
- speculative future features
- flags for incomplete platform work

### `coachWorkflowDefaults`

Use:
- defaults that reduce friction in the current web flow

Do not use:
- broad club policy engines
- team or org governance controls

### `imageAssistedAssumptions`

Use:
- assumptions already supported by the current image-assisted workflow

Do not use:
- auto-approval behavior that skips coach confirmation
- new AI subsystems

## Explicit non-goals

This config must not become:

- a generic tenant metadata framework
- a broad organization settings registry
- a team management configuration layer
- an entitlements definition file
- a billing or subscription config
- a RAG or knowledge-source registry
- a large feature-flag platform
- a substitute for server-side authorization

## Validation expectations

The KSC tenant config is valid only if all of the following are true:

- it stays limited to current pilot behavior
- it does not carry authorization meaning beyond existing platform expectations
- it does not redefine role, tier, or tenant membership
- it supports the shared Session Builder flow
- it supports Fut-Soccer bias in a bounded way
- it supports image-assisted pilot use without bypassing coach confirmation
- it stays sanitized in tracked docs and examples
- it does not create future platform obligations

## Operator review questions

Before using the KSC config, the operator should confirm:

- Is the tenant identifier correct and in the expected format?
- Is the tenant display name clear?
- Is `fut-soccer` the intended default sport pack?
- Are pilot feature flags limited to supported capabilities?
- Are image-assisted assumptions explicit?
- Does anything in this config accidentally imply auth or entitlements behavior?
- Is the config still narrow enough for Week 20?

## Risks and constraints

### Risk: config grows into a generic org settings system

Mitigation:
Keep fields limited to the current pilot coach flow only.

### Risk: config starts to carry authorization meaning

Mitigation:
Keep auth and entitlements authoritative elsewhere and document that boundary clearly.

### Risk: too many feature flags create hidden platform scope

Mitigation:
Enable only current pilot-critical flags and keep names explicit.

### Risk: image-assisted defaults overpromise reliability

Mitigation:
Require coach confirmation and keep support notes visible.

## Stop rules

Stop and escalate if the KSC config requires:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- IAM or CDK drift
- a new org-wide settings framework
- a new client-driven tenant identification path
- unsupported pilot features to be invented for the config to make sense

## Definition of done

This KSC tenant config note is done when:

- the config shape is explicit
- required fields are defined
- non-goals are explicit
- the pilot defaults are clear
- image-assisted assumptions are bounded
- the config does not weaken tenancy, auth, or entitlements boundaries
- the config remains narrow enough for Week 20 pilot readiness
