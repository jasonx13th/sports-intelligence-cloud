# SIC Architecture Roadmap vNext
## Weeks 11–20 (Product-First, Low-Cost, Solo Builder Mode)

This roadmap continues the existing SIC architecture after Week 10.

The goal is to convert SIC from a **strong platform foundation** into a **usable coach product**, while maintaining the architecture principles already established.

## Architecture Principles

The following principles remain non-negotiable:

- Multi-tenant by design
- Fail-closed tenant isolation
- Tenant context derived only from verified auth
- Serverless-first architecture
- Minimal but real observability
- Query-by-construction (never scan-then-filter)
- Product capabilities must ship every phase

## Budget Constraint

Target monthly AWS cost: **$10–70/month**

Primary services used:

- Cognito
- API Gateway
- Lambda
- DynamoDB
- S3
- CloudWatch
- Optional limited Bedrock usage

Avoid heavy services unless required by real users.

---

# Week 11 — Session Builder Hardening

## Goal
Stabilize the Session Builder into a production-ready MVP core.

### Tasks

**Day 1**
- Review Session and Session Pack domain contracts
- Freeze v1 API schema:
  - POST /sessions
  - GET /sessions
  - GET /sessions/{sessionId}
  - POST /session-packs
- Add validation rules for:
  - duration totals
  - equipment compatibility
  - age/level constraints

**Day 2**
- Implement deterministic generation pipeline:
  - intake normalization
  - generation
  - validation
  - persistence
  - export
- Add structured generation result format

**Day 3**
- Document architecture
- Add sequence diagram for request flow
- Record demo of session generation

---

# Week 12 — Web Application Foundation

## Goal
Create the first user-facing interface for coaches.

### Tasks

**Day 1**
- Create frontend project structure
- Recommended stack:
  - Next.js
  - React
  - Tailwind

**Day 2**
- Integrate Cognito authentication
- Implement protected routes:
  - /dashboard
  - /sessions
  - /sessions/new

**Day 3**
- Define UI contract with backend
- Document frontend-backend integration
- Capture screenshots for portfolio

---

# Week 13 — Session Library and Templates

## Goal
Enable reuse and repeat usage.

### Tasks

**Day 1**
- Extend DynamoDB model:
  - saved sessions
  - templates
  - tags

**Day 2**
- Implement template endpoints:
  - POST /templates
  - GET /templates
  - POST /templates/{templateId}/generate

**Day 3**
- Add usage metrics:
  - sessions generated
  - sessions saved
  - templates reused
- Create CloudWatch dashboard

---

# Week 14 — Coach Feedback Loop

## Goal
Capture structured feedback for learning and improvement.

### Tasks

**Day 1**
- Add endpoint:
  - POST /sessions/{sessionId}/feedback

**Day 2**
- Extend event timeline with product events:
  - session_generated
  - session_exported
  - session_run_confirmed
  - feedback_submitted

**Day 3**
- Document feedback architecture
- Establish weekly review workflow

---

# Week 15 — Team Layer v1

## Goal
Move from session planning to team management.

### Tasks

**Day 1**
- Implement Team model
- Add endpoints:
  - POST /teams
  - GET /teams
  - GET /teams/{teamId}

**Day 2**
- Implement session assignment:
  - POST /teams/{teamId}/sessions/{sessionId}/assign
  - GET /teams/{teamId}/sessions

**Day 3**
- Document team architecture
- Create demo flow

---

# Week 16 — Attendance System

## Goal
Provide operational workflow for weekly team training.

### Tasks

**Day 1**
- Implement attendance model
- Add endpoints:
  - POST /teams/{teamId}/attendance
  - GET /teams/{teamId}/attendance

**Day 2**
- Build weekly planning API

**Day 3**
- Add operational metrics dashboards
- Document failure scenarios

---

## Week 17 — Fut-Soccer Merge v1

### Goal
Merge Fut-Soccer into SIC as a first-class coaching flow on top of Session Builder, using the same tenant-safe architecture and the same coach-facing web app.

### Tasks

#### Day 1
- Define Fut-Soccer as a SIC sport pack / product flavor
- Lock v1 intake differences for:
  - fut-soccer
  - soccer
  - futsal
- Define sport-pack defaults for:
  - smaller spaces
  - indoor sessions
  - faster rotations
  - ball mastery
  - passing and pressing patterns
- Document what changes in generation logic vs what stays shared

#### Day 2
- Extend Session Builder pipeline to accept sport-pack bias
- Add Fut-Soccer selection in Club Vivo session flow
- Add first Fut-Soccer session templates and example outputs
- Keep the same save, list, detail, and export path

#### Day 3
- Document Fut-Soccer architecture and product scope
- Add validation for Fut-Soccer-specific assumptions
- Record demo showing:
  - soccer flow
  - fut-soccer flow
  - shared Session Builder foundation

---

## Week 18 — GenAI Space & Setup Intake v1

### Goal
Add the first practical GenAI layer to Session Builder so coaches can use images in two ways:

1. Generate an environment profile for better session creation
2. Generate a drill from a coach-confirmed setup image

### Tasks

#### Day 1
- Add image upload flow for session creation
- Define two analysis modes:
  - `environment_profile`
  - `setup_to_drill`
- Define structured output contracts for:
  - `EnvironmentProfile`
  - `SetupProfile`
- Store uploaded images in tenant-scoped S3 prefixes

#### Day 2
- Implement GenAI adapter layer:
  - multimodal prompt builder
  - response parser
  - validator
- Integrate Bedrock for image-assisted analysis
- Add coach confirmation and edit step before generation
- Feed confirmed profile into Session Builder normalization and generation

#### Day 3
- Document AI architecture
- Add logging and cost tracking
- Add metrics for:
  - image analysis success
  - image analysis failure
  - profile confirmed
  - session generated from environment
  - drill generated from setup
- Record a demo for both image modes

---

## Week 19 — AI Evaluation Harness

### Goal
Create a lightweight evaluation framework focused on real coaching usefulness, not just generic model output quality.

### Tasks

#### Day 1
- Build evaluation dataset with:
  - environment profile examples
  - setup-to-drill examples
  - Fut-Soccer examples
  - KSC-like coaching scenarios

#### Day 2
- Implement evaluation runner for:
  - JSON contract validity
  - equipment compatibility
  - age-band safety
  - session structure quality
  - setup faithfulness
- Add simple rubric scoring for coach usefulness

#### Day 3
- Document AI evaluation process
- Track generation quality metrics
- Define pass and fail thresholds for pilot readiness
- Capture 5 to 10 golden examples for repeat testing

---

## Week 20 — KSC Pilot Readiness

### Goal
Prepare SIC for a real Kensington Soccer Club coach pilot with Fut-Soccer and GenAI image-assisted session creation.

### Tasks

#### Day 1
- Implement pilot tenant setup scripts
- Create KSC tenant config
- Set up pilot users with organization email sign-in
- Add website login entry path for coaches

#### Day 2
- Improve support logging
- Add pilot feedback capture for:
  - session quality
  - drill usefulness
  - image analysis accuracy
  - missing features
- Tighten support and debug visibility for pilot issues

#### Day 3
- Create pilot onboarding documentation
- Create coach quick-start guide
- Create internal operator checklist
- Record KSC pilot walkthrough:
  - sign in
  - create session
  - upload environment photos
  - generate drill from setup
  - save and export

---

## Week 21 — Production Lite Release

### Goal
Ship the first stable version of SIC with Session Builder, Fut-Soccer support, and GenAI image-assisted intake.

### Tasks

#### Day 1
- End-to-end smoke testing
- Validate:
  - auth
  - session generation
  - Fut-Soccer flow
  - image upload flow
  - export flow
  - team assignment path if included

#### Day 2
- Review AWS costs
- Implement budget alarms
- Review Bedrock usage and guardrails
- Confirm logging and latency signals are usable

#### Day 3
- Publish release notes
- Record final product demo
- Capture portfolio screenshots and architecture evidence
- Write launch-ready summary of what SIC now does
