# Week 19 Day 1 — Negative Boundary Cases

## Purpose
Capture the first sanitized negative evaluation cases for the `negative_boundary` category.

These cases exist to confirm fail-closed behavior, clear failure reporting, and strict adherence to the current SIC tenant and product boundaries.

## Negative cases

```json
[
  {
    "id": "eval_neg_001",
    "category": "negative_boundary",
    "title": "Invalid contract shape",
    "description": "Case intentionally omits required structure so the harness can confirm schema or contract rejection behavior.",
    "input": {
      "mode": "environment_profile",
      "imageFixture": "fixtures/images/env-invalid-contract-001.jpg",
      "promptContext": "Malformed fixture intended for contract validation failure."
    },
    "expectedChecks": {
      "contractValid": false,
      "equipmentCompatible": false,
      "ageBandSafe": false,
      "setupFaithful": false,
      "structureUsable": false
    },
    "rubricHints": {},
    "goldenCandidate": false,
    "negativeCase": true,
    "expectedFailureReason": "invalid_contract_shape",
    "notes": [
      "Intentional rejection case",
      "Used to confirm fail-closed contract handling"
    ]
  },
  {
    "id": "eval_neg_002",
    "category": "negative_boundary",
    "title": "Equipment incompatibility",
    "description": "Case expects the system to reject or clearly fail a drill/session output that requires unavailable equipment.",
    "input": {
      "mode": "setup_to_drill",
      "imageFixture": "fixtures/images/setup-equipment-mismatch-002.jpg",
      "promptContext": "Small-area activity with cones and balls only.",
      "ageBand": "U12",
      "equipment": ["cones", "balls"],
      "simulatedBadOutput": {
        "requiredEquipment": ["cones", "balls", "full_goal", "ladders"]
      }
    },
    "expectedChecks": {
      "contractValid": true,
      "equipmentCompatible": false,
      "ageBandSafe": true,
      "setupFaithful": false,
      "structureUsable": false
    },
    "rubricHints": {},
    "goldenCandidate": false,
    "negativeCase": true,
    "expectedFailureReason": "equipment_incompatible",
    "notes": [
      "Intentional mismatch case",
      "Confirms unavailable equipment is not silently accepted"
    ]
  },
  {
    "id": "eval_neg_003",
    "category": "negative_boundary",
    "title": "Unsafe age-band mismatch",
    "description": "Case expects failure when the returned content is too advanced or unsafe for the stated age band.",
    "input": {
      "sportPack": "fut_soccer",
      "sessionInput": {
        "ageBand": "U8",
        "durationMin": 60,
        "playerCount": 12,
        "spaceType": "indoor_small",
        "equipment": ["cones", "balls", "bibs"],
        "objective": "simple close-control work"
      },
      "simulatedBadOutput": {
        "intensity": "high",
        "contactLoad": "advanced",
        "progressionComplexity": "too_high_for_age_band"
      }
    },
    "expectedChecks": {
      "contractValid": true,
      "equipmentCompatible": true,
      "ageBandSafe": false,
      "setupFaithful": true,
      "structureUsable": false
    },
    "rubricHints": {},
    "goldenCandidate": false,
    "negativeCase": true,
    "expectedFailureReason": "unsafe_age_band",
    "notes": [
      "Intentional safety rejection case",
      "Confirms rubric cannot override safety failure"
    ]
  },
  {
    "id": "eval_neg_004",
    "category": "negative_boundary",
    "title": "Tenant spoof rejection",
    "description": "Case intentionally includes a client-supplied tenant field so the harness can confirm rejection behavior.",
    "input": {
      "mode": "environment_profile",
      "imageFixture": "fixtures/images/env-tenant-spoof-004.jpg",
      "promptContext": "Intentional rejection test only.",
      "tenantId": "tenant_spoofed-demo"
    },
    "expectedChecks": {
      "contractValid": false,
      "equipmentCompatible": false,
      "ageBandSafe": false,
      "setupFaithful": false,
      "structureUsable": false
    },
    "rubricHints": {},
    "goldenCandidate": false,
    "negativeCase": true,
    "expectedFailureReason": "tenant_spoof_rejected",
    "notes": [
      "Intentional rejection-only case",
      "Only allowed case that includes client-supplied tenant input",
      "Must never be treated as a normal evaluation fixture"
    ]
  }
]
```

## Notes
- all cases are sanitized
- all cases are intentional negative cases
- no case here is a golden candidate
- the tenant spoof case is rejection-only and must remain clearly labeled
- these cases exist to confirm fail-closed behavior, not normal usability scoring

## Acceptance criteria
- 4 negative boundary cases exist
- each case has a stable `expectedFailureReason`
- one and only one tenant spoof rejection case exists
- no negative case is mixed into normal positive expectations
- fail-closed and tenancy-boundary behavior is explicit
