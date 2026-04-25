# Sports Intelligence Cloud

Sports Intelligence Cloud (SIC) is a multi-tenant, serverless sports platform on AWS.

Club Vivo is the current coach-facing web app and product surface inside SIC. It helps coaches plan, generate, save, review, and export training sessions from real-world constraints while keeping team and methodology context tenant-safe.

KSC is pilot context for early testing and walkthrough readiness. KSC is not the product identity, and the app direction remains one shared Club Vivo coach workspace for clubs, academies, and organizations.

## Current Product

The active product surface is the Club Vivo coach workspace in `apps/club-vivo`.

Current workspace areas include:

- Home
- Quick Session
- Session Builder
- Teams
- Equipment/Essentials
- Methodology
- Sessions library
- Saved-session detail
- Saved-session feedback
- PDF export action

Quick Session is a fast shared-app lane into the same generation and save flow. It is not a separate backend product.

## Architecture At A Glance

- `apps/club-vivo`
  - Active Next.js Club Vivo coach workspace.
- `services/club-vivo/api`
  - API Gateway/Lambda backend implementation for Club Vivo.
- `services/auth`
  - Cognito trigger Lambdas for entitlement provisioning and token claim enrichment.
- `infra/cdk`
  - AWS CDK source for API, auth, DynamoDB, S3, CloudWatch, IAM, and limited Bedrock permissions where currently wired.
- `docs/api`
  - API and cross-layer contracts.
- `docs/architecture`
  - Platform architecture, current system maps, repo inventory, source-of-truth docs, and cleanup planning.
- `docs/product/club-vivo`
  - Current Club Vivo product docs, pilot notes, generation profiles, and future/parked product planning.

The backend uses API Gateway, Lambda, DynamoDB, Cognito, S3, CloudWatch, and limited Bedrock usage for image-analysis requests where currently wired.

## Key Architecture Docs

- [Current System Map](docs/architecture/sic-current-system-map.md)
- [Repo Inventory](docs/architecture/sic-repo-inventory.md)
- [GitHub Showcase Cleanup Plan](docs/architecture/github-showcase-cleanup-plan.md)
- [Source-of-Truth Manifest](docs/architecture/foundations/source-of-truth-manifest.md)
- [Current System Diagram Blueprint](docs/architecture/diagrams/sic-current-system-blueprint.md)

## Local Validation

Frontend typecheck:

```powershell
cd apps/club-vivo
npx tsc --noEmit
```

Backend tests:

```powershell
npm test --prefix services/club-vivo/api
```

CDK build:

```powershell
cd infra/cdk
npm run build
```

## Repo Navigation

- `apps/`
  - User-facing app surfaces. `apps/club-vivo` is active; other app folders are future/cleanup-review candidates.
- `services/`
  - Backend services and auth Lambda source.
- `infra/`
  - Infrastructure-as-code source.
- `docs/`
  - Human-readable architecture, product, API, ADR, runbook, and progress documentation.
- `scripts/`
  - Repo utility and smoke-test scripts.
- `datasets/`
  - Checked-in machine-readable schemas and reference assets.

## Boundaries

- Tenant identity is server-derived from authenticated claims and authoritative entitlements.
- Client input must not provide `tenant_id`, `tenantId`, or `x-tenant-id`.
- Club Vivo remains one shared coach-facing app.
- Quick Session is not a separate backend product.
- KSC is pilot context, not the product identity.
- Methodology upload/source-mode, broad RAG/vector infrastructure, a separate admin app, a broader image-assisted intake restart, and deeper PDF document design are not claimed as active shipped runtime behavior here.

## Public Repo Safety

This repository is sanitized for public sharing.

- No secrets or credentials are stored in the repo.
- No real customer data is included.
- Documentation examples use placeholders where needed.
