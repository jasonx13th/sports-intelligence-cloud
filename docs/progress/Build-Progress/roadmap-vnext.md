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

# Week 17 — AI Integration v1

## Goal
Introduce AI capabilities in a controlled, low-cost way.

### Tasks

**Day 1**
- Implement AI adapter layer:
  - prompt builder
  - response parser
  - validator

**Day 2**
- Integrate Bedrock (optional)
- Generate session suggestions

**Day 3**
- Document AI architecture
- Add logging and cost tracking

---

# Week 18 — AI Evaluation Harness

## Goal
Create a lightweight evaluation framework.

### Tasks

**Day 1**
- Build evaluation dataset

**Day 2**
- Implement evaluation runner

**Day 3**
- Document AI evaluation process
- Track generation quality metrics

---

# Week 19 — Pilot Readiness

## Goal
Prepare system for real coach pilots.

### Tasks

**Day 1**
- Implement pilot tenant setup scripts

**Day 2**
- Improve support logging

**Day 3**
- Create pilot onboarding documentation

---

# Week 20 — Production Lite Release

## Goal
Ship the first stable version of SIC.

### Tasks

**Day 1**
- End-to-end smoke testing

**Day 2**
- Review AWS costs
- Implement budget alarms

**Day 3**
- Publish release notes
- Record product demo
