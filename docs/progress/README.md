# Progress Logs

This folder is the tracked home for weekly build logs, day notes, closeouts, templates, Q and A notes, and build-progress summaries.

## What belongs here

- Weekly and daily progress notes under padded `week_*` folders.
- Reusable note templates under `templates/`.
- Long-running build summaries under `build-progress/`.
- Reference Q and A notes under `qa/`.

## Current structure

- `build-progress/` -> long-running roadmap and architect log
- `qa/` -> reference questions and answers
- `templates/` -> reusable note templates
- `week_00/`, `week_01/`, `week_02/` ... -> weekly tracked notes

## Naming rules

- Week folders must use padded names like `week_00`, `week_01`, `week_12`.
- Weekly closeouts should use `closeout-summary.md`.
- Week-specific demo walkthroughs should use `demo-script.md`.
- Prefer lowercase kebab-case file names for new tracked notes.
- Avoid names like `Day_01.md`, `closeoutsummary.md`, or folders with apostrophes.

## Safety rules

- Do not commit real secrets, tokens, cookies, credentials, private keys, or environment values.
- Do not commit PII or customer-identifying details.
- Use placeholders such as `<redacted>`, `<tenant-id>`, `<request-id>`, `<commit-sha>`, or `<JWT>`.
- Do not paste raw `Authorization` headers, JWTs, session cookies, `Set-Cookie` values, or full sensitive request bodies.

## How to add notes

- Create a new weekly folder using the padded pattern, for example `week_14`.
- Add new day notes inside that folder using the existing naming pattern already established for current progress notes.
- Start each new day note from `docs/progress/templates/day_template.md`.
- Start each new week closeout from `docs/progress/templates/week_closeout_template.md`.
- Keep entries factual and concise: what changed, how it was validated, and what remains open.

## What not to do

- Do not create unpadded week folders like `week_1`.
- Do not create duplicate summary files with slightly different names.
- Do not rewrite historical notes just to modernize old path references unless there is a strong reason.
- Do not use this folder for local-only scratch notes. Local-only working material belongs in `.workspace/`.
