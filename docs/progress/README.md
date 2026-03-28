# Progress Logs

This folder is the tracked home for weekly build logs, day notes, closeouts, templates, Q&A notes, and build-progress summaries.

## What belongs here

- Weekly and daily progress notes under `week_*`.
- Reusable note templates under `templates/`.
- Build summaries under `Build-Progress/`.
- Reference Q&A notes under `Q&A's/`.

## Safety rules

- Do not commit real secrets, tokens, cookies, credentials, private keys, or environment values.
- Do not commit PII or customer-identifying details.
- Use placeholders such as `<redacted>`, `<tenant-id>`, `<request-id>`, `<commit-sha>`, or `<JWT>`.
- Do not paste raw `Authorization` headers, JWTs, session cookies, `Set-Cookie` values, or full sensitive request bodies.

## How to add notes

- Create a new weekly folder as `week_<n>` to match the existing structure.
- Add new day notes inside that folder, following the current repo naming pattern already in use for that week.
- Start each new day note from `docs/progress/templates/day_template.md`.
- Start each new week closeout from `docs/progress/templates/week_closeout_template.md`.
- Keep entries factual and concise: what changed, how it was validated, and what remains open.
