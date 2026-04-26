# SIC Documentation

This folder contains human-readable documentation for Sports Intelligence Cloud.

Docs explain product direction, API contracts, architecture, operations, decisions, and build history. They are not runtime code and should not be treated as the source for deployed behavior unless a source-of-truth doc or current source file supports the claim.

## What Belongs Here

- Architecture and platform documentation.
- API and cross-layer contract documentation.
- Product documentation for Club Vivo.
- Architecture decision records.
- Operational runbooks.
- Concise progress summaries and New SIC cleanup notes.

## What Should Not Go Here

- Runtime source code.
- Generated local outputs.
- Secrets, credentials, or real customer data.
- New product or architecture claims that contradict source-of-truth docs.

## Folder Map

- `api/`
  - API and cross-layer contract docs.
- `architecture/`
  - Platform/system architecture, principles, repo maps, source-of-truth governance, and diagram guidance.
- `product/`
  - Product documentation. Current Club Vivo product docs live under `product/club-vivo/`.
- `adr/`
  - Architecture decision records.
- `runbooks/`
  - Operational guidance for failures, smoke tests, shipping, and support workflows.
- `progress/`
  - Concise progress summaries and New SIC cleanup notes.

## Historical Progress Docs

`docs/progress/` is the clean GitHub-facing progress summary layer. Detailed historical progress history is preserved in the archive branch/tag listed in `docs/progress/README.md`.

## Product Docs

Current product docs live under:

- `docs/product/club-vivo/`

KSC-specific pilot docs belong under:

- `docs/product/club-vivo/pilots/ksc/`

Future or parked product ideas belong under:

- `docs/product/club-vivo/future/`

## Change Rules

- Keep source-of-truth docs aligned with current source.
- Do not present future or parked ideas as shipped runtime behavior.
- Public API contract changes may require an ADR or explicit architecture decision.
- Auth, tenancy, entitlement, IAM, CDK, data model, or repository-boundary changes require deliberate architecture review.
