# Week 12 Web Foundation

## Goal

Document the current Week 12 coach-facing web foundation that now exists in the repo.

## Implemented routes

- Frontend app path: `apps/club-vivo`
- Next.js app router frontend exists
- Implemented routes:
  - `/`
  - `/login`
  - `/login/start`
  - `/callback`
  - `/logout`
  - `/dashboard`
  - `/sessions`
  - `/sessions/new`
  - `/sessions/[sessionId]`

## Auth flow

- Auth uses Cognito Hosted UI with authorization code flow plus PKCE.
- `/login` is the public login entry route.
- `/login/start` generates server-side auth state and PKCE values, stores `sic_auth_state` and `sic_pkce_verifier` in HttpOnly cookies, and redirects to the Hosted UI authorize endpoint.
- `/callback` validates returned `code` and `state`, exchanges the code at the Cognito token endpoint, stores `sic_access_token` in an HttpOnly cookie, clears temporary auth cookies, and redirects to `/dashboard`.
- `/logout` clears local auth cookies and redirects to `/login?loggedOut=1`.
- Protected routes use a coarse cookie-presence check in `middleware.ts`.

## Backend endpoints used

- `GET /me`
- `GET /sessions`
- `POST /session-packs`
- `POST /sessions`
- `GET /sessions/{sessionId}`

## Current page behaviors

- `/` renders a static app entry page.
- `/login` redirects into the real localhost Hosted UI sign-in flow unless it is rendering the logged-out state.
- `/dashboard` is server-rendered from `GET /me`.
- `/sessions` renders the current saved-session summary list from `GET /sessions`.
- `/sessions/new` renders the first Session Builder form and candidate list.
- `/sessions/new` keeps generation and save as separate visible actions:
  - generate candidates with `POST /session-packs`
  - save one selected candidate with `POST /sessions`
- `/sessions/[sessionId]` renders session detail from `GET /sessions/{sessionId}`.

## Environment variables

- `CLUB_VIVO_API_URL`
- `CLUB_VIVO_COGNITO_DOMAIN`
- `CLUB_VIVO_WEB_CLIENT_ID`
- `CLUB_VIVO_REDIRECT_URI`
- `CLUB_VIVO_LOGOUT_URI`

## Known limitations

- `middleware.ts` uses the current middleware file convention; in Next 16 this convention is deprecated and should move to proxy later.
- Validation errors in `/sessions/new` are still coarse app-layer messages.
- The flow has been verified locally in the app, but it is not yet documented as deployed beyond localhost callback/logout auth wiring.

## Tenancy and security note

- Tenant scope remains server-derived from verified auth plus authoritative entitlements.
- The web app does not accept `tenant_id`, `tenantId`, or `x-tenant-id`.
- Auth failures fail closed:
  - missing local session cookie redirects to `/login`
  - `401` and `403` responses from backend calls redirect to `/logout`
- The web app does not derive tenant, role, or tier from request input or client-side cookie parsing.
