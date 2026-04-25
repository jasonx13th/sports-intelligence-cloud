# SIC GitHub Showcase Cleanup Plan

This document is a cleanup, restructure, naming, and README coverage plan for Sports Intelligence Cloud.

It is a decision document only. It does not delete, move, rename, or change runtime code, infrastructure, API contracts, auth, tenancy, entitlements, IAM, or CDK.

## 1. Purpose

GitHub main should showcase the current active SIC / Club Vivo product clearly.

SIC has accumulated useful build history, pilot notes, exploratory ideas, and future concepts. Those should not vanish, but GitHub main should make the current product, architecture, and runtime easy to understand first. Local VS Code workspaces, archive branches, tags, and private backup branches can preserve deeper history, detailed week-by-week work notes, and exploratory material without making the main branch harder to read.

The goal of this phase is to plan before moving anything:

- clarify product naming
- separate platform, product, pilot, future, and historical material
- decide what belongs in GitHub main
- identify what needs review before archive or removal
- improve README coverage so future files land in the correct place

## 2. Product Naming Clarification

Current naming should be clarified before moving files.

- SIC is the platform.
- Club Vivo is the current coach-facing web app and product surface.
- KSC is the first pilot/test club, not the general product.
- the former Coach Lite product-doc folder was confusing because the active app is Club Vivo and the product direction is now a shared coach workspace, not only a "lite" wedge.
- Product docs should separate general Club Vivo behavior from KSC pilot-specific material.

The current product docs still contain useful source material, but the folder name mixes platform name, wedge name, and product name. A cleaner structure should make it obvious that Club Vivo is the product surface and KSC is pilot evidence.

## 3. Proposed Product Docs Structure

These names were approved for the first product-doc restructure.

Recommended structure:

```text
docs/product/
  README.md
  club-vivo/
    README.md
    session-builder.md
    coach-workspace.md
    methodology.md
    user-flows.md
    generation-profiles/
      README.md
      soccer.md
      fut-soccer.md
    pilots/
      README.md
      ksc/
        README.md
        program-types-and-methodology.md
        pilot-readiness-notes.md
    future/
      README.md
      image-assisted-intake-parking-lot.md
      image-assisted-intake-v1-scope.md
      methodology-source-mode-planning.md
      roadmap-phases.md
```

### Naming Note: `sport-packs`

The suggested structure used `sport-packs/`. In current SIC docs, a "sport pack" appears to mean a sport-specific or flavor-specific generation profile that shapes session output, terminology, constraints, diagrams, and methodology defaults.

That concept is useful, but `sport-packs` may sound like downloadable content bundles or a runtime package system. Current source and docs are closer to generation behavior and methodology-aware profiles than packaged assets.

Recommended folder name for review:

- `generation-profiles/`

Alternative names:

- `sport-packs/`
- `methodology-packs/`
- `coaching-models/`
- `session-flavors/`

Recommendation: use `generation-profiles/` unless the product language intentionally wants a simpler coach-facing term. It matches the current system architecture vocabulary around generation context and avoids implying a separate package/plugin system.

## 4. Completed Product Docs Migration Map

The first cleanup uses `git mv` so history is preserved.

| Former file | Current destination | Reason | Classification | Move method |
| --- | --- | --- | --- | --- |
| `overview.md` | `docs/product/club-vivo/README.md` | General product overview should become the Club Vivo product landing doc, with naming updated away from Coach Lite. | Active product | `git mv` |
| `sic-session-builder.md` | `docs/product/club-vivo/session-builder.md` | Session Builder remains core Club Vivo behavior and is currently in the source-of-truth order. | Active product | `git mv` |
| `coach-workspace-v1.md` | `docs/product/club-vivo/coach-workspace.md` | Shared coach workspace is active product direction; KSC-specific sections may need splitting to pilot docs. | Active product / needs review | `git mv` |
| `club-methodology-v1.md` | `docs/product/club-vivo/methodology.md` | Club methodology v1 is active product direction, with current runtime support through the shared app. | Active product | `git mv` |
| `ksc-program-types-and-methodology-v1.md` | `docs/product/club-vivo/pilots/ksc/program-types-and-methodology.md` | This is explicitly KSC pilot/test club material, not generic product structure. | KSC pilot | `git mv` |
| `soccer-scope-v1.md` | `docs/product/club-vivo/generation-profiles/soccer.md` | Soccer-first scope describes a sport-specific generation profile. | Active product | `git mv` |
| `fut-soccer-scope-v1.md` | `docs/product/club-vivo/generation-profiles/fut-soccer.md` | Fut-Soccer is best treated as a generation profile/flavor, not a separate product. | Active product / needs review | `git mv` |
| `user-flows.md` | `docs/product/club-vivo/user-flows.md` | User flows belong with general Club Vivo product behavior. | Active product / needs review | `git mv` |
| `roadmap-phases.md` | `docs/product/club-vivo/future/roadmap-phases.md` | Older broad roadmap mixes current and future direction; keep but separate from shipped runtime. | Future parked / needs review | `git mv` |
| `image-assisted-intake-v1-scope.md` | `docs/product/club-vivo/future/image-assisted-intake-v1-scope.md` | Source has a current image-analysis path, but broader image-assisted intake is not current active product focus; classify carefully. | Needs review | `git mv` |
| `image-assisted-intake-parking-lot.md` | `docs/product/club-vivo/future/image-assisted-intake-parking-lot.md` | Explicit parking-lot/future exploration doc. | Future parked | `git mv` |
| `methodology-source-mode-planning.md` | `docs/product/club-vivo/future/methodology-source-mode-planning.md` | Explicit future planning; upload/source-mode/RAG is not shipped runtime behavior. | Future parked | `git mv` |

Potential new file after review:

- `docs/product/club-vivo/pilots/ksc/pilot-readiness-notes.md`
  - Could be extracted from Week 20/Week 21 pilot readiness and walkthrough docs after archive strategy is approved.

## 5. KSC-Specific Rule

KSC-specific docs should live under a KSC pilot folder, not in generic product docs.

Rules:

- KSC examples can stay as pilot evidence.
- KSC must not define the general product model.
- General Club Vivo docs should describe behavior usable by any club, academy, or organization.
- KSC Travel, KSC OST, and KSC methodology details should be examples or pilot configuration direction, not product-wide naming.
- The app should remain one shared coach-facing app, not a separate KSC app.

## 6. README Coverage Plan

README files should make the repo easier to navigate and help future files land in the correct folder.

| Recommended README path | Purpose of folder | What belongs here | What should not go here | Current status | Priority |
| --- | --- | --- | --- | --- | --- |
| `README.md` | Repo landing page and GitHub showcase entry | Product summary, active app, architecture map links, setup/test commands | Deep progress history or long implementation journals | Exists | High |
| `apps/README.md` | App workspace index | Active and future app folder explanations | Backend services, infra docs | Needs create | High |
| `apps/club-vivo/README.md` | Club Vivo frontend guide | Next app purpose, routes, env expectations, local dev, validation | Backend contracts or platform history | Exists | High |
| `services/README.md` | Backend services index | Service folders and ownership boundaries | Frontend docs or product roadmaps | Needs create | High |
| `services/club-vivo/README.md` | Club Vivo backend service overview | API service purpose and subfolders | Auth trigger ownership | Needs create | Medium |
| `services/club-vivo/api/README.md` | API/Lambda implementation guide | Handler folders, domain layout, tests, local commands | CDK resource definitions as the primary source | Needs create | High |
| `services/auth/README.md` | Auth Lambda guide | Cognito triggers, tenant entitlement provisioning, tests | App login UX or API contracts | Needs create | High |
| `infra/README.md` | Infrastructure index | CDK app locations and deployment docs | Runtime handler implementation details | Needs create | High |
| `infra/cdk/README.md` | CDK stack guide | API/auth stack commands, deploy/synth notes | Product planning | Exists | High |
| `docs/README.md` | Docs map | API, architecture, product, ADR, runbooks, progress history | Runtime code details | Needs create | High |
| `docs/api/README.md` | API contract index | Contract file list and change rules | Product brainstorming | Needs create | High |
| `docs/architecture/README.md` | Architecture index | System maps, principles, source-of-truth docs, diagrams | Weekly progress history | Needs create | High |
| `docs/architecture/diagrams/README.md` | Diagram assets guide | Editable diagram sources and exports | Runtime behavior claims not supported by docs/source | Exists | Medium |
| `docs/architecture/foundations/README.md` | Foundation docs guide | Source-of-truth manifest and governing docs | Casual notes or progress summaries | Needs create | High |
| `docs/product/README.md` | Product docs index | Product areas and naming rules | Architecture contracts or runbooks | Needs create | High |
| `docs/product/club-vivo/README.md` | Club Vivo product landing | Current product behavior, links to product docs | KSC-only pilot rules except as links | Future create | High |
| `docs/product/club-vivo/pilots/README.md` | Pilot docs index | Pilot/test club folders and evidence | Generic product rules | Future create | Medium |
| `docs/product/club-vivo/pilots/ksc/README.md` | KSC pilot index | KSC-specific program, methodology, readiness notes | General Club Vivo product model | Future create | Medium |
| `docs/product/club-vivo/future/README.md` | Future/parked product docs guide | Parking-lot and future direction docs | Shipped runtime claims | Future create | Medium |
| `docs/adr/README.md` | ADR index | ADR list, decision status, when to add ADRs | Progress notes or implementation logs | Needs create | High |
| `scripts/README.md` | Scripts guide | Smoke tests and utility scripts | App source or infra source | Needs create | Medium |
| `datasets/README.md` | Dataset/schema guide | Export schemas and validation expectations | Runtime data dumps | Needs create | Medium |
| `postman/README.md` | Postman collection guide | Collections, environments, usage notes | Source-of-truth API contracts | Exists | Low/medium |
| `.github/README.md` | GitHub automation guide | Workflows and repo automation notes | Product docs or local dev setup | Optional create | Low |

README creation should happen in grouped commits, not all at once, so each folder guide can be reviewed clearly.

## 7. GitHub Main Should Keep

GitHub main should keep the current active runtime, infrastructure, and governing docs:

- `apps/club-vivo`
- `services/club-vivo/api` active backend source
- `services/auth`
- `infra/cdk`
- `docs/api`
- `docs/architecture`
- `docs/adr`
- current product docs after restructure
- `.github` workflows
- `Makefile`
- `scripts`
- `datasets` if CI/docs require export schemas
- `postman` if still useful for API exploration and demonstrations

## 8. Candidate Move/Remove From GitHub Main After Backup

These are candidates only after an archive branch/tag or other backup exists:

- `docs/progress/week_*` detailed weekly history
- old week/class-session docs
- README-only future app folders:
  - `apps/ruta-viva`
  - `apps/athlete-evolution-ai`
- parked/future planning docs if they clutter showcase and after they are preserved elsewhere
- preview/demo-only app routes if not needed for the current product:
  - `apps/club-vivo/app/(protected)/sessions/coach-lite-preview/`

Do not delete these directly from working history without an approved archive strategy.

## 9. Needs Deeper Review Before Cleanup

These areas need source and dependency review before cleanup:

- `services/club-vivo/api/clubs`
- `services/club-vivo/api/memberships`
- `services/club-vivo/api/exports-domain`
- `services/club-vivo/api/lake-ingest`
- `services/club-vivo/api/lake-etl`
- domain export/lake docs and runbooks
- `apps/club-vivo/app/(protected)/sessions/coach-lite-preview`
- browser-local hint helpers:
  - `apps/club-vivo/lib/coach-team-hints.ts`
  - `apps/club-vivo/lib/equipment-hints.ts`
  - `apps/club-vivo/lib/selected-team.ts`
- `postman`
- `datasets/schemas/exports/v1`

Review questions:

- Is this active runtime?
- Is it used by CI, docs, or demos?
- Is it parked source that should remain visible?
- Is it historical only?
- Would moving it break imports, routes, workflows, or docs?

## 10. Do Not Move Without ADR Or Explicit Architecture Decision

Do not move or restructure these without an ADR or explicit architecture decision:

- `infra/cdk`
- `services/club-vivo/api/src/platform/tenancy/tenant-context.js`
- `services/club-vivo/api/src/platform/http/with-platform.js`
- `services/club-vivo/api/src/platform/errors/errors.js`
- `services/club-vivo/api/src/domains/*/*-repository.js`
- `services/auth`
- `docs/api`
- `docs/adr`
- currently CDK-wired API handler route folders
- public API contracts
- source-of-truth order

These areas define platform safety, runtime boundaries, durable data access, public contracts, or governance structure.

## 11. Proposed Cleanup Sequence

Use small commits.

1. Create archive branch/tag.
2. Update product docs structure using `git mv` after approval.
3. Update source-of-truth manifest references.
4. Update system map and inventory references.
5. Create/update README files by folder group.
6. Update root README navigation.
7. Review/remove or archive placeholder future app folders.
8. Review/archive weekly progress docs.
9. Review preview/demo routes.
10. Validate after every step.

Recommended commit grouping:

- product-doc rename/move only
- source-of-truth link updates
- README coverage batch 1: root/docs/architecture/docs/api/docs/product
- README coverage batch 2: apps/services/infra/scripts/datasets
- optional archive/removal decisions after review

## 12. Validation Checklist

Run validation based on what changed:

- `git diff --check`
- frontend typecheck from `apps/club-vivo`:
  - `cmd /c npx tsc --noEmit`
- backend tests:
  - `npm test --prefix services/club-vivo/api`
- CDK build/synth if infra is touched
- CI guardrails if applicable
- grep/search for old paths after `git mv`
- check README links after rename/move
- check source-of-truth manifest links after product doc restructure
- check system map and repo inventory links after product doc restructure

## 13. Open Decisions For Human Approval

Decisions needed before actual move/delete:

- Confirm whether any remaining internal "SIC Coach Lite" wording should be rewritten to Club Vivo now or preserved as wedge/history language.
- Should `sport-packs` be renamed to `generation-profiles`, `methodology-packs`, `coaching-models`, or `session-flavors`?
- Where exactly should KSC pilot docs live?
- Keep or archive `docs/progress` from GitHub main?
- Keep or remove README-only future app folders?
- Keep or remove `coach-lite-preview`?
- Keep `postman` top-level?
- Keep `datasets` export schemas top-level?
- What should GitHub `README.md` highlight first?
- Which README files should be created first?
- Should `roadmap-vnext.md` remain in the source-of-truth order after moving away from week-based work?
- Should `docs/product/club-vivo/future/image-assisted-intake-v1-scope.md` be future/parked, active reference, or architecture-only evidence?

## 14. Proposed First Cleanup Action

After this plan is approved, the first actual cleanup action should be:

Create an archive branch or tag from the current state before any move/delete/rewrite work.

Then, in the next cleanup commit, update README coverage for the highest-priority docs folders and continue validating after each small step.
