# Runbook — CI

## Purpose
This runbook documents the current GitHub Actions CI checks for Sports Intelligence Cloud. It explains what runs on PR/push, what fails, and how to debug the workflows locally.

## What runs on PR / push
The repository currently has three CI workflows that run on `pull_request` and `push` to `main`:

- `.github/workflows/tenant-guardrails.yml`
  - Job: `tenant-guardrails`
  - Purpose: scan code for banned tenant-scoping patterns that read `tenant_id`/`tenantId` from client inputs.
- `.github/workflows/ci-tests.yml`
  - Job: `unit-tests`
  - Purpose: install dependencies and run unit tests for `services/club-vivo/api`.
  - Job: `export-schemas-parse`
  - Purpose: validate JSON parseability of schema files under `datasets/schemas/exports/v1/`.

## Workflow mapping

### Tenant guardrails
File: `.github/workflows/tenant-guardrails.yml`

This workflow fails if any source code under the repository's code roots reads tenant scope from a client-controlled input source such as:

- request body
- query string
- request headers like `x-tenant-id`

The exact banned patterns are enforced with ripgrep and include strings like `event.queryStringParameters.tenantId`, `req.body.tenant_id`, and `req.headers["x-tenant-id"]`.

### CI tests
File: `.github/workflows/ci-tests.yml`

This workflow runs on `ubuntu-latest` and performs:

- `npm ci` in `services/club-vivo/api`
- `npm test --prefix services/club-vivo/api`

It also parses every `datasets/schemas/exports/v1/*.json` file with Node.js to confirm the schema JSON is valid.

### Smoke tests
File: `.github/workflows/smoke-tests.yml`

This workflow is manual only and uses `workflow_dispatch`. It is not a PR/push gate, but it is part of the repo's CI/CD documentation and test hygiene.

## What fails

### Tenant guardrails failures
Failing this workflow means the repo contains one or more patterns that may read tenant scope from untrusted client input. Examples include:

- `req.body.tenant_id`
- `event.queryStringParameters.tenantId`
- `headers["x-tenant-id"]`

If this workflow fails, the code must be corrected so tenant isolation is derived only from verified auth and the entitlements store.

### Unit test failures
Failing `unit-tests` means the Club Vivo API package has one or more test failures or install issues.

### Schema parse failures
Failing `export-schemas-parse` means one or more JSON schema files in `datasets/schemas/exports/v1/` are invalid JSON.

## Tenant safety rule
**Never accept `tenant_id`, `tenantId`, or `x-tenant-id` from client input.**
Tenant scope must come from verified auth context and authoritative entitlements, not from request body, query params, or headers.

This is enforced by the tenant guardrails workflow and by the repo's architecture contract in `docs/architecture/tenant-claim-contract.md`.

## How to debug locally

### Tenant guardrails locally
Use a local grep-style scan to mirror the workflow's intent:

```bash
cd <repo-root>
rg -I -n \\b(tenant_id|tenantId)\\b . --glob 'services/**' --glob 'apps/**' --glob 'src/**' --glob 'lambdas/**' --glob 'lambda/**' --glob 'backend/**' | grep -E 'queryStringParameters|headers|body|req\.query|req\.body|x-tenant-id'
```

If you do not have `rg`, use `grep` or an editor search. Fix any matches that read tenant scope from client inputs.

### Unit tests locally

```bash
cd <repo-root>
npm ci --prefix services/club-vivo/api
npm test --prefix services/club-vivo/api
```

### Schema parse locally

```bash
cd <repo-root>
for f in datasets/schemas/exports/v1/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'));"
  echo "OK: $f"
done
```

## GitHub Actions usage
The PR and push workflows are triggered automatically on:

- `pull_request`
- `push` to `main`

Use the Actions tab to inspect the run history for:

- `Tenant Guardrails`
- `CI Tests`

## Related runbooks
- `docs/runbooks/how-to-ship.md` — release hygiene and definition of done.
- `docs/runbooks/smoke-tests.md` — manual runtime validation and token guidance.
