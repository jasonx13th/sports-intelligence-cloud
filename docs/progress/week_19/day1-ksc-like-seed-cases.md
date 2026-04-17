# Week 19 Day 1 — KSC-like Seed Cases

## Purpose
Capture the first sanitized positive evaluation cases for the `ksc_like` category.

These cases are planning-grade seed fixtures for Week 19. They are meant to reflect realistic coach inputs that feel close to likely pilot usage, while staying fully sanitized and inside the current SIC Session Builder product boundary.

## Seed cases

```json
[
  {
    "id": "eval_ksc_001",
    "category": "ksc_like",
    "title": "Mixed equipment, limited space, 60-minute youth session",
    "description": "Coach needs a practical youth session with mixed available equipment and a constrained working area.",
    "input": {
      "sessionInput": {
        "sport": "soccer",
        "ageBand": "U12",
        "durationMin": 60,
        "playerCount": 14,
        "spaceType": "shared_half_pitch",
        "equipment": ["cones", "balls", "bibs", "mini_goals"],
        "objective": "passing under pressure and support angles"
      }
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
      "ageAppropriate": 5,
      "constraintFit": 5,
      "editBurden": 4
    },
    "goldenCandidate": true,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Strong pilot-adjacent scenario",
      "Good candidate for golden set"
    ]
  },
  {
    "id": "eval_ksc_002",
    "category": "ksc_like",
    "title": "Rainy-day indoor fallback session",
    "description": "Coach needs a same-day fallback session after weather forces training indoors with less space and simpler setup.",
    "input": {
      "sessionInput": {
        "sport": "soccer",
        "ageBand": "U11",
        "durationMin": 50,
        "playerCount": 12,
        "spaceType": "indoor_compact",
        "equipment": ["cones", "balls", "bibs"],
        "objective": "ball mastery and quick combination play"
      }
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
      "constraintFit": 5,
      "editBurden": 4
    },
    "goldenCandidate": true,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Good real-world coach scenario",
      "Useful for practical fallback planning checks"
    ]
  },
  {
    "id": "eval_ksc_003",
    "category": "ksc_like",
    "title": "Low-equipment session needing a simple runnable plan",
    "description": "Coach has minimal equipment and needs a clean, usable session without overcomplication.",
    "input": {
      "sessionInput": {
        "sport": "soccer",
        "ageBand": "U13",
        "durationMin": 55,
        "playerCount": 16,
        "spaceType": "grass_small",
        "equipment": ["cones", "balls"],
        "objective": "possession and transition with simple setup"
      }
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
      "ageAppropriate": 4,
      "constraintFit": 5,
      "editBurden": 3
    },
    "goldenCandidate": false,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Useful simplicity and constraint-fit case",
      "Should reward practical output over elaborate design"
    ]
  }
]
```

## Notes
- all cases are sanitized
- all cases are positive cases
- these scenarios are realistic but not tied to real tenant or user data
- these are pilot-adjacent cases, not production pilot fixtures
- negative boundary cases come later
- these are seed cases and may later be converted into runner fixtures

## Acceptance criteria
- 3 KSC-like seed cases exist
- IDs and categories follow the frozen schema
- all cases stay within the shared Session Builder product boundary
- at least 1 to 2 strong golden candidates are identified
