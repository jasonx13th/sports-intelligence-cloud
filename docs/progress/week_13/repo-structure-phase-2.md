# Repo Structure Phase 2

This Phase 2 pass moved clearly session and session-pack specific domain logic out of `services/club-vivo/api/_lib` into `services/club-vivo/api/src/domains/session-builder`.

## What moved

- `services/club-vivo/api/_lib/session-builder-pipeline.js` -> `services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.js`
- `services/club-vivo/api/_lib/session-builder-pipeline.test.js` -> `services/club-vivo/api/src/domains/session-builder/session-builder-pipeline.test.js`
- `services/club-vivo/api/_lib/session-pack-templates.js` -> `services/club-vivo/api/src/domains/session-builder/session-pack-templates.js`
- `services/club-vivo/api/_lib/session-pack-templates.test.js` -> `services/club-vivo/api/src/domains/session-builder/session-pack-templates.test.js`
- `services/club-vivo/api/_lib/session-pack-validate.js` -> `services/club-vivo/api/src/domains/session-builder/session-pack-validate.js`
- `services/club-vivo/api/_lib/session-pack-validate.test.js` -> `services/club-vivo/api/src/domains/session-builder/session-pack-validate.test.js`
- `services/club-vivo/api/_lib/session-validate.js` -> `services/club-vivo/api/src/domains/session-builder/session-validate.js`
- `services/club-vivo/api/_lib/session-validate.test.js` -> `services/club-vivo/api/src/domains/session-builder/session-validate.test.js`
- `services/club-vivo/api/_lib/diagram-spec-validate.js` -> `services/club-vivo/api/src/domains/session-builder/diagram-spec-validate.js`
- `services/club-vivo/api/_lib/diagram-spec-validate.test.js` -> `services/club-vivo/api/src/domains/session-builder/diagram-spec-validate.test.js`

## What stayed

Repository and persistence modules stayed in `services/club-vivo/api/_lib`, including `session-repository.js`, `session-pdf.js`, and `session-pdf-storage.js`, because they remain infrastructure-adjacent rather than pure session-builder domain logic.

Non-session domains and all platform code also stayed in place.

## Why this stayed low risk

This pass only relocated session and session-pack domain modules and updated imports. It did not change API contracts, validation behavior, tenancy enforcement, auth semantics, response shapes, or platform infrastructure concerns.
