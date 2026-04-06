# Repo Structure Phase 4

This Phase 4 pass moved session PDF and export-storage helpers out of `services/club-vivo/api/_lib` into `services/club-vivo/api/src/domains/sessions/pdf`.

## What moved

- `services/club-vivo/api/_lib/session-pdf.js` -> `services/club-vivo/api/src/domains/sessions/pdf/session-pdf.js`
- `services/club-vivo/api/_lib/session-pdf.test.js` -> `services/club-vivo/api/src/domains/sessions/pdf/session-pdf.test.js`
- `services/club-vivo/api/_lib/session-pdf-storage.js` -> `services/club-vivo/api/src/domains/sessions/pdf/session-pdf-storage.js`
- `services/club-vivo/api/_lib/session-pdf-storage.test.js` -> `services/club-vivo/api/src/domains/sessions/pdf/session-pdf-storage.test.js`

## What stayed

`services/club-vivo/api/_lib/coach-assistant/` was intentionally left untouched because it is outside Phase 4 scope.

## Why this stayed low risk

This pass only relocated session PDF/export helper modules and updated import paths. It did not change API contracts, response shapes, storage behavior, env var names, S3 key generation, or business logic.
