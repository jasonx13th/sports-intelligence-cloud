"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
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

test("validateCreateSessionPack accepts soccer with fut-soccer sportPackId", () => {
  const result = validateCreateSessionPack(
    makeValidPackRequest({
      sportPackId: "fut-soccer",
    })
  );

  assert.equal(result.sport, "soccer");
  assert.equal(result.sportPackId, "fut-soccer");
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

test("validateCreateSessionPack rejects incompatible finishing theme equipment", () => {
  assert.throws(
    () =>
      validateCreateSessionPack(
        makeValidPackRequest({
          theme: "Finishing",
          equipment: ["balls", "cones"],
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "incompatible_equipment");
      assert.equal(err.details.field, "equipment");
      assert.deepEqual(err.details.missingEquipment, ["goals"]);
      return true;
    }
  );
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
