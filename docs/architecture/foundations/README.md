# SIC Architecture Foundations

This folder holds governance and foundation docs for SIC architecture.

Foundation docs protect source-of-truth material from accidental drift. Protected does not mean frozen. These docs can evolve when SIC needs better architecture, product clarity, or repo organization, but changes should be intentional and traceable.

## What Belongs Here

- Source-of-truth manifests.
- Architecture governance docs.
- Rules for how protected docs can change.
- Small foundation docs that help keep architecture and product direction aligned.

## What Should Not Go Here

- Weekly progress notes.
- Casual planning notes.
- Runtime source code.
- Product-only docs.
- Future ideas presented as shipped runtime behavior.

## Important Files

- `source-of-truth-manifest.md`
  - Defines protected source-of-truth docs, amendment philosophy, ADR-required changes, and review checklist.

## Change Rules

- Changes should be reviewed, intentional, and traceable.
- Major changes may require an ADR or explicit architecture decision.
- Small clarifications can be made through normal doc review.
- Historical docs should not be rewritten to pretend the past was different.
- Future or parked docs should not be presented as shipped runtime behavior.

