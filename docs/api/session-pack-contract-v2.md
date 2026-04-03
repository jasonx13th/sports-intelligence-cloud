# Session Pack Contract v2

## Status
Draft v2

## Purpose

This document defines the v2 SessionPack contract for SIC Coach Lite.

Version 2 extends the existing structured session output by adding diagram support directly inside each activity.

The purpose of this contract is to ensure that generated sessions are:
- deterministic
- readable
- validatable
- visually useful
- export-ready

Coach Lite v1 is soccer-first, so this contract is written with soccer session planning as the primary use case.

---

## Goals

SessionPack v2 should:
- preserve the structured session design already established in SIC
- keep total session duration deterministic
- support text and visual drill output together
- allow exports to PDF and future print layouts
- remain tenant-safe and reusable across saved sessions

---

## Top-Level Contract

A SessionPack v2 object should contain:

- `sessionPackId`
- `specVersion`
- `title`
- `sport`
- `ageGroup`
- `level`
- `durationMinutes`
- `equipment`
- `space`
- `intensity`
- `objective`
- `activities`
- `cooldown`
- `safetyNotes`
- `successCriteria`
- `assumptions`
- `metadata`
- `export`

---

## Required Top-Level Fields

### `sessionPackId`
Unique identifier for the session pack.

### `specVersion`
Required version string.
For this contract:
- `session-pack.v2`

### `title`
Human-readable title.

### `sport`
Required string.
Allowed v1 value:
- `soccer`

### `ageGroup`
Required string.
Examples:
- `U8`
- `U10`
- `U12`
- `U14`
- `adult`

### `level`
Optional string.
Examples:
- `recreational`
- `club`
- `academy`
- `adult-amateur`

### `durationMinutes`
Required integer.
Must be greater than zero.

### `equipment`
Required array of strings or structured equipment object.
The exact representation may evolve, but the SessionPack must make the required equipment explicit.

### `space`
Required object describing the environment.
Suggested fields:
- `surfaceType`
- `areaType`
- `sizeLabel`
- `width`
- `length`
- `units`

### `intensity`
Optional string.
Suggested values:
- `low`
- `medium`
- `high`

### `objective`
Required short description of the session goal.

### `activities`
Required array of activity objects.
Must contain at least one activity.

---

## Activity Contract

Each activity should contain:

- `activityId`
- `name`
- `phase`
- `minutes`
- `objective`
- `setup`
- `instructions`
- `organization`
- `coachingPoints`
- `progressions`
- `regressions`
- `commonMistakes`
- `equipment`
- `space`
- `constraints`
- `diagrams`

---

## Activity Field Definitions

### `activityId`
Unique activity identifier within the session pack.

### `name`
Human-readable activity name.

### `phase`
Suggested values:
- `warm-up`
- `technical`
- `main`
- `game`
- `cooldown`

### `minutes`
Required integer.
Must be greater than zero.

### `objective`
Short description of the activity purpose.

### `setup`
Required text block describing how to arrange the area, players, and equipment.

### `instructions`
Required text block describing how the activity runs.

### `organization`
Optional text or structured object describing groups, rotations, and coach roles.

### `coachingPoints`
Required array of strings.

### `progressions`
Optional array of strings.

### `regressions`
Optional array of strings.

### `commonMistakes`
Optional array of strings.

### `equipment`
Required array or object listing the activity-specific equipment.

### `space`
Optional activity-specific override of space details.

### `constraints`
Optional array of relevant constraints.
Examples:
- `small area`
- `limited balls`
- `shared field`

---

## New v2 Field: `activities[].diagrams[]`

Each activity may include one or more diagrams.

This is the main v2 extension.

### Purpose
To make the activity visually understandable, not just textually described.

### Diagram array rules
- an activity may contain zero or more diagrams
- a main activity should usually contain at least one diagram in Coach Lite v1
- diagrams must match the activity setup and instructions
- each diagram must conform to `DrillDiagramSpec v1`

---

## Diagram Entry Shape

Each item in `activities[].diagrams[]` should contain:

- `diagramId`
- `specVersion`
- `diagramType`
- `title`
- `spec`

### `diagramId`
Unique identifier for the diagram.

### `specVersion`
Required string.
For this release:
- `drill-diagram-spec.v1`

### `diagramType`
Suggested values:
- `setup`
- `sequence`
- `progression`
- `variation`

### `title`
Human-readable diagram title.

### `spec`
Full `DrillDiagramSpec v1` payload.

---

## Cooldown

Optional object.
May contain:
- `minutes`
- `instructions`
- `notes`

Cooldown may also be represented as a final activity if the service prefers one uniform activity model.

---

## Safety Notes

Optional array of strings.

Examples:
- monitor workload for younger players
- adjust work-to-rest if conditions are hot
- reduce area if space becomes unsafe

---

## Success Criteria

Optional array of strings describing what success looks like.

Examples:
- defenders close space quickly
- players recognize pressing triggers
- possession group plays with fewer forced passes

---

## Assumptions

Optional array of strings.

This is important when the system fills gaps in coach input.

Examples:
- assumed moderate intensity
- assumed half-field access
- assumed standard warm-up included

---

## Metadata

Optional object.
Suggested fields:
- `generatedAt`
- `generatedBy`
- `generationMode`
- `methodologyApplied`
- `tenantScoped`

---

## Export

Optional object.
Suggested fields:
- `pdfUrl`
- `ttlSeconds`
- `exportReady`

The export object should not be required for the SessionPack to be valid.

---

## Example SessionPack v2

```json
{
  "sessionPackId": "sp_123",
  "specVersion": "session-pack.v2",
  "title": "U12 Defending Session",
  "sport": "soccer",
  "ageGroup": "U12",
  "level": "club",
  "durationMinutes": 75,
  "equipment": ["10 cones", "8 balls", "1 goal", "12 bibs"],
  "space": {
    "surfaceType": "grass",
    "areaType": "half-field",
    "sizeLabel": "half field"
  },
  "intensity": "medium",
  "objective": "Improve defending shape, pressure, and cover in small group moments.",
  "activities": [
    {
      "activityId": "act_01",
      "name": "4v2 Defensive Rondo",
      "phase": "main",
      "minutes": 18,
      "objective": "Improve pressing angle and cover inside the grid.",
      "setup": "Mark a 20x20 grid with four cones. Place four attackers on the outside and two defenders inside.",
      "instructions": "Outside players keep possession. Two defenders work together to press and cover.",
      "organization": "Rotate defenders every 60 to 90 seconds.",
      "coachingPoints": [
        "close space quickly",
        "force predictable passes",
        "cover behind the pressing defender"
      ],
      "progressions": ["limit attackers to two touches"],
      "regressions": ["increase the grid size"],
      "commonMistakes": ["both defenders pressing the same line"],
      "equipment": ["4 cones", "1 ball"],
      "constraints": ["limited equipment"],
      "diagrams": [
        {
          "diagramId": "diag_01",
          "specVersion": "drill-diagram-spec.v1",
          "diagramType": "setup",
          "title": "4v2 Defensive Rondo Setup",
          "spec": {}
        }
      ]
    }
  ],
  "cooldown": {
    "minutes": 5,
    "instructions": "Light movement and guided stretching."
  },
  "safetyNotes": ["adjust work-to-rest if the weather is hot"],
  "successCriteria": ["defenders show clear pressure and cover roles"],
  "assumptions": ["assumed moderate intensity"],
  "metadata": {
    "methodologyApplied": true,
    "tenantScoped": true
  },
  "export": {
    "exportReady": true,
    "ttlSeconds": 900
  }
}
```

---

## Validation Rules

A SessionPack v2 should be considered valid only if:

### Top-Level Validation
- `sessionPackId` exists
- `specVersion` equals `session-pack.v2`
- `sport` is supported
- `durationMinutes` is greater than zero
- `activities` is not empty

### Time Validation
- sum of `activities[].minutes` plus cooldown must equal `durationMinutes`
- any system-added warm-up or cooldown must be included in totals

### Activity Validation
- each activity has a unique `activityId`
- each activity has a positive `minutes` value
- setup and instructions are present
- equipment listed in an activity must not contradict the available session equipment

### Diagram Validation
- all diagrams must include valid `diagramId`, `specVersion`, and `diagramType`
- `spec` must conform to `DrillDiagramSpec v1`
- diagram content must not contradict activity text

### Soccer Validation
- output must be age-appropriate
- output must fit the coach’s equipment and space constraints
- output must remain understandable even if a diagram fails to render later

---

## Error Semantics

If a generated session fails validation, the service should not silently return a broken SessionPack.

Suggested behavior:
- retry generation internally if appropriate
- otherwise return a stable validation error

Suggested reason codes:
- `session_validation_failed`
- `duration_mismatch`
- `equipment_mismatch`
- `diagram_validation_failed`

---

## Relationship to Other Contracts

SessionPack v2 depends on:
- `chat-contract-v1`
- `DrillDiagramSpec v1`
- diagram rendering support for export and frontend display

---

## Summary

SessionPack v2 extends SIC’s structured session output with visual drill support.

The key v2 addition is:
- `activities[].diagrams[]`

This allows Coach Lite to return sessions that are not only readable, but also visually clear and export-ready.
