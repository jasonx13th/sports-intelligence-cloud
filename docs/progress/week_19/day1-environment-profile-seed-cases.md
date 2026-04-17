# Week 19 Day 1 — Environment Profile Seed Cases

## Purpose
Capture the first sanitized positive evaluation cases for the `environment_profile` category.

These cases are planning-grade seed fixtures for Week 19. They follow the frozen case schema and stay inside the shipped Week 18 image-assisted intake boundary.

## Seed cases

```json
[
  {
    "id": "eval_env_001",
    "category": "environment_profile",
    "title": "Small indoor court with cones and mini goals",
    "description": "Indoor youth training space with clear small-area limits, cones, and two mini goals visible.",
    "input": {
      "mode": "environment_profile",
      "imageFixture": "fixtures/images/env-small-indoor-001.jpg",
      "promptContext": "U11 session, limited indoor space, cones and mini goals available.",
      "ageBand": "U11",
      "equipment": ["cones", "mini_goals", "balls"]
    },
    "expectedChecks": {
      "contractValid": true,
      "equipmentCompatible": true,
      "ageBandSafe": true,
      "setupFaithful": true,
      "structureUsable": true
    },
    "rubricHints": {
      "runnableToday": 5,
      "clarity": 5,
      "ageAppropriate": 5,
      "constraintFit": 5,
      "editBurden": 4
    },
    "goldenCandidate": true,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Clear indoor boundary case",
      "Strong golden candidate",
      "No real tenant or user data"
    ]
  },
  {
    "id": "eval_env_002",
    "category": "environment_profile",
    "title": "Shared grass field with unclear boundaries",
    "description": "Outdoor grass area with overlapping markings and partial shared-use context.",
    "input": {
      "mode": "environment_profile",
      "imageFixture": "fixtures/images/env-shared-grass-002.jpg",
      "promptContext": "U13 training on a shared field with unclear working area and limited setup time.",
      "ageBand": "U13",
      "equipment": ["cones", "balls"]
    },
    "expectedChecks": {
      "contractValid": true,
      "equipmentCompatible": true,
      "ageBandSafe": true,
      "setupFaithful": true,
      "structureUsable": true
    },
    "rubricHints": {
      "runnableToday": 4,
      "clarity": 3,
      "ageAppropriate": 4,
      "constraintFit": 4,
      "editBurden": 3
    },
    "goldenCandidate": false,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Useful ambiguity case",
      "Tests boundary interpretation without widening scope"
    ]
  },
  {
    "id": "eval_env_003",
    "category": "environment_profile",
    "title": "Tight futsal-style space with limited equipment",
    "description": "Compact indoor or covered hard-court area with very limited visible equipment and tight working space.",
    "input": {
      "mode": "environment_profile",
      "imageFixture": "fixtures/images/env-tight-futsal-003.jpg",
      "promptContext": "Fast-rotation youth session in a small futsal-style space with cones and balls only.",
      "ageBand": "U12",
      "equipment": ["cones", "balls"]
    },
    "expectedChecks": {
      "contractValid": true,
      "equipmentCompatible": true,
      "ageBandSafe": true,
      "setupFaithful": true,
      "structureUsable": true
    },
    "rubricHints": {
      "runnableToday": 5,
      "clarity": 4,
      "ageAppropriate": 4,
      "constraintFit": 5,
      "editBurden": 4
    },
    "goldenCandidate": true,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Good bridge case between image intake and Fut-Soccer bias",
      "Likely golden candidate"
    ]
  },
  {
    "id": "eval_env_004",
    "category": "environment_profile",
    "title": "Outdoor training area with visible safety constraints",
    "description": "Outdoor space where surface condition, side obstructions, or uneven working area should influence practical planning.",
    "input": {
      "mode": "environment_profile",
      "imageFixture": "fixtures/images/env-safety-constraints-004.jpg",
      "promptContext": "U10 outdoor session with visible side hazards and a need for safe small-area work.",
      "ageBand": "U10",
      "equipment": ["cones", "balls", "bibs"]
    },
    "expectedChecks": {
      "contractValid": true,
      "equipmentCompatible": true,
      "ageBandSafe": true,
      "setupFaithful": true,
      "structureUsable": true
    },
    "rubricHints": {
      "runnableToday": 4,
      "clarity": 4,
      "ageAppropriate": 5,
      "constraintFit": 4,
      "editBurden": 3
    },
    "goldenCandidate": false,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Safety-sensitive case",
      "Useful for checking practical coaching adjustments"
    ]
  },
  {
    "id": "eval_env_005",
    "category": "environment_profile",
    "title": "Ambiguous space with partial equipment visibility",
    "description": "Image shows only part of the working area and only some equipment is clearly visible.",
    "input": {
      "mode": "environment_profile",
      "imageFixture": "fixtures/images/env-partial-visibility-005.jpg",
      "promptContext": "U14 session in a partly visible training area with uncertain boundaries and incomplete equipment visibility.",
      "ageBand": "U14",
      "equipment": ["cones", "balls"]
    },
    "expectedChecks": {
      "contractValid": true,
      "equipmentCompatible": true,
      "ageBandSafe": true,
      "setupFaithful": true,
      "structureUsable": true
    },
    "rubricHints": {
      "runnableToday": 3,
      "clarity": 3,
      "ageAppropriate": 4,
      "constraintFit": 3,
      "editBurden": 2
    },
    "goldenCandidate": false,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Ambiguity-heavy case",
      "Should stay bounded and avoid overclaiming"
    ]
  }
]
```

## Notes
- all cases are sanitized
- all cases are positive cases
- negative boundary cases come later
- these are seed cases and may later be converted into runner fixtures

## Acceptance criteria
- 5 environment-profile seed cases exist
- IDs and categories follow the frozen schema
- all cases stay within the shipped Week 18 boundary
- at least 1 to 2 strong golden candidates are identified
