# SIC Coach Lite — Generation Flow

## Status
Draft v1

## Purpose

This document defines the high-level generation flow for SIC Coach Lite.

The goal is to describe how a coach request becomes a validated, visually clear, exportable session pack inside the SIC platform.

This flow is designed to stay:
- soccer-first in v1
- tenant-safe by construction
- low-cost and serverless-first
- deterministic where possible
- compatible with future club methodology support

---

## Design Goals

The generation flow should:
- accept real coach constraints
- ask only for missing essentials
- generate a structured session pack
- validate the output before delivery
- generate one or more drill diagrams
- support export and save flows
- remain compatible with tenant-scoped methodology later

---

## High-Level Flow

1. Coach submits a session request.
2. The system resolves authenticated tenant context.
3. Intake is normalized into structured soccer constraints.
4. Missing essentials are identified.
5. The system generates a session pack draft.
6. The draft is validated against session rules.
7. Drill diagrams are generated from activity structure.
8. Diagram specs are validated.
9. The final session pack is rendered for UI display.
10. The session pack can be saved and exported.

---

## Step 1 — Coach Input

The coach may enter input through:
- chat-style prompt
- structured intake form
- mixed input with both free text and fields

### Example input
- U12 girls
- 14 players
- 75 minutes
- 10 cones
- 8 balls
- half field
- defending focus

The system should treat coach input as planning intent, not as trusted authorization input.

---

## Step 2 — Tenant Context Resolution

Before any generation work begins, the system must resolve the authoritative tenant context.

### Source of truth
- verified authentication context
- entitlements-backed tenant scope

### Rules
- never trust tenant identifiers from request body, query, or headers
- fail closed if tenant context cannot be built
- use tenant context to scope all downstream reads and writes

This step protects:
- saved sessions
- club methodology
- future club knowledge
- export paths

---

## Step 3 — Intake Normalization

The raw input is converted into a structured intake model.

### Example normalized fields
- sport
- ageGroup
- level
- athleteCount
- coachCount
- durationMinutes
- spaceType
- spaceSize
- equipment
- focus
- intensity
- constraints

### Purpose
Normalization makes the rest of the pipeline easier to validate and more predictable.

---

## Step 4 — Missing Essentials Check

The system determines whether the coach already provided the minimum required inputs.

### Minimum essentials for v1
- soccer
- age group or level
- athlete count
- session duration
- space type or size
- basic equipment
- session focus

### UX rule
Ask only for missing essentials.
Do not force the coach through a long questionnaire if the main request is already usable.

---

## Step 5 — Generation Context Assembly

The system prepares the context used for generation.

### Inputs to generation
- normalized coach constraints
- soccer-first session structure rules
- age and level rules
- equipment assumptions
- tenant configuration if available
- methodology context if enabled later

### v1 priority order
1. real coach constraints
2. safety and validation rules
3. soccer-specific generation patterns
4. tenant methodology preferences if available

Reality should always win over preference.

---

## Step 6 — Session Pack Draft Generation

The generator creates a structured draft session.

### Draft output should include
- title
- objective
- durationMinutes
- equipment
- space
- intensity
- activities
- coachingPoints
- progressions
- regressions
- safetyNotes
- assumptions

### Generation guidance
The first version should favor structured, predictable output over highly creative but inconsistent output.

---

## Step 7 — Session Pack Validation

The draft session pack is validated before it is returned.

### Validation checks
- total minutes match requested duration
- activity ordering makes sense
- required equipment is compatible with available equipment
- content matches soccer v1 scope
- age and level are reasonable
- instructions are not contradictory
- session remains usable if a diagram is unavailable

### Failure behavior
If validation fails:
- repair if the issue is deterministic
- otherwise return a safe retry or refinement path

---

## Step 8 — Diagram Spec Generation

After the activity structure is validated, the system creates diagram specs for the session.

### v1 expectation
At minimum, the main activities should receive a diagram.

### Diagram source
The system should generate a `DrillDiagramSpec v1` payload from:
- activity setup
- activity roles
- movement pattern
- equipment placement
- soccer-first diagram defaults

### Why this happens after validation
The diagram builder should work from valid activity structure, not from raw draft output.

---

## Step 9 — Diagram Validation

Each diagram spec must be checked before rendering.

### Validation checks
- required fields exist
- coordinates stay inside the canvas
- objects are valid
- connection endpoints exist
- diagram aligns with related activity setup
- render output is safe and deterministic

### Goal
Avoid diagrams that are visually broken or that contradict the session text.

---

## Step 10 — Response Assembly

The system assembles the final session pack response.

### Response should include
- session metadata
- activity list
- diagrams
- assumptions
- validation-safe output
- export metadata when relevant

This response should be usable both for:
- frontend display
- export generation

---

## Step 11 — Save and Export

Once the session is finalized, the coach may:
- save it
- duplicate it later
- export it

### Save behavior
Saved sessions must remain tenant-scoped by construction.

### Export behavior
Exports should include:
- session summary
- activity text
- diagrams
- printable format support

---

## High-Level Logical Components

### 1. Coach Assistant Handler
Receives the request and orchestrates the flow.

### 2. Tenant Context Builder
Builds authoritative tenant context from verified auth and entitlements.

### 3. Intake Normalizer
Converts coach input into structured planning constraints.

### 4. Session Generator
Creates a draft session pack.

### 5. Session Validator
Validates minutes, equipment, scope, and activity logic.

### 6. Diagram Spec Builder
Generates `DrillDiagramSpec v1` for supported activities.

### 7. Diagram Validator
Checks diagram consistency and render safety.

### 8. Renderer / Export Path
Renders diagrams and produces export-friendly output.

---

## Future Methodology Extension

Later, the flow may include:
- tenant configuration lookup
- approved methodology context retrieval
- methodology-informed generation and wording

This should happen inside the same tenant-safe orchestration flow, not as a separate product path.

---

## Failure Modes

The flow should anticipate failures such as:
- missing entitlements
- incomplete coach input
- invalid generation output
- diagram spec mismatch
- export generation failure

### Design rule
Failure should degrade safely.
The product should prefer a simpler valid session over a polished but unreliable one.

---

## Summary

SIC Coach Lite generation flow should transform coach input into a validated session pack with visual drill output.

The pipeline should remain:
- structured
- soccer-first
- tenant-safe
- validation-driven
- compatible with save and export workflows
