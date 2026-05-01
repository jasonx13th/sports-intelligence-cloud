"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getMissingEquipmentForTheme,
  validateCreateSessionPack,
  validateSessionPackV2Draft,
  SUPPORTED_SPORT_PACK_IDS,
} = require("./session-pack-validate");
const { DRILL_DIAGRAM_SPEC_VERSION } = require("./diagram-spec-validate");

function makeValidPackRequest(overrides = {}) {
  return {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 3,
    ...overrides,
  };
}

function makeValidDiagramSpec(activityId = "act_001") {
  return {
    diagramId: "diag_001",
    specVersion: DRILL_DIAGRAM_SPEC_VERSION,
    activityId,
    title: "Rondo setup",
    diagramType: "setup",
    sport: "soccer",
    objects: [
      {
        objectId: "player_1",
        type: "player",
        x: 100,
        y: 100,
      },
    ],
  };
}

function makeValidSessionPackV2Draft(overrides = {}) {
  return {
    sessionPackId: "sp_001",
    specVersion: "session-pack.v2",
    title: "U12 Defending Session",
    sport: "soccer",
    ageGroup: "U12",
    durationMinutes: 20,
    equipment: ["cones", "balls"],
    space: {
      areaType: "half-field",
    },
    objective: "Improve defending shape and cover.",
    activities: [
      {
        activityId: "act_001",
        name: "4v2 Defensive Rondo",
        minutes: 20,
        setup: "Mark a 20x20 grid with four cones.",
        instructions: "Defenders press together and recover shape quickly.",
        coachingPoints: ["close space quickly"],
        equipment: ["cones", "balls"],
      },
    ],
    ...overrides,
  };
}

test("validateCreateSessionPack accepts supported ageBand and optional equipment", () => {
  const result = validateCreateSessionPack(
    makeValidPackRequest({
      ageBand: "U16",
      equipment: ["Cones", "Balls"],
    })
  );

  assert.equal(result.ageBand, "u16");
  assert.deepEqual(result.equipment, ["cones", "balls"]);
});

test("validateCreateSessionPack normalizes common youth age wording", () => {
  const result = validateCreateSessionPack({
    sport: "soccer",
    ageBand: "under twelve",
    durationMin: 20,
    theme: "quick activity",
    sessionMode: "quick_activity",
    sessionsCount: 1,
  });

  assert.equal(result.ageBand, "u12");
});

test("validateCreateSessionPack accepts soccer with fut-soccer sportPackId", () => {
  const result = validateCreateSessionPack(
    makeValidPackRequest({
      sportPackId: "fut-soccer",
    })
  );

  assert.equal(result.sport, "soccer");
  assert.equal(result.sportPackId, "fut-soccer");
});

test("validateCreateSessionPack accepts explicit generation mode and coach notes", () => {
  const result = validateCreateSessionPack(
    makeValidPackRequest({
      sessionMode: "quick_activity",
      coachNotes: "Use the players' request for more finishing repetition.",
    })
  );

  assert.equal(result.sessionMode, "quick_activity");
  assert.equal(result.coachNotes, "Use the players' request for more finishing repetition.");
});

test("validateCreateSessionPack rejects unsupported generation mode", () => {
  assert.throws(
    () => validateCreateSessionPack(makeValidPackRequest({ sessionMode: "quick" })),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "unsupported_session_mode");
      assert.equal(err.details.field, "sessionMode");
      return true;
    }
  );
});

test("validateCreateSessionPack rejects unsupported ageBand with stable reason", () => {
  assert.throws(
    () => validateCreateSessionPack(makeValidPackRequest({ ageBand: "u7" })),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "unsupported_age_band");
      assert.equal(err.details.field, "ageBand");
      assert.equal(err.details.value, "u7");
      return true;
    }
  );
});

test("validateCreateSessionPack accepts balls and cones for finishing without requiring goals", () => {
  const result = validateCreateSessionPack(
    makeValidPackRequest({
      theme: "Finishing",
      equipment: ["balls", "cones"],
    })
  );

  assert.deepEqual(result.equipment, ["balls", "cones"]);
  assert.deepEqual(getMissingEquipmentForTheme("Finishing", ["balls", "cones"]), []);
});

test("validateCreateSessionPack treats pug, pugg, mini, small, and portable goals as goal-compatible", () => {
  const miniGoalResult = validateCreateSessionPack(
    makeValidPackRequest({
      theme: "Finishing",
      equipment: ["balls", "mini goals"],
    })
  );
  const pugGoalResult = validateCreateSessionPack(
    makeValidPackRequest({
      theme: "Finishing",
      equipment: ["balls", "pug goals"],
    })
  );
  const puggGoalResult = validateCreateSessionPack(
    makeValidPackRequest({
      theme: "Finishing",
      equipment: ["balls", "Pugg goals"],
    })
  );
  const smallGoalResult = validateCreateSessionPack(
    makeValidPackRequest({
      theme: "Finishing",
      equipment: ["balls", "small goals"],
    })
  );
  const portableGoalResult = validateCreateSessionPack(
    makeValidPackRequest({
      theme: "Finishing",
      equipment: ["balls", "portable goals"],
    })
  );

  assert.deepEqual(miniGoalResult.equipment, ["balls", "mini goals"]);
  assert.deepEqual(pugGoalResult.equipment, ["balls", "pug goals"]);
  assert.deepEqual(puggGoalResult.equipment, ["balls", "pugg goals"]);
  assert.deepEqual(smallGoalResult.equipment, ["balls", "small goals"]);
  assert.deepEqual(portableGoalResult.equipment, ["balls", "portable goals"]);
});

test("validateCreateSessionPack does not fail equipment compatibility when equipment is omitted", () => {
  const result = validateCreateSessionPack(
    makeValidPackRequest({
      theme: "Finishing",
    })
  );

  assert.equal(result.theme, "Finishing");
  assert.equal(Object.hasOwn(result, "equipment"), false);
});

test("validateCreateSessionPack rejects unsupported sportPackId with stable reason", () => {
  assert.throws(
    () =>
      validateCreateSessionPack(
        makeValidPackRequest({
          sportPackId: "indoor-soccer",
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "unsupported_sport_pack");
      assert.equal(err.details.field, "sportPackId");
      assert.equal(err.details.value, "indoor-soccer");
      assert.deepEqual(err.details.allowed, SUPPORTED_SPORT_PACK_IDS);
      return true;
    }
  );
});

test("validateCreateSessionPack rejects sportPackId when sport does not match", () => {
  assert.throws(
    () =>
      validateCreateSessionPack(
        makeValidPackRequest({
          sport: "basketball",
          sportPackId: "fut-soccer",
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "sport_pack_sport_mismatch");
      assert.equal(err.details.field, "sportPackId");
      assert.equal(err.details.sport, "basketball");
      assert.equal(err.details.sportPackId, "fut-soccer");
      assert.equal(err.details.allowedSport, "soccer");
      return true;
    }
  );
});

test("validateSessionPackV2Draft accepts a minimal valid soccer Session Pack v2 draft", () => {
  const result = validateSessionPackV2Draft(makeValidSessionPackV2Draft());

  assert.equal(result.specVersion, "session-pack.v2");
  assert.equal(result.sport, "soccer");
  assert.equal(result.activities[0].instructions, "Defenders press together and recover shape quickly.");
});

test("validateSessionPackV2Draft rejects activities[].instructions as string[]", () => {
  assert.throws(
    () =>
      validateSessionPackV2Draft(
        makeValidSessionPackV2Draft({
          activities: [
            {
              activityId: "act_001",
              name: "4v2 Defensive Rondo",
              minutes: 20,
              setup: "Mark a 20x20 grid with four cones.",
              instructions: ["Press together."],
              coachingPoints: ["close space quickly"],
              equipment: ["cones", "balls"],
            },
          ],
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "instructions");
      return true;
    }
  );
});

test("validateSessionPackV2Draft rejects non-canonical diagram wrapper specVersion", () => {
  assert.throws(
    () =>
      validateSessionPackV2Draft(
        makeValidSessionPackV2Draft({
          activities: [
            {
              activityId: "act_001",
              name: "4v2 Defensive Rondo",
              minutes: 20,
              setup: "Mark a 20x20 grid with four cones.",
              instructions: "Defenders press together and recover shape quickly.",
              coachingPoints: ["close space quickly"],
              equipment: ["cones", "balls"],
              diagrams: [
                {
                  diagramId: "diag_001",
                  specVersion: "drill-diagram-spec/v1",
                  diagramType: "setup",
                  title: "Rondo setup",
                  spec: makeValidDiagramSpec("act_001"),
                },
              ],
            },
          ],
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "invalid_spec_version");
      assert.equal(err.details.field, "specVersion");
      return true;
    }
  );
});

test("validateSessionPackV2Draft rejects invalid diagramType", () => {
  assert.throws(
    () =>
      validateSessionPackV2Draft(
        makeValidSessionPackV2Draft({
          activities: [
            {
              activityId: "act_001",
              name: "4v2 Defensive Rondo",
              minutes: 20,
              setup: "Mark a 20x20 grid with four cones.",
              instructions: "Defenders press together and recover shape quickly.",
              coachingPoints: ["close space quickly"],
              equipment: ["cones", "balls"],
              diagrams: [
                {
                  diagramId: "diag_001",
                  specVersion: DRILL_DIAGRAM_SPEC_VERSION,
                  diagramType: "variation",
                  title: "Rondo setup",
                  spec: makeValidDiagramSpec("act_001"),
                },
              ],
            },
          ],
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "unsupported_diagram_type");
      assert.equal(err.details.field, "diagramType");
      return true;
    }
  );
});
