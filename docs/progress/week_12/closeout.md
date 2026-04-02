# Week 12 - Closeout Summary (Web Application Foundation)

## Week 12 goal

Create the first coach-facing web foundation on top of the hardened Week 11 Session Builder API by:

- scaffolding the frontend app in `apps/club-vivo`
- adding localhost Cognito Hosted UI authentication with PKCE
- protecting the first dashboard and sessions routes
- connecting the first web pages to the existing Session Builder endpoints
- documenting the current Week 12 web foundation

## What changed

### Day 1 - frontend foundation

- created the frontend app scaffold in:
  - `apps/club-vivo`
- set up a minimal Next.js app router project with:
  - React
  - TypeScript
  - Tailwind
- added the first app routes and base styling for the Week 12 coach-facing slice

### Day 2 - auth and protected routes

- added localhost Cognito Hosted UI authentication with:
  - authorization code flow
  - PKCE
  - HttpOnly cookies
- implemented the auth route set:
  - `/login`
  - `/login/start`
  - `/callback`
  - `/logout`
- added protected route behavior for:
  - `/dashboard`
  - `/sessions`
  - `/sessions/new`
  - `/sessions/[sessionId]`
- added dashboard hydration from:
  - `GET /me`

### Day 3 - session flows and documentation

- added the first protected sessions list page backed by:
  - `GET /sessions`
- added the first protected session detail page backed by:
  - `GET /sessions/{sessionId}`
- added the first session generation and save flow in `/sessions/new` using:
  - `POST /session-packs`
  - `POST /sessions`
- kept generate and save as separate visible actions
- added Week 12 architecture notes in:
  - `docs/architecture/week12-scope-lock.md`
  - `docs/architecture/week12-web-foundation.md`

## Validation and test evidence

The main Week 12 verification evidence came from focused local app validation:

- `npm.cmd exec tsc --noEmit`
- local route smoke behavior for:
  - `/`
  - `/login`
  - `/sessions`
  - `/sessions/new`

Key outcomes verified:

- the frontend app scaffold compiles under TypeScript
- localhost Cognito Hosted UI + PKCE auth wiring is present
- protected routes fail closed on missing auth cookie
- dashboard hydration uses `GET /me`
- sessions list uses `GET /sessions`
- session detail uses `GET /sessions/{sessionId}`
- `/sessions/new` generates candidates first and saves one selected candidate separately

## Architecture and documentation evidence created

- `docs/architecture/week12-scope-lock.md`
- `docs/architecture/week12-web-foundation.md`

These documents now cover:

- the Week 12 scope lock
- the implemented route surface
- the current auth flow
- the current backend endpoints used by the web app

## Tenancy and security check

- no infra, IAM, auth-boundary, tenancy-boundary, or entitlements-model changes were made in Week 12
- the web app does not accept `tenant_id`, `tenantId`, or `x-tenant-id`
- tenant scope remains server-derived from verified auth plus entitlements
- auth failures fail closed
- the web app does not derive tenant, role, or tier from request input or client-side cookie parsing
- backend calls continue to rely on the existing Week 11 API contract

## Observability note

- Week 12 did not introduce a new observability subsystem
- current evidence is primarily local app validation plus the existing backend logging surface
- no new alarms or dashboards were added as part of this slice

## Known limitations and follow-ups

- `middleware.ts` uses the current middleware file convention and should move to proxy later for Next 16 alignment
- validation messaging in `/sessions/new` is still coarse at the app layer
- localhost callback/logout URLs are the only auth callback/logout configuration currently wired into the web app flow
- screenshots and a Week 12 runbook have not yet been captured in committed repo docs

## Product impact

Week 12 establishes the first usable coach-facing web foundation for SIC:

- coaches now have a real protected web surface
- the app can authenticate locally through Hosted UI
- the app can show current user state, list sessions, view session detail, and run the first generate-then-save flow
- the Week 12 documentation now matches the current web implementation

## Recommended next step for Week 13

Start Week 13 by building the smallest reusable session-library layer on top of the Week 12 web foundation:

- add template and reuse flows only when backed by explicit backend endpoints
- tighten app-layer validation and user feedback around the existing generate/save workflow
- add the first lightweight usage evidence such as screenshots, route smoke notes, or a focused runbook
