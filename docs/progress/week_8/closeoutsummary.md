# Week 8 — Closeout Summary (Testing & CI hardening sprint #1)
Date: 2026-03-30
Track: Testing & CI hardening sprint #1 (quality bar raise)

## Objective
Raise the platform quality bar with:
- PR CI gates that block regressions
- Repeatable integration smoke tests (auth + deterministic 4xx)
- CI/CD documentation (“how to ship” + runbooks)

(Aligns with SIC CI/CD discipline + fail-closed tenancy principles.)【:contentReference[oaicite:0]{index=0}】【:contentReference[oaicite:1]{index=1}】

---

## What We Built

### 1) CI gates that run on PR and push to main
- Added **CI Tests** workflow:
  - Runs Club Vivo API unit tests (`npm ci` + `npm test --prefix services/club-vivo/api`)
  - Parses export v1 JSON schemas to prevent broken schema commits
- Existing **Tenant Guardrails** workflow remains enforced:
  - Blocks client-controlled tenant scope patterns (query/body/headers, including `x-tenant-id` access patterns)

**Workflows now in repo**
- `.github/workflows/tenant-guardrails.yml`
- `.github/workflows/ci-tests.yml`
- `.github/workflows/smoke-tests.yml` (manual)

### 2) Unit test output hardening (signal > noise)
- Added a test-only console silencer imported via Node test runner so CI logs are readable.
- Opt-in verbosity remains possible via `TEST_VERBOSE=1`.

### 3) Integration smoke tests (repeatable, environment-separated)
- Added `scripts/smoke/smoke.mjs`:
  - `GET /me` with a valid token => 200
  - `GET /me` without token => 401/403
  - Unknown route => 404
- Added **Smoke Tests (manual)** GitHub Action (`workflow_dispatch`) taking:
  - `base_url`
  - `token` (Bearer access token)
- Pinned Node version in the manual smoke workflow for deterministic runs.

### 4) Repo hygiene improvements
- Added `.gitattributes` enforcing LF endings across repo text files to reduce CRLF churn and noisy diffs.

### 5) CI/CD documentation (Docs Day)
Added new runbooks:
- `docs/runbooks/ci.md` — what runs, what fails, how to debug locally
- `docs/runbooks/how-to-ship.md` — release hygiene + definition of done + pre/post merge checklist
- `docs/runbooks/smoke-tests.md` — how to run smoke tests + access_token guidance + common failure modes

---

## Tenancy / Security Guarantees (Non-negotiables upheld)
- **Fail-closed tenancy** remains the enforcement model:
  - Tenant scope is derived only from verified auth context + entitlements.
  - Never accept `tenant_id` / `tenantId` / `x-tenant-id` from request body/query/headers.
- CI now includes an explicit guardrail workflow that blocks common client-controlled tenant-scoping patterns before merge.

(These are constitutional SIC rules.)【:contentReference[oaicite:2]{index=2}】

---

## PRs / Commits (Week 8)
Merged PRs (high level):
1. Add CI workflow for unit tests + export schema parse
2. Silence console output during unit tests
3. Add `.gitattributes` to standardize LF endings
4. Add smoke test script + manual GitHub Actions runner
5. Pin Node version for manual smoke workflow
6. Add CI/CD runbooks (CI, how-to-ship, smoke tests)

---

## Validation Evidence
### CI gates
- PR checks consistently ran and passed:
  - Tenant Guardrails ✅
  - CI Tests / unit-tests ✅
  - CI Tests / export-schemas-parse ✅

### Local tests
- `npm test --prefix services/club-vivo/api` => green (48 tests)

### Smoke tests
- Local: `GET /me` with `Bearer <access_token>` => **200**
- GitHub Actions: **Smoke Tests (manual)** workflow => **Success**

Key lesson captured in runbooks:
- Use **access_token** for API Authorization; `id_token` may fail; expired tokens yield **401**.

---

## Decisions / Notes
- Chose **manual `workflow_dispatch` smoke tests** first to avoid storing secrets in repo.
- Smoke suite is intentionally minimal and deterministic until more endpoints are reliably deployed at the dev base URL.
- Prioritized “PR gate correctness” over expanding endpoint coverage.

---

## Observability Notes
- No production logging/metrics behavior changed.
- Test-only log silencing improves CI readability without affecting runtime structured logging.

---

## Next Steps (Week 9 preview)
Week 9 focus per roadmap: **S3 Data Lake foundations (tenant-safe)**:
- Define lake layout + access controls
- Ensure tenant cannot read other tenant prefixes
- Add runbooks/alarms for lake failures【:contentReference[oaicite:3]{index=3}】

---

## Certification Mapping (quick)
- **DVA-C02**: CI/CD gates, troubleshooting (Actions), auth token flows, automation discipline【:contentReference[oaicite:4]{index=4}】
- **AIF-C01 / MLA-C01**: Data contract/schema rigor + operational discipline foundations for later ML/GenAI pipelines【:contentReference[oaicite:5]{index=5}】【:contentReference[oaicite:6]{index=6}】
