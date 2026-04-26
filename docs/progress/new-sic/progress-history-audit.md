# Progress History Audit

## Purpose

This audit supported the decision about whether detailed `docs/progress` history should remain in GitHub `main`, be archived, or be summarized/reduced.

It is an audit document only. It does not change runtime code, infrastructure, API contracts, auth, tenancy, entitlements, IAM, or CDK.

## Original Finding

Before the archive cleanup, `docs/progress` contained:

- detailed weekly build folders
- day notes and closeout summaries
- walkthrough and demo scripts
- class-session and planning notes
- progress templates and Q/A notes
- a detailed architecture process log
- a week-based roadmap file
- New SIC cleanup planning docs

The audit found that detailed progress history was valuable as evidence, but too heavy for the GitHub `main` presentation once concise summary docs existed.

## Reference Risk Review

The risky direct links from current docs into detailed weekly history were replaced with summary-layer references before detailed history was removed from `main`.

GitHub-facing current docs now prefer:

- `docs/progress/weekly-progress-notes.md`
- `docs/progress/architect-process-summary.md`
- `docs/progress/README.md`
- `docs/progress/new-sic/`

## Decision Outcome

The selected direction is a cautious summary-first cleanup:

- keep concise progress summaries in `main`
- keep New SIC cleanup context in `main`
- remove detailed historical progress files from `main`
- preserve full detail in the archive branch/tag

Archive preservation:

- branch: `archive/pre-showcase-cleanup`
- tag: `pre-showcase-cleanup-2026-04-25`

## Current Recommendation

Keep GitHub `main` focused on the concise progress summary layer. Restore detailed historical files from the archive only if a future review identifies a specific public-facing need.
