# SIC Architecture Docs

This folder contains platform and system architecture documentation for Sports Intelligence Cloud.

Architecture docs explain how SIC is structured, what boundaries matter, and how current source maps to the running Club Vivo product.

## What Belongs Here

- Platform principles and constitution.
- Tenancy, auth, and source-of-truth contracts.
- Current system maps and repo inventories.
- Architecture cleanup and reorganization plans.
- Diagram source guidance.
- Architecture notes that are broader than one product spec.

## What Should Not Go Here

- Runtime source code.
- API contracts that belong in `docs/api/`.
- Product-only docs that belong in `docs/product/`.
- Historical weekly progress notes.
- Unapproved future architecture presented as active runtime behavior.

## Important Files

- `architecture-principles.md`
- `platform-constitution.md`
- `tenant-claim-contract.md`
- `club-vivo-source-map.md`
- `repo-structure.md`
- `sic-repo-inventory.md`
- `sic-current-system-map.md`
- `github-showcase-cleanup-plan.md`

## Important Subfolders

- `club-vivo/`
  - Current Club Vivo architecture area, including `diagram-sequence-spec-v1.md` as the proposed structured diagram and future animation data spec.
- `diagrams/`
  - Official architecture diagram guidance, blueprints, editable diagram sources, and exported images.
- `foundations/`
  - Governance and source-of-truth foundation docs.
- `coach-lite/`
  - Legacy naming that still contains useful architecture material for generation flow, diagram rendering, drill diagram specs, and tenant methodology knowledge.

## Change Rules

- System maps and diagrams should reflect current source files.
- Do not introduce architecture in a diagram if it is not in source or approved docs.
- Changes to auth, tenancy, entitlements, IAM, CDK, data access, public API contracts, or source-of-truth order require deliberate architecture review.
- Keep future or parked architecture clearly labeled.

## Related Source-Of-Truth Docs

- `foundations/source-of-truth-manifest.md`
- `architecture-principles.md`
- `platform-constitution.md`
- `tenant-claim-contract.md`
