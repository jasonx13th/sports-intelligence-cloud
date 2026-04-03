# Diagram Rendering Contract v1

## Status
Draft v1

## Purpose

This document defines the v1 contract for rendering drill diagrams in SIC Coach Lite.

The goal is to provide a stable bridge between:
- structured diagram data
- frontend display
- export generation

This contract is intentionally simple for Lite.
It assumes the source diagram is already represented as `DrillDiagramSpec v1`.

---

## Scope

This contract describes how a valid `DrillDiagramSpec v1` becomes a renderable output.

It may be used by:
- frontend preview components
- backend export services
- future diagram caching or asset generation workflows

It does not require that rendering be exposed as a public API on day one.
The first implementation may remain internal.

---

## Core Principle

Rendering is downstream of validation.

A renderer should receive only:
- a valid diagram spec
- explicit render options
- tenant-safe context where required

If the spec is invalid, the system should fail before rendering.

---

## Rendering Modes

Diagram rendering v1 should support two output modes.

### 1. Inline preview mode
Used by the frontend for immediate viewing.

### 2. Export mode
Used for printable session packs or generated assets.

---

## Contract Entry Shape

A rendering request should contain:

- `diagram`
- `output`
- `theme`
- `labels`
- `assetOptions`

---

## Input Shape

```json
{
  "diagram": {
    "diagramId": "diag_01",
    "specVersion": "drill-diagram-spec.v1",
    "diagramType": "setup",
    "title": "4v2 Defensive Rondo Setup",
    "spec": {}
  },
  "output": {
    "format": "svg",
    "mode": "inline-preview",
    "width": 1200,
    "height": 800,
    "background": "light"
  },
  "theme": {
    "variant": "default-soccer-lite"
  },
  "labels": {
    "showTitle": true,
    "showLegend": true,
    "showObjectLabels": true
  },
  "assetOptions": {
    "embedFonts": false,
    "optimizeForPrint": false
  }
}
```

---

## Field Definitions

### `diagram`
Required object.

Contains the diagram wrapper and full `DrillDiagramSpec v1` payload.

### `output`
Required object.

Defines the rendering target.

#### `output.format`
Required string.
Suggested v1 values:
- `svg`
- `png`

PDF should normally be generated at the session export layer, not directly as the diagram renderer’s only concern.

#### `output.mode`
Required string.
Suggested values:
- `inline-preview`
- `export`

#### `output.width`
Optional integer.
Target width in pixels.

#### `output.height`
Optional integer.
Target height in pixels.

#### `output.background`
Optional string.
Suggested values:
- `light`
- `transparent`

### `theme`
Optional object.

Used to keep rendering visually consistent.

Suggested v1 field:
- `variant`

### `labels`
Optional object.

Used to control label visibility.

Suggested fields:
- `showTitle`
- `showLegend`
- `showObjectLabels`
- `showStepNumbers`

### `assetOptions`
Optional object.

Suggested fields:
- `embedFonts`
- `optimizeForPrint`
- `trimWhitespace`

---

## Output Contract

A successful rendering response should contain:

- `diagramId`
- `format`
- `renderStatus`
- `content`
- `metadata`

---

## Success Response Example

### SVG inline response

```json
{
  "diagramId": "diag_01",
  "format": "svg",
  "renderStatus": "completed",
  "content": {
    "svg": "<svg>...</svg>"
  },
  "metadata": {
    "width": 1200,
    "height": 800,
    "themeVariant": "default-soccer-lite"
  }
}
```

### Asset response example

```json
{
  "diagramId": "diag_01",
  "format": "png",
  "renderStatus": "completed",
  "content": {
    "assetUrl": "https://example-rendered-asset"
  },
  "metadata": {
    "width": 1200,
    "height": 800,
    "themeVariant": "default-soccer-lite",
    "ttlSeconds": 900
  }
}
```

---

## Output Field Definitions

### `diagramId`
Identifier copied from the request.

### `format`
Returned asset format.

### `renderStatus`
Suggested values:
- `completed`
- `failed`

### `content`
Depends on output mode and format.

For inline preview:
- raw SVG string is acceptable

For asset mode:
- asset URL is acceptable if the renderer stores a file

### `metadata`
Optional object.
Suggested fields:
- `width`
- `height`
- `themeVariant`
- `ttlSeconds`
- `renderTimeMs`

---

## Renderer Rules

### Rule 1
The renderer must not reinterpret the meaning of the diagram.
It only renders what the validated spec describes.

### Rule 2
The renderer should preserve object placement, connection direction, and labels.

### Rule 3
The renderer should produce consistent visuals for the same spec.

### Rule 4
The renderer should stay simple enough for Lite.
No freehand generation or model-generated visuals are required.

### Rule 5
Rendering should be deterministic enough to support tests and export workflows.

---

## Validation Expectations

Before rendering begins, the diagram should already have passed:
- wrapper validation
- `DrillDiagramSpec v1` validation
- activity alignment checks where relevant

The renderer may still do defensive checks for:
- missing dimensions
- unsupported formats
- impossible layout values

---

## Error Semantics

### `400 Bad Request`
Used when the rendering request is malformed.

Suggested reason codes:
- `invalid_render_request`
- `unsupported_output_format`
- `missing_diagram_spec`

### `422 Unprocessable Entity`
Used when the supplied diagram cannot be rendered safely.

Suggested reason codes:
- `diagram_validation_failed`
- `unsupported_diagram_shape`
- `invalid_coordinates`

### `500 Internal Server Error`
Used when rendering fails internally.

Suggested reason codes:
- `renderer_failure`
- `asset_generation_failed`

---

## Error Response Example

```json
{
  "error": {
    "code": "unsupported_output_format",
    "message": "The requested output format is not supported.",
    "requestId": "req_789"
  }
}
```

---

## Relationship to Frontend

For frontend preview, the preferred v1 approach is:
- backend returns validated diagrams as part of SessionPack
- frontend renders SVG directly from the spec, or
- frontend requests a renderable SVG payload using this contract

The exact implementation can stay flexible as long as the contract remains stable.

---

## Relationship to Export

For exports, the preferred v1 approach is:
- the export service uses the same rendering rules
- diagrams are rendered to SVG or PNG
- the export layer places rendered diagrams into the PDF layout

This avoids having separate visual logic for preview and export.

---

## Summary

Diagram Rendering Contract v1 defines how SIC Coach Lite turns validated diagram specs into renderable assets.

It should remain:
- validation-first
- deterministic
- simple enough for Lite
- useful for both frontend preview and export generation
