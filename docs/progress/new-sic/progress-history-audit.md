# Progress History Audit

## 1. Purpose

This audit supports the decision about whether `docs/progress` historical history should remain in GitHub `main`, be archived, or be summarized/reduced.

It is an audit document only. It does not delete, move, rename, or rewrite any existing progress files. It does not change runtime code, infrastructure, API contracts, auth, tenancy, entitlements, IAM, or CDK.

## 2. Current `docs/progress` Structure

`docs/progress` currently contains build history, planning evidence, templates, and new SIC cleanup notes.

Major folders:

| Folder | Current contents | Audit classification |
| --- | --- | --- |
| `docs/progress/week_00/` through `docs/progress/week_21/` | Chronological week folders containing day notes, scope locks, closeouts, demo scripts, walkthrough scripts, class-session notes, pilot-readiness notes, and evaluation planning docs. | Historical build evidence. |
| `docs/progress/build-progress/` | `architect_process_log.md` and `roadmap-vnext.md`. | Mixed: audit/process history plus still-referenced roadmap/source-of-truth material. |
| `docs/progress/new-sic/` | New SIC starting point plan and cleanup closeout summary. | Current cleanup/planning context. |
| `docs/progress/templates/` | Reusable day and week closeout templates. | Useful process support if future progress notes remain in main. |
| `docs/progress/qa/` | Question/answer notes. | Reference history; likely low-risk but should be preserved if still useful. |

Current file counts by folder:

- `build-progress`: 2 files
- `new-sic`: 2 files before this audit
- `qa`: 1 file
- `templates`: 2 files
- week folders: `week_00` through `week_21`, with the heaviest history in `week_19`, `week_20`, and `week_21`

## 3. Historical Only

The week-based folders are historical build evidence, not active runtime.

Historical-only candidates include:

- `docs/progress/week_00/` through `docs/progress/week_21/`
- week day notes such as `day-1-notes.md`, `day1-closeout-summary.md`, and `day7-closeout-summary.md`
- week closeouts such as `closeout-summary.md`
- demo and walkthrough scripts such as `demo-script.md` and `day7-walkthrough-script.md`
- class-session material such as `docs/progress/week_21/week-21-class-session.md`
- detailed pilot-readiness, evaluation, and scope-lock notes that record how work was planned and validated

These files are valuable as evidence and portfolio narrative, but they should not be treated as current runtime behavior unless a current source-of-truth doc explicitly references them.

## 4. What Should Probably Stay In `main`

Recommended to keep in `main` for now:

- `docs/progress/new-sic/`
  - This is current cleanup context and records the new starting point decision path.
- `docs/progress/build-progress/architect_process_log.md`
  - This is an audit-oriented summary of the build path and is easier to review than the full week history.
- `docs/progress/build-progress/roadmap-vnext.md`
  - Keep for now because it is still listed in the source-of-truth order by `docs/architecture/foundations/source-of-truth-manifest.md` and `docs/architecture/platform-constitution.md`.
  - It should be reviewed separately because the New SIC plan says SIC is moving away from week-based work.
- `docs/progress/templates/`
  - Keep if future progress notes will still be created in `main`.
  - Archive later if the project switches away from progress-note workflows entirely.
- `docs/progress/README.md`
  - Keep and update later if Option A is chosen, because it is the natural place to explain that progress history is historical evidence.

## 5. What Could Be Archived From GitHub `main` Later

Candidates for later archive or reduction, after references and portfolio value are reviewed:

- detailed `docs/progress/week_00/` through `docs/progress/week_21/` folders
- old class-session docs
- day-by-day historical closeouts
- old walkthroughs and demo scripts
- detailed Week 19 evaluation-planning notes if a smaller summary remains in `main`
- detailed Week 20 and Week 21 pilot-readiness notes if current product and pilot docs already preserve the durable decisions
- `docs/progress/qa/` if it is only historical and no current docs depend on it

Do not remove these until direct references are handled and the intended GitHub/portfolio story is clear.

## 6. Reference Risk

Search scope: current docs outside `docs/progress`.

Direct references that would break or become stale if week folders were removed:

| Referencing doc | Reference | Risk if week folders are removed |
| --- | --- | --- |
| `docs/product/club-vivo/coach-workspace.md` | `docs/progress/week_21/day1-scope-lock.md` | Direct historical source link would break. |
| `docs/product/club-vivo/pilots/ksc/program-types-and-methodology.md` | `docs/progress/week_21/day1-scope-lock.md` | Direct historical source link would break. |
| `docs/runbooks/attendance-system-v1-failures.md` | `docs/progress/week_16/attendance-storage-design.md` | Direct evidence/reference link would break. |
| `docs/runbooks/session-builder-image-assisted-intake-v1-failures.md` | `docs/progress/week_18/week18-day1-scope-lock.md` | Direct evidence/reference link would break. |
| `docs/architecture/sic-repo-inventory.md` | `docs/progress/week_00/` through `docs/progress/week_21/`, plus `docs/progress/week_21/week-21-class-session.md` | Inventory would become inaccurate and at least one specific file reference would break. |
| `docs/architecture/foundations/source-of-truth-manifest.md` | `docs/progress/week_*` | Historical-doc classification would become stale if week folders leave `main`. |
| `docs/architecture/github-showcase-cleanup-plan.md` | `docs/progress/week_*` | Cleanup-plan candidate list would become stale if week folders leave `main`. |

References to `build-progress` that matter before any archive/reduction:

| Referencing doc | Reference | Risk |
| --- | --- | --- |
| `docs/architecture/architecture-diagrams.md` | `docs/progress/build-progress/roadmap-vnext.md` | Active roadmap link would break if moved. |
| `docs/architecture/foundations/source-of-truth-manifest.md` | `docs/progress/build-progress/roadmap-vnext.md` | Source-of-truth order would break if moved without governance update. |
| `docs/architecture/platform-constitution.md` | `docs/progress/build-progress/roadmap-vnext.md` | Source-of-truth order would break if moved without governance update. |
| `docs/architecture/sic-current-system-map.md` | `docs/progress/build-progress/roadmap-vnext.md` | Review/backlog reference would become stale. |
| `docs/architecture/sic-repo-inventory.md` | `architect_process_log.md` and `roadmap-vnext.md` | Inventory would become inaccurate. |

General references that would need wording updates if `docs/progress` is reduced:

- `docs/README.md`
- `docs/product/README.md`
- `docs/runbooks/how-to-ship.md`
- `docs/architecture/repo-structure.md`
- `docs/architecture/sic-repo-inventory.md`

Current conclusion: week-folder removal is not a simple delete. There are direct historical-source links, source-of-truth references, and repo navigation docs that would need a coordinated follow-up.

## 7. Options

### Option A: Keep All `docs/progress` In `main`

Keep the full progress tree in GitHub `main`, but add or update a README/index that clearly says the week folders are historical build evidence.

Pros:

- Safest for links.
- Preserves portfolio and audit value.
- Avoids accidental loss of build narrative.
- Smallest immediate change.

Cons:

- GitHub `main` stays heavier and more history-forward.
- Current product story may remain harder to scan.
- Old week notes may look like current direction unless clearly indexed.

### Option B: Keep Current Summaries And Archive Detailed Week Folders

Keep:

- `docs/progress/new-sic/`
- `docs/progress/build-progress/architect_process_log.md`
- `docs/progress/build-progress/roadmap-vnext.md` while it remains source of truth
- current/high-level summaries
- useful progress templates

Archive or remove from `main` later:

- detailed week folders
- day-by-day closeouts
- old demo scripts
- old class-session docs

Pros:

- Makes GitHub `main` cleaner.
- Preserves durable summary and governance material.
- Keeps active cleanup context visible.

Cons:

- Requires link updates and replacement references.
- Needs a clear archive branch/tag story.
- Could reduce portfolio evidence unless a good summary remains.

### Option C: Move Most Progress History To Archive Branch Only

Keep only a summarized progress history in `main`, with the detailed week history available on an archive branch/tag.

Pros:

- Cleanest GitHub `main`.
- Strongest current-product presentation.
- Forces current docs to depend on durable summaries instead of day notes.

Cons:

- Highest link-break and context-loss risk.
- Harder to browse historical evidence from `main`.
- Requires careful replacement docs and governance updates before removal.

## 8. Recommendation

The safest next action is to start with Option A or a cautious version of Option B.

Do not delete or archive the week history from `main` yet. First review direct link references and decide what portfolio value the week-by-week evidence provides. If the week folders are later removed from `main`, keep an archive branch/tag and replace direct links with stable summary docs before removal.

Near-term recommendation:

- Treat `docs/progress/new-sic/` as current cleanup planning and keep it in `main`.
- Keep `architect_process_log.md` because it already summarizes weeks in an audit-friendly form.
- Keep `roadmap-vnext.md` until source-of-truth governance is updated.
- Use `docs/progress/README.md` as the first low-risk place to label the full tree as historical evidence.

## 9. Proposed First Action After Audit

Make one small follow-up change:

Update `docs/progress/README.md` to add a short index and status note:

- `week_*` folders are historical build evidence.
- `build-progress/architect_process_log.md` is the summary audit log.
- `build-progress/roadmap-vnext.md` remains referenced as source-of-truth until reviewed.
- `new-sic/` contains current cleanup decisions.
- Do not delete or move week folders until direct references and portfolio value are reviewed.
