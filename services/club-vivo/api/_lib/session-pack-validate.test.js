"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateCreateSessionPack } = require("./session-pack-validate");

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
