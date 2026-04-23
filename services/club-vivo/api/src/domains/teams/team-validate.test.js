"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateCreateTeam, validateUpdateTeam } = require("./team-validate");

test("validateCreateTeam normalizes Team fields, optional durable context, and defaults status", () => {
  const result = validateCreateTeam({
    name: " U14 Blue ",
    sport: " soccer ",
    ageBand: " U14 ",
    level: " competitive ",
    notes: "  Strong group  ",
    programType: " Travel ",
    playerCount: 18,
  });

  assert.deepEqual(result, {
    name: "U14 Blue",
    sport: "soccer",
    ageBand: "U14",
    level: "competitive",
    notes: "Strong group",
    programType: "travel",
    playerCount: 18,
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

test("validateCreateTeam rejects invalid programType values", () => {
  assert.throws(
    () =>
      validateCreateTeam({
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        programType: "academy",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "programType");
      assert.deepEqual(err.details.allowed, ["travel", "ost"]);
      return true;
    }
  );
});

test("validateCreateTeam rejects playerCount values outside the safe Team range", () => {
  assert.throws(
    () =>
      validateCreateTeam({
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        playerCount: 0,
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "playerCount");
      assert.equal(err.details.min, 1);
      return true;
    }
  );

  assert.throws(
    () =>
      validateCreateTeam({
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        playerCount: 61,
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "playerCount");
      assert.equal(err.details.max, 60);
      return true;
    }
  );
});

test("validateUpdateTeam normalizes editable Team fields including optional durable context", () => {
  const result = validateUpdateTeam({
    name: " U12 Red ",
    sport: " soccer ",
    ageBand: " U12 ",
    level: " rec ",
    notes: "  Smaller sided focus  ",
    status: "archived",
    programType: " Ost ",
    playerCount: 12,
  });

  assert.deepEqual(result, {
    name: "U12 Red",
    sport: "soccer",
    ageBand: "U12",
    level: "rec",
    notes: "Smaller sided focus",
    status: "archived",
    programType: "ost",
    playerCount: 12,
  });
});

test("validateUpdateTeam rejects durationMin as an unknown field", () => {
  assert.throws(
    () =>
      validateUpdateTeam({
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        durationMin: 60,
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["durationMin"] });
      return true;
    }
  );
});
