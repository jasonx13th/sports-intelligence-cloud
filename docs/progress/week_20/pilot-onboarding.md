# Week 20 Day 3 — Pilot Onboarding

## Theme

KSC Pilot Readiness

## Purpose

Define the minimum onboarding document needed to launch the Kensington Soccer Club pilot safely and clearly.

This note is written for pilot participants and internal coordination. It explains what the pilot is, what is included, how coaches access SIC, what they should do during normal use, what to do when something fails, and what feedback is requested.

## Why this note exists

Week 20 is the transition from internal product progress to a real coach-facing pilot.

A pilot onboarding note is needed so that:

- coaches understand the purpose of the pilot
- coaches know what SIC currently does in this pilot
- coaches know how to access the product
- coaches know what is and is not in scope
- coaches know how to report issues and submit useful feedback
- the internal operator has one clear onboarding reference to share

The onboarding note should reduce confusion without expanding into a broader training program or product-marketing site.

## Pilot summary

The KSC pilot gives a small group of coaches access to the current SIC coach workflow so they can use the Session Builder in a real planning context.

The pilot is focused on practical coaching value, not broad platform rollout.

In this pilot, SIC is intended to help coaches:

- create sessions from real coaching constraints
- use Fut-Soccer-biased defaults where relevant
- use image-assisted intake where enabled
- review and adjust generated results
- save and export sessions
- provide direct product feedback

## Pilot objective

The objective of the KSC pilot is to validate that the current shared Session Builder flow is useful, understandable, and supportable for real coach use.

This pilot is also intended to help SIC learn:

- whether generated sessions are practically useful
- whether image-assisted flows help coaches in real use
- where the current workflow causes friction
- what support gaps appear in a live pilot
- which small improvements matter most before broader release

## What is in scope for the pilot

The KSC pilot includes the current bounded SIC flow only.

Coaches may use SIC to:

- sign in through the approved pilot access path
- create a session through the current coach-facing flow
- use Fut-Soccer defaults where configured
- upload an environment or setup image where the image-assisted flow is enabled
- confirm or correct image-derived results before generation
- review generated content
- save sessions
- export sessions where supported
- submit pilot feedback

## What is not in scope for the pilot

The KSC pilot does not include:

- a broader club administration platform
- advanced team management workflows beyond the current shipped slice
- custom org-level knowledge systems
- broad analytics dashboards
- full reporting products
- broad AI assistant expansion
- support for every possible coaching workflow
- self-serve tenant or account administration
- any client-controlled tenant selection

The pilot is intentionally narrow so feedback stays tied to the current real product surface.

## Who this pilot is for

This pilot is intended for:

- selected KSC coaches using the approved pilot access path
- the internal SIC operator supporting pilot setup and issue triage

This pilot is not a public signup or open beta.

## How coaches access SIC

Coaches should use `/login` as the approved KSC pilot login entry path provided by the operator.

The intended access flow is:

1. open `/login`
2. select the sign-in action
3. complete the existing approved sign-in flow
4. enter the protected SIC coach app
5. continue into `/sessions/new`

Coaches do not need to choose a tenant, enter a tenant identifier, or provide technical access information manually.

## What coaches should expect on first use

On first use, coaches should expect SIC to support a practical session-planning workflow, not a full club platform.

The current pilot flow is designed to help a coach move from constraints to a usable training session.

Typical workflow:

1. sign in
2. start a new session
3. enter session constraints or use the available assisted intake path
4. review the generated result
5. adjust as needed
6. save and export if needed
7. submit pilot feedback

## Image-assisted use in the pilot

Where image-assisted intake is enabled, coaches may use SIC in two bounded ways:

### Environment-oriented image use

Use an environment photo to help SIC understand the available setup or training context before generation.

### Setup-to-drill image use

Use a setup image to help SIC generate a drill suggestion based on the coach’s actual setup.

Important pilot rule:

Image-derived results still require coach review and confirmation before they should be treated as final session content.

The pilot is designed to support coach judgment, not replace it.

## Coach expectations during the pilot

During the pilot, coaches are asked to:

- use SIC for real session-planning work where practical
- note where the flow is useful
- note where the flow is confusing or incomplete
- submit feedback after using the product
- report support issues through the operator path when access or flow problems occur

Coaches are not expected to test edge cases beyond normal use unless the operator specifically asks for that.

## Operator expectations during the pilot

The internal operator is expected to:

- confirm pilot readiness before coach use
- share the correct login entry path
- support common access or workflow issues
- review support logs and reason-code signals
- confirm feedback capture is working
- keep the pilot bounded to the current Week 20 scope
- collect issues and observations for closeout

## What coaches should do if something fails

If a coach cannot access SIC or part of the flow does not work as expected, the coach should:

1. confirm they are using the approved pilot entry path
2. retry only if the failure appears temporary
3. contact the pilot operator if access still fails or the workflow is blocked
4. describe where the issue happened, such as:
   - sign in
   - session creation
   - image analysis
   - save
   - export
   - feedback submission

Coaches should not try to solve access problems by guessing technical values or using alternate URLs.

## What feedback SIC wants from coaches

The pilot is specifically looking for feedback on:

- session quality
- drill usefulness
- image analysis accuracy
- missing features

Short practical comments are especially useful when they explain:

- what the coach expected
- what worked well
- what felt wrong or incomplete
- what would have made the flow more useful in real training

## How feedback should be given

Coaches should use the pilot feedback path inside the SIC workflow where available.

When a workflow issue blocks normal feedback capture, the coach should send the feedback through the operator using a short practical note that includes:

- what they were trying to do
- where the issue happened
- what they expected
- what happened instead

## Pilot boundaries and expectations

This pilot is meant to validate the current product slice, not every future SIC idea.

That means coaches should expect:

- a focused Session Builder experience
- some rough edges typical of a pilot
- support from the operator when issues appear
- visible areas where feedback will directly shape the next improvements

That also means coaches should not expect:

- a finished club operating system
- fully automated coaching intelligence
- broad analytics or reporting features
- complete configuration flexibility for every workflow

## Success signals for the pilot

The pilot will be considered useful if coaches can generally do the following without major confusion:

- access SIC through the correct path
- create a session successfully
- understand image-assisted steps when used
- save or export their work
- provide feedback
- get support when something breaks

Useful pilot learning also includes identifying:

- recurring support gaps
- recurring feedback themes
- confusion points in the login or coach flow
- quality issues in generation or image-assisted output

## Documentation and support hygiene

This onboarding note should remain:

- coach-readable
- operator-shareable
- narrow to the current pilot
- free of secrets and live credentials
- free of client-trusted tenant instructions

Live account details, passwords, tokens, and environment secrets must not appear in this document.

## Risks and constraints

### Risk: onboarding note turns into broad product documentation

Mitigation:
Keep this note limited to pilot purpose, access, workflow, support, and feedback.

### Risk: coaches are given technical auth or tenant instructions

Mitigation:
Keep access instructions simple and route all technical handling through the approved auth path and operator support.

### Risk: pilot promises exceed current product reality

Mitigation:
Describe the current flow honestly and keep expectations tied to the shipped slice.

### Risk: feedback requests are too vague

Mitigation:
Ask for feedback in the four Week 20 pilot categories and encourage short practical notes.

## Stop rules

Stop and escalate if onboarding work requires:

- auth-boundary changes
- tenancy-boundary changes
- entitlements-model changes
- IAM or CDK drift
- a second login model
- public self-serve pilot signup
- broad website or product-marketing expansion
- client-visible tenant handling instructions

## Definition of done

This pilot onboarding note is done when:

- pilot purpose is clear
- in-scope and out-of-scope items are explicit
- coach access instructions are simple
- the current pilot workflow is understandable
- support guidance is present
- requested feedback areas are clear
- the note stays narrow, safe, and aligned to the Week 20 pilot boundary
