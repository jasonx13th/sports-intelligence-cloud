"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateWeeklyPlanningQuery } = require("./team-weekly-planning-validate");

test("validateWeeklyPlanningQuery accepts an empty query object", () => {
  assert.deepEqual(validateWeeklyPlanningQuery({}), {});
  assert.deepEqual(validateWeeklyPlanningQuery(undefined), {});
});

test("validateWeeklyPlanningQuery rejects all forbidden and unknown query params", () => {
  for (const field of [
    "weekStart",
    "weekEnd",
    "startDate",
    "endDate",
    "limit",
    "nextToken",
    "cursor",
    "anythingElse",
  ]) {
    assert.throws(
      () => validateWeeklyPlanningQuery({ [field]: "value" }),
      (err) => {
        assert.equal(err.code, "unknown_fields");
        assert.deepEqual(err.details, { unknown: [field] });
        return true;
      }
    );
  }
});
