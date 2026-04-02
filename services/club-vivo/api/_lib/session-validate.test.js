"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateCreateSession } = require("./session-validate");

function makeValidSession(overrides = {}) {
  return {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 45,
    objectiveTags: ["pressing"],
    activities: [
      { name: "Warm-up", minutes: 10, description: "Dynamic movement prep" },
      { name: "Pressing game", minutes: 20, description: "Small-sided pressing exercise" },
      { name: "Conditioned game", minutes: 15, description: "Finish with an 8v8 conditioned game" },
    ],
    ...overrides,
  };
}

test("validateCreateSession accepts supported ageBand and optional equipment", () => {
  const result = validateCreateSession(
    makeValidSession({
      ageBand: "U14",
      equipment: ["Cones", "Balls"],
    })
  );

  assert.equal(result.ageBand, "u14");
  assert.deepEqual(result.equipment, ["cones", "balls"]);
});

test("validateCreateSession rejects unsupported ageBand with stable reason", () => {
  assert.throws(
    () => validateCreateSession(makeValidSession({ ageBand: "u7" })),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "unsupported_age_band");
      assert.equal(err.details.field, "ageBand");
      assert.equal(err.details.value, "u7");
      return true;
    }
  );
});

test("validateCreateSession rejects incompatible equipment with stable reason", () => {
  assert.throws(
    () =>
      validateCreateSession(
        makeValidSession({
          equipment: ["balls", "cones"],
          activities: [{ name: "1v1 to goal", minutes: 20, description: "Attack the goal." }],
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

test("validateCreateSession preserves duration total rule with stable reason", () => {
  assert.throws(
    () =>
      validateCreateSession(
        makeValidSession({
          durationMin: 20,
          activities: [
            { name: "Warm-up", minutes: 10, description: "Prep" },
            { name: "Game", minutes: 15, description: "Play" },
          ],
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "invalid_duration_total");
      assert.equal(err.details.durationMin, 20);
      assert.equal(err.details.totalMinutes, 25);
      return true;
    }
  );
});

test("validateCreateSession keeps legacy optional fields runtime-tolerated", () => {
  const result = validateCreateSession(
    makeValidSession({
      clubId: "club-1",
      teamId: "team-1",
      seasonId: "season-1",
    })
  );

  assert.equal(result.clubId, "club-1");
  assert.equal(result.teamId, "team-1");
  assert.equal(result.seasonId, "season-1");
});
