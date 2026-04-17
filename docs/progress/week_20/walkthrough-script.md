# KSC Pilot — Walkthrough Script

## Purpose

This walkthrough script is the internal guide for running and reviewing the Week 20 KSC pilot flow end to end.

It is intended for internal pilot review, operator validation, and demo-style evidence capture. It should reflect the real current product slice without overpromising beyond the current SIC surface.

## Walkthrough goal

Show that a KSC pilot coach can move through the current shared SIC Session Builder flow in a way that is:

- understandable
- tenant-safe
- supportable
- useful enough for a real pilot
- aligned to the current KSC pilot boundary

## Walkthrough boundary

This walkthrough must stay inside the Week 20 scope.

Included flow:

- sign in
- create session
- upload environment photo where applicable
- generate drill from setup where applicable
- review and confirm output
- save session
- export session where supported
- submit pilot feedback

Not included:

- platform-admin demos
- org-wide settings demos
- entitlement redesign demos
- analytics/reporting demos
- broad AI roadmap demos
- manual tenant selection demos
- any client-trusted tenant identity behavior

## Audience

Primary audience:

- internal operator
- internal reviewer
- pilot-prep reviewer

Secondary audience:

- future closeout summary reference
- sanitized internal evidence capture

This is not a public marketing script.

## Pre-walkthrough checklist

Before starting, confirm:

- the KSC pilot login entry path is known
- the pilot user used for the walkthrough is approved for the flow
- the walkthrough data is sanitized or pilot-safe
- no secrets or live credentials will appear in recorded notes
- the current app path is available
- save/export and feedback paths are available where expected
- image-assisted flow is available if it is part of the walkthrough run
- the operator can capture issues without widening scope

## Walkthrough setup

Use a pilot-safe scenario that reflects real coach work.

Recommended scenario example:

- sport pack: fut-soccer
- age group: youth
- player count: realistic for KSC pilot use
- time available: realistic training block
- space: small or medium training area
- equipment: cones, balls, bibs, goals where relevant
- objective: practical coaching goal such as passing under pressure, ball mastery, pressing, or finishing

If using images, use pilot-safe or sanitized images only.

## Demo evidence capture rules

Capture:

- what step was attempted
- whether it worked as expected
- where the coach might get confused
- supportability observations
- any reason-code or triage observations if something fails
- whether the flow stayed inside the Week 20 pilot boundary

Do not capture:

- secrets
- raw tokens
- full authorization headers
- unnecessary personal data
- anything that encourages client-side tenant handling

## Walkthrough script

### Step 1 — Open the pilot entry path

Narration:
Open the approved KSC pilot access page and confirm that the coach-facing entry point is clear.

What to verify:

- the entry path is the one intended for pilot coaches
- the copy is understandable
- the coach is not asked for tenant information
- the path points to the existing approved sign-in flow

Evidence note:
Record whether the entry path is clear enough for a first-time coach.

### Step 2 — Sign in through the approved flow

Narration:
Select the sign-in action and complete the current approved sign-in flow.

What to verify:

- sign-in uses the current approved auth path
- there is no second login model
- the flow does not require tenant selection
- failure behavior would fail closed if access is invalid

Evidence note:
Record whether sign-in feels simple and whether the path creates avoidable confusion.

### Step 3 — Land in the protected coach app

Narration:
After sign-in, confirm that the coach lands in the current protected SIC app and can move toward the session flow.

What to verify:

- the landing page is coach-appropriate
- the next action is understandable
- the path into session work is short
- the current pilot slice feels coherent

Evidence note:
Record whether the landing destination supports a real coach starting work quickly.

### Step 4 — Start a new session

Narration:
Begin a new session using the current Session Builder flow and enter practical coaching constraints.

Suggested inputs:

- fut-soccer context
- age group or level
- player count
- time available
- space available
- equipment available
- session focus

What to verify:

- the flow accepts practical coach inputs
- the path remains understandable
- the pilot defaults support the intended KSC use case
- no extra platform concepts distract from the task

Evidence note:
Record whether the session-start flow feels usable for a real coach.

### Step 5 — Upload an environment photo where applicable

Narration:
Use the image-assisted environment flow to help SIC understand the current coaching setup.

What to verify:

- image upload is available where expected
- the environment-photo path is understandable
- the coach can review image-derived interpretation
- coach confirmation remains part of the flow

Evidence note:
Record whether the environment-photo step adds value or friction.

### Step 6 — Generate a drill from a setup photo where applicable

Narration:
Use the setup-to-drill flow with a pilot-safe setup image and review the resulting drill suggestion.

What to verify:

- setup photo flow is available where expected
- the resulting interpretation is understandable
- the coach can confirm or correct before relying on the result
- the output feels connected to the actual setup

Evidence note:
Record whether setup-to-drill output is practically useful.

### Step 7 — Review and confirm generated output

Narration:
Review the generated session or drill and confirm whether it matches the coaching need.

What to verify:

- timing looks appropriate
- equipment and space assumptions look realistic
- the objective matches the intended coaching goal
- the Fut-Soccer bias feels useful where expected
- image-assisted interpretation is acceptable where used
- the coach has a clear chance to correct issues

Evidence note:
Record whether the output is usable, partially usable, or confusing.

### Step 8 — Save the session

Narration:
Save the current session through the normal flow.

What to verify:

- save action is discoverable
- save succeeds or fails clearly
- the coach can understand what happened
- support triage would be possible if save failed

Evidence note:
Record whether save feels reliable and clear.

### Step 9 — Export the session

Narration:
Export the saved session if the export path is available in the current flow.

What to verify:

- export action is understandable
- export happens in the expected place
- the coach understands the outcome
- export supportability is acceptable if something fails

Evidence note:
Record whether export feels ready enough for pilot use.

### Step 10 — Submit pilot feedback

Narration:
Submit feedback using the current pilot feedback path.

Suggested feedback areas:

- session quality
- drill usefulness
- image analysis accuracy
- missing features

What to verify:

- the feedback path is easy enough to find
- required fields are understandable
- submission success or failure is clear
- the feedback model feels practical for real coach use

Evidence note:
Record whether feedback capture is realistic enough to learn from the pilot.

## Failure-mode checks to observe

If possible during review, confirm that support and failure handling are understandable for these cases:

- access denied after sign-in
- missing entitlements behavior
- malformed feedback rejection
- image-assisted failure
- session generation failure
- save or export failure

These checks do not require staged breakage if that would widen scope. They only need enough evidence to confirm fail-closed and supportable behavior.

## Walkthrough reviewer questions

After the run, answer these questions:

- Could a real coach understand where to start?
- Could a real coach get into the product without tenant confusion?
- Did the session flow feel practically useful?
- Did image-assisted steps help or create friction?
- Could the coach save and export without confusion?
- Was feedback capture realistic and useful?
- Could the operator triage likely failures?
- Did the walkthrough stay inside the Week 20 scope?

## Evidence checklist

Capture the following at the end of the walkthrough:

- [ ] sign-in path confirmed
- [ ] protected landing confirmed
- [ ] session-start flow confirmed
- [ ] environment-photo flow reviewed where applicable
- [ ] setup-to-drill flow reviewed where applicable
- [ ] output review step captured
- [ ] save step captured
- [ ] export step captured where supported
- [ ] feedback step captured
- [ ] supportability observations recorded
- [ ] boundary-compliance note recorded

## Risks and constraints

### Risk: walkthrough becomes a polished demo instead of a pilot check

Mitigation:
Record friction honestly and keep the script tied to real coach use.

### Risk: the walkthrough hides support gaps

Mitigation:
Capture confusion points and failure observations, not just successful clicks.

### Risk: future roadmap ideas leak into the script

Mitigation:
Keep narration tied only to the current Session Builder pilot slice.

### Risk: walkthrough evidence contains sensitive data

Mitigation:
Use sanitized or pilot-safe data and avoid recording secrets or raw auth details.

## Stop rules

Stop and escalate if the walkthrough reveals that pilot readiness now depends on:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- IAM or CDK drift
- client-side tenant handling
- a second coach login surface
- broad platform work beyond current Week 20 scope

## Definition of done

This walkthrough script is done when:

- the real pilot flow is mapped step by step
- expected verification points are explicit
- evidence capture expectations are clear
- failure-mode observation guidance is included
- the script remains honest, narrow, and aligned to KSC pilot readiness
