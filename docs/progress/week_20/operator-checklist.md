# KSC Pilot — Internal Operator Checklist

## Purpose

This checklist is for the internal SIC operator preparing and supporting the KSC pilot.

It is designed to confirm pilot readiness, reduce avoidable access issues, keep support triage simple, and ensure the pilot stays inside the approved Week 20 boundary.

## Operator goals

Before and during the pilot, the operator should be able to confirm:

- the KSC pilot setup is ready
- the KSC tenant config is defined
- pilot-user assumptions are clear
- coaches have the correct login entry path
- support logging is usable for triage
- pilot feedback capture is working
- issues are recorded without widening scope
- the pilot remains aligned to the current Session Builder flow

## Boundary reminder

This checklist does not authorize platform expansion.

Do not widen scope into:

- auth redesign
- tenancy-boundary changes
- entitlements-model changes
- infra, IAM, or CDK drift without explicit approval
- broad analytics or observability expansion
- new club-admin or org-admin platform work
- client-trusted tenant selection or tenant input

If a pilot issue appears to require one of those changes, stop and escalate rather than improvising.

## Section 1 — KSC pilot setup readiness

Confirm each of the following before pilot use:

- [ ] `scope-lock.md` exists and the Week 20 boundary is frozen
- [ ] `pilot-tenant-setup.md` exists and the setup boundary is clear
- [ ] `ksc-tenant-config.md` exists and the KSC config shape is explicit
- [ ] KSC pilot defaults are documented and narrow
- [ ] Any setup examples in tracked docs remain sanitized
- [ ] No real secrets, tokens, or live credentials appear in tracked files
- [ ] Manual versus automated setup steps are clearly separated
- [ ] No setup step implies a second source of truth for tenant identity

## Section 2 — Tenant and entitlement safety check

Confirm tenant and entitlement assumptions remain correct:

- [ ] tenant scope remains server-derived from verified auth plus authoritative entitlements
- [ ] no request flow accepts `tenant_id`, `tenantId`, or `x-tenant-id` from the client
- [ ] role and tier remain server-derived from entitlements
- [ ] pilot access is not being inferred from email domain alone
- [ ] there is no scan-then-filter tenancy pattern in pilot-related work
- [ ] no pilot document tells coaches to enter tenant information manually
- [ ] missing entitlements is expected to fail closed
- [ ] invalid tenant format is expected to fail closed

## Section 3 — Pilot-user readiness

Confirm pilot-user assumptions are explicit and supportable:

- [ ] `pilot-user-setup.md` exists
- [ ] pilot-user categories are minimal and clear
- [ ] pilot coach expectations are documented
- [ ] operator expectations are documented
- [ ] real pilot user data is not stored in tracked docs
- [ ] pilot access assumptions are documented in sanitized form only
- [ ] any live account handling follows approved operational paths only
- [ ] likely access failure cases are known to support

## Section 4 — Login entry path readiness

Confirm coaches can be sent to one clear entry path:

- [ ] `login-entry-path.md` exists
- [ ] there is one approved coach-facing entry path for the pilot
- [ ] the entry path uses the existing approved sign-in flow
- [ ] the entry path does not ask coaches to choose a tenant
- [ ] the entry path does not expose a second login model
- [ ] post-login landing expectations are clear
- [ ] support fallback wording exists for blocked coaches
- [ ] operator guidance matches the actual coach path being used

## Section 5 — Coach workflow readiness

Confirm the pilot flow supports the intended KSC coach experience:

- [ ] coach can sign in
- [ ] coach can reach the current session flow
- [ ] coach can start a session
- [ ] Fut-Soccer-biased defaults behave as intended for the pilot
- [ ] image-assisted flow is available where expected
- [ ] image-derived results still require coach confirmation
- [ ] coach can review generated output
- [ ] coach can save work
- [ ] coach can export where supported
- [ ] coach can reach the feedback path where expected

## Section 6 — Support logging readiness

Confirm pilot support visibility is usable and bounded:

- [ ] `support-logging-and-feedback.md` exists
- [ ] structured support logging expectations are documented
- [ ] stable reason codes are documented or mapped to existing behavior
- [ ] logs avoid full JWTs, raw auth headers, passwords, and tokens
- [ ] request and route context is available where already supported
- [ ] image-assisted failures can be distinguished from general generation failures
- [ ] save/export failures can be distinguished from generation failures
- [ ] support notes explain likely pilot failure cases

## Section 7 — Pilot feedback readiness

Confirm feedback capture is practical and narrow:

- [ ] required feedback categories are explicit:
  - session quality
  - drill usefulness
  - image analysis accuracy
  - missing features
- [ ] optional free-text feedback stays short and bounded
- [ ] feedback placement in the current flow is clear
- [ ] malformed feedback rejection expectations are documented
- [ ] feedback does not accept client-derived tenant identity
- [ ] session-linked feedback remains tenant-scoped by construction
- [ ] feedback capture is supportable if a coach reports failure

## Section 8 — Documentation pack readiness

Confirm all pilot-facing and operator-facing docs are present:

- [ ] `pilot-onboarding.md`
- [ ] `coach-quick-start.md`
- [ ] `operator-checklist.md`
- [ ] `walkthrough-script.md`
- [ ] docs are coach-readable or operator-readable as intended
- [ ] docs do not overpromise beyond the current pilot slice
- [ ] docs remain sanitized and free of secrets
- [ ] docs do not include client-visible tenant handling instructions

## Section 9 — Walkthrough readiness

Confirm the pilot walkthrough can be run end to end:

- [ ] sign in step is clear
- [ ] create-session step is clear
- [ ] environment-photo step is clear where applicable
- [ ] setup-to-drill step is clear where applicable
- [ ] review and confirmation step is clear
- [ ] save step is clear
- [ ] export step is clear
- [ ] feedback submission step is clear
- [ ] walkthrough evidence plan is defined
- [ ] walkthrough uses sanitized or pilot-safe data only

## Section 10 — Known issue triage

Use this quick triage guide when a coach reports a problem.

### Access problem

Ask:
- Is the coach using the approved pilot entry path?
- Is the issue sign-in failure or post-sign-in access denial?
- Is the pilot user expected?
- Is missing entitlements the likely cause?

Record:
- route or step
- stable reason code if available
- whether retry succeeded

### Session generation problem

Ask:
- Did the problem occur before generation, during generation, or after validation?
- Was the coach using normal session creation or an image-assisted path?
- Did the output fail, or was it just low quality?

Record:
- flow mode
- input shape if relevant and safe
- reason code if available

### Image-assisted problem

Ask:
- Was this environment-profile or setup-to-drill?
- Was the issue upload, analysis, validation, or coach confirmation?
- Did the coach understand the confirmation step?

Record:
- image mode
- failure point
- reason code if available

### Save or export problem

Ask:
- Was the content already generated successfully?
- Did save fail, export fail, or was the result unclear to the coach?

Record:
- whether the session existed before failure
- route and reason code if available

### Feedback problem

Ask:
- Was the coach able to reach the feedback path?
- Was the issue validation or submission?
- Was a session reference involved?

Record:
- failure point
- malformed input suspicion if relevant
- reason code if available

## Section 11 — Evidence capture

At meaningful checkpoints, capture:

- what changed
- why it changed
- how it was validated
- tenancy and security confirmation
- observability note
- product impact note
- pilot risks or open issues
- whether scope remained inside Week 20

## Section 12 — Escalation rules

Stop and escalate immediately if any issue implies:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- IAM or CDK drift
- a second coach login model
- client-driven tenant identity
- broad analytics expansion
- broad platform work beyond KSC pilot readiness

Do not patch around these by adding informal operator workarounds.

## End-of-pilot readiness questions

Before calling the pilot ready, answer yes to all of these:

- [ ] Is the KSC pilot setup clear and narrow?
- [ ] Can a coach get in without confusion?
- [ ] Can a coach complete the current session workflow?
- [ ] Can the operator triage common failures quickly?
- [ ] Is feedback capture practical enough to learn from?
- [ ] Did the pilot-prep work avoid scope expansion?
- [ ] Is the current slice still low-cost and realistic to operate?

## Definition of success

This checklist succeeds if the operator can use it to:

- prepare the pilot safely
- support coaches consistently
- spot boundary violations early
- collect useful evidence
- keep Week 20 focused on real pilot readiness rather than platform drift
