# Architect Process Summary

This is the short GitHub-readable architecture/process summary for SIC.

It summarizes the architecture/process story through Week 21 and the New SIC starting point. It is a summary layer only; detailed process evidence remains preserved in the archive branch/tag listed in `docs/progress/README.md`.

## Platform Foundation Summary

SIC started with a serverless-first, multi-tenant platform foundation. The early work established AWS account hygiene, IAM/MFA habits, Cognito as the identity backbone, API Gateway plus Lambda as the request surface, DynamoDB as the primary domain store, and S3 for exported or generated artifacts.

The platform direction stayed conservative: keep infrastructure low-cost, use managed AWS services, build thin vertical slices, and validate with small evidence gates before widening scope.

## Tenancy, Auth, And Security Summary

The core security rule stayed consistent from the earliest notes through Week 21: tenant identity is server-derived.

Auth uses Cognito and API Gateway JWT authorization. Backend handlers resolve tenant context through platform wrapper code and authoritative entitlement records. Runtime paths do not trust `tenant_id`, `tenantId`, or `x-tenant-id` from body, query string, or headers.

Missing or invalid identity/entitlement state is expected to fail closed. Tenant-scoped DynamoDB keys and tenant-prefixed S3 paths were used as the recurring data-access pattern.

## API, Lambda, And DynamoDB Architecture Summary

The backend grew as a set of Lambda route handlers under `services/club-vivo/api`, with shared platform behavior in `src/platform` and domain behavior in `src/domains`.

The main domain table, `SicDomainTable`, became the common storage surface for tenant-scoped records such as sessions, teams, templates, methodology, feedback, attendance, clubs, and memberships. Repositories query by tenant-scoped keys instead of scan-then-filter patterns.

Current CDK-wired API routes include the active Club Vivo surfaces for `/me`, athletes, sessions, session packs, templates, teams, and methodology. Some older domain export/lake folders still need review because current repo inventory notes that matching CDK wiring is not visible in the current stack.

## Observability Summary

Observability grew from structured logs and request correlation into a practical set of runbooks, metric filters, dashboards, alarms, CI checks, and smoke-test workflows.

The recurring pattern is intentionally modest: route-level structured logs, focused success/failure events, runbooks for expected failure classes, and thin alarms where they help operators act. Several later product slices deliberately avoided claiming broader observability programs when only local or route-level evidence existed.

## Session Builder And Quick Session Summary

Session Builder became the main coach-facing generation foundation. Week 11 froze its v1 contract and made the internal pipeline explicit: normalize input, generate, validate, persist, and export.

Quick Session later became a fast shared-app lane. It reuses the existing `POST /session-packs` generation path and `POST /sessions` save path. It is not a separate backend product, route family, service, or data model.

Image-assisted intake and Fut-Soccer were added as narrow extensions to the shared Session Builder foundation. They did not create separate app stacks or separate tenancy paths.

## Team And Session Ownership Summary

Team work began as Team Layer v1, then gained attendance, weekly planning, and assignment workflows. Week 21 hardened ownership behavior so regular coaches are scoped to their own teams and saved sessions, while admin users retain tenant-wide visibility where implemented.

Non-owner team/session access is expected to return `404` where ownership applies. This keeps user-facing behavior simple while avoiding cross-coach visibility leaks inside the same tenant.

## Methodology And Generation Context Summary

Week 21 introduced a narrow methodology management path and internal generation context groundwork.

Methodology v1 is text-only in the current active direction. Admin users can manage draft/published methodology where implemented, coaches can read published context, and Session Builder can use server-owned context. Upload/source-mode, attachments, RAG/vector ingestion, and broader knowledge management remain future or parked unless explicitly rescoped.

## Week 21 And Club Vivo Workspace Hardening Summary

Week 21 moved the product from a working but mixed coach prototype toward a clearer shared Club Vivo coach workspace for KSC pilot use.

The app gained a more coherent public/login/Home flow, a fast Quick Session lane, a deliberate Session Builder lane, coach-owned Teams, coach-owned saved sessions, Methodology workspace direction, improved saved-session output, and clearer feedback/export actions. The week did not redesign auth, tenancy, entitlements, IAM, CDK, or the shared app model.

## New SIC Starting Point Summary

After Week 21, SIC moved away from week-based work into a cleaner baseline for product, architecture, and GitHub presentation.

The cleanup checkpoint reorganized product docs around Club Vivo, treated KSC as pilot context rather than product identity, separated future/parked material, added README coverage, refreshed the root README, and created an audit for the `docs/progress` history decision.

The next cleanup decisions are intentionally small and review-based: progress history, preview/demo routes, README-only future app folders, Postman/datasets, unwired backend folders, and domain export/lake review.

## Current Guardrails

- Tenant identity is server-derived from verified auth plus authoritative entitlements.
- No client-supplied `tenant_id`, `tenantId`, or `x-tenant-id`.
- One shared coach-facing Club Vivo app.
- Quick Session is a shared-app lane, not a separate backend product.
- KSC is pilot context, not the product identity.
- Future and parked docs are not shipped runtime.
- Source-of-truth docs are living documents, but changes should be deliberate, reviewed, and traceable.
- Do not move or archive detailed progress history until direct references and portfolio value are reviewed.
