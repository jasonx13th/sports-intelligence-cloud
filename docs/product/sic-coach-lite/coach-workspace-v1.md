# SIC Coach Lite — Coach Workspace v1

## Status
Draft v1

## Purpose

This document defines the Week 21 product direction for **Coach Workspace v1** inside SIC Coach Lite.

It uses `docs/progress/week_21/day1-scope-lock.md` as the current Week 21 source of truth.

This is a product-direction document only.
It does not claim that all described surfaces already exist in the current runtime.

---

## Current Week 21 boundary

Week 21 is frozen as **Coach Workspace Hardening for KSC**.

That means this document must stay aligned to the current repo reality:

- authenticated coach flow already exists
- `/sessions/new` is the main current generation path
- saved sessions list, detail, and feedback already exist
- export exists at API level but is not yet surfaced in the Next UI
- team APIs already exist, but the durable team model is still small
- there is no teams UI route yet
- Quick Drill is not yet a first-class product mode
- coach profile is not yet a durable product surface
- equipment profile is not yet a durable product surface
- coach-admin workspace is not yet a durable product surface

---

## Product summary

Coach Workspace v1 is the next product step after the narrow Session Builder wedge.

Its purpose is to make SIC feel less like a single isolated generation form and more like a real coach-facing workspace that supports:

- first-time setup once
- faster repeat usage later
- team-aware session creation
- methodology-aware defaults later
- reuse of saved work
- future coach-admin governance direction

Coach Workspace v1 remains one shared coach-facing product path.
It does not introduce a second app for KSC Travel or KSC OST.

---

## Current repo grounding

The current shipped flow already provides a real foundation for Coach Workspace direction:

- coach authentication exists
- the active coach generation path already centers on `/sessions/new`
- saved sessions can already be listed and viewed
- saved-session feedback already exists
- export continuity already exists at the API level

Week 21 should build forward from that reality rather than replace it.

---

## One shared app direction

Coach Workspace v1 must stay inside the existing shared Club Vivo web app direction.

Frozen rules:

- one coach-facing app
- no Travel app
- no OST app
- no separate coach-admin app
- no separate auth path
- no separate tenancy path

Program and methodology differences should be expressed through team context and product defaults, not through separate deployments.

---

## Primary user types

### Coach
Uses SIC to create, refine, save, and review sessions in a faster repeat workflow.

### Coach-admin direction
Represents the future KSC coaching lead or program lead who needs broader visibility and methodology ownership.

Week 21 recognizes this user type as product direction without claiming a fully shipped admin workspace.

---

## Coach Workspace v1 shape

Coach Workspace v1 should make the coach experience feel like:

- sign in
- orient quickly
- select team context
- choose how to create
- generate with today’s constraints
- save and reuse work

This keeps Session Builder as the core engine while making the surrounding experience more durable and more practical.

---

## First-time coach flow

The first-time coach flow should be treated as setup, not as normal repeat usage.

Target direction:

1. Coach logs in through the existing authenticated flow.
2. Coach is guided into a lightweight first-time setup path.
3. Coach creates basic coach setup information.
4. Coach creates one or more teams.
5. Coach sets team context such as program type and age context.
6. Coach sets practical defaults such as likely duration, environment context, and equipment context.
7. Coach saves this setup for future reuse.

Week 21 boundary:

- this flow is frozen as product direction
- it is not a claim that all durable setup objects already exist in the runtime

---

## Returning-coach flow

The returning-coach flow should optimize for speed and repeat usage.

Target direction:

1. Coach logs in.
2. Coach lands in the main coach workspace entry area.
3. Coach selects a team.
4. Coach selects a session creation mode.
5. Coach adjusts objective, duration, and today’s constraints.
6. Coach generates quickly.
7. Coach reviews, saves, and continues into the existing saved-session flow.

This should feel meaningfully faster than starting from an unstructured blank form every time.

---

## Session-builder landing block direction

The main returning-coach entry should be a **Session Builder landing block** inside the workspace.

That block should eventually make room for:

- team selection
- mode selection
- duration selection
- objective input
- constraints input
- recent or saved work reuse
- generate action

Current Week 21 grounding:

- the current runtime already has `/sessions/new`
- Week 21 should harden product direction around that path instead of replacing it with a second generation surface

---

## Full Session vs Quick Drill direction

Coach Workspace v1 should make session creation modes more explicit.

Frozen direction:

- **Full Session** is the structured session-planning path
- **Quick Drill** is the faster small-activity or drill-oriented path

Week 21 boundary:

- Full Session remains closest to the current shipped behavior
- Quick Drill is a frozen product direction only
- Quick Drill should not be described as already shipped as a first-class runtime mode

---

## Team context inside the workspace

Team context should become the main way SIC carries repeat-use defaults.

That includes direction for:

- program type
- age context
- default duration
- methodology defaults
- later environment and equipment defaults

This keeps the coach workflow practical:

- the coach should not have to restate stable team context every time
- the coach should still be able to override today’s session settings when needed

---

## Coach-admin direction

Coach Workspace v1 should recognize coach-admin direction clearly, even if the full surface is not yet shipped.

Coach-admin direction should include:

- broader visibility into coach and team activity
- methodology ownership and updates
- governance over defaults and coaching consistency

Week 21 boundary:

- acknowledge the product need
- keep it inside one shared app direction
- do not claim that a full admin workspace already exists

---

## Explicit non-goals for v1 direction

Coach Workspace v1 is not trying to do all of the following in Week 21:

- create a second app
- redesign auth
- redesign tenancy
- redesign entitlements
- redesign IAM or CDK
- claim a shipped teams UI that does not yet exist
- claim a shipped Quick Drill runtime mode that does not yet exist
- claim a shipped coach-admin workspace that does not yet exist
- turn Week 21 into a broad platform rewrite

---

## Summary

Coach Workspace v1 is the next product layer after Session Builder.

It keeps one shared app, builds on the existing authenticated session flow, makes first-time setup and repeat usage more explicit, and defines where team context, creation modes, and coach-admin direction should live next without overstating what is already shipped.
