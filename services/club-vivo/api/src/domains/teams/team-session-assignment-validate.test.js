"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateAssignSession } = require("./team-session-assignment-validate");

test("validateAssignSession normalizes optional notes", () => {
  assert.deepEqual(validateAssignSession({ notes: "  Use next Tuesday  " }), {
    notes: "Use next Tuesday",
  });
});

test("validateAssignSession rejects unknown fields including tenantId", () => {
  assert.throws(
    () =>
      validateAssignSession({
        notes: "Use next Tuesday",
        tenantId: "spoofed",
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["tenantId"] });
      return true;
    }
  );
});

test("validateAssignSession rejects overlong notes", () => {
  assert.throws(
    () =>
      validateAssignSession({
        notes: "x".repeat(1001),
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "notes");
      return true;
    }
  );
});
