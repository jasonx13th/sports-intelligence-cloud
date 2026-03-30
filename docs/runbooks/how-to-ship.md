# Runbook — How to Ship

## Purpose
This runbook defines the current release hygiene and definition of done for shipping changes in Sports Intelligence Cloud. It is intentionally focused on the repo's current CI/CD reality: code reviews, PR checks, tenant safety, and post-merge validation.

## Release hygiene

### Branch and PR discipline
- Use a descriptive branch name.
- Keep PRs small and focused on one feature or fix.
- Do not add new top-level folders unless there is an explicit architecture decision and approval.
- Include a short summary of what changed and why.

### PR description expectations
- Mention the workflows affected by the change.
- Reference `docs/architecture/tenant-claim-contract.md` if auth or tenant isolation behavior is involved.
- List any manual validation performed.
- Note if the change is documentation-only.

## Definition of Done
A change is ready to ship when it meets all of the following:

- [ ] CI passes on PR and `main`.
- [ ] `docs/runbooks/ci.md` is up to date if the change affects CI behavior.
- [ ] `docs/runbooks/smoke-tests.md` is updated if runtime validation or API contract changes are involved.
- [ ] No source code reads `tenant_id`, `tenantId`, or `x-tenant-id` from request body, query params, or headers.
- [ ] Unit tests are added or updated for code changes.
- [ ] Any schema or contract change is reflected in repo documentation.
- [ ] Reviewer checklist items are addressed.

## Pre-merge checklist

### Run local validation
- `npm ci --prefix services/club-vivo/api`
- `npm test --prefix services/club-vivo/api`
- `cd <repo-root> && for f in datasets/schemas/exports/v1/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'));"; echo "OK: $f"; done`
- Use search to confirm no banned tenant-scoping patterns are introduced.

### Confirm repository guardrails
- Review `.github/workflows/tenant-guardrails.yml` for tenant safety enforcement.
- Review `.github/workflows/ci-tests.yml` for code and schema checks.
- If adding manual smoke validation, review `.github/workflows/smoke-tests.yml` and `scripts/smoke/smoke.mjs`.

### Reviewer checklist
- Verify the PR description includes CI signals and validation commands.
- Confirm changes do not depend on client-supplied tenant identifiers.
- Confirm no changes were made to infra/IAM/CDK unless explicit approval was granted.
- Confirm documentation updates were included where required.

## Post-merge checklist
- Confirm PR push triggered the workflows on `main`.
- Verify the Actions run status in GitHub for:
  - `Tenant Guardrails`
  - `CI Tests`
- If the change touched API behavior or auth, optionally run the smoke test workflow from `docs/runbooks/smoke-tests.md`.
- Add a short note to `docs/progress/` describing the shipped change and any validation results.

## Tenant safety
**Non-negotiable rule:** never accept `tenant_id`, `tenantId`, or `x-tenant-id` from client input.
Tenant scope must be derived from verified auth context and the entitlements store. This is required by the repo's architecture contract in `docs/architecture/tenant-claim-contract.md`.

## Commands to run

```bash
cd <repo-root>
npm ci --prefix services/club-vivo/api
npm test --prefix services/club-vivo/api
for f in datasets/schemas/exports/v1/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'));"
  echo "OK: $f"
done
```

## Related runbooks
- `docs/runbooks/ci.md` — CI workflow behavior and debugging.
- `docs/runbooks/smoke-tests.md` — manual smoke test guidance and access token usage.
