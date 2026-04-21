# SIC Coach Lite — KSC Program Types and Methodology v1

## Status
Draft v1

## Purpose

This document defines the Week 21 product direction for KSC program types and methodology behavior in SIC Coach Lite.

It uses `docs/progress/week_21/day1-scope-lock.md` as the current Week 21 source of truth.

This is a product-direction document only.
It does not claim that all described objects or defaults already exist in the current runtime.

---

## Current Week 21 boundary

Week 21 is frozen as **Coach Workspace Hardening for KSC**.

For this topic, the key Week 21 rules are:

- keep one shared app direction
- make team-level `programType` explicit
- make team-level methodology defaults explicit
- support first-time coach setup direction
- support returning-coach fast usage direction
- acknowledge coach-admin methodology ownership direction
- do not widen auth, tenancy, entitlements, IAM, or CDK scope

---

## Why KSC needs explicit program and methodology rules

KSC does not need two separate products.
It needs one shared product path that can express meaningful differences between coaching contexts.

The most important differences to freeze in Week 21 are:

- Travel coaches usually work with more fixed team context
- OST coaches may work with more variable and mixed-age practical conditions
- different program contexts may imply different methodology defaults

If SIC does not treat those differences explicitly, the coach experience stays too generic.

---

## One shared app direction

KSC Travel and KSC OST must remain inside one shared coach-facing app direction.

Frozen rules:

- no separate Travel app
- no separate OST app
- no separate auth path
- no separate tenancy model
- no program split at deployment level

Program differences should be expressed through team context and product defaults inside the same tenant-safe workflow.

---

## Program types

Week 21 freezes the product direction that each KSC team should eventually carry:

- `programType = travel | ost`

This should be treated as team-level context, not coach identity.

That means:

- one coach may work with multiple teams
- those teams may span different program types
- the workspace should use team selection to determine the active program context

---

## Travel program direction

Travel direction should assume a more stable team planning context.

Typical implications:

- more fixed age context
- clearer recurring team identity
- stronger default methodology expectations
- more repeat-use planning continuity

Week 21 does not require a separate Travel workflow.
It freezes Travel as a team-level context that can shape defaults inside the shared workspace.

---

## OST program direction

OST direction should assume a more flexible and practical coaching context.

Typical implications:

- more variable player group conditions
- more practical adaptation to space and equipment
- methodology defaults that may emphasize play, engagement, and usability

Week 21 does not require a separate OST workflow.
It freezes OST as a team-level context that can shape defaults inside the shared workspace.

---

## Team-level source of truth

Program type and methodology should live primarily on the team.

Frozen rules:

- the team is the main product object for KSC program context
- the team should eventually carry `programType`
- the team should eventually carry one default methodology context
- the team should eventually carry age context
- the team should eventually carry default duration

This keeps the model practical for coaches who work across more than one team.

---

## Methodology defaults

Methodology should be treated as a real product concept, not only as hidden prompt behavior.

Frozen rules:

- each team should eventually have one default methodology context
- Travel teams should be able to default to KSC Travel methodology
- OST teams should be able to default to OST or US Soccer-style methodology
- the coach should not need to restate that default every time
- the coach should still be able to adapt today’s session request as needed

Week 21 does not require a fully shipped Methodology Pack runtime surface.
It freezes the product rule that methodology ownership and defaulting should be explicit.

---

## How program type should influence coach flow

Program type should influence coach flow through defaults, not through separate apps.

### First-time coach setup direction

During setup, the coach should eventually be able to:

- create a team
- choose `travel` or `ost`
- set age context
- set practical defaults
- save the team for repeat use

### Returning-coach direction

During repeat use, the coach should eventually be able to:

- select a team
- inherit the team’s program context
- inherit the team’s default methodology context
- choose Full Session or Quick Drill direction
- adjust today’s objective, duration, and constraints

This keeps the coach flow fast without making it rigid.

---

## Coach-admin methodology direction

Week 21 should also freeze a narrow coach-admin direction around methodology.

Frozen rules:

- coach-admin should be the likely owner of methodology management direction
- coach-admin should be able to review broader team and coach context later
- methodology governance should stay inside the same shared tenant-scoped app direction

Week 21 boundary:

- acknowledge the product need
- do not claim that a full coach-admin workspace already exists

---

## Current repo grounding

The current repo already contains part of the foundation for this direction:

- team APIs already exist
- the durable team model already supports `name`, `sport`, `ageBand`, `level`, `notes`, and `status`
- the durable team model does not yet support `programType`
- the durable team model does not yet support methodology linkage or default duration
- there is no teams UI route yet
- methodology is present in docs and product direction, but not yet as a durable first-class runtime surface

This means Week 21 should document the correct product shape without overclaiming current implementation depth.

---

## Out-of-scope boundaries

The following are out of scope for this Week 21 product freeze:

- separate Travel and OST apps
- auth redesign
- tenancy redesign
- entitlements redesign
- IAM or CDK redesign
- claiming shipped runtime behavior for programType defaults
- claiming shipped runtime behavior for methodology packs
- claiming shipped coach-admin workspace behavior beyond narrow existing admin-only API surfaces

---

## Summary

KSC program type and methodology should become explicit team-level product concepts inside one shared SIC coach app.

Week 21 freezes the rule that `travel` and `ost` belong on the team, that teams should eventually carry methodology defaults, and that coaches and coach-admins should benefit from those defaults without splitting SIC into parallel products.
