# Repo Structure Phase 1

This Phase 1 pass moved only clearly cross-cutting backend platform code out of `services/club-vivo/api/_lib` into `services/club-vivo/api/src/platform`, while creating `services/club-vivo/api/src/domains` for future domain-aligned moves.

## What moved

- `services/club-vivo/api/_lib/tenant-context.js` -> `services/club-vivo/api/src/platform/tenancy/tenant-context.js`
- `services/club-vivo/api/_lib/tenant-context.test.js` -> `services/club-vivo/api/src/platform/tenancy/tenant-context.test.js`
- `services/club-vivo/api/_lib/logger.js` -> `services/club-vivo/api/src/platform/logging/logger.js`
- `services/club-vivo/api/_lib/errors.js` -> `services/club-vivo/api/src/platform/errors/errors.js`
- `services/club-vivo/api/_lib/parse-body.js` -> `services/club-vivo/api/src/platform/http/parse-body.js`
- `services/club-vivo/api/_lib/validate.js` -> `services/club-vivo/api/src/platform/validation/validate.js`
- `services/club-vivo/api/_lib/with-platform.js` -> `services/club-vivo/api/src/platform/http/with-platform.js`
- `services/club-vivo/api/_lib/with-platform.test.js` -> `services/club-vivo/api/src/platform/http/with-platform.test.js`

## What stayed

Domain-specific repositories, validation flows, and session-generation code stayed in `services/club-vivo/api/_lib`, including repository modules such as athlete, club, membership, session, and team repositories, plus session pack, PDF, and builder pipeline code.

## Why this was low risk

This pass did not change handler behavior, auth semantics, tenant enforcement, route contracts, infra, IAM, or observability behavior. It only relocated shared platform modules and updated import paths so existing runtime and test behavior remained intact while creating a cleaner structure for later domain-focused refactors.
