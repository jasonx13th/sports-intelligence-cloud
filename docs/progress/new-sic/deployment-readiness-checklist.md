# New SIC Deployment Readiness Checklist

## Related Docs

- Hosting/domain planning: [hosting-and-domain-launch-plan.md](hosting-and-domain-launch-plan.md).
- Broad deployment readiness: this document.
- Narrow Club Vivo runtime readiness: [club-vivo-runtime-readiness-checklist.md](club-vivo-runtime-readiness-checklist.md).
- Local runtime readiness evidence: [club-vivo-runtime-readiness-evidence.md](club-vivo-runtime-readiness-evidence.md).
- Docs overlap/audit guidance: [docs-readiness-duplication-audit.md](docs-readiness-duplication-audit.md).

## Account Access Rule

- [ ] Use the `j-admin` IAM administrator account for normal AWS Console work.
- [ ] Do not use the AWS root account for everyday deployment work.
- [ ] Keep the root account locked down with MFA.
- [ ] Use root only for root-required account or billing tasks.
- [ ] Confirm there are no root access keys.

## Pre-Flight Repo State

- [ ] `main` is clean.
- [ ] `origin/main` is current.
- [ ] Latest hosting and domain launch plan is pushed.
- [ ] Active app is `apps/club-vivo`.
- [ ] Backend source of truth remains `infra/cdk`.

## Hosting Decision

- [ ] AWS Amplify Hosting is selected for the frontend.
- [ ] App root is `apps/club-vivo`.
- [ ] Deployment branch is chosen.
- [ ] Environment name is chosen, likely `pilot` or `staging`.
- [ ] Custom domain decision is pending or chosen.

## Domain/DNS Readiness

- [ ] Domain is chosen.
- [ ] Route 53 or external DNS provider decision is made.
- [ ] HTTPS is required.
- [ ] Final app URL is documented.
- [ ] GitHub README is updated only after the URL works.

## Amplify Readiness

- [ ] GitHub repo is connected to AWS Amplify Hosting.
- [ ] Deployment branch is selected.
- [ ] App root is configured as `apps/club-vivo`.
- [ ] Build command is confirmed as `npm run build`.
- [ ] Next.js output and framework handling are confirmed in Amplify.
- [ ] Frontend environment variables are configured.
- [ ] Build logs are clean.
- [ ] Rollback path is confirmed.

## Frontend Env Vars Checklist

Before entering hosted values, inspect the current `.env.example` if present, `apps/club-vivo/README.md`, and app config in `apps/club-vivo/lib`.

- [ ] API base URL: `CLUB_VIVO_API_URL`.
- [ ] Cognito domain or issuer: `CLUB_VIVO_COGNITO_DOMAIN`.
- [ ] Cognito client ID: `CLUB_VIVO_WEB_CLIENT_ID`.
- [ ] Cognito redirect/callback URL: `CLUB_VIVO_REDIRECT_URI`.
- [ ] Cognito logout URL: `CLUB_VIVO_LOGOUT_URI`.
- [ ] Environment or stage flag, if added or required: placeholder `CLUB_VIVO_ENVIRONMENT` or `NEXT_PUBLIC_APP_ENV`.

## Cognito Checklist

- [ ] Hosted callback URL is added to Cognito allowed callback URLs.
- [ ] Hosted logout URL is added to Cognito allowed logout URLs.
- [ ] Localhost callback and logout URLs remain for development.
- [ ] App client settings are verified.
- [ ] Login flow lands in the expected route.
- [ ] Auth remains fail closed.
- [ ] Client does not supply tenant identity.
- [ ] Tenant context remains server-derived from auth plus entitlements.

## Backend Readiness Checklist

Active API routes to validate:

- [ ] `/me`
- [ ] `/session-packs`
- [ ] `/sessions`
- [ ] `/teams`
- [ ] `/methodology`
- [ ] `/templates`
- [ ] `/athletes`

Backend deployment checks:

- [ ] API Gateway URL is known.
- [ ] Lambda functions are deployed.
- [ ] DynamoDB tables exist.
- [ ] `SessionPdfBucket` exists.
- [ ] Cognito entitlements flow is understood.
- [ ] Bedrock permission is understood where wired.
- [ ] CloudWatch logs are available.

## Not-Currently-Wired Reminder

Keep these unwired during launch unless explicitly approved:

- `clubs`
- `memberships`
- `exports-domain`
- `lake-ingest`
- `lake-etl`

Do not deploy unused AWS resources just to look complete. The hosted launch should prove the active Club Vivo path, not expand the AWS footprint for parked or future work.

## Budget Checklist

- [ ] AWS Budget alarm exists.
- [ ] Billing access is available to `j-admin` or the account owner.
- [ ] Amplify build and hosting costs are understood.
- [ ] Bedrock usage is monitored.
- [ ] CloudWatch log retention is reviewed.
- [ ] No Glue, Athena, or lake resources are added for launch.

## Validation Checklist After Deployment

- [ ] Hosted app loads.
- [ ] Login works.
- [ ] Logout works.
- [ ] `/me` works.
- [ ] Quick Session works.
- [ ] Session Builder works.
- [ ] Saved sessions list and detail work.
- [ ] Teams works.
- [ ] Methodology works.
- [ ] Feedback works.
- [ ] PDF export works.
- [ ] Error states are visible enough to debug.

## GitHub Update Checklist

- [ ] Add live URL to README only after validation.
- [ ] Update system map if deployed shape differs.
- [ ] Update closeout summary after successful deployment.

## Stop Conditions

Stop and do not continue deployment if:

- Auth callback fails.
- App cannot call the API.
- Tenant context fails.
- Unexpected AWS costs appear.
- Build logs expose secrets.
- Any route requires the root account unexpectedly.

## Recommended Console Order

1. Sign in as `j-admin`.
2. Check billing and budget access.
3. Inspect Cognito URLs.
4. Inspect current API Gateway URL.
5. Inspect frontend env vars.
6. Create Amplify app.
7. Deploy.
8. Update Cognito URLs.
9. Validate login and API flows.
10. Attach domain.
11. Update README after success.
