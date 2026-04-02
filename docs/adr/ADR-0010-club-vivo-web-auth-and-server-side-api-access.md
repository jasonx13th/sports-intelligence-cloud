# ADR-0010 - Club Vivo Web Auth and Server-Side API Access

Status: Accepted
Date: 2026-04-02

## Context

Week 12 introduced the first coach-facing web application in `apps/club-vivo`.

The web layer needed an explicit authentication and API access pattern that:

- fits the existing SIC platform boundary
- remains fail closed
- does not weaken multi-tenant isolation
- does not accept tenant identifiers from client input

The existing platform contract remains:

- tenant scope remains server-derived from verified auth plus authoritative entitlements
- `tenant_id`, `tenantId`, and `x-tenant-id` are never accepted from client input
- auth and authorization failures fail closed

The web layer also needed a practical localhost flow that works with the existing Cognito and backend setup.

## Decision

SIC will use the following web pattern for the Club Vivo app in `apps/club-vivo`:

- Cognito Hosted UI for sign-in
- authorization code flow with PKCE
- HttpOnly cookie storage for the access token
- server-side API calls from the Next.js app
- fail-closed redirects for auth failures

The implemented route pattern is:

- `/login` as the login entry route
- `/login/start` to generate auth state and PKCE values server-side and redirect to Hosted UI
- `/callback` to validate state, exchange the code server-side, set the access-token cookie, and redirect into the app
- `/logout` to clear local auth cookies

Protected app routes use a coarse cookie-presence check, and server-side data loading redirects:

- missing auth cookie -> `/login`
- backend `401` or `403` -> `/logout`

The web app will not:

- decode tokens for tenant authority
- derive tenant, role, or tier from client-side cookie parsing
- accept `tenant_id`, `tenantId`, or `x-tenant-id`

Authoritative tenant scope remains server-derived from verified auth plus authoritative entitlements through the existing backend.

## Consequences

Positive

- keeps auth and tenant authority server-side
- aligns the web app with the existing fail-closed SIC platform model
- avoids direct client-managed tenant context
- keeps backend access on the server side, which is the safest minimal Week 12 pattern

Negative

- the current flow is localhost-oriented
- current protected route handling uses `middleware.ts`, which should move to proxy later for Next 16 alignment
- validation messaging in the `/sessions/new` flow remains coarse at the app layer

## Alternatives considered

### Browser-side direct API calls as the default pattern

Rejected because the Week 12 safest minimal slice is server-side API access, and tenant and auth handling should stay server-side.

### Store tenant context in client-managed state or cookies

Rejected because tenant scope must remain server-derived from verified auth plus authoritative entitlements.

### Accept tenant selection from request input

Rejected because it violates the SIC non-negotiable multi-tenant contract.
