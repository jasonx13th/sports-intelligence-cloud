# Runbook: Session Builder Image-Assisted Intake v1 Failures

## Purpose

This runbook explains how to reason about the current Week 18 image-assisted intake slice when it fails or appears confusing in production-like use.

It covers only the current implemented Session Builder image-intake behavior for:

- `/sessions/new`
- `POST /session-packs` image-analysis requests
- `environment_profile`
- `setup_to_drill`

This is a practical current-state runbook, not a redesign document and not a separate AI-product workflow.

## Scope and non-negotiable safety rules

This runbook applies only to the current Week 18 image-assisted intake implementation and the frozen Week 18 v1 contracts.

Non-negotiable safety rules:

- Session Builder remains the shared core
- tenant scope must come only from verified auth plus authoritative entitlements
- no request-derived tenant scope is allowed
- never accept `tenant_id`, `tenantId`, or `x-tenant-id` from client input
- one image per analysis request is the v1 boundary
- unconfirmed model output must never directly trigger generation
- parser or validator rejection must fail closed
- save, list, detail, and export remain unchanged downstream

Current scope limits:

- no separate AI app or image-analysis product exists
- no separate route family exists for image intake
- no multi-image or video analysis exists in v1
- no infra, IAM, auth-boundary, tenancy-boundary, or entitlements-model changes are part of this runbook

Explicitly out of scope:

- model selection changes
- Bedrock architecture redesign
- prompt redesign beyond the current bounded adapter
- new storage model proposals
- new downstream save, list, detail, or export behavior
- chatbot or conversational assistant behavior
- any suggestion to try another client-supplied tenant identifier

## 1) Trigger

- A coach reports that image-assisted intake failed in `/sessions/new`.
- A developer sees unexpected `400`, `401`, `403`, `500`, or timeout behavior on `POST /session-packs`.
- The current route-level image-intake events drop or shift unexpectedly:
  - `session_image_analysis_success`
  - `session_image_analysis_failure`
  - `session_image_profile_confirmed`
- A draft profile is not returned, or a returned draft cannot be confirmed or used for generation.

## 2) Impact

- Coaches may be unable to get a draft `environment_profile` or `setup_to_drill` result from one uploaded image.
- Coaches may need to retry, correct request input, or continue with manual Session Builder input.
- Data integrity risk is low when the system is behaving as designed because:
  - tenant scope is server-derived by construction
  - image storage is tenant-scoped by server-built key derivation
  - unsupported or ambiguous output fails closed
  - generation only accepts confirmed, validated profiles

Some outcomes that look like failures are expected and safe:

- `400 platform.bad_request` for unsupported image or bad payload
- `400 platform.bad_request` for spoofed tenant-like input
- image-analysis failure without any generated session
- parser or validator rejection without downstream save/list/detail/export side effects
- coach rejecting a draft profile and continuing manually

## 3) 5-minute triage (do these first)

1. Confirm the coach is using the existing `/sessions/new` flow and not a custom client.
2. Confirm the request is the image-analysis branch of `POST /session-packs`.
3. Identify the failure point:
   - upload or payload
   - tenant spoof rejection
   - Bedrock call
   - parser
   - validator
   - coach rejected the draft
4. Check whether the request was for:
   - `environment_profile`
   - `setup_to_drill`
5. Check recent route logs for:
   - `session_image_analysis_success`
   - `session_image_analysis_failure`
   - `session_image_profile_confirmed`
   - `handler_error`
   - `request_end`
6. Do not attempt any workaround that relies on client-supplied tenant identifiers or cross-tenant inspection.

## 4) Failure map by step

### Upload or request entry

Expected safe behavior:

- the request is rejected before analysis if the payload is malformed or missing required image data
- no Bedrock call is made
- no draft profile is returned
- no generation starts

Expected coach-facing outcome:

- the coach sees a request or upload failure and can retry or continue without image-assisted intake

### Unsupported image or bad payload

Expected safe behavior:

- invalid mime types, malformed body shape, missing required fields, or forbidden extra image input are rejected
- one-image-only validation is enforced here
- no draft profile is accepted
- no downstream generation runs

Expected coach-facing outcome:

- the coach receives a validation failure and must fix the request before retrying

### Bedrock failure or timeout

Expected safe behavior:

- model invocation failure or timeout returns no accepted profile
- there is no fallback into freeform output or silent generation
- the request fails closed and is logged as an analysis failure

Expected coach-facing outcome:

- the coach sees that image analysis could not be completed and can retry or continue manually

### Parser failure

Expected safe behavior:

- if raw model output cannot be parsed into the frozen Week 18 shape, the request fails closed
- no partial freeform draft is treated as valid
- no confirmed-profile path is available from that failed result

Expected coach-facing outcome:

- the coach does not receive a usable draft and must retry or continue without image-assisted intake

### Invalid structured output

Expected safe behavior:

- parsed output still has to pass deterministic validation
- safe bounded normalization may occur for known variants only
- unsupported or ambiguous values do not widen the contract
- invalid structured output is rejected before generation

Expected coach-facing outcome:

- the coach sees that analysis could not produce a usable structured draft and must retry or continue manually

### Coach rejects extracted profile

Expected safe behavior:

- rejecting or declining to confirm the draft is a supported normal outcome
- no generation occurs from that unconfirmed draft
- the coach may edit further, retry analysis, or continue with manual Session Builder input

Expected coach-facing outcome:

- the coach remains in control and is not forced into generation from a draft they do not trust

### Tenant spoof rejection

Expected safe behavior:

- any `tenant_id`, `tenantId`, or `x-tenant-id` attempt is rejected
- server-derived tenant context remains authoritative
- no cross-tenant storage or analysis path is used

Expected coach-facing outcome:

- the request is rejected with a validation-style failure and no image analysis proceeds

## 5) Scenario playbooks

### Upload failure

Expected client behavior:

- request fails before draft generation
- no confirmed profile is created

Operator note:

- treat isolated upload failures as normal client or transient failures unless they spike
- investigate only if multiple coaches or tenants start failing at the same step

### Unsupported image or bad payload

Expected client behavior:

- `400 platform.bad_request` is expected for malformed request shape, unsupported image payload, or one-image-boundary violations

Operator note:

- treat isolated `400` responses as expected client mistakes
- investigate only if previously valid request shapes start failing after a rollout

### Bedrock failure or timeout

Expected client behavior:

- no usable draft profile is returned
- no generation is triggered

Operator note:

- treat spikes as integration health problems, not product-boundary changes
- do not widen behavior by bypassing parser/validator or confirmation

### Parser failure

Expected client behavior:

- analysis fails closed
- no draft profile is accepted

Operator note:

- parser failure usually means model output drifted outside the frozen contract shape
- use this as a bounded parser-hardening signal, not as a reason to widen the contract

### Invalid structured output

Expected client behavior:

- analysis fails validation
- no confirmed-profile handoff occurs

Operator note:

- invalid structured output is expected to stop before generation
- do not relax validators during incident response

### Coach rejects draft

Expected client behavior:

- the draft is not used for generation
- the coach may continue manually

Operator note:

- this is a normal supported outcome, not an incident by default
- investigate only if coaches cannot continue manually or cannot clear/retry the flow

### Tenant spoof rejection

Expected client behavior:

- `400 platform.bad_request` is expected for spoofed tenant-like input

Operator note:

- treat this as correct fail-closed behavior
- do not workaround by accepting client tenant identity

## 6) Logs Insights queries

### Image-intake route outcomes

```sql
fields @timestamp, eventType, tenantId, userId, correlationId, http.path, http.statusCode, error.code
| filter http.path like /\/session-packs/
| filter eventType in ["session_image_analysis_success","session_image_analysis_failure","session_image_profile_confirmed","handler_error","request_end"]
| stats count() as n by eventType, tenantId, http.statusCode, error.code
| sort n desc
| limit 100
```

### Trace one image-intake request

```sql
fields @timestamp, level, eventType, message, tenantId, userId, requestId, correlationId, http.path, http.statusCode, error.code
| filter correlationId = "REPLACE_ME"
| sort @timestamp asc
```

## 7) Safe mitigation

- First decide whether the reported outcome is expected safe product behavior before treating it as an incident.
- If the issue is payload-related, reproduce the exact request shape against the frozen Week 18 contract.
- If the issue is Bedrock-related, confirm the failure stays bounded to image analysis and does not affect manual Session Builder usage.
- If the issue is parser or validator related, keep the fail-closed boundary intact and capture the offending shape for a narrow follow-up patch.
- If the coach rejected the draft, treat that as expected product behavior unless the manual fallback path is broken.
- Keep mitigation safe and reversible.
- Do not suggest client-side tenant overrides.
- Do not use scan-then-filter troubleshooting patterns to inspect tenant-scoped data.

## 8) Prevention / follow-ups

- add clearer coach-facing copy for each major failure class if confusion repeats
- keep parser normalizations narrow and contract-safe
- keep failure metrics stable enough for triage
- revisit this runbook if Week 18 expands beyond one image, two fixed modes, and confirmed-profile-only generation

## Related docs

- `docs/architecture/session-builder-image-assisted-intake-v1.md`
- `docs/product/club-vivo/future/image-assisted-intake-v1-scope.md`
- `docs/progress/week_18/week18-day1-scope-lock.md`
- `docs/runbooks/auth-failures.md`
- `docs/runbooks/entitlement-failures.md`
