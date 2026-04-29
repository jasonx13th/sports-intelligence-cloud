# Docs Readiness and Duplication Audit

## Purpose

This audit reviews current Markdown documentation before adding more deployment or readiness docs.

The goal is to reduce duplication, identify source-of-truth candidates, preserve useful evidence, and avoid scattering repeated Club Vivo deployment/runtime readiness content across more files.

This is an audit document only. It does not rewrite, delete, rename, merge, or reclassify existing docs. It does not change app code, backend code, infra, auth, middleware, Cognito, IAM, CDK, package files, or runtime code.

## Related Docs

- Hosting/domain planning: [hosting-and-domain-launch-plan.md](hosting-and-domain-launch-plan.md).
- Broad deployment readiness: [deployment-readiness-checklist.md](deployment-readiness-checklist.md).
- Narrow Club Vivo runtime readiness: [club-vivo-runtime-readiness-checklist.md](club-vivo-runtime-readiness-checklist.md).
- Local runtime readiness evidence: [club-vivo-runtime-readiness-evidence.md](club-vivo-runtime-readiness-evidence.md).
- Docs overlap/audit guidance: this document.

## Commands and Searches Used

Run from repo root on branch `audit/docs-readiness-and-duplication`:

```powershell
git status --short --branch
rg --files --hidden -g "*.md" -g "!node_modules/**" -g "!.git/**" -g "!.next/**" -g "!cdk.out/**" -g "!apps/club-vivo/node_modules/**" -g "!apps/club-vivo/.next/**"
git ls-files "*.md"
rg -n -i "Club Vivo" docs -g "*.md"
Get-ChildItem -Path .workspace -Recurse -Force -Filter *.md -ErrorAction SilentlyContinue
git check-ignore -v .workspace/docs/club-vivo-web-runtime-map.md .workspace/new-sic/deployment-readiness-checklist.local.md .workspace/ai/CODEX.private.md .workspace/ai/COPILOT.private.md
Select-String -Path docs/progress/new-sic/*.md,docs/architecture/*.md,apps/club-vivo/README.md,docs/runbooks/*.md -Pattern '/dashboard|/profile|session-builder-server|selected-team|TeamsSetupManager|Amplify|Cognito|callback|logout|readiness|hosting|deployment|runtime' -CaseSensitive:$false
```

Relevant files were also read directly with `Get-Content`, including the readiness checklist/evidence docs, hosting plan, deployment checklist, app README, smoke-test runbook, shipping runbook, auth ADR, system map, repo inventory, and ignored `.workspace` readiness notes.

## Summary of Findings

- `git ls-files "*.md"` found 129 tracked Markdown files.
- The tracked readiness/deployment overlap is concentrated in `docs/progress/new-sic/`.
- The clearest duplicated topics are Amplify hosting, environment variables, Cognito callback/logout URLs, deployed route smoke testing, and API connectivity smoke testing.
- `docs/progress/new-sic/club-vivo-runtime-readiness-checklist.md` and `docs/progress/new-sic/deployment-readiness-checklist.md` overlap but have different scopes: narrow Club Vivo runtime validation vs broader hosted deployment readiness.
- `docs/progress/new-sic/club-vivo-runtime-readiness-evidence.md` is evidence, not a checklist or source-of-truth doc. Keep it as historical validation record.
- `docs/progress/new-sic/hosting-and-domain-launch-plan.md` is a plan and decision narrative. It should not be duplicated by more checklist docs.
- `.workspace/docs/club-vivo-web-runtime-map.md` and `.workspace/new-sic/deployment-readiness-checklist.local.md` are ignored local workspace files. They appear useful, but should not be tracked without deliberate sanitization and summarization.
- `docs/architecture/sic-current-system-map.md` and `docs/architecture/sic-repo-inventory.md` still contain stale references to removed Club Vivo web runtime files/routes. They are not duplicate readiness docs, but they are source-map drift candidates after PR #16.
- Some progress/checklist docs are intentionally mechanical. They could later receive a more natural lead-in and clearer "use this for..." framing, but evidence docs should stay factual.

## Related Docs Table

| Path | Current role | Finding | Recommendation |
| --- | --- | --- | --- |
| `docs/architecture/foundations/source-of-truth-manifest.md` | Active source-of-truth governance | Defines source-of-truth order and separates historical/progress docs from governing docs. | Keep as the governing hierarchy doc. Consider adding readiness/deployment doc roles later if this area grows. |
| `docs/README.md` | Active docs index | Explains docs folder purpose and warns against unsupported runtime claims. | Keep. Link to any consolidated readiness hierarchy later if needed. |
| `docs/progress/README.md` | Progress evidence governance | Says progress docs are GitHub-facing evidence, not deployed behavior by themselves. | Keep. No rewrite needed for this task. |
| `apps/club-vivo/README.md` | Active app reference | Lists active app routes, folders, local commands, and change rules. | Treat as the best tracked app-level guide for `apps/club-vivo`. Keep distinct from deployment readiness. |
| `docs/adr/ADR-0010-club-vivo-web-auth-and-server-side-api-access.md` | Accepted architecture decision | Defines Cognito Hosted UI, callback/logout, server-side API access, and tenant safety pattern. | Keep as source for auth/callback/logout intent. Do not fold into readiness docs. |
| `docs/runbooks/how-to-ship.md` | Active release hygiene runbook | Covers PR discipline, CI, smoke tests, tenant safety, and post-merge validation. | Keep as release process source, not deployment checklist. |
| `docs/runbooks/smoke-tests.md` | Active API smoke-test runbook | Covers API smoke workflow for `/me`, missing token, and unknown route. | Keep as API smoke-test source. Readiness docs should link or reference it instead of repeating details. |
| `docs/progress/new-sic/hosting-and-domain-launch-plan.md` | Strategic hosting/deployment plan | Explains why hosting exists, recommends Amplify, covers domain, Cognito, backend readiness, budget, and pilot validation. | Keep as planning narrative. Avoid creating another hosting plan. |
| `docs/progress/new-sic/deployment-readiness-checklist.md` | Broad hosted deployment checklist | Repeats Amplify, env var, Cognito, backend, budget, validation, and stop-condition topics also present in the runtime checklist. | Candidate to become the broad operational checklist, with links to the runtime checklist and evidence docs. |
| `docs/progress/new-sic/club-vivo-runtime-readiness-checklist.md` | Narrow runtime readiness checklist | Focuses on active `apps/club-vivo` routes, build readiness, stale route regression, env vars, Amplify, Cognito, and API smoke checks. | Keep as narrow Club Vivo runtime checklist. Do not broaden it into the full deployment checklist. |
| `docs/progress/new-sic/club-vivo-runtime-readiness-evidence.md` | Historical validation evidence | Records local stale-route search, build/typecheck, active build route output, and remaining hosted work. | Keep as evidence. Do not rewrite for style unless a factual correction is needed. |
| `docs/architecture/sic-current-system-map.md` | Current system map | Still references `apps/club-vivo/lib/session-builder-server.ts` and diagram nodes for `/dashboard` and `/profile`. | Needs a small follow-up correction after PR #16. Do not fix in this audit PR. |
| `docs/architecture/sic-repo-inventory.md` | Current repo inventory | Still lists `/dashboard`, `/profile`, `TeamsSetupManager.tsx`, `session-builder-server.ts`, and `selected-team.ts` as active or candidate items in places. | Needs a small follow-up correction after PR #16. Do not fix in this audit PR. |
| `.workspace/docs/club-vivo-web-runtime-map.md` | Ignored local working map | Contains detailed active web runtime map and hosted/local validation notes. More current in some places than tracked maps, but local-only. | Keep ignored. If promoted later, sanitize and distill into an official doc rather than tracking the local file directly. |
| `.workspace/new-sic/deployment-readiness-checklist.local.md` | Ignored local deployment readiness log | Contains detailed hosted deployment evidence and local/private operational detail. | Keep ignored. Do not track as-is. Distill only safe, durable conclusions if needed. |

## Recommended Source-of-Truth Hierarchy

Use this hierarchy before adding new readiness or deployment docs:

1. Runtime source and build output: source files, route manifests, local build output, and deployed behavior beat docs for current runtime facts.
2. Governance and architecture decisions: `docs/architecture/foundations/source-of-truth-manifest.md` and relevant ADRs, especially `ADR-0010`.
3. Current architecture and app maps: `docs/architecture/sic-current-system-map.md`, `docs/architecture/sic-repo-inventory.md`, and `apps/club-vivo/README.md`. These need post-PR #16 cleanup for stale route/helper references.
4. Broad hosted deployment readiness: `docs/progress/new-sic/deployment-readiness-checklist.md`.
5. Narrow Club Vivo runtime readiness: `docs/progress/new-sic/club-vivo-runtime-readiness-checklist.md`.
6. Evidence records: `docs/progress/new-sic/club-vivo-runtime-readiness-evidence.md` and other audit/evidence docs. These prove what was checked; they should not become instructions unless intentionally promoted.
7. Ignored workspace notes: `.workspace/**`. These can inform future work, but should not be treated as tracked source-of-truth.

## Duplicate or Merge Candidates

These are candidates for later review, not changes made by this audit:

- `docs/progress/new-sic/deployment-readiness-checklist.md` and `docs/progress/new-sic/club-vivo-runtime-readiness-checklist.md`
  - Overlap: Amplify, env vars, Cognito callback/logout, validation, stop conditions.
  - Suggested direction: keep both, but make the broad deployment checklist explicitly delegate the narrow route/build/stale-route checks to the runtime readiness checklist.
- `docs/progress/new-sic/hosting-and-domain-launch-plan.md` and `docs/progress/new-sic/deployment-readiness-checklist.md`
  - Overlap: Amplify, domain, Cognito, budget, validation.
  - Suggested direction: keep the hosting plan as the narrative plan and the deployment checklist as the operational checklist. Add cross-links later rather than merging immediately.
- `docs/architecture/sic-current-system-map.md` and `docs/architecture/sic-repo-inventory.md`
  - Overlap: active app route/file maps and backend/CDK/runtime inventory.
  - Suggested direction: do not merge now. First correct stale Club Vivo route/helper references so both remain safe to use.
- `.workspace/docs/club-vivo-web-runtime-map.md` and tracked architecture/app docs
  - Overlap: active routes, app files, API helpers, deleted surfaces, hosted validation notes.
  - Suggested direction: do not track the local file. Later, distill safe current facts into `apps/club-vivo/README.md` or the architecture maps if needed.
- `.workspace/new-sic/deployment-readiness-checklist.local.md` and tracked readiness/evidence docs
  - Overlap: hosted Amplify, Cognito, env vars, route validation, bug-fix history.
  - Suggested direction: do not track the local file. Later, distill a sanitized deployment evidence summary if needed.

## Docs to Keep as Historical Evidence

Keep these as evidence unless a factual correction is required:

- `docs/progress/new-sic/club-vivo-runtime-readiness-evidence.md`
- `docs/progress/new-sic/backend-export-lake-audit.md`
- `docs/progress/new-sic/coach-lite-preview-audit.md`
- `docs/progress/new-sic/progress-history-audit.md`
- `docs/progress/new-sic/closeout-summary-1.md`
- `docs/progress/new-sic/closeout-summary-2.md`
- `docs/progress/new-sic/closeout-summary-3.md`
- `docs/progress/weekly-progress-notes.md`
- `docs/progress/architect-process-summary.md`

## Docs Not to Rewrite Because They Are Audit Evidence

These docs may read procedural or repetitive, but that is acceptable because they preserve a decision or validation trail:

- `docs/progress/new-sic/club-vivo-runtime-readiness-evidence.md`
- `docs/progress/new-sic/backend-export-lake-audit.md`
- `docs/progress/new-sic/coach-lite-preview-audit.md`
- `docs/progress/new-sic/progress-history-audit.md`
- `docs/progress/new-sic/docs-readiness-duplication-audit.md`

If any of these need improvement, prefer appending a short correction note over rewriting the original evidence.

## Docs That Could Later Use a More Natural Voice

Needs human review before any rewrite:

- `docs/progress/new-sic/deployment-readiness-checklist.md`
  - Could use a short human-readable "when to use this" opening and links to the runtime checklist, hosting plan, and smoke-test runbook.
- `docs/progress/new-sic/club-vivo-runtime-readiness-checklist.md`
  - Could use a shorter lead-in and clearer relationship to deployment readiness, while keeping checklist format.
- `docs/progress/new-sic/hosting-and-domain-launch-plan.md`
  - Already has readable intent, but could be tightened once actual hosted deployment evidence is settled.
- `docs/architecture/sic-current-system-map.md`
  - Could later be made less inventory-heavy, but stale fact cleanup should come first.
- `docs/architecture/sic-repo-inventory.md`
  - Useful as an inventory. It should stay factual; any voice rewrite is lower priority than stale route/helper cleanup.

Do not rewrite evidence docs just to make them sound more polished.

## Local-Only or Should Not Be Tracked

The `.workspace/` folder is ignored by `.gitignore`.

Confirmed ignored local Markdown files:

- `.workspace/docs/club-vivo-web-runtime-map.md`
- `.workspace/new-sic/deployment-readiness-checklist.local.md`
- `.workspace/ai/CODEX.private.md`
- `.workspace/ai/COPILOT.private.md`

Recommendation:

- Keep `.workspace/**` untracked.
- Do not copy local readiness logs into tracked docs verbatim.
- If local notes contain useful durable facts, create a sanitized tracked summary instead.

## Stale Route and Deleted Helper Drift

The tracked runtime readiness evidence says `/dashboard`, `/profile`, `TeamsSetupManager`, `selected-team`, and `session-builder-server` were absent from `apps/club-vivo` runtime searches after PR #16.

However, tracked docs still contain historical or stale references:

- `docs/architecture/sic-current-system-map.md`
  - Mentions `apps/club-vivo/lib/session-builder-server.ts`.
  - Mermaid frontend route map includes `/dashboard` and `/profile`.
- `docs/architecture/sic-repo-inventory.md`
  - Mentions middleware including dashboard/profile.
  - Lists `/dashboard` and `/profile` protected pages.
  - Lists `TeamsSetupManager.tsx`, `session-builder-server.ts`, and `selected-team.ts`.

Recommendation:

- Treat this as documentation drift, not runtime regression.
- Fix in a separate small documentation PR after this audit.
- Do not reintroduce deleted routes/helpers to make docs true.

## Proposed Small Next PR

Proposed next PR scope:

1. Update `docs/architecture/sic-current-system-map.md` to remove or relabel stale `/dashboard`, `/profile`, and `session-builder-server.ts` references.
2. Update `docs/architecture/sic-repo-inventory.md` to remove or relabel stale `/dashboard`, `/profile`, `TeamsSetupManager.tsx`, `session-builder-server.ts`, and `selected-team.ts` references.
3. Add short cross-links among:
   - `docs/progress/new-sic/hosting-and-domain-launch-plan.md`
   - `docs/progress/new-sic/deployment-readiness-checklist.md`
   - `docs/progress/new-sic/club-vivo-runtime-readiness-checklist.md`
   - `docs/progress/new-sic/club-vivo-runtime-readiness-evidence.md`

Do not add another readiness checklist in that PR. Keep it to stale-doc correction and navigation.

## Stop Conditions for Follow-Up Work

Stop and ask for review if a future cleanup would:

- rewrite evidence docs rather than correcting specific facts;
- merge planning, checklist, and evidence docs into one large document;
- require auth, middleware, callback/logout, backend, IAM, CDK, package, or runtime code changes;
- require tracking `.workspace/**`;
- expose local/private deployment details from ignored workspace notes;
- create new top-level folders.
