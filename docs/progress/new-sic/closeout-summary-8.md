# New SIC Closeout Summary 8 - Club Vivo Source-Of-Truth Alignment

## Branch

`sic-evolution-source-of-truth`

## Theme

Club Vivo/SIC source-of-truth alignment, repo readability cleanup, and long-lived product direction.

## Summary

This work session closed out the Club Vivo evolution source-of-truth pass beyond the original Training Prescription branch.

It aligned the current repo around:

- SIC as the platform
- Club Vivo as the current coach-facing product
- Session Builder as the active runtime wedge
- Coach Workspace as the surrounding product experience
- a proposed soccer-only Training Prescription Layer as the next evolution
- structured diagram sequence data as the preferred source of truth for diagrams
- GitHub/current repo docs as the official source for future project context

This was documentation/source-of-truth work only. It does not claim runtime implementation.

Main is now pushed through:

- `ad0bc93 docs: add Club Vivo evolution roadmap`

## Final Commits / Checkpoints

- `c0ba358 docs: define Club Vivo Training Prescription direction`
- `ed593f9 docs: align repo structure with Club Vivo source map`
- `ad0bc93 docs: add Club Vivo evolution roadmap`

## Source-Of-Truth Files Created Or Updated

- `docs/architecture/club-vivo-source-map.md`
- `docs/product/club-vivo/training-prescription-layer.md`
- `docs/api/training-brief-v1-contract.md`
- `docs/architecture/club-vivo/diagram-sequence-spec-v1.md`
- `docs/adr/ADR-0011-soccer-only-training-prescription-layer.md`
- `docs/architecture/repo-structure.md`
- `docs/product/club-vivo/club-vivo-evolution-roadmap.md`
- `docs/architecture/platform-constitution.md`
- `docs/vision.md`

## Important Decisions

- Club Vivo active evolution is soccer/football/fútbol only.
- Futsal and multi-sport expansion are parked.
- Session Builder remains the active runtime wedge.
- Coach Workspace remains the surrounding product experience.
- Training Prescription extends Session Builder instead of replacing it.
- Training Prescription does not create a separate app, backend service, or tenancy path.
- Training Brief is the proposed bridge from evidence to training objective and session direction.
- DiagramSequence is a proposed structured diagram data contract, not raw generated imagery.
- Diagrams are a five-star requirement.
- Training Prescription, Training Brief, and DiagramSequence are not shipped runtime behavior yet.
- The long-lived roadmap now lives at `docs/product/club-vivo/club-vivo-evolution-roadmap.md`.

## ChatGPT Project Source Guidance

- Keep source files lean and current.
- Use GitHub/current repo as the official source.
- Keep closeout summaries as session handoffs, not long-term roadmap sources.
- Use `docs/product/club-vivo/club-vivo-evolution-roadmap.md` as the long-lived direction guide.
- Refresh project source context from current source-of-truth docs rather than older branch notes when they diverge.

## Guardrails Preserved

- tenant isolation
- server-derived tenant context
- entitlements as the authorization source
- validation
- observability
- cost-awareness
- product value before platform expansion

## Next Recommended Implementation Slices

1. Training Brief intake UI draft
2. Training Brief validation module
3. Session Builder handoff mapping
4. DiagramSequence validator alignment
5. Diagram-first activity output prototype

These are recommended future slices. They are not claims of current runtime behavior.

## Next-Session Starting Point

1. Start from clean `main`.
2. Pull `origin/main`.
3. Create branch `training-brief-intake-ui`.
4. Begin with a Training Brief intake draft inside the existing Club Vivo path.

The first implementation pass should stay inside the existing Club Vivo and Session Builder path unless an explicit architecture decision changes that.

## Closeout Note

This session established the decision frame, repo placement frame, and long-lived product roadmap for the next Club Vivo evolution without changing runtime code.

Implementation should begin with small, tenant-safe slices that preserve the existing Session Builder path and prove the evidence-to-training bridge before adding broader intelligence infrastructure.
