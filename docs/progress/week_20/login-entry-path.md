# Week 20 Day 1 — Login Entry Path

## Theme

KSC Pilot Readiness

## Purpose

Define the narrowest safe website login entry path for KSC pilot coaches.

This note exists to make the coach access path clear without creating a second auth surface, a second coach app surface, or any drift in SIC’s current auth, tenancy, or entitlements model.

## Why this note exists

Week 20 requires a visible login entry path for coaches as part of KSC Pilot Readiness.

The goal is not to redesign authentication. The goal is to make the existing path understandable and supportable for real pilot users.

A pilot coach should be able to understand:

- where to start
- how to sign in
- where they land after sign-in
- what to do if access fails
- how support should triage common problems

## Core rule

The Week 20 login entry path must reuse the existing approved SIC web authentication path.

That means:

- one coach-facing website entry path
- one approved sign-in flow
- one protected app flow after authentication
- tenant scope still derived server-side from verified auth plus authoritative entitlements
- no tenant choice from client input
- no second login model for the pilot

## Desired coach experience

The pilot login flow should feel simple:

1. coach reaches the pilot website entry point
2. coach sees a short explanation of what SIC is for in this pilot
3. coach selects the sign-in action
4. coach completes the existing approved sign-in flow
5. coach lands in the current protected coach-facing app area
6. coach continues into the Session Builder flow

The access path should minimize ambiguity and support requests.

## Login entry path boundary

This note covers only:

- the entry point a coach should use
- what the entry page needs to communicate
- the expected post-login landing path
- support guidance for common failure cases
- narrow UI copy requirements if needed

This note does not cover:

- a new auth architecture
- a public marketing site redesign
- a second app shell
- a second identity provider
- tenant selection UX
- broad onboarding workflows outside current pilot need

## Recommended pilot login path

The safest Week 20 pattern is:

### Entry point

Use `/login` as the single pilot-safe website path that tells coaches how to enter SIC for the KSC pilot.

This entry point should:

- clearly name the pilot
- explain that coaches sign in through the existing approved access path
- avoid exposing technical auth details
- avoid asking coaches to provide tenant information
- direct coaches into the current auth flow with one clear call to action

### Sign-in action

The sign-in action should reuse the current approved auth flow only.

It should not:

- fork users into multiple login choices
- ask for tenant selection
- ask for role selection
- expose a hidden operator path on the coach-facing page
- imply that email alone determines authorization

### Post-login landing path

After successful sign-in, the coach should land on `/sessions/new` inside the current protected coach-facing SIC app.

Recommended landing characteristics:

- simple
- coach-facing
- aligned to Session Builder
- minimal ambiguity about next action
- close to session creation, session review, or the primary coach dashboard

### Support fallback path

If login fails or access is denied, the coach should see clear guidance on:

- whether they should retry sign-in
- whether they may not yet have pilot access
- where to contact the operator for support

## Entry page content requirements

The Week 20 pilot entry page should communicate only the essentials.

Required content:

### 1. Pilot context

Example intent:
- “This pilot gives KSC coaches access to SIC Session Builder for session planning, image-assisted intake, save/export, and pilot feedback.”

### 2. Primary action

Example intent:
- “Sign in to continue”

### 3. Minimal support note

Example intent:
- “If you expected access and cannot sign in, contact the pilot operator.”

### 4. No tenant instructions

The page must not ask the coach to:

- enter a tenant identifier
- choose an organization
- select a role
- paste a token
- use a technical URL not meant for coaches

## Recommended UI copy draft

The following is a narrow Week 20 draft, not final product copy.

### Entry page heading

`KSC Coach Pilot Access`

### Entry page body copy

`Use SIC to create and review training sessions for the KSC pilot. Sign in with your approved coach access path to continue.`

### Primary action label

`Sign in`

### Support copy

`If you expected pilot access but cannot continue, contact the KSC pilot operator for help.`

## Protected landing recommendation

The post-login landing point should stay inside the current coach-facing SIC web app.

The best Week 20 landing path for the current pilot is:

- `/sessions/new`

Selection criteria:

- shortest path to useful session work
- least confusion for first-time pilot coaches
- no need to understand platform structure
- no exposure to incomplete future surfaces

## Operator guidance for the login path

The operator should be able to explain the coach access path in one sentence:

`Go to /login, sign in through the approved access flow, and continue into the SIC coach app at /sessions/new.`

The operator should also be ready to confirm:

- the coach is using the correct entry page
- the coach is part of the expected pilot group
- the coach’s access issue is not caused by missing entitlements
- the coach is not being told to provide tenant information manually

## Common failure cases

### 1. Coach uses the wrong URL

Expected result:
- confusion or support request

Support action:
- redirect the coach to the documented pilot entry path only

### 2. Coach signs in but is denied access

Expected result:
- fail-closed denial based on missing or invalid server-side authorization state

Support action:
- confirm verified identity exists and entitlements are complete and correct

### 3. Coach expects tenant selection

Expected result:
- confusion caused by unclear instructions

Support action:
- clarify that tenant access is determined server-side and the coach does not need to choose a tenant

### 4. Coach reaches a page that does not clearly lead to session work

Expected result:
- pilot friction and avoidable support questions

Support action:
- tighten landing choice and entry-page copy to guide the coach into the current Session Builder flow

### 5. Support notes reveal too much technical detail

Expected result:
- unnecessary coach confusion

Support action:
- keep coach-facing language simple and move technical detail into operator docs only

## Validation expectations

The login entry path is correct only if all of the following are true:

- it reuses the current approved auth flow
- it does not introduce tenant choice from the client
- it does not introduce a second coach login model
- it leads coaches into the current protected SIC app
- the entry copy is simple and coach-readable
- support fallback guidance exists
- the path supports the KSC pilot specifically and does not widen into site redesign work

## Explicit non-goals

Week 20 login-path work does not include:

- redesigning Cognito or auth infrastructure
- changing the tenancy contract
- changing entitlements behavior
- creating self-serve account recovery beyond existing paths
- adding public multi-tenant routing UX
- adding a second branded site experience
- broad navigation redesign
- full marketing website work
- club-wide portal expansion

## Minimal implementation candidates

If a small change is needed, it should stay limited to one or more of the following:

- a pilot-safe login entry route
- clearer coach-facing copy on the entry path
- a safer default post-login redirect
- a support message for access failures
- a documentation note mapping entry page to protected landing flow

Any implementation beyond that should be treated as scope risk.

## Risks and constraints

### Risk: login entry work turns into auth redesign

Mitigation:
Reuse the existing flow and treat clarity improvements as the primary Week 20 goal.

### Risk: coaches are asked to do tenant-related steps

Mitigation:
Keep all tenant resolution server-side and remove any client-visible tenant handling.

### Risk: the wrong landing page creates friction

Mitigation:
Choose the shortest useful path into Session Builder behavior and document it clearly.

### Risk: operator guidance drifts from the real web flow

Mitigation:
Keep operator notes updated to match the exact live entry path used for the pilot.

## Stop rules

Stop and escalate immediately if login-path work requires:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- IAM or CDK drift
- a second login surface
- client-side tenant selection
- a new identity-provider integration
- a broad website redesign beyond current pilot need

## Definition of done

This login entry path note is done when:

- the coach entry point is clear
- the sign-in action reuses the current approved flow
- the post-login landing expectation is explicit
- support guidance is documented
- non-goals are clear
- the path remains narrow, coach-friendly, and aligned to SIC’s current auth and tenancy model
