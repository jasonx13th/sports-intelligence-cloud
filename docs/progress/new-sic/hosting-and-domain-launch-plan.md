# New SIC Hosting and Domain Launch Plan

## 1. Title

New SIC Hosting and Domain Launch Plan

## 2. Why This Exists

The New SIC starting point is not complete until Club Vivo runs on a real hosted URL.

A hosted environment gives SIC a real truth test for the frontend, backend, auth, AWS services, costs, and GitHub presentation. Local development and screenshots are useful, but they do not prove that coaches and admins can reach the product, sign in, generate sessions, save work, and report issues in a real environment.

The goal is a stable 3-month pilot/test environment, not a huge production overbuild. The first hosted version should be practical, low-cost, observable enough to debug, and narrow enough to maintain.

## Related Docs

- Hosting/domain planning: this document.
- Broad deployment readiness: [deployment-readiness-checklist.md](deployment-readiness-checklist.md).
- Narrow Club Vivo runtime readiness: [club-vivo-runtime-readiness-checklist.md](club-vivo-runtime-readiness-checklist.md).
- Local runtime readiness evidence: [club-vivo-runtime-readiness-evidence.md](club-vivo-runtime-readiness-evidence.md).
- Docs overlap/audit guidance: [docs-readiness-duplication-audit.md](docs-readiness-duplication-audit.md).

## 3. Recommended Hosting Direction

Recommended direction:

- Use AWS Amplify Hosting for the `apps/club-vivo` Next.js frontend.
- Keep the existing CDK backend as API Gateway + Lambda + DynamoDB + S3 + Cognito + CloudWatch + limited Bedrock where currently wired.
- Use Route 53 or another domain/DNS provider for the public domain.
- Do not create a separate frontend/backend architecture unless Amplify becomes limiting.

This keeps the hosted app close to the current repo structure and avoids adding unnecessary platform complexity before the pilot proves real usage.

## 4. Environment Model

Use a simple environment model:

- Local development
  - Developer machine, local Next.js app, local environment variables, and deployed backend references as needed.
- Hosted pilot/staging environment
  - First real hosted Club Vivo URL.
  - Used for the 3-month test period with real coaches/admins.
  - Treated as pilot/staging, not full production.
- Future production environment
  - Introduced only after pilot usage, cost behavior, auth, support workflow, and operational expectations are understood.

The first hosted environment should not pretend to be enterprise production. It should be reliable enough for real testing, but intentionally scoped.

## 5. Domain Decision

Domain tasks:

- Choose the domain name.
- Decide whether to buy/manage the domain in Route 53 or with an external provider.
- Configure DNS for the hosted frontend.
- Configure HTTPS.
- Set the final live app URL.
- Update the GitHub README only after the URL works.

The domain decision should prioritize trust, clarity, and operational simplicity. The URL should reflect Club Vivo as the active product, while SIC remains the platform identity behind it.

## 6. Frontend Hosting Plan

Frontend hosting steps:

- Connect the GitHub repo/branch to AWS Amplify Hosting.
- Configure the app root as `apps/club-vivo`.
- Configure build settings for the Next.js app.
- Configure frontend environment variables needed by the hosted app.
- Confirm Cognito login, callback, and logout URLs.
- Deploy the hosted frontend.
- Validate that the hosted app loads, signs in, calls the API, and handles errors cleanly.

The first deployment should be small and reversible. Do not use the hosted launch as a reason to add new app surfaces or broaden scope.

## 7. Backend Readiness Plan

Confirm the current CDK stack is the backend source of truth.

Active API Gateway routes to confirm:

- `/me`
- `/session-packs`
- `/sessions`
- `/teams`
- `/methodology`
- `/templates`
- `/athletes`

Confirm these not-currently-CDK-wired folders remain unwired:

- `clubs`
- `memberships`
- `exports-domain`
- `lake-ingest`
- `lake-etl`

Confirm the deployed backend shape is understood:

- DynamoDB tables
- S3 buckets
- Cognito
- Bedrock permissions
- CloudWatch signals

Do not wire unused AWS resources just to make the repo look bigger. New routes, buckets, Glue/Athena/lake resources, or EventBridge paths should only be wired when they are needed and approved.

## 8. Cognito/Auth Checklist

Auth checklist:

- Hosted app URL is added to Cognito callback allowed URLs.
- Hosted app URL is added to Cognito logout allowed URLs.
- Local URLs remain available for development.
- Login flow ends in the correct app route.
- Auth remains fail closed.
- Tenant context remains server-derived from auth plus entitlements.
- Client requests do not supply or control `tenant_id`, `tenantId`, or `x-tenant-id`.

The hosted launch must preserve the existing tenant-safety boundary. A real domain should not weaken the platform rules.

## 9. Budget And Cost Controls

Cost checklist:

- Create or confirm an AWS Budget alarm.
- Review Amplify hosting and build cost expectations.
- Review API Gateway cost drivers.
- Review Lambda cost drivers.
- Review DynamoDB cost drivers.
- Review S3 cost drivers.
- Review Cognito cost drivers.
- Review CloudWatch log, metric, dashboard, and alarm cost drivers.
- Review Bedrock cost drivers.
- Set expectations for a low-cost pilot environment.
- Avoid Glue/Athena/lake resources until a real need exists.
- Track Bedrock usage carefully.

Budget discipline is part of the product architecture. The hosted pilot should prove value without silently expanding the AWS footprint.

## 10. 3-Month Pilot Validation Checklist

Validate these areas weekly:

- Login works.
- Session generation works.
- Quick Session works.
- Session Builder works.
- Saved sessions work.
- Teams work.
- Methodology works.
- Feedback works.
- PDF export works.
- Errors are visible enough to debug.
- AWS costs stay under control.
- Coaches can use the app without developer help.

Validate these areas monthly:

- Which workflows are actually used.
- Which workflows confuse coaches.
- Whether auth, tenant context, and entitlements remain stable.
- Whether CloudWatch signals are enough to diagnose issues.
- Whether Bedrock usage and cost are acceptable.
- Whether the hosted app should remain pilot/staging or move toward production.
- Whether GitHub docs still match the deployed reality.

The 3-month test should produce evidence, not just a deployed URL.

## 11. GitHub Alignment

The GitHub README should eventually include the live URL.

GitHub `main` should keep files that support the active hosted app, clean docs, contracts, architecture, tests, and future concepts. It should not make parked or historical work look like active shipped runtime.

The hosted app becomes the truth test for future cleanup decisions. If a folder, doc, or workflow does not support the hosted Club Vivo app, an intentional future concept, a contract, or useful historical context, it should be reviewed for relabeling, summary, or archive.

## 12. Definition Of Starting Point Complete

The New SIC starting point is complete when:

- Hosted app URL works.
- Custom domain works.
- Cognito auth works.
- Active backend flows work.
- Budget alarms are configured.
- README links to the live app.
- Architecture docs match deployed resources.
- 3-month pilot checklist is ready.

Completion means the repo, docs, hosted app, and AWS footprint tell the same story.

## 13. Risks And Decisions

Open decisions:

- Amplify vs another hosting option.
- Route 53 vs external DNS.
- Environment naming for dev, staging, and production.
- Whether to deploy from `main` or a dedicated release branch.
- How to handle environment variables safely.
- How to validate real workflows without exposing private data.

Risks:

- Amplify may become limiting for future needs, but it is a reasonable first hosted path.
- Cognito callback/logout URLs can easily drift between local and hosted environments.
- A hosted URL can create false confidence if backend routes, costs, and errors are not watched.
- Real coaches may reveal workflow gaps that local testing did not expose.
- Public GitHub docs may overstate parked features if cleanup discipline slips.

## 14. Recommended Next Action

Create a deployment readiness checklist next, then deploy the hosted frontend in small steps.

The next step should focus on readiness, not expansion: confirm env vars, Cognito URLs, API URL, branch choice, DNS choice, budget alarm, and validation flow before turning the hosted app into the public GitHub signal.
