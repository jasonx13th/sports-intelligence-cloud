# Week 19 Day 1 — Fut-Soccer Seed Cases

## Purpose
Capture the first sanitized positive evaluation cases for the `fut_soccer` category.

These cases are planning-grade seed fixtures for Week 19. They test whether the shared Session Builder remains useful under a Fut-Soccer sport-pack bias, without creating a separate product surface.

## Seed cases

```json
[
  {
    "id": "eval_futsoc_001",
    "category": "fut_soccer",
    "title": "Tight indoor space with fast passing focus",
    "description": "Small indoor court scenario focused on quick passing, scanning, and fast support angles.",
    "input": {
      "sportPack": "fut_soccer",
      "sessionInput": {
        "ageBand": "U11",
        "durationMin": 50,
        "playerCount": 12,
        "spaceType": "indoor_court_small",
        "equipment": ["cones", "balls", "bibs", "mini_goals"],
        "objective": "quick passing and support play under pressure"
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
      "Clear Fut-Soccer bias case",
      "Strong golden candidate"
    ]
  },
  {
    "id": "eval_futsoc_002",
    "category": "fut_soccer",
    "title": "Ball mastery in a compact training area",
    "description": "Small-area technical session emphasizing touches, control, and quick changes of direction.",
    "input": {
      "sportPack": "fut_soccer",
      "sessionInput": {
        "ageBand": "U10",
        "durationMin": 45,
        "playerCount": 10,
        "spaceType": "indoor_compact",
        "equipment": ["cones", "balls"],
        "objective": "ball mastery and close control"
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
    "goldenCandidate": false,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Good small-space technical case",
      "Useful for constraint-fit checks"
    ]
  },
  {
    "id": "eval_futsoc_003",
    "category": "fut_soccer",
    "title": "Pressing transition session in a fut-soccer setting",
    "description": "Short, high-rotation session focused on pressing reactions and immediate transition in a tight space.",
    "input": {
      "sportPack": "fut_soccer",
      "sessionInput": {
        "ageBand": "U13",
        "durationMin": 55,
        "playerCount": 14,
        "spaceType": "indoor_medium",
        "equipment": ["cones", "balls", "bibs", "mini_goals"],
        "objective": "pressing transition and fast recovery"
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
      "constraintFit": 4,
      "editBurden": 3
    },
    "goldenCandidate": true,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Good speed-and-rotation case",
      "Useful bridge between general session quality and Fut-Soccer bias"
    ]
  },
  {
    "id": "eval_futsoc_004",
    "category": "fut_soccer",
    "title": "Short-duration youth session with frequent rotations",
    "description": "Compact youth session where time is short and activities must rotate quickly without overcomplication.",
    "input": {
      "sportPack": "fut_soccer",
      "sessionInput": {
        "ageBand": "U9",
        "durationMin": 40,
        "playerCount": 8,
        "spaceType": "indoor_small",
        "equipment": ["cones", "balls", "bibs"],
        "objective": "quick rotations and simple small-sided repetition"
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
      "constraintFit": 4,
      "editBurden": 3
    },
    "goldenCandidate": false,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Useful age-band and simplicity case",
      "Should stay practical and not over-design the session"
    ]
  }
]
```

## Notes
- all cases are sanitized
- all cases are positive cases
- these cases test shared Session Builder usefulness under a Fut-Soccer bias
- negative boundary cases come later
- these are seed cases and may later be converted into runner fixtures

## Acceptance criteria
- 4 fut-soccer seed cases exist
- IDs and categories follow the frozen schema
- all cases stay within the shared Session Builder product boundary
- at least 1 to 2 strong golden candidates are identified
