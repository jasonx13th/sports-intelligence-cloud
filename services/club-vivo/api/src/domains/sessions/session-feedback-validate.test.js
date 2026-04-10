"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateSessionFeedback } = require("./session-feedback-validate");

test("validateSessionFeedback accepts valid input and trims note fields", () => {
  const result = validateSessionFeedback({
    rating: 4,
    runStatus: "ran_with_changes",
    objectiveMet: true,
    difficulty: "about_right",
    wouldReuse: true,
    notes: "  Useful session with good flow.  ",
    changesNextTime: "  Add one more finishing block. ",
  });

  assert.deepEqual(result, {
    rating: 4,
    runStatus: "ran_with_changes",
    objectiveMet: true,
    difficulty: "about_right",
    wouldReuse: true,
    notes: "Useful session with good flow.",
    changesNextTime: "Add one more finishing block.",
  });
});

test("validateSessionFeedback rejects unknown fields", () => {
  assert.throws(
    () =>
      validateSessionFeedback({
        rating: 5,
        runStatus: "ran_as_planned",
        tenantId: "spoofed",
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["tenantId"] });
      return true;
    }
  );
});

test("validateSessionFeedback rejects invalid rating", () => {
  assert.throws(
    () =>
      validateSessionFeedback({
        rating: 6,
        runStatus: "ran_as_planned",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "rating");
      return true;
    }
  );
});

test("validateSessionFeedback rejects inconsistent not_run fields", () => {
  assert.throws(
    () =>
      validateSessionFeedback({
        rating: 3,
        runStatus: "not_run",
        objectiveMet: false,
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "inconsistent_feedback_fields");
      assert.deepEqual(err.details.inconsistent, ["objectiveMet"]);
      return true;
    }
  );
});
