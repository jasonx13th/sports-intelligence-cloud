# SIC Architecture Diagrams

This folder is for official editable architecture diagram sources and exported images for Sports Intelligence Cloud / Club Vivo.

## Purpose

Use this folder for durable architecture diagram assets that should live with the repo.

Recommended contents include:

- editable diagram sources, such as `.drawio` files
- exported images, such as `.png` or `.svg` files
- supporting notes only when they are needed to explain a diagram source

This folder is not a place to introduce new architecture by drawing it first. Diagrams should reflect current source files or approved architecture/product docs.

## Relationship To The System Map

`docs/architecture/sic-current-system-map.md` is the current text source of truth for the system map.

Diagrams in this folder should be traceable to:

- `docs/architecture/sic-current-system-map.md`
- `docs/architecture/sic-repo-inventory.md`
- current source files
- approved source-of-truth docs or ADRs

Diagrams should not introduce architecture that is not present in source or approved docs.

## Recommended Tools

- draw.io / diagrams.net
  - Preferred for official repo-owned editable diagrams.
  - Store the editable `.drawio` source in this folder.
- Miro
  - Useful for colorful working boards, stakeholder explanation, and presentation boards.
  - Treat Miro as a collaboration/presentation surface unless a durable export is intentionally added to the repo.
- Mermaid
  - Useful inside markdown for lightweight source-controlled diagrams.
  - Best for diagrams that should remain close to prose docs.
- Structurizr or similar C4 tooling
  - Optional future direction if SIC needs more formal architecture modeling later.

## Proposed File Naming

Use names that identify the system area and keep editable sources next to exports.

Examples:

- `sic-current-system.drawio`
- `sic-current-system.png`
- `sic-frontend-route-map.drawio`
- `sic-backend-api-map.drawio`
- `sic-quick-session-flow.drawio`
- `sic-session-builder-flow.drawio`
- `sic-auth-tenancy-flow.drawio`
- `sic-aws-resource-map.drawio`

When an exported image exists, it should be regenerated from the matching editable source.

## Diagram Set To Create Next

First official diagrams to create:

- Current system overview
- Frontend route map
- Backend API/domain/data map
- Quick Session flow
- Session Builder flow
- Auth and tenant context flow
- AWS resource map
- Data ownership map for teams, sessions, and methodology

## Visual Style Guidance

Use color by layer:

- frontend
- API/Lambda
- domain logic
- data stores
- auth/security
- AI/Bedrock
- observability
- parked/future

Guidelines:

- Clearly label current runtime vs parked/future areas.
- Use arrows with verbs, such as "calls", "validates", "loads", "writes", or "publishes".
- Avoid overclaiming unshipped features.
- Show the tenant boundary explicitly.
- Keep the shared Club Vivo coach-facing app visible as the current product direction.
- Do not imply a separate admin app, separate Quick Session backend product, methodology upload/source-mode, broad RAG/vector infrastructure, or deeper PDF document design unless source or approved docs support it.

## Update Rules

- Update the markdown system map first when architecture meaning changes.
- Update draw.io diagrams after source or system map changes.
- Regenerate exported PNG/SVG files from editable sources.
- Do not make diagram-only architecture changes without docs/source support.
- If a diagram contradicts the system map, source code, or a higher-priority source-of-truth doc, fix the diagram or open an architecture decision before presenting it as official.

## Miro Note

Miro boards can be used for colorful explanation and stakeholder review.

The repo should still keep durable architecture diagram source in draw.io or markdown.

Miro exports can be linked or stored later if they become useful for review, evidence, or presentation.

