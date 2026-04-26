# Progress Evidence

`docs/progress` is the clean GitHub-facing home for SIC progress summaries.

Detailed week-by-week progress history was removed from GitHub `main` after the concise summary layer was created. The full detailed history remains preserved in:

- branch: `archive/pre-showcase-cleanup`
- tag: `pre-showcase-cleanup-2026-04-25`

This folder is documentation only. It is not runtime code and does not define deployed behavior by itself.

## Start Here

- `weekly-progress-notes.md`
  - Short week-by-week summary for GitHub readers.
- `architect-process-summary.md`
  - Short architecture/process story distilled from the archived detailed process log.
- `new-sic/`
  - New SIC starting point cleanup plans, audits, and closeout summaries.

## Current Structure

```text
docs/progress/
├── README.md
├── architect-process-summary.md
├── weekly-progress-notes.md
└── new-sic/
```

## Archive Status

The removed detailed history included:

- detailed week folders
- old day notes
- old closeout files
- old class-session notes
- old walkthrough and demo scripts
- old progress templates and Q/A notes
- the former detailed architect process log
- the former week-based roadmap file

Those files should be restored from the archive branch/tag only if a future review decides that some detailed historical material belongs in `main` again.

## Rules

- Keep `main` focused on concise progress summaries.
- Do not reintroduce detailed historical week folders without an explicit cleanup decision.
- Do not claim future or parked ideas are shipped runtime.
- Keep new progress summaries factual, concise, and linked to current docs where possible.
