"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateCreateTeam } = require("./team-validate");

test("validateCreateTeam normalizes Team v1 fields and defaults status", () => {
  const result = validateCreateTeam({
    name: " U14 Blue ",
    sport: " soccer ",
    ageBand: " U14 ",
    level: " competitive ",
    notes: "  Strong group  ",
  });

  assert.deepEqual(result, {
    name: "U14 Blue",
    sport: "soccer",
    ageBand: "U14",
    level: "competitive",
    notes: "Strong group",
    status: "active",
  });
});

test("validateCreateTeam rejects unknown fields including tenantId", () => {
  assert.throws(
    () =>
      validateCreateTeam({
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        tenantId: "spoofed",
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["tenantId"] });
      return true;
    }
  );
});

test("validateCreateTeam rejects durationMin as an unknown field", () => {
  assert.throws(
    () =>
      validateCreateTeam({
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        durationMin: 45,
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["durationMin"] });
      return true;
    }
  );
});

test("validateCreateTeam rejects invalid status values", () => {
  assert.throws(
    () =>
      validateCreateTeam({
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        status: "draft",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "status");
      return true;
    }
  );
});
