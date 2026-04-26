# Coach Lite Preview Audit

## 1. Purpose

This audit supports the cleanup decision for old Coach Lite preview and demo material in the current SIC repository.

It is an audit document only. It does not delete, move, rename, or rewrite existing files. It does not change runtime code, infrastructure, API contracts, auth, tenancy, entitlements, IAM, or CDK.

The cleanup question is whether Coach Lite material should remain in GitHub `main`, be relabeled as historical/preview material, be migrated into current Club Vivo documentation, or be removed from `main` after the useful decisions are preserved elsewhere.

## 2. What Coach Lite Originally Was

Based on the current source and docs, "Coach Lite" appears to be a mix of older product wedge, preview route, and architecture planning language.

Current interpretation:

- Old product wedge/name: Coach Lite appears in older product and architecture docs as a lightweight coach-facing session generation concept.
- Preview route: `apps/club-vivo/app/(protected)/sessions/coach-lite-preview/page.tsx` is a standalone protected preview page for rendering a generated or mock session pack.
- Internal draft/preview bridge: the preview route calls the existing `POST /session-packs` path, adapts the response into a `SessionPackV2` display shape, and falls back to a local mock pack if generation fails.
- Architecture planning label: `docs/architecture/coach-lite/` contains durable ideas about generation flow, diagram rendering, drill diagram specs, and tenant-scoped methodology knowledge.
- Historical artifact: New SIC cleanup docs now identify Club Vivo as the active coach-facing app, with Coach Lite preview material as something to review before deciding whether it belongs in the active app tree.

It does not appear to be the current product identity. The current product framing is Club Vivo as one shared coach-facing app, with Quick Session as a fast lane inside the shared session workflow rather than a separate backend product.

## 3. Current Files Found

Coach Lite related app files:

- `apps/club-vivo/app/(protected)/sessions/coach-lite-preview/page.tsx`
- `apps/club-vivo/app/(protected)/sessions/coach-lite-preview/mock-session-pack.ts`
- `apps/club-vivo/components/coach/CoachPrimaryNav.tsx`

Coach Lite architecture docs:

- `docs/architecture/coach-lite/coach-lite-generation-flow.md`
- `docs/architecture/coach-lite/diagram-rendering-architecture.md`
- `docs/architecture/coach-lite/drill-diagram-spec-v1.md`
- `docs/architecture/coach-lite/tenant-methodology-knowledge.md`

Other docs with Coach Lite references:

- `docs/api/chat-contract-v1.md`
- `docs/api/diagram-rendering-contract-v1.md`
- `docs/api/session-pack-contract-v2.md`
- `docs/architecture/README.md`
- `docs/architecture/github-showcase-cleanup-plan.md`
- `docs/architecture/repo-structure.md`
- `docs/architecture/sic-current-system-map.md`
- `docs/architecture/sic-repo-inventory.md`
- `docs/product/club-vivo/README.md`
- `docs/product/club-vivo/coach-workspace.md`
- `docs/product/club-vivo/user-flows.md`
- `docs/product/club-vivo/future/roadmap-phases.md`
- `docs/product/club-vivo/generation-profiles/README.md`
- `docs/product/club-vivo/generation-profiles/soccer-futbol.md`
- `docs/product/club-vivo/methodology/README.md`
- `docs/product/club-vivo/pilots/ksc/program-types-and-methodology.md`
- `docs/progress/weekly-progress-notes.md`
- `docs/progress/new-sic/closeout-summary-1.md`
- `docs/progress/new-sic/new-sic-starting-point-plan.md`

Runtime/backend references using Coach Lite naming:

- `services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.test.js`
- `services/club-vivo/api/src/domains/session-builder/session-pack-templates.js`
- `services/club-vivo/api/src/domains/session-builder/session-pack-templates.test.js`
- `apps/club-vivo/lib/types/drill-diagram-spec.ts`

## 4. Runtime Dependency Check

### Is `/sessions/coach-lite-preview` reachable from navigation?

No direct navigation link was found in the primary coach navigation.

`CoachPrimaryNav.tsx` defines nav items for Home, New Session, Methodology, Teams, Equipment, and Sessions. It does not include a Coach Lite preview item.

The nav does know about `/sessions/coach-lite-preview` only to exclude that path from the normal Sessions active-state behavior. That means the route is recognized, but not presented as a standard current navigation destination.

The route remains reachable by direct URL because it exists as a Next.js route under the protected app tree.

### Is it imported by current Session Builder, Quick Session, Sessions, or Saved Session Detail?

No imports from current Session Builder, Quick Session, Sessions, or Saved Session Detail into the preview route were found.

Search results show the preview page imports the mock pack from its sibling file, but no current session workflow imports the preview route or mock pack.

### Does any current runtime code depend on `mock-session-pack.ts`?

Only the preview route appears to depend on `mock-session-pack.ts`.

Found dependency:

- `apps/club-vivo/app/(protected)/sessions/coach-lite-preview/page.tsx` imports `MOCK_COACH_LITE_SESSION_PACK` from `./mock-session-pack`.

No other app or service import of the mock pack was found.

### Does removing the route appear likely to break TypeScript?

Removing both `page.tsx` and `mock-session-pack.ts` together does not appear likely to break TypeScript based on imports found in this audit, because the mock pack is only used by that route.

However, a removal change should also update the special-case route check in `CoachPrimaryNav.tsx` and then run the app typecheck/build to confirm there are no path, route, or lint assumptions left behind.

### Does removing `docs/architecture/coach-lite` appear likely to break current docs?

Yes, removing `docs/architecture/coach-lite/` without doc updates would make current documentation stale.

Current architecture and repo-navigation docs still mention the folder as older Coach Lite architecture material. API and product docs also still use Coach Lite terminology in places. Those references should be reviewed before removing the architecture folder from `main`.

## 5. Documentation Value

The Coach Lite architecture docs still contain useful decisions, even if the product label is historical.

Useful content to preserve or migrate:

- `coach-lite-generation-flow.md`: useful because it states that the generation path should extend the existing Session Builder flow in place, remain tenant-safe, validate output before delivery, and avoid a parallel product-silo backend.
- `diagram-rendering-architecture.md`: useful because it explains the structured rendering decision, including deterministic SVG/PNG-style output instead of freeform image generation.
- `drill-diagram-spec-v1.md`: useful because it defines a structured drill diagram contract aligned with SessionPack output, rendering, export, validation, and tenant safety.
- `tenant-methodology-knowledge.md`: useful because it explains tenant-scoped methodology knowledge, server-derived tenant context, and methodology as generation guidance rather than an override of real-world constraints.

Potential migration targets before doc removal:

- Club Vivo Session Builder architecture docs
- Club Vivo methodology docs
- Diagram rendering/API docs
- Current system map or architecture summary

Content that may be safe to leave only in archive later:

- Coach Lite product naming as a standalone product identity
- Preview/demo route walkthrough language
- Draft-only wording that predates the Club Vivo cleanup
- Historical references to Coach Lite as the main app surface

## 6. Cleanup Options

### Option A: Keep Coach Lite Preview And Docs In `main`

Keep the preview route and `docs/architecture/coach-lite/`, but label both as historical or preview material.

Pros:

- Lowest immediate risk.
- Preserves all historical context in GitHub `main`.
- Avoids accidentally losing useful architecture decisions.

Cons:

- Keeps old product language visible in the active app tree.
- Makes GitHub readers wonder whether Coach Lite is a current product surface.
- Leaves an unlinked preview route available by direct URL.

### Option B: Remove Preview Route, Keep Useful Docs As Architecture History

Remove the unlinked preview route and mock pack from the app tree, update references, and keep the useful architecture docs for now.

Pros:

- Cleans active app routes without losing architecture decisions.
- Aligns `apps/club-vivo` around current Club Vivo surfaces.
- Keeps the safest path for later migration of diagram, methodology, and generation-flow decisions.

Cons:

- Requires careful reference updates and frontend validation.
- Leaves Coach Lite wording in docs until a later docs migration pass.
- Requires deciding which architecture docs should be renamed, migrated, or archived later.

### Option C: Remove Preview Route And Archive Old Coach Lite Docs From `main`

Remove the preview route and remove old Coach Lite architecture docs from GitHub `main`, relying on archive branch/tag history and current Club Vivo docs.

Pros:

- Cleanest GitHub `main`.
- Strongest current-product presentation.
- Removes old product naming from prominent repo locations.

Cons:

- Highest documentation-loss risk.
- Requires migration of durable diagram/methodology/generation decisions first.
- Current docs and API references would need a coordinated update.

## 7. Recommendation

The safest next step is Option B.

If the preview route is not linked from navigation and is not imported by current Session Builder, Quick Session, Sessions, or Saved Session Detail, remove the preview route from the app tree and update references in a dedicated follow-up change.

Do not delete the useful architecture docs yet. First review and migrate durable decisions about generation flow, diagram rendering, drill diagram specs, and tenant methodology knowledge into current Club Vivo or platform architecture docs. After that migration, the old `docs/architecture/coach-lite/` folder can be considered for archive-only preservation.

## 8. Proposed Next Action

Create one small follow-up cleanup step:

- Remove `apps/club-vivo/app/(protected)/sessions/coach-lite-preview/page.tsx`.
- Remove `apps/club-vivo/app/(protected)/sessions/coach-lite-preview/mock-session-pack.ts`.
- Update `CoachPrimaryNav.tsx` to remove the obsolete route special case if no longer needed.
- Update current docs that mention the preview route.
- Run frontend validation and repeat the Coach Lite reference search before deciding whether to migrate or archive `docs/architecture/coach-lite/`.

## 9. Audit Conclusion

Coach Lite should be treated as historical/preview language, not the current active product identity.

The preview route appears isolated enough to remove in a follow-up, but the architecture docs still contain useful platform and product decisions. Those decisions should be migrated or summarized before removing the old Coach Lite architecture folder from GitHub `main`.
