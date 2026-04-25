# Club Vivo Product Overview

## Naming Note

SIC is the platform. Club Vivo is the current coach-facing product and app surface. Older references in this document to SIC Coach Lite describe the original product wedge that has now been reorganized under Club Vivo product docs.

## Status
Draft v1

## Product Summary

SIC Coach Lite is the first club-facing product inside Sports Intelligence Cloud.

It helps coaches turn real-world training constraints into usable training sessions that are fast to run, visually clear, and easy to export. The first release is built specifically for soccer.

SIC Coach Lite is not just a chatbot. It is a coaching workflow product that combines:
- structured coach intake
- session generation
- session validation
- drill diagram generation
- exportable session packs

The goal is to save coaches time while helping clubs maintain methodology consistency.

---

## Problem

Many coaches, especially grassroots and low-resource coaches, do not need more theory. They need help building a session they can actually run today.

Their real constraints are things like:
- number of players
- number of balls
- number of cones
- goals or mini goals available
- field size
- indoor or outdoor space
- session duration
- technical or tactical focus

Most tools either:
- return generic text
- assume ideal conditions
- require too much manual work
- do not reflect club methodology
- do not provide clear visual setup

SIC Coach Lite is designed to solve that.

---

## Who It Serves

### Primary users
- grassroots soccer coaches
- assistant coaches
- solo coaches
- small clubs and academies
- nonprofit sports programs

### Secondary users
- technical directors
- club directors
- coach educators
- program coordinators

---

## Core Product Promise

Tell SIC Coach Lite what you have today, and it will generate a session you can run now.

That includes:
- the structure of the session
- the activity order
- clear instructions
- coaching points
- progressions and regressions
- visual drill diagrams
- printable export

---

## Why Soccer First

SIC is designed as a multi-sport platform over time, but Coach Lite v1 is soccer-first.

That choice keeps the first release focused and credible. Soccer offers:
- strong founder-context fit
- repeatable drill patterns
- common youth coaching workflows
- natural club methodology use cases
- high reuse for future futsal support

Future sports may be added later, but the first release should be excellent for soccer before it becomes broader.

---

## Product Positioning

### User-facing product name
SIC Coach Lite

### Internal feature wedge
Session Builder

### Platform relationship
SIC Coach Lite is the first product layer that turns SIC from a platform foundation into a coach-facing workflow.

It sits on top of:
- authenticated tenant-safe access
- entitlements-backed tenant context
- session generation APIs
- exports
- observability
- Club Vivo product direction

For Coach Lite v1, the backend path should stay aligned to the existing Session Builder modules and the existing `POST /session-packs` endpoint family. The contract should evolve in place rather than creating a parallel Coach Lite generation pipeline.

---

## Key Product Principles

### 1. Product value first
The first release must be useful for real coaches, not just technically interesting.

### 2. Visual clarity matters
The output must not be text only. It should include clear diagrams for setup, cones, players, balls, and movement.

### 3. Low-cost delivery
The first version should remain realistic for a solo builder and affordable for low-resource clubs.

### 4. Methodology-aware over time
Each club should be able to shape the product with its own terminology, session preferences, and methodology.

### 5. Tenant-safe by design
All club data, session history, and methodology context must stay tenant-scoped by construction.

---

## V1 Capabilities

Coach Lite v1 should support:

- soccer-only intake
- structured coach input
- generation of a validated session pack
- one or more drill diagrams per session
- a single-string `instructions` field per activity
- save session
- export session
- basic session edits such as:
  - make it easier
  - make it harder
  - change focus
  - adapt to smaller space
  - adapt to fewer balls

---

## V1 Non-Goals

The first version is not trying to do all of the following:

- support every sport
- replace full coaching education
- offer advanced performance science recommendations
- include live video breakdown
- include drag-and-drop diagram editing
- provide full club operating system workflows
- introduce heavy AI/ML infrastructure too early

---

## Product Value for Clubs

SIC Coach Lite helps clubs by:
- improving coach consistency
- reducing session planning time
- supporting less experienced coaches
- making methodology more reusable
- creating printable session assets
- laying the groundwork for club-wide coaching intelligence later

---

## Product Value for Coaches

SIC Coach Lite helps coaches by:
- turning constraints into usable training sessions
- giving structure when time is limited
- making setup easier through visual diagrams
- reducing planning stress
- giving a better starting point for adaptation

---

## Success Signals

Early success should be measured by:
- first session generated
- repeat session generation
- sessions saved
- sessions exported
- coach feedback after running a session
- club pilot adoption

---

## Summary

SIC Coach Lite is the first practical coaching product in SIC.

It starts with soccer, focuses on clear session output and visual setup, and gives clubs a realistic way to support coaches without requiring expensive tools or heavy infrastructure.
