# SIC Architecture Decision Records

This folder contains Architecture Decision Records for Sports Intelligence Cloud.

ADRs capture important architecture decisions, the context behind them, and the constraints future work should respect.

## What Belongs Here

- Decisions that affect platform architecture.
- Decisions that set long-lived rules for auth, tenancy, entitlements, data access, API contracts, or infrastructure.
- Decisions that future contributors should understand before changing core boundaries.

## What Should Not Go Here

- Daily progress notes.
- Walkthrough scripts.
- Product brainstorming.
- Runbooks.
- Implementation details that do not represent an architecture decision.

## When To Add An ADR

Add an ADR, or get an explicit architecture decision, for changes such as:

- auth model changes
- tenancy model changes
- entitlement model changes
- public API contract changes
- durable data model changes
- repository or data-access boundary changes
- infrastructure or CDK source-structure changes
- new major AWS service dependencies
- source-of-truth order changes

## Existing ADRs

- `ADR-0001-multi-tenant-dynamodb-single-table-model.md`
- `ADR-0002-jwt-tenant-identity-propagation.md`
- `ADR-0003-fail-closed-authorization-model.md`
- `ADR-0004-idempotent-athlete-creation.md`
- `ADR-0005-entitlements-provisioning-postconfirmation-lambda.md`
- `ADR-0006-repository-boundary-tenant-safe-data-access.md`
- `ADR-0007-authoritative-tenant-context-via-entitlements.md`
- `ADR-0008-coach-basic-to-org-premium-upgrade-and-active-tenant-selection.md`
- `ADR-0009-session-builder-runtime-boundaries-and-explicit-coach-flow.md`
- `ADR-0010-club-vivo-web-auth-and-server-side-api-access.md`

## Change Rules

- Do not rewrite ADR history casually.
- If an older decision changes, prefer a new ADR that supersedes or amends it.
- Keep ADRs linked from current architecture docs when they define active boundaries.

