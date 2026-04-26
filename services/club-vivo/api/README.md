# Club Vivo API

`services/club-vivo/api` contains the API Gateway/Lambda backend implementation for Club Vivo.

## Important Handler Folders

Current CDK-wired handler folders include:

- `me/`
- `athletes/`
- `sessions/`
- `templates/`
- `session-packs/`
- `teams/`
- `methodology/`

Handler/source folders that need review before cleanup include:

- `clubs/`
- `memberships/`
- `exports-domain/`
- `lake-ingest/`
- `lake-etl/`

These folders are **not currently CDK-wired**. Source exists, but they are not part of the current deployed Club Vivo runtime in `infra/cdk/lib/sic-api-stack.ts`.

Keep them for review, future domain work, or parked export-lake work. Do not treat them as active shipped runtime, and do not delete them yet because tests, docs, or schemas still reference the surrounding context.

Keeping these folders unwired avoids deploying unused AWS resources. New routes, buckets, Glue/Athena/lake resources, or EventBridge paths should only be wired when they are needed and approved.

The current deployed Club Vivo API remains focused on the active routes for `me`, `session-packs`, `sessions`, `teams`, `methodology`, `templates`, and `athletes`.

## Important Source Folders

- `src/domains/`
  - Business and domain logic.
  - Includes Session Builder, sessions, teams, methodology, templates, athletes, clubs, and memberships domain code.
- `src/platform/`
  - Shared platform utilities.
  - Includes tenancy, HTTP wrapper, logging, errors, validation, Bedrock integration, and S3 storage helpers.
- `_testHelpers/`
  - Test helpers used by Node test runs.

## Domain And Repository Boundaries

Repository files under `src/domains/**` are DynamoDB data-access boundaries.

Examples:

- `src/domains/sessions/session-repository.js`
- `src/domains/teams/team-repository.js`
- `src/domains/methodology/methodology-repository.js`
- `src/domains/templates/template-repository.js`

Do not bypass these boundaries casually. Repository or durable data-access changes may require an ADR or explicit architecture decision.

## Tenant Safety

Tenant context must be server-derived through the platform wrapper and tenant context builder.

Do not accept these from client body, query, or headers:

- `tenant_id`
- `tenantId`
- `x-tenant-id`

Requests should use authenticated identity and authoritative entitlements, not client-supplied tenant identity.

## Tests

From the repo root:

```powershell
npm test --prefix services/club-vivo/api
```

## What Belongs Here

- Lambda handler code.
- Domain services, validation, repositories, and backend tests.
- Platform utilities used by Club Vivo API Lambdas.

## What Should Not Go Here

- Frontend UI.
- CDK stack definitions.
- Product docs.
- Runtime data dumps or local secrets.

## Change Rules

- Keep handler route behavior aligned with `infra/cdk/lib/sic-api-stack.ts`.
- Keep public/cross-layer contracts aligned with `docs/api/`.
- Preserve fail-closed tenant behavior.
- Do not widen public POST `/session-packs` without explicit approval.
