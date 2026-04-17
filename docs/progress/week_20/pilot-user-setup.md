# Week 20 Day 1 — Pilot User Setup Assumptions

## Theme

KSC Pilot Readiness

## Purpose

Define the smallest safe pilot-user setup model for the Kensington Soccer Club pilot.

This note freezes the Week 20 boundary for pilot-user readiness so SIC can support real coaches without widening into auth redesign, entitlements redesign, or a broader identity-management system.

## Why this note exists

Week 20 requires pilot users with organization email sign-in assumptions, but SIC must keep the current server-derived tenant model intact.

This note exists to make three things explicit:

1. how pilot users are expected to access SIC
2. what assumptions are safe for Week 20
3. what must remain authoritative on the server side

## Core rule

Pilot-user setup must fit the current SIC contract:

- identity is verified through the existing auth path
- tenant scope comes from verified auth plus authoritative entitlements
- role and tier remain server-derived from entitlements
- no client input may declare tenant identity
- no tracked doc may include real emails, passwords, or tokens

This note does not define a new auth model. It defines a bounded pilot operating assumption.

## Pilot-user goal

By the end of Week 20, SIC should have a clear and supportable user setup assumption for KSC coaches that allows them to:

- reach the correct login entry path
- sign in with organization email-based access assumptions
- enter the current coach-facing web flow
- operate inside the correct tenant boundary through existing server-side authorization
- receive support when pilot access fails

## Pilot-user boundary

This note covers only:

- organization email sign-in assumptions
- pilot-user categories
- minimal role and tier expectations
- server-side entitlement expectations
- operator handling guidance for pilot-user readiness
- sanitized setup and validation notes

This note does not cover:

- a new self-serve invite system
- a new admin console
- a Cognito redesign
- identity federation expansion beyond current approved usage
- password policy redesign
- broad membership lifecycle automation
- entitlements-model redesign

## Pilot access model

The Week 20 pilot should use the existing authenticated SIC web path.

That means pilot users should enter SIC through the current approved website login entry path and continue into the current protected coach-facing app flow.

The user experience should be simple:

1. coach reaches pilot login entry point
2. coach signs in with the approved organization-email-based access path
3. verified identity reaches the existing protected app flow
4. server-side entitlements determine tenant scope, role, and tier
5. coach uses the current Session Builder pilot flow

## Organization email sign-in assumptions

For Week 20, the safest interpretation of organization email sign-in is operational, not architectural.

Approved assumptions:

- pilot users are identified and supported using organization email addresses
- the operator knows which pilot users are expected to access the KSC tenant
- the sign-in path should be clearly explained using the existing auth surface
- the pilot should avoid introducing a second login model
- any live user invitation or account handling should follow already-approved auth procedures only

Not approved for Week 20:

- inventing a new identity system
- introducing parallel login flows
- encoding tenant identity into client-visible login parameters
- using email alone as tenant authorization
- using a client-supplied tenant field to place users into KSC

## Pilot-user categories

Pilot-user categories should remain minimal.

### 1. Pilot coach

Primary intended user for Week 20.

Expected capabilities:

- sign in
- create a session
- use image-assisted intake where enabled
- save and export
- submit pilot feedback

Role expectation:
- coach

Tier expectation:
- current pilot-appropriate tier as derived from entitlements

### 2. Internal operator

Internal support user for pilot setup and triage.

Expected capabilities:

- confirm readiness
- verify pilot-user setup assumptions
- support login-path issues
- review support logs and stable reason codes
- confirm feedback capture behavior

Role expectation:
- admin or current approved operator-capable role only if already supported

Tier expectation:
- current approved operator-capable tier only if already supported

This note does not expand operator permissions. It documents pilot support assumptions only.

## Authoritative entitlement expectations

For every pilot user, the authoritative entitlements layer must remain the source of truth.

Expected entitlement attributes:

- `tenant_id`
- `role`
- `tier`

Expected behavior:

- verified identity alone is not enough without entitlements
- missing entitlements must fail closed
- missing `tenant_id`, `role`, or `tier` must fail closed
- invalid tenant format must fail closed
- pilot access must not be inferred from email domain alone

## Minimal pilot-user readiness checklist

A pilot user is considered ready only if all of the following are true:

- the user is expected as part of the pilot
- the user has access through the existing approved sign-in path
- the user’s verified identity can be matched to authoritative entitlements
- the entitlements row resolves a valid tenant scope
- the resolved tenant is the intended KSC pilot tenant
- the user role is appropriate for the pilot flow
- the user tier is appropriate for the pilot flow
- the login entry path is documented clearly enough for the coach to follow

## Sanitized pilot-user setup example

This example is illustrative only and must remain sanitized.

```json
{
  "pilotUsers": [
    {
      "email": "<coach1@organization.example>",
      "expectedRole": "coach",
      "expectedTier": "pro",
      "expectedTenantId": "tenant_ksc-pilot",
      "notes": "Sanitized placeholder only"
    },
    {
      "email": "<operator@organization.example>",
      "expectedRole": "admin",
      "expectedTier": "org",
      "expectedTenantId": "tenant_ksc-pilot",
      "notes": "Internal operator placeholder only"
    }
  ]
}
```

This example is not a live seed artifact. It is a placeholder format to clarify expected pilot-user assumptions.

## What must remain manual

The following should remain manual unless an already-approved path exists:

- entering real pilot user emails into live systems
- handling real invitations, passwords, resets, or account recovery
- confirming live entitlement records
- handling support for a specific coach account issue
- confirming access in a live environment
- removing or changing pilot users during the pilot

Manual handling is preferred because Week 20 is about safe pilot readiness, not identity automation.

## What may be documented or lightly automated

Safe areas for documentation or bounded automation:

- sanitized user readiness checklist
- documented expected role and tier mapping per pilot-user type
- documented login support steps
- preflight validation of placeholder fields in sanitized examples
- operator-facing notes on common access failure causes

Automation is acceptable only when it does not change auth, entitlements, or tenancy boundaries.

## Common failure cases to expect

Pilot-user support should be ready for these likely issues:

### 1. Valid sign-in, missing entitlements

Expected result:
- access denied
- stable fail-closed behavior

Operator action:
- confirm the user’s entitlements row exists and is complete

### 2. Valid sign-in, wrong role or tier expectation

Expected result:
- the current product surface may not behave as intended for the pilot

Operator action:
- confirm role and tier assumptions in the authoritative entitlements source

### 3. Coach reaches wrong login path

Expected result:
- confusion, failed sign-in, or support requests

Operator action:
- redirect the coach to the documented pilot login entry path

### 4. Missing or invalid tenant mapping

Expected result:
- fail-closed access denial

Operator action:
- confirm the entitlement record resolves the intended KSC pilot tenant in valid format

### 5. Real account details appear in tracked docs

Expected result:
- documentation hygiene failure

Operator action:
- remove and sanitize immediately

## Validation expectations

This pilot-user setup note is valid only if all of the following are true:

- no new auth surface is introduced
- no new tenant-assignment path is introduced from client input
- no live credentials or real user details are committed
- role and tier remain server-derived from entitlements
- pilot-user categories remain minimal
- user setup assumptions are clear enough for the operator to support
- the note supports the current KSC pilot and nothing broader

## Explicit non-goals

Week 20 pilot-user setup does not include:

- self-serve registration
- dynamic tenant selection by users
- multi-org identity routing
- custom identity federation rollout
- bulk membership automation platform work
- admin UX for user management
- role model redesign
- tier model redesign
- entitlements redesign
- auth-boundary changes
- tenancy-boundary changes

## Operator review questions

Before pilot use, the operator should be able to answer yes to these questions:

- Is each pilot user expected and documented in sanitized form?
- Is the pilot login entry path clear?
- Is the authoritative entitlement expectation explicit?
- Are role and tier assumptions minimal and valid?
- Would a missing-entitlements failure be understandable to support?
- Are all tracked docs free of real user secrets and live values?
- Does this remain a pilot operating note rather than identity-platform work?

## Risks and constraints

### Risk: organization email language gets interpreted as email-based authorization

Mitigation:
Keep email as an operational identifier only. Authorization remains server-derived from verified identity plus entitlements.

### Risk: pilot-user setup drifts into auth redesign

Mitigation:
Use the current approved login flow only and stop if new auth behavior is required.

### Risk: operator assumptions diverge from entitlements reality

Mitigation:
Document expected role, tier, and tenant mapping clearly and verify against the authoritative source during pilot readiness.

### Risk: real user data leaks into docs

Mitigation:
Keep all tracked examples sanitized and placeholder-only.

## Stop rules

Stop and escalate immediately if pilot-user setup requires:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- IAM or CDK drift
- a new identity provider integration
- a new client-driven tenant selection path
- broad membership lifecycle automation
- live credentials or sensitive values to be committed

## Definition of done

This pilot-user setup note is done when:

- organization email sign-in assumptions are clear
- pilot-user categories are defined
- authoritative entitlement expectations are explicit
- manual versus documented work is clearly separated
- common failure cases are documented
- non-goals are explicit
- the note stays narrow, safe, and aligned to the current SIC auth and tenancy model
