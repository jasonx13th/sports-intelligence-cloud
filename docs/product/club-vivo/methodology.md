# SIC Coach Lite — Club Methodology v1

## Status
Draft v1

## Purpose

This document defines how SIC Coach Lite v1 should support club methodology.

The goal is to allow each club to shape the coaching output without requiring a separate application or separate bot deployment.

SIC should remain one platform capability with tenant-scoped methodology behavior.

---

## Core Principle

Each club should feel like it has its own coaching assistant, but SIC should implement that through:
- tenant-scoped configuration
- tenant-scoped knowledge
- tenant-scoped output behavior

Not through separate bots or separate deployments.

---

## Why Club Methodology Matters

Many clubs want more than a generic session generator.

They want coaches to receive sessions that reflect:
- club language
- age group standards
- training principles
- style of play
- planning format
- curriculum direction

Club methodology support turns SIC Coach Lite from a generic tool into a club product.

---

## Methodology v1 Design

Club methodology v1 should be lightweight and practical.

It should support two layers:

### 1. Tenant configuration
Structured settings stored per tenant.

### 2. Tenant knowledge
Approved club documents or notes that can be referenced during generation.

---

## Tenant Configuration v1

The first configuration layer should support:

- preferred terminology
  - bibs vs pinnies
  - rondo naming
  - field zone labels
- default session structure
  - warm up expectation
  - small-sided game preference
  - finishing block preference
- age band guidance
- intensity preferences
- style of play cues
  - possession-oriented
  - pressing-oriented
  - transition-oriented
- export branding
  - club name
  - logo later
  - footer text later

This should be structured and easy to validate.

---

## Tenant Knowledge v1

The first knowledge layer should support approved inputs such as:
- club methodology notes
- age-group curriculum guidance
- coaching principles
- session format examples
- style of play summaries
- approved drill notes

This layer should be controlled and intentionally limited in v1.

The goal is not to build a heavy knowledge platform yet.
The goal is to give the generator better context when the club has something useful to provide.

---

## v1 Storage Concept

Club methodology should be stored per tenant.

Possible conceptual entities:
- tenant bot config
- methodology document metadata
- approved methodology snippets
- export preferences

All club methodology data must remain tenant-scoped by construction.

---

## v1 Retrieval Concept

When a coach requests a session inside a club tenant, the system should:

1. resolve tenant context
2. load tenant configuration
3. determine whether methodology context is enabled
4. retrieve only tenant-approved guidance
5. inject only the most relevant method context into generation
6. generate and validate the final session pack

The system must never retrieve methodology from another tenant.

---

## v1 Governance Rules

Club methodology support should follow these rules:

- only authorized users can edit methodology settings
- only approved documents or notes should influence generation
- methodology context should be transparent and reviewable
- tenant context should remain server-derived
- no club methodology should be loaded from client-provided tenant identifiers

---

## v1 Output Expectations

When club methodology is active, the generated session may reflect:
- club vocabulary
- preferred progression style
- age-specific coaching tone
- methodology-aligned focus
- standardized session structure

The session should still remain practical and constrained by:
- available equipment
- available players
- available time
- available space

Methodology should guide the output, not override reality.

---

## v1 Non-Goals

Club Methodology v1 should not try to become:
- a full curriculum engine
- a full learning management system
- a heavy RAG platform
- a document warehouse
- a director approval workflow engine
- a cross-club content marketplace

Those may come later.

---

## Example

A club configures:
- terminology: use "bibs"
- U10 sessions should be lower complexity
- emphasize possession and scanning
- prefer one small-sided game in every session
- use the club training language for pressing cues

A coach then requests:
- 16 players
- U12 boys
- 75 minutes
- half field
- 10 cones
- 8 balls
- defending focus

SIC Coach Lite should generate a valid soccer session that:
- still fits the coach’s real constraints
- uses the club’s preferred language
- reflects the club’s coaching direction
- remains easy to run and export

---

## Future Expansion

Later versions may add:
- more structured curriculum layers
- age-band program packs
- methodology versioning
- richer retrieval
- stronger approval workflows
- branded club exports

But v1 should stay intentionally small and useful.

---

## Summary

Club Methodology v1 gives each club a tenant-scoped coaching identity inside SIC Coach Lite.

It should remain:
- simple
- controlled
- useful
- tenant-safe
- grounded in real coach workflows
