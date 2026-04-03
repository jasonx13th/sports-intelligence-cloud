# Chat Contract v1

## Status
Draft v1

## Purpose

This document defines the v1 API contract for the SIC Coach Lite chat and session generation flow.

The purpose of this contract is to give the frontend a stable way to:
- submit a coach request
- provide structured soccer constraints
- receive either a direct assistant reply, a follow-up question, or a complete SessionPack
- preserve tenant-safe behavior across all requests

Coach Lite v1 is soccer-first.

---

## Scope

This contract covers the first chat-style orchestration endpoint for Coach Lite.

It does not attempt to define:
- long-term conversation analytics
- streaming tokens
- voice interactions
- live collaboration
- multi-sport behavior
- advanced methodology approval workflows

---

## Endpoint

### `POST /chat`

Primary orchestration endpoint for coach interaction.

This endpoint accepts a coach message plus optional structured context.
It returns:
- a follow-up question when required inputs are missing
- a direct assistant reply when no session should be generated yet
- a validated `SessionPack` when generation succeeds

---

## Authentication and Tenant Rules

### Required
- authenticated request
- verified JWT identity
- tenant context resolved from server-side auth + entitlements

### Non-negotiable rule
The endpoint must never trust tenant identifiers from:
- request body
- query params
- headers

All storage and retrieval behavior must use authoritative tenant context only.

---

## Request

### Method
`POST`

### Path
`/chat`

### Headers
Required:
- `Authorization: Bearer <JWT>`

Optional:
- `Content-Type: application/json`
- `X-Correlation-Id` if allowed by current platform wrapper

---

## Request Body

```json
{
  "message": "I need a 75 minute U12 soccer session focused on defending. I have 14 players, 10 cones, 8 balls, and half a field.",
  "context": {
    "sport": "soccer",
    "ageGroup": "U12",
    "level": "club",
    "playersCount": 14,
    "durationMinutes": 75,
    "space": {
      "surfaceType": "grass",
      "areaType": "half-field",
      "sizeLabel": "half field"
    },
    "equipment": {
      "cones": 10,
      "balls": 8,
      "bibs": 12,
      "miniGoals": 0,
      "goals": 1,
      "poles": 0,
      "mannequins": 0
    },
    "focus": ["defending"],
    "constraints": ["limited equipment"],
    "methodologyMode": "tenant-default"
  },
  "conversation": {
    "conversationId": "optional-existing-conversation-id",
    "turnId": "optional-client-turn-id"
  },
  "options": {
    "generateSession": true,
    "includeDiagrams": true,
    "includeExportPreview": false,
    "responseMode": "standard"
  }
}
```

---

## Request Field Definitions

### `message`
Required string.

Natural-language coach input.
This may be the only input in simple cases.

### `context`
Optional object.

Structured constraints supplied by the UI to reduce ambiguity and keep generation deterministic.

### `context.sport`
Required for generation.

Allowed v1 value:
- `soccer`

If omitted, the service may ask a follow-up question instead of generating.

### `context.ageGroup`
Recommended string.
Examples:
- `U8`
- `U10`
- `U12`
- `U14`
- `U17`
- `adult`

### `context.level`
Optional string.
Suggested values:
- `recreational`
- `club`
- `academy`
- `school`
- `adult-amateur`

### `context.playersCount`
Recommended integer.
Must be greater than zero.

### `context.durationMinutes`
Recommended integer.
Must be greater than zero.

### `context.space`
Optional object.

Suggested fields:
- `surfaceType`
- `areaType`
- `sizeLabel`
- `width`
- `length`
- `units`

### `context.equipment`
Optional object.

Supported v1 fields:
- `cones`
- `balls`
- `bibs`
- `goals`
- `miniGoals`
- `poles`
- `mannequins`
- `ladders`

### `context.focus`
Optional array of strings.
Examples:
- `defending`
- `pressing`
- `finishing`
- `passing`
- `transition`

### `context.constraints`
Optional array of strings.
Examples:
- `small space`
- `indoors`
- `fewer balls`
- `shared field`
- `rain`

### `context.methodologyMode`
Optional string.
Suggested values:
- `tenant-default`
- `off`

v1 should prefer tenant-default behavior when club methodology is enabled.

### `conversation`
Optional object.

Used to continue an existing thread or preserve client-side interaction state.

### `options.generateSession`
Optional boolean.
Default: `true`

If `false`, the system may return a direct assistant reply without trying to generate a SessionPack.

### `options.includeDiagrams`
Optional boolean.
Default: `true`

### `options.includeExportPreview`
Optional boolean.
Default: `false`

### `options.responseMode`
Optional string.
Suggested values:
- `standard`
- `compact`

---

## Response Types

The endpoint may return one of three main outcomes.

### 1. Follow-up question
Used when required generation inputs are missing.

### 2. Assistant reply only
Used when the user is asking for clarification, adaptation, or a non-generation answer.

### 3. Assistant reply plus SessionPack
Used when session generation succeeds.

---

## Success Response Shape

```json
{
  "requestId": "req_123",
  "conversation": {
    "conversationId": "conv_123",
    "turnId": "turn_456"
  },
  "status": "completed",
  "responseType": "session-pack",
  "assistantReply": {
    "message": "Here is a 75 minute U12 defending session built for your numbers and equipment.",
    "followUpQuestions": []
  },
  "sessionPack": {
    "sessionPackId": "sp_123",
    "specVersion": "session-pack.v2",
    "title": "U12 Defending Session",
    "sport": "soccer",
    "ageGroup": "U12",
    "level": "club",
    "durationMinutes": 75,
    "activities": []
  },
  "metadata": {
    "methodologyApplied": true,
    "diagramsIncluded": true,
    "exportPreviewAvailable": false
  }
}
```

---

## Follow-Up Response Example

```json
{
  "requestId": "req_124",
  "conversation": {
    "conversationId": "conv_123",
    "turnId": "turn_457"
  },
  "status": "needs_input",
  "responseType": "follow-up",
  "assistantReply": {
    "message": "I can build that. What age group and how much time do you have?",
    "followUpQuestions": [
      "What age group is the team?",
      "How many minutes do you have?"
    ]
  },
  "sessionPack": null,
  "metadata": {
    "missingFields": ["ageGroup", "durationMinutes"]
  }
}
```

---

## Response Field Definitions

### `requestId`
Server-generated identifier for the request.

### `conversation`
Conversation tracking object.

### `status`
Suggested values:
- `completed`
- `needs_input`
- `error`

### `responseType`
Suggested values:
- `follow-up`
- `assistant-reply`
- `session-pack`

### `assistantReply.message`
Human-readable response shown in the UI.

### `assistantReply.followUpQuestions`
Array of follow-up prompts.
Empty when not needed.

### `sessionPack`
Returned when generation succeeds.
Must conform to `session-pack.v2`.

### `metadata.methodologyApplied`
Boolean indicating whether tenant methodology was included.

### `metadata.diagramsIncluded`
Boolean indicating whether diagrams are included in the returned SessionPack.

### `metadata.exportPreviewAvailable`
Boolean indicating whether an export preview or export-ready asset is available.

---

## Error Contract

Errors should use stable HTTP semantics and stable reason codes.

### `400 Bad Request`
Used when the request body is malformed or violates schema.

Example reason codes:
- `invalid_request_body`
- `unsupported_sport`
- `invalid_option`

### `401 Unauthorized`
Used when auth is missing or invalid.

Example reason codes:
- `missing_auth`
- `invalid_auth_context`

### `403 Forbidden`
Used when entitlements or tenant context cannot be resolved.

Example reason codes:
- `missing_entitlements`
- `invalid_tenant_id`
- `feature_not_enabled`

### `422 Unprocessable Entity`
Used when the request is valid JSON but cannot produce a safe or valid generation result.

Example reason codes:
- `insufficient_generation_context`
- `generation_validation_failed`
- `diagram_validation_failed`

### `500 Internal Server Error`
Used for internal failures.

Example reason codes:
- `handler_error`
- `dependency_error`
- `export_generation_failed`

---

## Error Response Shape

```json
{
  "error": {
    "code": "generation_validation_failed",
    "message": "The generated session could not be validated.",
    "requestId": "req_125"
  }
}
```

---

## Contract Rules

### Rule 1
The service must not return a SessionPack unless it passes session validation.

### Rule 2
If diagrams are requested, the service must either:
- return valid diagrams, or
- fail gracefully with a stable validation error

### Rule 3
The service should ask for missing essentials instead of generating from weak assumptions when confidence is too low.

### Rule 4
Soccer is the only supported sport in v1.

### Rule 5
Club methodology may shape output, but must never override real-world coach constraints.

---

## Session Generation Minimum Inputs

The system should usually require enough information to infer or confirm:
- sport
- age group or level
- players count
- duration
- space
- core equipment
- focus

The service may proceed with assumptions when appropriate, but should surface those assumptions in the SessionPack.

---

## Relationship to Other Contracts

This contract depends on:
- `session-pack.v2`
- `DrillDiagramSpec v1`
- tenant-safe request handling rules already established in SIC

---

## Summary

`POST /chat` is the main Coach Lite orchestration endpoint.

It should remain:
- soccer-first
- tenant-safe
- validation-first
- clear for the frontend
- flexible enough to support both quick generation and follow-up questions
