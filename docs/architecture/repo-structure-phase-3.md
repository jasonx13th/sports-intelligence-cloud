# Repo Structure Phase 3

This Phase 3 pass moved repository and data-access modules out of `services/club-vivo/api/_lib` into domain-owned folders under `services/club-vivo/api/src/domains`.

## What moved

- `services/club-vivo/api/_lib/athlete-repository.js` -> `services/club-vivo/api/src/domains/athletes/athlete-repository.js`
- `services/club-vivo/api/_lib/club-repository.js` -> `services/club-vivo/api/src/domains/clubs/club-repository.js`
- `services/club-vivo/api/_lib/membership-repository.js` -> `services/club-vivo/api/src/domains/memberships/membership-repository.js`
- `services/club-vivo/api/_lib/team-repository.js` -> `services/club-vivo/api/src/domains/teams/team-repository.js`
- `services/club-vivo/api/_lib/session-repository.js` -> `services/club-vivo/api/src/domains/sessions/session-repository.js`
- `services/club-vivo/api/_lib/session-repository.test.js` -> `services/club-vivo/api/src/domains/sessions/session-repository.test.js`

## What stayed

`session-pdf.js` and `session-pdf-storage.js` stayed in `services/club-vivo/api/_lib` because they are still PDF/export infrastructure rather than repository data-access modules.

`services/club-vivo/api/_lib/coach-assistant/` was intentionally left untouched because it is outside Phase 3 scope.

## Why this stayed low risk

This pass only relocated repository modules and updated import paths. It did not change API contracts, error behavior, tenancy enforcement, table access patterns, response shapes, or business logic.
