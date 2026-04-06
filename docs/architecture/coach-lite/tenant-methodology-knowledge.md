# SIC Coach Lite — Tenant Methodology Knowledge

## Status
Draft v1

## Purpose

This document defines how SIC Coach Lite should handle club-specific methodology knowledge in a tenant-safe way.

The goal is to let clubs shape coaching output through their own methodology, terminology, and approved guidance while preserving SIC's multi-tenant boundaries and low-complexity product direction.

---

## Core Product Idea

SIC should remain one coaching platform capability.

Each club should feel like it has its own coaching assistant because the platform can load:
- tenant-scoped configuration
- tenant-scoped methodology guidance
- tenant-scoped terminology
- tenant-scoped preferences

This should not require separate bot deployments.

---

## Why This Layer Matters

A generic session generator can help coaches.
A methodology-aware session generator can help clubs.

Clubs often want coaches to follow:
- a style of play
- age-group principles
- preferred session structure
- specific vocabulary
- approved training guidance

This layer gives SIC Coach Lite a path from individual utility to club relevance.

---

## Core Security Rule

Tenant methodology knowledge must always be tenant-scoped by construction.

That means:
- tenant identity is resolved from verified auth and entitlements
- methodology data is loaded only through server-side tenant context
- no methodology is selected from client-provided tenant identifiers
- no cross-tenant retrieval is allowed

---

## v1 Scope

Tenant methodology knowledge v1 should stay intentionally small.

### In scope
- tenant configuration
- approved methodology notes
- terminology preferences
- age-group guidance
- style-of-play cues
- lightweight generation context injection

### Out of scope
- full enterprise RAG infrastructure
- cross-tenant knowledge graphs
- document-heavy search platform
- complex approval engines
- automatic curriculum generation across an organization

---

## Knowledge Layers

The methodology layer should be split into two parts.

### 1. Tenant Configuration
Structured fields that are easy to validate and apply.

Examples:
- terminology preferences
- preferred session structure
- preferred coaching tone
- intensity defaults
- age-band rules
- style-of-play preferences

### 2. Tenant Knowledge Inputs
Approved methodology content that may influence generation.

Examples:
- club methodology summaries
- curriculum notes
- age-specific guidance
- approved coaching principles
- club-specific drill notes

---

## v1 Retrieval Model

The system should retrieve methodology context like this:

1. resolve tenant context
2. load structured tenant configuration
3. determine whether approved methodology content exists
4. select only the most relevant methodology context
5. inject that context into generation
6. validate the final output against real training constraints

The methodology layer should guide the output, not dominate it.

---

## Priority Order During Generation

When multiple inputs influence the result, the system should prioritize them in this order:

1. verified tenant context
2. coach's real-world constraints
3. safety and age appropriateness
4. session contract validity
5. tenant methodology guidance
6. stylistic preferences

This rule prevents methodology from producing unrealistic or unsafe sessions.

---

## Example Use Case

A club configures the following methodology preferences:
- use the term `bibs`
- include at least one game-like moment in most sessions
- prefer possession and scanning language
- reduce complexity for younger age groups
- use club language for pressing concepts

A coach then requests:
- U12 boys
- 16 players
- 70 minutes
- half field
- 10 cones
- 8 balls
- defending focus

The product should return a session that:
- still fits the available players, equipment, time, and space
- uses the club's preferred language
- reflects the club's coaching direction where practical
- remains valid even if methodology context is minimal

---

## Suggested v1 Data Shape

The following conceptual records are useful:

### TenantBotConfig
Structured tenant-level settings.

### MethodologyDocumentMetadata
Metadata about approved methodology documents.

### MethodologySnippet
Short approved guidance segments that are easier to inject than entire documents.

### ExportBrandingConfig
Club-level export preferences for later use.

These may be implemented in different ways, but they should all remain tenant-scoped.

---

## Suggested v1 Governance Rules

Methodology data should follow these rules:
- only authorized users can edit it
- only approved knowledge can influence generation
- methodology context should be reviewable
- methodology changes should not weaken tenant isolation
- club preferences should not override session validity rules

---

## Operational Simplicity Rule

v1 should avoid building a heavy knowledge system too early.

The first useful version is likely:
- structured tenant config
- a small set of approved methodology notes or snippets
- limited context injection during generation

This is enough to prove value before investing in a broader retrieval layer.

---

## Failure Behavior

If tenant methodology knowledge is missing, incomplete, or unavailable:
- generation should still work
- the product should fall back to soccer-first defaults
- the session should remain useful and valid

Methodology should improve the session, not make it fragile.

---

## Future Expansion

Later versions may add:
- methodology versioning
- age-band packs
- richer snippet ranking
- better retrieval pipelines
- director review workflows
- club-wide curriculum layers

These should all continue using the same tenant-safe foundation.

---

## Summary

Tenant methodology knowledge lets SIC Coach Lite become more than a generic session generator.

It gives each club a tenant-scoped coaching identity while preserving:
- server-derived tenant context
- low-complexity product delivery
- realistic coach workflows
- safe and isolated data access
