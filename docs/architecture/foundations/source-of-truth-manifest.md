# SIC Source-of-Truth Manifest

This manifest identifies protected Sports Intelligence Cloud architecture, product, and contract documents.

Protected does not mean untouchable or frozen. SIC source-of-truth docs are living governing documents. They can and should evolve when the product, architecture, or repo organization needs better clarity. Protected means changes should be reviewed, intentional, and traceable so the repo does not drift by accident.

This manifest does not move, delete, rename, or reclassify runtime code. It only describes the current document governance surface.

## 1. Purpose

The purpose of this manifest is to protect source-of-truth docs from accidental drift.

These docs define or constrain important SIC behavior: product scope, architecture boundaries, tenancy, public contracts, repo structure, and execution direction. They should remain easy to find and should not be casually contradicted by newer notes, demos, progress summaries, or future planning documents.

These documents can evolve when SIC needs better architecture, product clarity, or repo organization. Changes should make the system more accurate and easier to govern, not simply rewrite history or blur the line between shipped behavior and planned work.

## 2. Amendment Philosophy

Source-of-truth docs are living documents.

- Changes are allowed when they improve SIC.
- Major changes require an ADR or explicit architecture decision.
- Small clarifications can be made with normal doc review.
- Historical docs should not be rewritten to pretend the past was different.
- Future or parked docs should not be presented as shipped runtime behavior.

When a protected doc changes, the change should be traceable to one of these reasons:

- the current implementation changed and the doc needs to stay true
- a product or architecture decision intentionally changed direction
- a doc was ambiguous, stale, or incomplete and needed clarification
- repo organization work created a better home or cross-reference for the same governing idea

## 3. Source-of-Truth Order

This order follows the current platform constitution. When there is ambiguity, use this order:

1. `docs/architecture/architecture-principles.md`
2. `docs/architecture/platform-constitution.md`
3. `docs/vision.md`
4. `docs/architecture/tenant-claim-contract.md`
5. `docs/product/club-vivo/session-builder.md`
6. `docs/progress/build-progress/roadmap-vnext.md`

Changing this order requires an ADR or explicit architecture decision.

## 4. Protected Architecture Docs

These architecture docs should not change accidentally:

- `docs/architecture/architecture-principles.md`
  - Highest-priority architecture principles.
- `docs/architecture/platform-constitution.md`
  - Governing platform constitution and current source-of-truth order.
- `docs/architecture/tenant-claim-contract.md`
  - Tenant claim and identity contract.
- `docs/architecture/repo-structure.md`
  - Existing repo structure map.
- `docs/architecture/platform-overview.md`
  - Current platform overview.
- `docs/architecture/sic-repo-inventory.md`
  - Current source-based repo inventory for architecture and reorganization planning.

## 5. Protected API Contract Docs

These API and internal contract docs define public or cross-layer expectations and should not change accidentally:

- `docs/api/session-builder-v1-contract.md`
- `docs/api/session-pack-contract-v2.md`
- `docs/api/team-layer-v1-contract.md`
- `docs/api/methodology-v1-contract.md`
- `docs/api/generation-context-v1-contract.md`
- `docs/api/resolved-generation-context-v1-contract.md`
- `docs/api/session-feedback-v1-contract.md`
- `docs/api/platform-error-contract.md`

Other files in `docs/api/` are also contract/reference docs and should be reviewed carefully when changed, especially when a change would affect clients, handlers, tests, saved data, or deployment behavior.

## 6. Product Source-of-Truth Docs

These Club Vivo product docs define active product direction and should not change accidentally:

- `docs/product/club-vivo/session-builder.md`
  - Session Builder product source of truth.
- `docs/product/club-vivo/coach-workspace.md`
  - Shared coach workspace direction.
- `docs/product/club-vivo/pilots/ksc/program-types-and-methodology.md`
  - KSC program and methodology framing.
- `docs/product/club-vivo/methodology.md`
  - Club methodology v1 product framing.

Future-facing language inside product docs should stay clearly labeled as future direction when it does not represent shipped runtime behavior.

## 7. Historical Docs

Historical docs preserve how the project actually evolved.

- `docs/progress/week_*`
- `docs/progress/build-progress/architect_process_log.md`
- progress closeout summaries
- walkthrough scripts
- QA notes

These files should not be rewritten casually. They can be corrected for factual mistakes, broken references, or obvious clarity problems, but they should not be rewritten to erase the actual build path.

Historical docs are evidence and narrative context, not active runtime code.

## 8. Parked/Future Docs

Parked and future-planning docs preserve ideas that may matter later, but they do not represent shipped runtime behavior.

Current examples include:

- `docs/product/club-vivo/future/image-assisted-intake-parking-lot.md`
- `docs/product/club-vivo/future/methodology-source-mode-planning.md`

These docs should remain clearly separated from active source-of-truth docs unless a later architecture/product decision moves their scope into active work.

## 9. ADR-Required Or Explicit-Decision Changes

The following changes require an ADR or explicit architecture decision before source-of-truth docs are changed to endorse them:

- auth model changes
- tenancy model changes
- entitlements model changes
- accepting `tenant_id`, `tenantId`, or `x-tenant-id` from client input
- repository or data-access boundary changes
- moving CDK or infra source structure
- moving API handler route folders
- public API contract changes
- durable data model changes
- replacing the shared app model with separate apps
- introducing new AWS service dependencies such as broad RAG, vector store, Glue, Athena, or SageMaker as active product dependencies
- changing the source-of-truth order itself

## 10. Normal-Change Docs

The following docs can usually be updated through normal doc review, as long as the edits do not contradict protected source-of-truth docs:

- closeout summaries
- walkthrough scripts
- progress notes
- README files
- diagram docs

Diagram docs can be updated normally when they clarify the current system. If a diagram asserts new architecture boundaries, product scope, data flow, tenancy behavior, IAM behavior, or infrastructure dependencies, use the ADR/explicit-decision path instead.

## 11. Source-of-Truth Improvement Backlog

Starter candidates for later review:

- Review whether `docs/progress/build-progress/roadmap-vnext.md` should remain a source-of-truth doc now that SIC is moving away from week-based work.
- Review whether `docs/architecture/repo-structure.md` and `docs/architecture/sic-repo-inventory.md` should be merged, cross-linked, or kept separate.
- Review whether `docs/architecture/platform-constitution.md` should mention the new repo architecture audit phase.
- Review whether `docs/vision.md` should be updated after the new system map is created.

## 12. Review Checklist

Before modifying a protected doc, ask:

- Does this change alter product scope?
- Does this change alter architecture boundaries?
- Does this change affect auth, tenancy, entitlements, IAM, CDK, or data access?
- Does this require an ADR?
- Does this contradict any higher-priority source-of-truth doc?
- Does this describe shipped runtime behavior or future/parked direction?
