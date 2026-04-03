# DrillDiagramSpec v1

## Status
Draft v1 proposal for SIC Coach Lite.

## Purpose
DrillDiagramSpec v1 defines the minimum structured diagram contract that SIC can generate alongside each training activity so coaches receive a session that is not only readable in text, but also visually understandable.

This spec is designed for **SIC Coach Lite**, where diagrams should be:
- deterministic
- low-cost to render
- easy to validate
- easy to export to PDF
- readable on web and mobile
- understandable even when the coach only glances at the image

This spec is intentionally optimized for **rules-based rendering** rather than freeform AI image generation.

---

## Why this exists
SIC’s Session Builder already aims to return a deterministic, structured SessionPack with export support, readable output, and clear validation rules. DrillDiagramSpec v1 extends that idea so each activity can also produce a diagram that shows setup and flow in a coaching-friendly way.

This keeps SIC aligned with the current platform direction:
- product-first
- low-cost
- serverless-first
- tenant-safe
- thin vertical slices
- deterministic validation where possible

---

## Goals
DrillDiagramSpec v1 should support the most common coaching diagram needs:

1. Show the training area clearly.
2. Show cones, goals, poles, mannequins, and other setup objects.
3. Show player starting positions.
4. Show ball starting positions.
5. Show movement paths.
6. Show pass directions.
7. Show rotations and player flow.
8. Show labels for groups, zones, or sequence order.
9. Render consistently in SVG, PNG, and PDF.
10. Stay simple enough for SIC Coach Lite.

---

## Non-goals for v1
DrillDiagramSpec v1 does not try to solve everything.

Not in scope for v1:
- freehand drawing tools
- full animation playback
- tactical freeze-frame video generation
- custom art styles
- sport-specific icon packs beyond simple defaults
- drag-and-drop coach editing inside the spec itself
- advanced layering for multi-phase video tactics boards

Those can come in later versions.

---

## Design principles

### 1. Readable even without the diagram
The text activity still matters. The diagram supports the activity, not replaces it.

### 2. Deterministic
The same spec should render the same result every time.

### 3. Renderer-friendly
A frontend or export service should be able to turn this into SVG without guessing.

### 4. Sport-aware but generic
The spec should work for soccer first, while still being reusable for futsal, basketball, and other invasion sports later.

### 5. Lite-first
This must be affordable and simple enough for SIC Coach Lite.

### 6. Validation-first
The spec should fail clearly if required geometry or unsupported symbols are missing.

---

## Placement inside SessionPack
Each activity in SessionPack should be allowed to include one or more diagrams.

Suggested shape:

```json
{
  "activities": [
    {
      "activityId": "act_001",
      "name": "4v2 defensive rondo",
      "minutes": 12,
      "setup": "20x20 grid with four outside players and two defenders inside.",
      "instructions": ["Keep possession in the grid.", "Defenders press together."],
      "coachingPoints": ["Angle of approach", "Cover shadow"],
      "diagrams": [
        {
          "diagramId": "diag_001",
          "specVersion": "drill-diagram-spec/v1",
          "title": "Starting setup",
          "diagramType": "setup"
        },
        {
          "diagramId": "diag_002",
          "specVersion": "drill-diagram-spec/v1",
          "title": "Pressing movement",
          "diagramType": "sequence"
        }
      ]
    }
  ]
}
```

---

## Top-level schema

```json
{
  "diagramId": "diag_001",
  "specVersion": "drill-diagram-spec/v1",
  "activityId": "act_001",
  "title": "4v2 defensive rondo",
  "diagramType": "setup",
  "sport": "soccer",
  "canvas": {},
  "field": {},
  "objects": [],
  "connections": [],
  "annotations": [],
  "legend": {},
  "renderHints": {},
  "validation": {}
}
```

---

## Field definitions

### `diagramId`
Unique identifier for this diagram.

Type:
- string

Example:
- `diag_001`

### `specVersion`
Version marker for the diagram contract.

Type:
- string

Allowed value for v1:
- `drill-diagram-spec/v1`

### `activityId`
Reference back to the activity in SessionPack.

Type:
- string

### `title`
Human-readable diagram title.

Type:
- string

Examples:
- `Starting setup`
- `Progression 1`
- `Passing pattern`

### `diagramType`
Controls how the renderer and export layer interpret the diagram.

Type:
- string

Allowed values for v1:
- `setup`
- `sequence`
- `progression`
- `regression`
- `condition`

### `sport`
Current sport context.

Type:
- string

Suggested values for v1:
- `soccer`
- `futsal`
- `basketball`
- `generic`

---

## `canvas`
Defines the drawing space.

```json
{
  "width": 1200,
  "height": 800,
  "unit": "px",
  "background": "pitch"
}
```

Fields:
- `width`: number
- `height`: number
- `unit`: `px`
- `background`: `pitch` | `court` | `plain`

Rules:
- v1 renderers should assume a landscape canvas by default.
- If omitted, renderer may use defaults.

---

## `field`
Defines the area shown inside the canvas.

```json
{
  "surfaceType": "pitch",
  "view": "full",
  "orientation": "vertical",
  "zones": [
    {
      "zoneId": "zone_main",
      "shape": "rectangle",
      "x": 300,
      "y": 180,
      "width": 400,
      "height": 260,
      "label": "Main area",
      "dashed": true
    }
  ]
}
```

Fields:
- `surfaceType`: `pitch` | `court` | `pool` | `generic`
- `view`: `full` | `half` | `third` | `custom`
- `orientation`: `vertical` | `horizontal`
- `zones[]`: optional highlighted areas

Zone fields:
- `zoneId`
- `shape`: `rectangle` | `circle`
- `x`, `y`, `width`, `height` or radius values depending on shape
- `label`
- `dashed`: boolean

---

## `objects`
All visible objects placed on the diagram.

Each object must have:
- `objectId`
- `type`
- `x`
- `y`

Supported object types in v1:
- `cone`
- `ball`
- `player`
- `goal`
- `mini_goal`
- `pole`
- `mannequin`
- `marker`
- `coach`
- `gate`
- `zone_anchor`

### Cone example
```json
{
  "objectId": "cone_1",
  "type": "cone",
  "x": 300,
  "y": 180,
  "color": "orange"
}
```

### Ball example
```json
{
  "objectId": "ball_1",
  "type": "ball",
  "x": 420,
  "y": 260
}
```

### Player example
```json
{
  "objectId": "player_1",
  "type": "player",
  "x": 420,
  "y": 260,
  "role": "defender",
  "team": "red",
  "label": "D1",
  "hasBall": true,
  "facing": "right"
}
```

Player-specific fields:
- `role`: `attacker` | `defender` | `neutral` | `goalkeeper` | `coach` | `generic`
- `team`: `red` | `blue` | `yellow` | `black` | `neutral`
- `label`: string
- `hasBall`: boolean
- `facing`: `up` | `down` | `left` | `right` | `up-right` | `up-left` | `down-right` | `down-left`

### Goal example
```json
{
  "objectId": "goal_1",
  "type": "goal",
  "x": 600,
  "y": 120,
  "width": 120,
  "height": 40,
  "rotation": 0
}
```

### Gate example
A gate is a training gate made from two cones or markers.

```json
{
  "objectId": "gate_1",
  "type": "gate",
  "x": 500,
  "y": 300,
  "width": 80,
  "label": "Pass through"
}
```

---

## `connections`
Connections define visible relationships or actions between objects.

Supported types in v1:
- `pass`
- `movement`
- `dribble`
- `shot`
- `rotation`
- `press`
- `support`

Each connection should include:
- `connectionId`
- `type`
- `fromRef`
- `toRef`

Optional fields:
- `style`
- `label`
- `sequenceOrder`
- `dashed`
- `curve`

### Pass example
```json
{
  "connectionId": "conn_1",
  "type": "pass",
  "fromRef": "player_1",
  "toRef": "player_2",
  "style": "dashed-arrow",
  "label": "1",
  "sequenceOrder": 1
}
```

### Movement example
```json
{
  "connectionId": "conn_2",
  "type": "movement",
  "fromRef": "player_3",
  "toRef": "zone_main",
  "style": "solid-arrow",
  "label": "Press",
  "sequenceOrder": 2
}
```

### Dribble example
```json
{
  "connectionId": "conn_3",
  "type": "dribble",
  "fromRef": "player_4",
  "toRef": "cone_6",
  "style": "zigzag-arrow",
  "sequenceOrder": 3
}
```

`style` allowed values for v1:
- `solid-arrow`
- `dashed-arrow`
- `zigzag-arrow`
- `curved-arrow`
- `double-arrow`

Rules:
- `fromRef` and `toRef` must reference an existing object or zone.
- `sequenceOrder` is optional for setup diagrams and recommended for sequence diagrams.

---

## `annotations`
Extra labels or callouts for coaches.

```json
[
  {
    "annotationId": "ann_1",
    "type": "text",
    "x": 760,
    "y": 180,
    "text": "Defenders press together"
  },
  {
    "annotationId": "ann_2",
    "type": "badge",
    "x": 420,
    "y": 220,
    "text": "Start"
  }
]
```

Allowed annotation types:
- `text`
- `badge`
- `callout`
- `number`

---

## `legend`
Defines how symbols should be explained when needed.

```json
{
  "show": true,
  "items": [
    { "symbol": "red-player", "meaning": "Defender" },
    { "symbol": "blue-player", "meaning": "Attacker" },
    { "symbol": "dashed-arrow", "meaning": "Pass" },
    { "symbol": "solid-arrow", "meaning": "Movement" }
  ]
}
```

Rules:
- v1 should allow legend omission for simple diagrams.
- Export renderer may automatically include legend only if multiple symbol types appear.

---

## `renderHints`
Optional rendering guidance.

```json
{
  "theme": "classic-coaching-board",
  "showGridLines": false,
  "showFieldStripes": true,
  "preferLabels": true,
  "iconStyle": "simple-flat",
  "emphasis": ["zone_main", "player_1"]
}
```

Allowed values:
- `theme`: `classic-coaching-board` | `clean-flat` | `minimal`
- `iconStyle`: `simple-flat` | `outline`

Rules:
- Render hints are optional.
- They may influence presentation but must not change meaning.

---

## `validation`
Machine-readable validation status or expectations.

```json
{
  "requiresObjects": ["ball", "cone", "player"],
  "maxSequenceSteps": 6,
  "mustMatchActivityEquipment": true,
  "mustMatchPlayerCounts": true
}
```

Purpose:
- help the diagram validator confirm the diagram is aligned with the activity
- prevent diagrams from showing equipment or players that the activity does not support

---

## Coordinate system
v1 uses a 2D absolute coordinate system.

Rules:
- origin is top-left of the canvas
- `x` increases to the right
- `y` increases downward
- all object coordinates live in canvas space

This is simple and renderer-friendly for Lite.

Future versions may add normalized coordinates.

---

## Minimum required fields for a valid v1 diagram
A valid v1 diagram must include:
- `diagramId`
- `specVersion`
- `activityId`
- `title`
- `diagramType`
- `sport`
- `objects`

And it must satisfy:
- at least one `player` object
- at least one setup object or ball object
- all `fromRef` and `toRef` values resolve
- no unsupported `type` values

---

## Recommended v1 validation rules

### Structural validation
- required top-level fields present
- schema version recognized
- enum values valid
- references resolve

### Coaching validation
- player count shown does not contradict activity organization
- equipment shown does not exceed activity equipment
- diagram type matches use case
- sequence steps are not overloaded

### Export validation
- all objects inside canvas bounds
- labels do not overlap excessively when possible
- PDF renderer can degrade gracefully if hints are unsupported

---

## Recommended diagram limits for Lite
To keep SIC Coach Lite simple and clear:
- max 12 visible players per diagram before grouping is recommended
- max 10 connections per diagram
- max 6 numbered sequence steps
- max 2 diagrams per activity in v1

These are product rules, not hard technical limits.

---

## Example v1 diagram

```json
{
  "diagramId": "diag_def_001",
  "specVersion": "drill-diagram-spec/v1",
  "activityId": "act_def_001",
  "title": "4v2 Defensive Rondo",
  "diagramType": "sequence",
  "sport": "soccer",
  "canvas": {
    "width": 1200,
    "height": 800,
    "unit": "px",
    "background": "pitch"
  },
  "field": {
    "surfaceType": "pitch",
    "view": "custom",
    "orientation": "vertical",
    "zones": [
      {
        "zoneId": "zone_main",
        "shape": "rectangle",
        "x": 320,
        "y": 180,
        "width": 420,
        "height": 280,
        "label": "20x20 Grid",
        "dashed": true
      }
    ]
  },
  "objects": [
    { "objectId": "cone_1", "type": "cone", "x": 320, "y": 180, "color": "orange" },
    { "objectId": "cone_2", "type": "cone", "x": 740, "y": 180, "color": "orange" },
    { "objectId": "cone_3", "type": "cone", "x": 320, "y": 460, "color": "orange" },
    { "objectId": "cone_4", "type": "cone", "x": 740, "y": 460, "color": "orange" },
    { "objectId": "player_a1", "type": "player", "x": 420, "y": 200, "role": "attacker", "team": "blue", "label": "A1" },
    { "objectId": "player_a2", "type": "player", "x": 640, "y": 200, "role": "attacker", "team": "blue", "label": "A2" },
    { "objectId": "player_a3", "type": "player", "x": 420, "y": 440, "role": "attacker", "team": "blue", "label": "A3" },
    { "objectId": "player_a4", "type": "player", "x": 640, "y": 440, "role": "attacker", "team": "blue", "label": "A4" },
    { "objectId": "player_d1", "type": "player", "x": 500, "y": 300, "role": "defender", "team": "red", "label": "D1" },
    { "objectId": "player_d2", "type": "player", "x": 570, "y": 350, "role": "defender", "team": "red", "label": "D2" },
    { "objectId": "ball_1", "type": "ball", "x": 420, "y": 200 }
  ],
  "connections": [
    { "connectionId": "p1", "type": "pass", "fromRef": "player_a1", "toRef": "player_a2", "style": "dashed-arrow", "label": "1", "sequenceOrder": 1 },
    { "connectionId": "p2", "type": "movement", "fromRef": "player_d1", "toRef": "player_a2", "style": "solid-arrow", "label": "Press", "sequenceOrder": 2 },
    { "connectionId": "p3", "type": "pass", "fromRef": "player_a2", "toRef": "player_a4", "style": "dashed-arrow", "label": "2", "sequenceOrder": 3 },
    { "connectionId": "p4", "type": "rotation", "fromRef": "player_d2", "toRef": "zone_main", "style": "curved-arrow", "label": "Cover", "sequenceOrder": 4 }
  ],
  "annotations": [
    { "annotationId": "ann_1", "type": "text", "x": 790, "y": 230, "text": "Nearest defender presses" },
    { "annotationId": "ann_2", "type": "text", "x": 790, "y": 280, "text": "Second defender covers passing lane" }
  ],
  "legend": {
    "show": true,
    "items": [
      { "symbol": "blue-player", "meaning": "Attacker" },
      { "symbol": "red-player", "meaning": "Defender" },
      { "symbol": "dashed-arrow", "meaning": "Pass" },
      { "symbol": "solid-arrow", "meaning": "Movement" }
    ]
  },
  "renderHints": {
    "theme": "classic-coaching-board",
    "showGridLines": false,
    "showFieldStripes": true,
    "preferLabels": true,
    "iconStyle": "simple-flat",
    "emphasis": ["zone_main", "player_d1"]
  },
  "validation": {
    "requiresObjects": ["ball", "cone", "player"],
    "maxSequenceSteps": 6,
    "mustMatchActivityEquipment": true,
    "mustMatchPlayerCounts": true
  }
}
```

---

## Suggested renderer behavior in Coach Lite
Renderer should:
- default to SVG output
- support PNG export through rasterization
- support embedding into session PDF
- use default symbols if styling is omitted
- keep labels readable before making diagrams visually fancy

If spec is incomplete:
- render best-effort only when safe
- otherwise return validation error instead of silently guessing

---

## Suggested backend flow
1. Coach submits prompt and constraints.
2. Session Builder creates validated activity structure.
3. Diagram builder creates DrillDiagramSpec v1 per activity.
4. Diagram validator confirms activity and diagram alignment.
5. Renderer creates SVG assets.
6. Export service places session text plus diagrams into PDF.
7. SessionPack and export stay tenant-scoped by construction.

---

## Suggested file locations in repo
- `docs/contracts/drill-diagram-spec-v1.md`
- `docs/contracts/session-pack-v1.md`
- `services/club-vivo/api/_lib/diagram-builder.js`
- `services/club-vivo/api/_lib/diagram-validator.js`
- `apps/club-vivo/lib/renderDiagram.ts`

---

## Open questions for next pass
1. Should v1 use absolute coordinates only, or allow normalized coordinates too?
2. Should player icons be generic circles first, or human silhouettes from day one?
3. Should the renderer own arrow styling, or should the spec define more path geometry?
4. Should diagrams be stored as source spec only, or spec plus rendered SVG?
5. Should progressions/regressions share one diagram with toggles, or separate diagrams?
6. Should basketball and futsal reuse the same symbol language exactly, or vary by sport pack?

---

## Recommendation
Adopt DrillDiagramSpec v1 as a **Lite-friendly contract** that is:
- structured
- deterministic
- renderer-first
- exportable
- tenant-safe
- simple enough to ship early

This gives SIC Coach Lite a real coaching advantage: the output is not just words, but a session coaches can actually set up and run.
