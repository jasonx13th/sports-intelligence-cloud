# SIC Coach Lite Roadmap and High Level Implementation Phases

## Purpose

This document defines the product roadmap for **SIC Coach Lite** as the first club-facing product in Sports Intelligence Cloud, and lays out the full high level implementation phases that grow SIC from a coach session builder into a broader club and sports organization platform.

This direction stays aligned with the current SIC product wedge, architecture principles, tenant contract, and roadmap direction:

- Session Builder is the current product wedge
- SIC should evolve through thin vertical slices
- Multi-tenant safety is non-negotiable
- Tenant context must come only from verified auth plus authoritative entitlements
- The platform should remain low cost, serverless first, and product led
- AI should be introduced in controlled stages with validation and cost discipline

---

# 1. Product Positioning

## SIC Coach Lite

**SIC Coach Lite** is the first club-facing product to present to coaches and small clubs.

Its job is simple:

> A coach describes the training reality they have today, and SIC returns a usable training session that is clear, structured, and easy to run.

The first version should help coaches answer practical questions such as:

- How many players do I have today?
- How much time do I have?
- What size field or space do I have?
- What equipment do I actually have?
- What do I want to work on today?

Then SIC should return:

- a structured training session
- activity by activity breakdown
- coaching points
- progressions and regressions
- a printable session pack
- clear drill visuals that help the coach set up fast

---

# 2. Why SIC Coach Lite Should Be First

SIC should begin with a narrow but highly usable wedge.

That wedge is not a general AI chatbot. It is a **coach workflow product**.

SIC Coach Lite should come first because it:

- solves a real pain point immediately
- is useful for low income and grassroots coaches
- fits the current SIC Session Builder direction
- can be built on the existing AWS and tenancy foundation
- creates structured data that supports future SIC intelligence features
- gives clubs an immediate reason to pilot the platform

This product should be good enough for:

- individual coaches
- assistant coaches
- small clubs
- nonprofit academies
- directors who want coaching consistency

---

# 3. Core Product Promise

The product promise for SIC Coach Lite should be:

> Tell SIC what kind of team you coach, what space and equipment you have, and what you want to improve today. SIC will build a training session you can run now.

That means the product should accept:

- sport
- age group or level
- athlete count
- session length
- field or court or pool environment
- available equipment
- session objective or focus

And it should produce:

- session title
- session objective
- total duration
- clear activity sequence
- coaching points
- progressions
- regressions
- safety notes
- assumptions when inputs are missing
- visual drill diagrams
- exportable PDF session pack

---

# 4. Visual Delivery Requirement

A major requirement for SIC Coach Lite is that the output should not be just words.

The coach should receive a session that is visually understandable.

## What this means

Each session should include not only text instructions, but also visual diagrams that show:

- cone placement
- player positions
- ball starting points
- pass directions
- movement directions
- rotation paths
- grid or area shape
- optional mini goals or field markers

The goal is that a coach can open SIC and quickly understand:

- where to place the cones
- how players are organized
- where the ball starts
- where the action moves first
- how to run the drill or game

## Lite visual strategy

For Lite, the correct approach is not to rely on expensive image generation for every activity.

Instead, Lite should:

1. generate a structured session pack
2. generate a structured drill diagram description for each activity
3. render that description into a clear SVG or PNG diagram
4. include that output in the web UI and the exported PDF

This keeps cost lower, increases consistency, and makes the diagrams easier to validate.

## Lite visual quality bar

For the first version, visuals should be:

- clear
- consistent
- readable
- exportable
- easy for coaches to follow

The first version does **not** need to be artistic or perfect.

It only needs to be clear enough that a coach can set up the activity correctly.

---

# 5. Product Architecture Direction

SIC Coach Lite should remain aligned with the existing SIC architecture direction.

## Core architectural shape

- web app for coaches
- Cognito authentication
- API Gateway entry point
- Lambda application services
- DynamoDB for tenant-scoped data
- S3 for session exports and diagrams
- CloudWatch for logs, metrics, and alarms
- optional limited Bedrock usage for generation

## Tenant safety rules

The product must preserve SIC non-negotiables:

- tenant identity is never accepted from request body, query, or headers
- tenant context is derived only from verified auth plus entitlements
- all reads and writes are tenant-scoped by construction
- exports remain tenant-partitioned in storage

## Product design rule

Every club should feel like it has its own bot, but SIC should still operate as one platform capability.

That means tenant-specific behavior should come from:

- tenant-scoped configuration
- tenant-scoped methodology knowledge
- tenant-scoped templates
- tenant-scoped terminology
- tenant-scoped saved sessions and team context

Not from separate bot deployments.

---

# 6. SIC Coach Lite as the First Club Facing Product

## Club demo value

When SIC Coach Lite is shown to a club, the value should be obvious.

A director or coach should be able to see that SIC can:

- save coaches time
- increase session planning consistency
- help newer coaches deliver better sessions
- align sessions with the club's philosophy over time
- produce clean, printable session plans
- eventually support club-specific methodology

## Example club use case

A club like Kensington Soccer Club could eventually configure SIC so that:

- the club has its own methodology pack
- the club uses preferred coaching language
- U10, U12, U14, and summer camp groups have different defaults
- sessions align with the methodology or philosophy the club wants coaches to follow

This is how SIC evolves from a coach tool into a club platform.

---

# 7. Roadmap Overview

The recommended roadmap is:

1. SIC Coach Lite
2. Coach Workspace
3. Team Layer
4. Club Methodology Layer
5. Visual Session Intelligence
6. Club Operations OS
7. SIC Intelligence Features

Each phase should ship as a thin vertical slice that delivers real user value.

---

# 8. Full High Level Phases for Implementation

## Phase 0 — Foundation Already in Place

### Goal
Use the SIC platform foundations that already exist as the base for the coach product.

### What this phase includes

- tenant-safe auth foundation
- verified tenant context pattern
- entitlements-backed authorization
- serverless AWS foundation
- structured logging and observability
- session builder domain direction
- exports and product-safe storage patterns

### Why it matters

This phase makes sure the product is built on a trustworthy platform and not on shortcuts.

---

## Phase 1 — SIC Coach Lite MVP

### Goal
Ship the first real coach product that clubs can see and use.

### Core outcome
A coach can log in, describe the training reality, and receive a usable training session with clear visuals.

### Features

- login and authenticated coach access
- intake form plus chat style refinement
- capture sport, age group, players, time, space, and equipment
- session focus and objective input
- generation of a validated session pack
- progressions and regressions
- save session
- export session pack
- visual diagram per activity or per main activity
- PDF export for field use

### Lite visual capability

Lite should include:

- one clean diagram for each main activity
- arrows for movement and passes
- standard symbols for players, cones, balls, and goals
- layout suited for mobile and PDF viewing

### Success criteria

- a coach can generate a session in minutes
- a coach can understand how to set up the drill
- a coach can save and export the plan
- the demo is strong enough to show to clubs

---

## Phase 2 — Coach Workspace

### Goal
Move from one time generation to repeatable weekly use.

### Core outcome
The coach starts using SIC as an everyday planning workspace rather than only a chatbot.

### Features

- session library
- saved templates
- duplicate and adapt workflow
- favorites
- weekly planning view
- session history
- notes after training
- lightweight feedback collection

### Why it matters

This phase builds retention and real workflow behavior.

---

## Phase 3 — Team Layer

### Goal
Connect sessions to real teams and actual coaching operations.

### Core outcome
Coaches can plan for specific teams, not only generic groups.

### Features

- team profiles
- roster aware defaults
- team specific constraints
- assign sessions to teams
- attendance support
- team session history
- weekly planning by team

### Why it matters

This phase moves SIC from a content generator to a team planning system.

---

## Phase 4 — Club Methodology Layer

### Goal
Enable a club or organization to shape how SIC generates sessions.

### Core outcome
SIC becomes a club-aware coaching assistant rather than only a general planning tool.

### Features

- tenant bot configuration
- methodology documents or playbooks
- club terminology settings
- age group standards
- club style of play defaults
- club drill library
- branded exports
- group specific configuration such as U10, U12, U14, camp, academy

### Example impact

A club director can define what good coaching looks like for that club, and SIC helps coaches plan inside that framework.

---

## Phase 5 — Visual Session Intelligence

### Goal
Upgrade visuals from simple diagrams to stronger coaching boards.

### Core outcome
Session outputs become more polished, visual, and easier to use on the field.

### Features

- richer diagram layout engine
- multiple frames for progressions
- full field and half field templates
- clearer numbering and sequence flow
- better spacing rules for cones and players
- color or team theme support
- optional manual editor for coaches to adjust diagrams before export

### Why it matters

This is where SIC becomes not just useful, but visually impressive.

---

## Phase 6 — Club Operations OS

### Goal
Expand from coach planning into club workflow infrastructure.

### Core outcome
SIC starts functioning as a lightweight operating system for clubs and organizations.

### Features

- director and coach roles
- club wide session libraries
- permissions by team and role
- methodology governance workflows
- season or curriculum planning
- cross coach collaboration
- coach onboarding support
- organization level reporting

### Why it matters

This is the transition from a coach product to a real multi-user club platform.

---

## Phase 7 — SIC Intelligence Features

### Goal
Introduce intelligence features after real usage data exists.

### Core outcome
SIC becomes smarter because it learns from real coach workflows, session usage, and feedback.

### Features

- recommended session adaptations
- methodology alignment suggestions
- usage based drill recommendations
- feedback informed improvements
- age group and team pattern insights
- training load summaries
- advanced AI assistance for curriculum generation

### Rule for this phase

This phase should be built only after real product usage supports it.

---

# 9. Recommended Release Sequence

## Release 1 — SIC Coach Lite

The first product shown to clubs should include:

- session generation
- validated session pack
- clear drill visuals
- exportable PDF
- save session
- club pilot demo readiness

## Release 2 — Coach Workspace

- session library
- templates
- reuse
- weekly planning
- feedback notes

## Release 3 — Team Layer

- teams
- assignment
- attendance
- planning by team

## Release 4 — Club Methodology

- tenant configuration
- methodology pack
- club defaults
- branded exports

## Release 5 — Club OS

- multi coach workflows
- director controls
- club operations support

## Release 6 — SIC Intelligence

- recommendations
- usage insights
- methodology analytics
- advanced AI assistance

---

# 10. Practical Build Strategy

## Recommendation

Build **SIC Coach Lite now**, but build it in a way that leaves clean seams for the richer future phases.

That means:

- keep one session pack contract
- keep one multi-tenant platform
- keep one authoritative tenant context model
- keep one orchestration flow
- add visual drill support through structured diagram rendering
- leave room for future methodology retrieval and richer intelligence

## Important product rule

The first product should not try to do everything.

It should do one thing very well:

> Give coaches a session they can run today, and make the output clear enough that they can set it up fast.

---

# 11. Next Design Step

The next design step after this roadmap is:

## Define DrillDiagramSpec v1

This should become part of the session pack contract so that each activity can return both:

- human readable coaching content
- machine renderable visual drill structure

That will allow SIC to support:

- web diagram rendering
- PDF session exports with visuals
- future diagram editing
- stronger visual quality over time

---

# 12. Summary

SIC Coach Lite should be the first club facing product.

It should prove that SIC can turn a coach's constraints into a structured, visual, usable training session.

The long term path is not to stay as a simple chatbot.

The long term path is:

- coach tool
- coach workspace
- team layer
- club methodology platform
- club operations system
- intelligence layer built on real usage

That is a strong, realistic, and product aligned direction for SIC.
