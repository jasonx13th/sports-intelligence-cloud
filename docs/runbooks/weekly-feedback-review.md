# Weekly Feedback Review

## Purpose

This runbook defines the current-state weekly review workflow for SIC coach feedback and session events.

It is intentionally:

- manual-first
- low-cost
- realistic for a solo builder
- based on evidence that exists today

This is not an automated analytics system.
This is not a dashboard-driven operating model.

---

## Current-State Operating Model

Use this workflow once per week to review:

- what coaches generated
- what coaches exported
- which sessions appear to have been run
- which sessions received feedback
- where product friction or validation problems are showing up

Review one tenant at a time.
Do not attempt cross-tenant rollups from request-derived tenant inputs.

---

## Evidence Sources Available Now

Use only the evidence sources that currently exist in the product and platform.

### 1. Feedback records

Use tenant-scoped `SESSION_FEEDBACK` items to review:

- ratings
- run status
- objective met signals
- reuse signals
- notes
- changes for next time

### 2. Session event items

Use tenant-scoped `SESSION_EVENT` items to review:

- `session_generated`
- `session_exported`
- `session_run_confirmed`
- `feedback_submitted`

These give the current lightweight product activity trail.

### 3. Logs

Use current structured application logs to review:

- success events such as:
  - `session_feedback_created`
  - `session_pdf_exported`
  - `template_generated`
- request failures
- obvious retry/conflict patterns

### 4. Postman / manual smoke checks

Use existing Postman requests or manual API checks to verify that key flows still behave correctly:

- feedback submit
- PDF export
- template-based session generation

---

## Review Cadence

Recommended cadence:

- once per week
- one focused review block of 30 to 60 minutes

Good default rhythm:

- review the previous 7 days
- write one short summary note
- pick 1 to 3 product follow-ups only

---

## Weekly Review Checklist

### 1. Confirm the product slice still works

- run a small smoke check for:
  - template generate
  - PDF export
  - feedback submit
- verify expected happy-path responses
- verify one or two intentional rejection paths still return the expected errors

### 2. Review recent feedback records

- look for repeated low ratings
- look for repeated `not_run`
- look for repeated `wouldReuse = false`
- read notes and `changesNextTime` for common patterns

### 3. Review recent session events

- check whether generated sessions are also being exported
- check whether exported sessions are later getting feedback
- check whether feedback is creating run confirmations where expected

### 4. Review logs

- look for concentrated `400`, `404`, or `409` patterns
- look for PDF export failures
- look for request failures that may indicate product confusion or rough edges

### 5. Summarize product takeaways

- what seems to be used
- what seems to be ignored
- what coaches appear to struggle with
- what the smallest next product fix should be

---

## Suggested Weekly Output Note Format

Use a short note format like this:

### Week of `<date>`

- Tenant reviewed: `<tenantId or internal label>`
- Time window: `<start>` to `<end>`
- Smoke checks completed:
  - template generate
  - PDF export
  - feedback submit
- What happened:
  - `<short factual summary>`
- Feedback themes:
  - `<top 1 to 3 patterns>`
- Event themes:
  - `<generation/export/run/feedback observations>`
- Log findings:
  - `<errors or notable warnings>`
- Product actions for next week:
  - `<1 to 3 small follow-ups>`

Keep this note short.
Prefer concrete observations over broad interpretation.

---

## Practical Review Heuristics

Use simple questions first:

- Are sessions being generated but never exported?
- Are sessions being exported but not getting feedback?
- Are coaches saying sessions were not run?
- Are coaches repeatedly changing the same thing next time?
- Are low ratings clustered around one kind of session or template?

For the current SIC stage, these questions are more useful than broad analytics.

---

## Current Limitations

This workflow is intentionally manual because SIC is not ready for heavier analytics yet.

Current limitations:

- no dedicated timeline read endpoint
- no dashboard
- no scheduled weekly aggregation
- no automated summary generation
- no built-in cross-tenant review surface

---

## Explicit Deferrals

The following are deferred on purpose:

- dashboards
- new read endpoints
- scheduled aggregation
- Athena or QuickSight reporting
- cross-tenant rollups
- ML or RAG analysis

These may become useful later, but they are not required for the current Week 14 operating workflow.

---

## Tenancy and Safety Notes

- tenant scope must remain server-derived from verified auth plus entitlements
- do not trust `tenant_id`, `tenantId`, or `x-tenant-id` from requests
- review data tenant by tenant
- do not use scan-then-filter patterns for tenant isolation
- do not treat this workflow as permission to build ad hoc cross-tenant analytics

---

## When To Revisit This Runbook

Revisit this runbook when SIC gains any of the following:

- a timeline read endpoint
- a coach-facing session history view
- a real dashboard for feedback/events
- enough volume to justify scheduled summaries
- a clearer product need for aggregate reporting
