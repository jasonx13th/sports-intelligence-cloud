# Week 19 Day 1 — Setup to Drill Seed Cases

## Purpose
Capture the first sanitized positive evaluation cases for the `setup_to_drill` category.

These cases are planning-grade seed fixtures for Week 19. They follow the frozen case schema and stay inside the shipped Week 18 boundary, where setup analysis produces one practical drill or activity seed.

## Seed cases

```json
[
  {
    "id": "eval_setup_001",
    "category": "setup_to_drill",
    "title": "Cone box with mini goals for passing pattern",
    "description": "Small-sided setup with a clear cone box and two mini goals that should seed a simple passing or possession drill.",
    "input": {
      "mode": "setup_to_drill",
      "imageFixture": "fixtures/images/setup-cone-box-mini-goals-001.jpg",
      "promptContext": "U11 passing and support play in a tight area with cones, balls, and two mini goals.",
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
      "Very clear setup-to-drill case",
      "Strong golden candidate"
    ]
  },
  {
    "id": "eval_setup_002",
    "category": "setup_to_drill",
    "title": "Rondo-style setup with bibs and cones",
    "description": "Visible cone square and bib grouping that should map to a narrow rondo or keep-away activity seed.",
    "input": {
      "mode": "setup_to_drill",
      "imageFixture": "fixtures/images/setup-rondo-bibs-cones-002.jpg",
      "promptContext": "U12 ball-retention activity using bibs, cones, and balls in a compact working space.",
      "ageBand": "U12",
      "equipment": ["cones", "bibs", "balls"]
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
      "editBurden": 4
    },
    "goldenCandidate": true,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Good faithfulness case",
      "Useful for checking narrow drill seeding"
    ]
  },
  {
    "id": "eval_setup_003",
    "category": "setup_to_drill",
    "title": "Finishing channel with visible goal and markers",
    "description": "Straight-line channel setup with a visible goal and markers that should produce one bounded finishing activity.",
    "input": {
      "mode": "setup_to_drill",
      "imageFixture": "fixtures/images/setup-finishing-channel-003.jpg",
      "promptContext": "U13 finishing repetition in a marked channel with cones, balls, and one goal.",
      "ageBand": "U13",
      "equipment": ["cones", "balls", "goal"]
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
      "constraintFit": 4,
      "editBurden": 4
    },
    "goldenCandidate": false,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Good single-activity seed case",
      "Should stay bounded and not widen into full-session generation"
    ]
  },
  {
    "id": "eval_setup_004",
    "category": "setup_to_drill",
    "title": "Partial setup with unclear spacing",
    "description": "Only part of the drill layout is visible, so the output should stay practical but cautious about assumptions.",
    "input": {
      "mode": "setup_to_drill",
      "imageFixture": "fixtures/images/setup-partial-spacing-004.jpg",
      "promptContext": "U10 small-area activity with incomplete layout visibility and limited setup detail.",
      "ageBand": "U10",
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
      "Ambiguity case",
      "Useful for checking bounded assumptions"
    ]
  },
  {
    "id": "eval_setup_005",
    "category": "setup_to_drill",
    "title": "Small-area possession layout",
    "description": "Compact possession setup with cones and clear working lanes that should produce one practical possession drill seed.",
    "input": {
      "mode": "setup_to_drill",
      "imageFixture": "fixtures/images/setup-small-possession-005.jpg",
      "promptContext": "U14 possession activity in a small area with cones, balls, and clear lane structure.",
      "ageBand": "U14",
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
      "ageAppropriate": 4,
      "constraintFit": 4,
      "editBurden": 3
    },
    "goldenCandidate": false,
    "negativeCase": false,
    "expectedFailureReason": null,
    "notes": [
      "Practical possession seed case",
      "Good middle-of-the-pack usability case"
    ]
  }
]
```

## Notes
- all cases are sanitized
- all cases are positive cases
- all cases stay within the Week 18 `setup_to_drill` boundary
- negative boundary cases come later
- these are seed cases and may later be converted into runner fixtures

## Acceptance criteria
- 5 setup-to-drill seed cases exist
- IDs and categories follow the frozen schema
- all cases stay within the shipped Week 18 boundary
- at least 1 to 2 strong golden candidates are identified
