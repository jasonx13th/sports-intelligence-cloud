# SIC Coach Lite — User Flows

## Status
Draft v1

## Purpose

This document defines the main user flows for SIC Coach Lite v1.

The goal is to make sure the first release supports the most valuable coach and club workflows without adding unnecessary complexity.

---

## Primary User Types

### Coach
Uses SIC Coach Lite to generate, adjust, save, and export training sessions.

### Club director or technical lead
Defines methodology, terminology, and club preferences for coaches inside the tenant.

### Later supporting users
- assistant coach
- team coordinator
- club admin

---

## Flow 1 — Generate a Session

### User
Coach

### Goal
Create a session from real training constraints.

### Entry point
- coach dashboard
- new session page
- session builder page

### Flow
1. Coach opens SIC Coach Lite.
2. Coach enters initial input such as:
   - U12 girls
   - 14 players
   - 75 minutes
   - 10 cones
   - 8 balls
   - half field
   - focus on defending
3. System checks for missing essentials.
4. System asks only necessary follow-up questions.
5. Coach submits.
6. System generates a structured SessionPack.
7. System validates:
   - minutes
   - equipment fit
   - age and level appropriateness
   - soccer scope
8. System generates diagrams for the main activities.
9. Coach sees the full session.

### Output
- session summary
- activity list
- drill diagrams
- coaching points
- progressions and regressions

---

## Flow 2 — Refine a Session

### User
Coach

### Goal
Quickly adapt the generated session.

### Example edits
- make it easier
- make it harder
- reduce setup time
- adapt for smaller space
- change to pressing
- add more finishing
- fewer balls available
- indoor version

### Flow
1. Coach reviews session.
2. Coach selects a quick edit or enters a refinement prompt.
3. System updates the session pack.
4. Validator checks the updated version.
5. Diagrams refresh if activity setup changes.
6. Coach reviews the new version.

### Output
An updated session that keeps the same session contract and visual clarity.

---

## Flow 3 — Save a Session

### User
Coach

### Goal
Store a session for future reuse.

### Flow
1. Coach reviews a generated or updated session.
2. Coach clicks save.
3. Coach optionally adds:
   - title
   - team
   - tags
   - notes
4. System stores the session under the current tenant context.
5. Session appears in coach history or session library.

### Output
A reusable saved session.

---

## Flow 4 — Export a Session

### User
Coach

### Goal
Download or share a printable version of the session.

### Flow
1. Coach opens a session.
2. Coach selects export.
3. System builds an export package that includes:
   - title
   - session details
   - activity list
   - diagrams
   - notes
4. Export file is generated.
5. Coach receives a downloadable file.

### Output
A print-ready session document.

---

## Flow 5 — Browse Session History

### User
Coach

### Goal
Find a previous session quickly.

### Flow
1. Coach opens saved sessions.
2. Coach filters by:
   - age group
   - focus
   - duration
   - recent use
3. Coach opens a past session.
4. Coach can:
   - reuse
   - duplicate
   - edit
   - export

### Output
Fast reuse of prior work.

---

## Flow 6 — Club Methodology Setup

### User
Club director or technical lead

### Goal
Shape the output that coaches receive.

### Flow
1. Director opens methodology settings.
2. Director configures:
   - club terminology
   - age-specific guidance
   - session preferences
   - style of play cues
   - approved methodology documents
3. System stores the configuration as tenant-scoped data.
4. Future coach generations can reference that methodology.

### Output
Tenant-specific methodology context.

---

## Flow 7 — Generate a Session with Club Methodology Active

### User
Coach inside a configured club tenant

### Goal
Receive club-aware coaching output.

### Flow
1. Coach enters session request.
2. System resolves tenant context.
3. System loads club methodology config and allowed knowledge.
4. Session generation uses both:
   - coach constraints
   - club methodology context
5. System returns a session that reflects the club’s preferred language and coaching direction.

### Output
A club-aligned session without requiring the coach to manually restate the methodology.

---

## V1 UX Principles

Coach Lite v1 should follow these user experience rules:

- ask for only the missing essentials
- do not overwhelm the coach with too many setup questions
- keep the output structured
- make diagrams easy to read
- let coaches iterate quickly
- make export simple
- prioritize usefulness over visual complexity

---

## Summary

The first version of SIC Coach Lite should support a small number of strong flows:
- generate
- refine
- save
- export
- reuse
- apply club methodology

If these flows feel smooth, the product will already provide real value to coaches and clubs.
