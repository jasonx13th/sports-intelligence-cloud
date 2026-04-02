# Week 12 Scope Lock

## In scope

- first coach-facing web surface
- authenticated app shell
- protected routes
- session generation entry point
- session list
- session detail
- docs/screenshots later in the week

## Out of scope

- infra/IAM/CDK changes
- tenancy/auth/entitlements model changes
- client-supplied tenant identifiers
- templates
- team/club/admin flows
- analytics
- edit/delete flows

## Frontend routes

- `/login`
- `/dashboard`
- `/sessions`
- `/sessions/new`
- `/sessions/[sessionId]`
- `/callback` and `/logout` are technical auth plumbing, not product routes

## Backend endpoints used

- `GET /me`
- `GET /sessions`
- `POST /session-packs`
- `POST /sessions`
- `GET /sessions/{sessionId}`
- `GET /sessions/{sessionId}/pdf`

## Non-negotiables

- never accept `tenant_id`, `tenantId`, or `x-tenant-id`
- tenant scope derived from verified auth plus entitlements
- fail closed on missing auth
- use existing Week 11 API contract

## Risks and constraints

- no frontend app exists yet
- localhost-oriented auth callback/logout config exists
- possible CORS/proxy constraint, so safest path is app-layer/server-side API calling unless proven otherwise
- PDF response shape doc gap is known but not a blocker
