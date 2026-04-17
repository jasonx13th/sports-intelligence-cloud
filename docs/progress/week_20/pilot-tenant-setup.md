# Week 20 Day 1 — Pilot Tenant Setup Boundary

## Theme

KSC Pilot Readiness

## Purpose

Define the smallest safe tenant setup path needed to prepare Kensington Soccer Club for a real SIC pilot.

This note is a boundary document. It does not expand the platform. It defines what a Week 20 pilot setup script is allowed to do, what inputs it may use, what must remain manual, and what must never be committed.

## Why this note exists

Week 20 requires pilot tenant setup scripts and KSC tenant preparation, but SIC must keep tenant safety, auth safety, and low-cost delivery intact.

The setup path for this week must support the current Session Builder pilot flow without:

- redesigning tenancy
- redesigning entitlements
- creating a new auth model
- introducing broad org-management infrastructure
- widening into a generic tenant lifecycle platform

## Scope of this setup work

This setup work is limited to defining and supporting a narrow KSC pilot bootstrap path.

The pilot setup path may cover:

- creating or preparing a pilot-safe tenant configuration record
- preparing sanitized seed inputs for KSC pilot defaults
- documenting expected entitlements prerequisites for pilot users
- documenting expected website login entry path prerequisites
- producing operator-readable setup steps for repeatable pilot readiness

This setup work is not a general tenant provisioning system.

## Core setup principle

The Week 20 pilot setup path must prepare KSC inside the existing SIC model.

That means:

- tenant scope remains server-derived from verified auth plus authoritative entitlements
- no client-provided `tenant_id`, `tenantId`, or `x-tenant-id` is ever trusted
- pilot setup only prepares data and configuration needed for the current coach-facing pilot slice
- any auth, entitlements, IAM, or infra drift is out of scope unless explicitly escalated

## Desired outcome

By the end of this setup work, SIC should have a narrow, documented, repeatable way to prepare KSC for pilot use that is:

- understandable by the internal operator
- safe to run with sanitized inputs
- aligned to the current Session Builder flow
- limited to current pilot needs
- realistic for a solo builder to operate

## What the pilot setup path is allowed to create

The pilot setup path may create or prepare only the minimum artifacts needed for KSC pilot readiness.

Allowed output categories:

### 1. Tenant configuration artifact

A KSC-specific configuration definition for current pilot behavior, such as:

- display name
- pilot-visible sport defaults
- current sport-pack bias assumptions
- bounded pilot feature flags
- image-assisted intake enablement assumptions
- safe coach workflow defaults

### 2. Pilot readiness metadata

Operator-readable metadata or seed definition describing:

- expected tenant identifier format
- expected config record naming
- expected pilot feature toggle state
- readiness status notes
- links to related onboarding and operator docs

### 3. Sanitized setup inputs

A sanitized config file or documented config shape containing placeholders only, never live secrets or live user credentials.

### 4. Setup instructions

Operator-facing instructions covering:

- prerequisites
- sequence of setup actions
- manual follow-ups
- validation checks
- rollback or cleanup notes where relevant

## What the pilot setup path must not create

The Week 20 setup path must not create or imply:

- a broad self-serve tenant provisioning system
- a generic club administration console
- a second source of truth for tenant identity
- a second source of truth for role, tier, or entitlements
- direct client control over tenant scope
- a new auth flow separate from the existing web login path
- a broad org-settings framework
- analytics, reporting, or dashboard subsystems
- speculative future club-layer infrastructure

## Required setup inputs

The setup path should read only sanitized, bounded inputs.

Expected input categories:

- environment target, such as local or dev
- target tenant identifier placeholder
- tenant display name
- default sport pack or product flavor for pilot use
- bounded pilot feature flags
- image-assisted mode assumptions for the pilot
- optional operator notes

All inputs must be safe to commit only if fully sanitized.

## Sanitized config expectations

Tracked config examples must be sanitized and placeholder-only.

They must not include:

- real coach email addresses
- real passwords
- real tokens
- live Cognito identifiers unless explicitly approved
- live API base URLs unless explicitly approved
- secrets of any kind
- any value that weakens the current auth or tenancy model

A safe example shape is:

```json
{
  "environment": "<env>",
  "tenantId": "tenant_ksc-pilot",
  "tenantDisplayName": "Kensington Soccer Club",
  "defaultSportPack": "fut-soccer",
  "featureFlags": {
    "sessionBuilder": true,
    "imageAssistedIntake": true,
    "setupToDrill": true
  },
  "operatorNotes": "Sanitized example only. No live values."
}
```

This example is illustrative only. Final implementation should stay aligned to the actual repo’s current config and seed patterns.

## What must remain manual

The following should remain manual unless an already-approved, existing path safely covers them:

- creation or confirmation of real pilot user accounts
- entry of real organization email addresses
- handling of real passwords, invitations, or resets
- confirmation of live auth environment values
- confirmation of live entitlement records
- any production-like environment approval step
- any step involving secrets or protected operational data

Manual handling is preferred here because Week 20 is about safe pilot readiness, not full automation.

## What may be automated

Only the smallest safe parts should be automated.

Candidate automation areas:

- writing a sanitized tenant config artifact
- creating a bounded pilot-ready seed object
- validating required non-secret config fields
- checking for missing placeholder values before use
- producing an operator summary of expected prerequisites

Automation is acceptable only when it reduces operator error without introducing auth, tenancy, or infra drift.

## Script boundary

If a setup script exists for Week 20, its responsibility should stay narrow.

The script may:

- read sanitized config
- validate required non-secret fields
- prepare pilot configuration data
- emit a clear success or failure summary
- fail closed when required inputs are missing

The script must not:

- authorize tenant scope from script input
- bypass entitlements
- mint or assume privileged auth state
- create hidden operational dependencies
- write broad infrastructure
- change IAM, CDK, Cognito, or entitlements design

## Inputs and outputs list

### Inputs

- sanitized environment target
- sanitized tenant config values
- bounded pilot feature flags
- optional operator notes
- documented prerequisites for user and entitlement readiness

### Outputs

- pilot tenant setup definition
- sanitized KSC config artifact or config shape
- operator setup checklist inputs
- validation checklist for readiness confirmation
- a clear list of manual follow-up tasks

## Validation expectations

The tenant setup path is valid only if all of the following are true:

- the target tenant remains inside the current server-derived tenant model
- no client-driven tenant scoping path is introduced
- no entitlements redesign is required
- no auth-boundary change is required
- no infra, IAM, or CDK change is required for the docs-only setup definition
- all tracked artifacts remain sanitized
- the operator can understand what is automated versus manual
- the setup path supports the current KSC pilot slice and nothing broader

## Operator checklist preview

The operator should be able to answer yes to these questions after setup:

- Is the KSC tenant config defined?
- Are pilot feature defaults explicit?
- Is the login entry path known?
- Are pilot user prerequisites documented?
- Are entitlement assumptions explicit?
- Are manual steps clearly separated from automated steps?
- Are all tracked files sanitized?
- Can pilot readiness be validated without guessing?

## Risks and constraints

### Risk: setup script grows into provisioning platform work

Mitigation:
Keep the script bounded to pilot config preparation and prerequisite validation only.

### Risk: real user setup leaks into tracked docs

Mitigation:
Keep all examples sanitized and push live values to approved operational handling only.

### Risk: tenant setup starts depending on auth or entitlements redesign

Mitigation:
Stop immediately and escalate rather than widening the Week 20 slice.

### Risk: KSC pilot settings become a generic org-settings framework

Mitigation:
Keep config limited to the current Session Builder pilot flow and current feature set.

## Stop rules

Stop and escalate immediately if pilot setup requires:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- Cognito model changes beyond current approved usage
- IAM or CDK drift
- a new privileged admin path
- client-supplied tenant identity
- broad club or organization provisioning features

## Definition of done

This setup boundary is done when:

- the allowed pilot setup scope is explicit
- inputs and outputs are defined
- sanitized config expectations are clear
- manual versus automated work is clearly separated
- validation expectations are documented
- stop rules are explicit
- the KSC pilot setup path remains narrow, safe, and aligned to the current SIC model
