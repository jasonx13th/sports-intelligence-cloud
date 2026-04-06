# Week 5 Day 4 — Closeout Summary (SIC / Club Vivo)

## What we built (end-to-end outcomes)
- **PDF export E2E**: `GET /sessions/{sessionId}/pdf` generates a minimal session PDF server-side, stores it in **tenant-scoped S3**, and returns a **short‑TTL presigned URL**. Verified by downloading and opening the PDF.
- **Tenancy regression preserved**: cross-tenant access to both session and PDF export fails closed (**404**).
- **Operational readiness**:
  - **Runbook + demo script**: added a shareable Week 5 operator/demo runbook.
  - **Minimal observability**: CloudWatch **metric filters**, **dashboard**, and **alarm** for coach-loop signals (session create + PDF export success/failure, handler errors).

## Files changed (high-level)

### API
- `services/club-vivo/api/sessions/handler.js`
- `services/club-vivo/api/sessions/handler.test.js`
- `services/club-vivo/api/_lib/session-pdf.js` (+ test)
- `services/club-vivo/api/_lib/session-pdf-storage.js` (+ test)
- `services/club-vivo/api/package.json`, `services/club-vivo/api/package-lock.json`

### Infra (CDK)
- `infra/cdk/lib/sic-api-stack.ts`
- `infra/cdk/bin/sic-auth.ts`
- `infra/cdk/bin/sic-api.ts` (API-only synth/diff entrypoint)

### Docs
- `docs/progress/week_05/demo-script.md`

## Commits (evidence)
- `88add42` — API-only PDF export (helpers + handler route + tests)
- `cdb9211` — CDK: PDF exports bucket + route + env vars + entrypoint support
- `fa435a0` — Docs: Week 5 demo runbook
- `6b4ed60` — API: add `pdf_export_failed` structured log marker + test
- `ea950c2` — CDK: coach-loop observability (metric filters + dashboard + alarm)

## Errors encountered + how we fixed them
- **PowerShell path issues**: initial repo scans failed when run from `infra/cdk`; fixed by running from repo root and/or adjusting paths.
- **CDK synth/diff blocked by env vars** (`SIC_USER_POOL_ID`, `SIC_USER_POOL_CLIENT_ID`):
  - Added **API-only CDK entrypoint** `bin/sic-api.ts` using placeholder values for synth/diff only.
- **CDK diff blocked by account resolution**:
  - Set `CDK_DEFAULT_ACCOUNT` / `CDK_DEFAULT_REGION`, verified creds via `aws sts get-caller-identity`.
- **Windows Node test runner `spawn EPERM`** intermittently:
  - Worked around by running tests in the proven “file-by-file / reporter tweak” pattern.
- **Request validation failure**:
  - `POST /sessions` rejected unknown field `theme`; fixed by using only allowed schema: `sport, ageBand, durationMin, objectiveTags, activities, clubId, teamId, seasonId`.

## Key design decisions (and why)
- **Dedicated PDF exports bucket** (not CDK assets bucket; not chatbot bucket; not training bucket):
  - reduces accidental mixing, keeps IAM tight, enables simple lifecycle policy later.
- **Tenant-scoped S3 keys derived only from tenant context**:
  - `tenant_<tenantId>/sessions/<sessionId>.pdf`; never user-supplied paths.
- **Route detection uses HTTP API v2 `event.routeKey`** when available:
  - avoids path/template mismatches and brittle regex-only routing.
- **Added `pdf_export_failed` log marker**:
  - enables reliable CloudWatch metric filtering for failures (dynamic paths aren’t filter-friendly).

## How to validate (commands + expected outputs)

### API functional
- Create session (valid schema) → **201** with `sessionId`.
- Export PDF:
  - `GET /sessions/{sessionId}/pdf` → `{ url, expiresInSeconds: 300 }`
  - Download via `Invoke-WebRequest $url -OutFile session.pdf` → PDF downloads/opens.

### Tenancy (fail-closed)
- With token from different tenant:
  - `GET /sessions/{id}` → **404**
  - `GET /sessions/{id}/pdf` → **404**

### Observability
- Metrics emit:
  - `SIC/ClubVivo::session_create_success` increments on session create
  - `SIC/ClubVivo::pdf_export_success` increments on PDF export
- Dashboard exists:
  - `sic-club-vivo-dev`
- Alarm exists + correct wiring:
  - `sic-dev-pdf-export-failures` on `SIC/ClubVivo::pdf_export_failure`
  - `TreatMissingData = notBreaching`

## Security / tenancy check (fail closed)
- **Tenant authority**: derived only from verified auth context + entitlements store; never accepted from headers/query/body.
- **Tenant-scoped session lookup**: repository access is tenant-scoped by construction.
- **S3 access**: least-privilege IAM for SessionsFn: `s3:PutObject` + `s3:GetObject` on the PDF bucket **object ARNs only**.

## Observability notes
- Logs→metrics via metric filters for:
  - session create success
  - pack success
  - pdf success/failure
  - handler_error aggregation
- Dashboard `sic-club-vivo-${envName}` and alarm `sic-dev-pdf-export-failures`.

## Cost notes
- PDF generation is small payload; S3 storage costs minimal.
- Presigned URL avoids proxying bytes through Lambda/API Gateway.
- Auto-delete objects enabled only for dev bucket cleanup to avoid long-lived clutter.

## Next starting point (Week 6)
- Repo hygiene: ignore local artifacts (e.g., `session.pdf`) and consider `.gitattributes` to reduce CRLF/LF churn.
- Extend coach loop:
  - “session pack → PDF pack export” (multi-session PDF)
  - lifecycle policy on exports bucket (expire after 14–30 days)
- Observability enhancements:
  - add alarm actions (SNS) if desired
  - add targeted 5xx alarms per Lambda if needed

## Cert mapping (DVA-C02 + MLA-C01 + AIF-C01)
- **DVA-C02**: API Gateway + Lambda patterns, least-privilege IAM, S3 presigned URLs, CloudWatch dashboards/alarms/metric filters, CDK synth/diff discipline.
- **MLA-C01**: Data separation strategy (training vs operational vs artifacts), pipeline mindset for curated datasets (next phase).
- **AIF-C01**: Governance posture (separation of chatbot artifacts vs coach content vs training data), tenant isolation as a safety control, operational monitoring for reliability.
