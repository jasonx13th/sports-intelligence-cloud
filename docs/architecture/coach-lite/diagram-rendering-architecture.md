# SIC Coach Lite — Diagram Rendering Architecture

## Status
Draft v1

## Purpose

This document defines the high-level rendering architecture for drill diagrams in SIC Coach Lite.

The goal is to explain how structured diagram data becomes a coach-friendly visual that can be displayed in the UI and included in exports.

This architecture is intentionally designed for Lite:
- low-cost
- deterministic
- easy to validate
- easy to export
- soccer-first in v1

---

## Core Decision

Coach Lite v1 should not depend on freeform image generation for drill visuals.

Instead, it should use:
- structured diagram specifications
- deterministic rendering rules
- SVG or PNG output
- export-safe visual generation

### Why this is the right choice for Lite
- cheaper than image generation pipelines
- more consistent across sessions
- easier to validate against session text
- easier to render in web and PDF outputs
- easier to evolve into better visuals later

---

## Rendering Architecture Overview

The rendering path should follow this pattern:

1. Session activity is generated.
2. `DrillDiagramSpec v1` is built for supported activities.
3. Diagram spec is validated.
4. Renderer converts spec into display output.
5. Frontend displays the rendered diagram.
6. Export pipeline reuses the same visual output.

---

## Architectural Principle

The rendering layer should be a translation system, not a creative system.

It receives structured meaning and converts it into structured visuals.

That means:
- renderer does not invent tactics
- renderer does not reinterpret activity logic
- renderer only draws what the diagram spec explicitly describes

---

## Main Rendering Components

### 1. Diagram Spec Input
Input format is `DrillDiagramSpec v1`.

This defines:
- canvas
- field shape
- objects
- connections
- annotations
- legend
- render hints

### 2. Diagram Validator
The validator checks whether the diagram spec is safe and complete enough to render.

### 3. Render Engine
The renderer transforms the validated spec into a visual artifact.

### 4. Frontend Diagram View
The frontend displays the rendered diagram in the session UI.

### 5. Export Adapter
The export path includes the rendered output in printable session packs.

---

## Recommended v1 Render Format

### Primary format
SVG

### Why SVG first
- lightweight
- clean in browser
- sharp in export
- good for diagrams and labels
- easy to generate from coordinates
- easier to theme consistently

### Secondary format
PNG

PNG may be generated later for export compatibility or fallback scenarios.

---

## Rendering Inputs

A renderable diagram needs:
- a valid diagram spec
- symbol definitions for supported object types
- line rules for supported connection types
- layout rules for labels and annotations
- style defaults for soccer v1

---

## Supported v1 Visual Elements

### Field elements
- rectangular training area
- grid or channel boundaries
- half-pitch outline where needed
- optional simple field markings

### Object symbols
- cones
- balls
- players
- goals
- mini goals
- mannequins
- poles
- gates

### Connection visuals
- pass arrows
- movement arrows
- dribble arrows
- shot arrows
- rotation arrows
- pressing cues

### Text elements
- labels
- step numbers
- coach notes
- area labels

---

## v1 Rendering Rules

The renderer should follow these rules:

### 1. Consistent symbol language
The same object type should always render the same way.

### 2. Predictable layout
The same kind of setup should render similarly across sessions.

### 3. Legibility first
Labels and arrows should not make diagrams unreadable.

### 4. Export compatibility
Rendered output should work inside PDF or printable export layouts.

### 5. Limited complexity
If a single diagram becomes too dense, prefer a second diagram over visual clutter.

---

## Suggested Internal Modules

### `diagram-spec-builder`
Creates diagram spec objects from validated activities.

### `diagram-spec-validator`
Checks diagram structure and render safety.

### `diagram-renderer`
Converts validated spec into SVG.

### `diagram-theme`
Defines consistent symbols, colors, sizing, and label rules.

### `diagram-export-adapter`
Packages SVG or image output into export workflows.

---

## Frontend Display Path

The frontend should be able to:
- receive a diagram spec or rendered diagram
- display one or more diagrams per activity
- support responsive display inside a session page
- remain readable on laptop and tablet layouts

### v1 recommendation
Render in the frontend from structured spec when practical, or render server-side and return SVG payload for display.

Both options are valid, but the first version should pick one and keep it consistent.

---

## Export Path

The export path should reuse the same diagram output that appears in the UI when possible.

### Export requirements
- crisp visual output
- stable layout
- diagram and activity text remain aligned
- multiple diagrams supported when needed

### Recommended v1 pattern
Generate SVG first, then embed the SVG or a derived image into the export document.

---

## Validation Boundary

A diagram should only reach the renderer if it passes validation.

Validation should check:
- schema completeness
- object ids and references
- coordinate ranges
- object count sanity
- connection consistency
- alignment with related activity setup

This keeps the renderer simple and safe.

---

## Failure Handling

If a diagram cannot be rendered:
- the session should still remain usable
- the activity text should still be returned
- the system may omit the diagram and flag that fallback occurred

The product should never fail the entire session output only because a diagram failed.

---

## v1 Non-Goals

The rendering architecture is not trying to provide:
- freehand drawing tools
- drag-and-drop editing in v1
- animation playback
- advanced whiteboard software replacement
- tactical video overlays
- high-end art direction

Those can come later if the product proves the need.

---

## Future Expansion Path

Later versions may add:
- multi-frame sequences
- better automatic spacing
- coach-side diagram edits
- template-based layout presets
- sport-specific symbol packs beyond soccer
- richer export themes for clubs

These should extend the same structured rendering foundation, not replace it.

---

## Summary

Coach Lite diagram rendering should be built as a structured rendering system.

`DrillDiagramSpec v1` provides the meaning.
The renderer provides the visual translation.
The export path reuses the same output.

This gives SIC Coach Lite a practical and affordable way to deliver visually clear training sessions without depending on heavy image-generation infrastructure.
