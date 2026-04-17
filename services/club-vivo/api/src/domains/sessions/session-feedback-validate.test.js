"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateSessionFeedback } = require("./session-feedback-validate");

test("validateSessionFeedback accepts valid input and trims missingFeatures", () => {
  const result = validateSessionFeedback({
    sessionQuality: 4,
    drillUsefulness: 5,
    imageAnalysisAccuracy: "medium",
    missingFeatures: "  Wanted easier drill editing.  ",
    flowMode: "setup_to_drill",
  });

  assert.deepEqual(result, {
    sessionQuality: 4,
    drillUsefulness: 5,
    imageAnalysisAccuracy: "medium",
    missingFeatures: "Wanted easier drill editing.",
    flowMode: "setup_to_drill",
  });
});

test("validateSessionFeedback rejects unknown fields", () => {
  assert.throws(
    () =>
      validateSessionFeedback({
        sessionQuality: 5,
        drillUsefulness: 4,
        imageAnalysisAccuracy: "high",
        missingFeatures: "Wanted more export options.",
        tenantId: "spoofed",
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["tenantId"] });
      return true;
    }
  );
});

test("validateSessionFeedback rejects invalid sessionQuality", () => {
  assert.throws(
    () =>
      validateSessionFeedback({
        sessionQuality: 6,
        drillUsefulness: 4,
        imageAnalysisAccuracy: "high",
        missingFeatures: "Wanted more export options.",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "sessionQuality");
      return true;
    }
  );
});

test("validateSessionFeedback rejects invalid imageAnalysisAccuracy", () => {
  assert.throws(
    () =>
      validateSessionFeedback({
        sessionQuality: 3,
        drillUsefulness: 4,
        imageAnalysisAccuracy: "wrong",
        missingFeatures: "Wanted more export options.",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "imageAnalysisAccuracy");
      return true;
    }
  );
});

test("validateSessionFeedback rejects empty missingFeatures after trim", () => {
  assert.throws(
    () =>
      validateSessionFeedback({
        sessionQuality: 3,
        drillUsefulness: 4,
        imageAnalysisAccuracy: "not_used",
        missingFeatures: "   ",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "missingFeatures");
      return true;
    }
  );
});
