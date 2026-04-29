# Club Vivo Runtime Readiness Evidence

## Status

Local runtime readiness verification started from a clean `main` baseline after:

- PR #16 removed stale Club Vivo web runtime surfaces.
- PR #17 added the Club Vivo runtime readiness checklist.

## Branch

- Branch: `verify/club-vivo-runtime-readiness`
- Baseline commit: `cdc14ba`
- Baseline title: `docs(club-vivo): add runtime readiness checklist (#17)`

## Stale Route and Deleted Helper Search

Command group run from repo root:

- `grep -R "/dashboard" apps/club-vivo --exclude-dir=node_modules --exclude-dir=.next || true`
- `grep -R "/profile" apps/club-vivo --exclude-dir=node_modules --exclude-dir=.next || true`
- `grep -R "TeamsSetupManager" apps/club-vivo --exclude-dir=node_modules --exclude-dir=.next || true`
- `grep -R "selected-team" apps/club-vivo --exclude-dir=node_modules --exclude-dir=.next || true`
- `grep -R "session-builder-server" apps/club-vivo --exclude-dir=node_modules --exclude-dir=.next || true`

Result:

- No `/dashboard` references found.
- No `/profile` references found.
- No `TeamsSetupManager` references found.
- No `selected-team` references found.
- No `session-builder-server` references found.

## Local Build Validation

Commands run from `apps/club-vivo`:

- `npm.cmd run build`
- `./node_modules/.bin/tsc.cmd --noEmit`

Result:

- Production build passed.
- TypeScript check passed.
- Build completed with the current Next.js middleware-to-proxy warning.
- Warning recorded as non-blocking for this pass because middleware is out of scope.

## Build Route Output

Active routes confirmed by build:

- `/`
- `/_not-found`
- `/callback`
- `/equipment`
- `/home`
- `/login`
- `/login/start`
- `/logout`
- `/methodology`
- `/sessions`
- `/sessions/[sessionId]`
- `/sessions/new`
- `/sessions/quick`
- `/sessions/quick-review`
- `/teams`

Removed/stale routes absent from build output:

- `/dashboard`
- `/profile`

## Scope Boundaries Confirmed

No changes were made to:

- auth
- middleware
- callback/logout
- backend API
- tenancy or entitlements
- IAM or CDK
- package files
- runtime code

## Current Result

Local Club Vivo web runtime readiness checks passed for:

- clean branch baseline
- stale route regression search
- deleted helper regression search
- production build
- TypeScript check
- active route output verification

Remaining readiness work:

- Amplify hosting verification
- Amplify environment variable verification
- Cognito deployed callback/logout URL verification
- deployed route smoke test
- deployed API connectivity smoke test
