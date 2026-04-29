# Club Vivo Runtime Readiness Checklist

## 1. Title and Purpose

This checklist validates the Club Vivo web runtime before deployment or hosting changes.

Scope is limited to documentation and verification of the active `apps/club-vivo` web surface. It does not authorize auth, middleware, callback/logout, backend API, tenancy, entitlement, IAM, CDK, or package changes.

## 2. Current Branch and Baseline

- [ ] Confirm the working branch is `checklist/club-vivo-runtime-readiness`.
- [ ] Confirm `main` is clean and current at commit `6a32445`.
- [ ] Confirm PR #16 removed stale Club Vivo web runtime surfaces.
- [ ] Confirm the active web app remains `apps/club-vivo`.
- [ ] Confirm `/dashboard` and `/profile` remain removed and are not reintroduced.

## 3. GitHub Repo Readiness

- [ ] Confirm the branch has only the intended documentation change.
- [ ] Confirm there are no app code, backend code, infra, auth, middleware, Cognito, IAM, CDK, package, or unrelated doc edits.
- [ ] Confirm no ignored local folders or generated artifacts are staged or included.
- [ ] Confirm any future PR description names this as a runtime readiness checklist only.

## 4. Club Vivo Web Build Readiness

- [ ] From `apps/club-vivo`, run the production build command used by the app.
- [ ] Confirm the build completes without TypeScript errors.
- [ ] Confirm the build route output includes only expected active routes.
- [ ] Confirm the build route output does not include `/dashboard` or `/profile`.
- [ ] Record any build warnings separately from blocking failures.

## 5. Amplify Hosting Readiness

- [ ] Confirm Amplify is configured to build and host `apps/club-vivo`.
- [ ] Confirm the Amplify build command and output directory match the current Next.js app configuration.
- [ ] Confirm Amplify environment variables are present for the target environment.
- [ ] Confirm deployment branch mapping targets the intended branch or release branch.
- [ ] Confirm no hosting change depends on backend, IAM, CDK, or Cognito edits in this checklist.

## 6. Environment Variables to Verify

- [ ] Verify the app base URL used by the browser runtime.
- [ ] Verify API base URL configuration for the target environment.
- [ ] Verify Cognito domain, client ID, and region values.
- [ ] Verify callback URL configuration used by login flow.
- [ ] Verify logout URL configuration used by logout flow.
- [ ] Verify any feature flags or runtime toggles required by `apps/club-vivo`.
- [ ] Confirm local-only values remain in ignored files such as `.env.local`.

## 7. Cognito Callback/Logout URL Checks

- [ ] Confirm Cognito callback URLs include the deployed `/callback` URL.
- [ ] Confirm Cognito logout URLs include the deployed `/logout` URL.
- [ ] Confirm local callback/logout URLs are only present where appropriate for local testing.
- [ ] Confirm no callback, logout, middleware, or auth code changes are part of this readiness pass.
- [ ] Confirm login returns the user to an active route, not `/dashboard` or `/profile`.

## 8. Active Route Smoke Test

Smoke test these active routes after local build and after deployment:

- [ ] `/`
- [ ] `/callback`
- [ ] `/equipment`
- [ ] `/home`
- [ ] `/login`
- [ ] `/login/start`
- [ ] `/logout`
- [ ] `/methodology`
- [ ] `/sessions`
- [ ] `/sessions/[sessionId]`
- [ ] `/sessions/new`
- [ ] `/sessions/quick`
- [ ] `/sessions/quick-review`
- [ ] `/teams`

For protected routes:

- [ ] Confirm unauthenticated users are handled by the existing auth flow.
- [ ] Confirm authenticated users can load the route without runtime errors.
- [ ] Confirm navigation stays within the active route set.

## 9. API Connectivity Smoke Test

- [ ] Confirm authenticated API calls use the configured API base URL.
- [ ] Confirm `/home` loads the expected coach context.
- [ ] Confirm `/teams` can load team data.
- [ ] Confirm `/equipment` can load and update equipment state where supported.
- [ ] Confirm `/methodology` can load methodology data.
- [ ] Confirm `/sessions` can load session history.
- [ ] Confirm `/sessions/new`, `/sessions/quick`, and `/sessions/quick-review` can complete their expected API-backed flows.
- [ ] Confirm `/sessions/[sessionId]` loads an existing session by ID.

## 10. Stale Route Regression Checks

- [ ] Search `apps/club-vivo` for `/dashboard`.
- [ ] Search `apps/club-vivo` for `/profile`.
- [ ] Search `apps/club-vivo` for stale dashboard/profile links, redirects, router pushes, or nav items.
- [ ] Confirm no route manifests, build output, or generated links expose `/dashboard` or `/profile`.
- [ ] Confirm any references found are comments or historical notes only, or remove them in a separate scoped cleanup.

## 11. Local-Only Files and Ignored Artifacts

- [ ] Do not delete `.workspace`.
- [ ] Do not delete `.env.local`.
- [ ] Do not delete `node_modules`.
- [ ] Do not delete `.next`.
- [ ] Do not delete `cdk.out`.
- [ ] Do not delete `infra/cdk/.local`.
- [ ] Confirm ignored artifacts are not staged.

## 12. Deployment Validation Notes

- [ ] Record the deployed URL tested.
- [ ] Record the commit SHA deployed.
- [ ] Record the Amplify app and branch used for deployment.
- [ ] Record build status and timestamp.
- [ ] Record any non-blocking warnings.
- [ ] Record smoke test pass/fail results for each active route.
- [ ] Record API connectivity pass/fail results.

## 13. Stop Conditions

Stop and do not deploy from this checklist if any of the following are true:

- [ ] `/dashboard` or `/profile` reappears as an active route, link, redirect, or nav item.
- [ ] Auth, middleware, callback/logout, Cognito, tenancy, entitlement, IAM, CDK, or backend changes are required.
- [ ] The production build fails.
- [ ] Protected routes cannot complete the existing auth flow.
- [ ] Required environment variables are missing in Amplify.
- [ ] API connectivity fails for core Club Vivo flows.
- [ ] Ignored local files or generated artifacts are staged.

## 14. Final Sign-Off Checklist

- [ ] Only `docs/progress/new-sic/club-vivo-runtime-readiness-checklist.md` changed for this task.
- [ ] `git status --short` shows only the intended documentation file.
- [ ] `git diff --stat` matches the expected documentation-only change.
- [ ] Club Vivo web build readiness has been verified.
- [ ] Amplify hosting readiness has been verified.
- [ ] Active route smoke tests have been completed.
- [ ] API connectivity smoke tests have been completed.
- [ ] Stale route regression checks have passed.
- [ ] No commits were created unless explicitly requested.
