# Progress Evidence

`docs/progress` is historical and progress evidence for Sports Intelligence Cloud. It is not active runtime code.

GitHub `main` should prefer short, clear summaries over deep week-by-week implementation detail. The detailed week folders are still present for now because current docs still reference them and because their portfolio/audit value has not been fully reviewed.

The detailed history is also protected by the archive branch and tag created during the GitHub showcase cleanup checkpoint:

- branch: `archive/pre-showcase-cleanup`
- tag: `pre-showcase-cleanup-2026-04-25`

Do not delete, move, or rename the detailed week folders until link references and portfolio value are reviewed.

## Start Here

- `weekly-progress-notes.md`
  - Short week-by-week summary for GitHub readers.
- `architect-process-summary.md`
  - Short architecture/process story distilled from the long architect process log.
- `new-sic/`
  - Current New SIC starting point cleanup plan, audit notes, and closeout summaries.
- `build-progress/architect_process_log.md`
  - Detailed audit log for the historical architecture process. Keep for now.
- `build-progress/roadmap-vnext.md`
  - Still referenced in source-of-truth governance until that governance is deliberately updated.

## Current Structure

- `week_00/` through `week_21/`
  - Detailed historical build notes, scope locks, closeouts, demos, walkthroughs, and evidence.
- `build-progress/`
  - Long-running roadmap and detailed architect process log.
- `new-sic/`
  - New starting point cleanup planning and closeout notes.
- `templates/`
  - Reusable progress-note templates.
- `qa/`
  - Historical question/answer notes.

## Status

The week folders are historical evidence, not the current product source of truth. Current product and architecture readers should start from the short summaries and then open detailed week folders only when they need evidence behind a decision.

`roadmap-vnext.md` remains referenced by `docs/architecture/foundations/source-of-truth-manifest.md` and related governance docs. Review that source-of-truth status before archiving or replacing it.

## Rules

- Do not rewrite historical week files to modernize the past.
- Do not claim future or parked ideas are shipped runtime.
- Do not delete or move week folders until references are reviewed.
- Keep new progress summaries factual, concise, and linked to evidence.
