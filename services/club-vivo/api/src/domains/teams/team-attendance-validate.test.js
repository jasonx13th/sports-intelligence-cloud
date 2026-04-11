"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateCreateAttendance,
  validateListAttendanceQuery,
} = require("./team-attendance-validate");

test("validateCreateAttendance trims notes and omits blank notes", () => {
  assert.deepEqual(
    validateCreateAttendance({
      sessionId: " session-123 ",
      sessionDate: "2026-04-15",
      status: "completed",
      notes: "  Good intensity  ",
    }),
    {
      sessionId: "session-123",
      sessionDate: "2026-04-15",
      status: "completed",
      notes: "Good intensity",
    }
  );

  assert.deepEqual(
    validateCreateAttendance({
      sessionId: "session-123",
      sessionDate: "2026-04-15",
      status: "completed",
      notes: "   ",
    }),
    {
      sessionId: "session-123",
      sessionDate: "2026-04-15",
      status: "completed",
    }
  );
});

test("validateCreateAttendance rejects unknown fields including tenant spoof fields", () => {
  assert.throws(
    () =>
      validateCreateAttendance({
        sessionId: "session-123",
        sessionDate: "2026-04-15",
        status: "completed",
        tenantId: "tenant-123",
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["tenantId"] });
      return true;
    }
  );
});

test("validateCreateAttendance rejects invalid status", () => {
  assert.throws(
    () =>
      validateCreateAttendance({
        sessionId: "session-123",
        sessionDate: "2026-04-15",
        status: "done",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "status");
      return true;
    }
  );
});

test("validateListAttendanceQuery accepts supported attendance filters", () => {
  assert.deepEqual(validateListAttendanceQuery({}), {});
  assert.deepEqual(
    validateListAttendanceQuery({
      startDate: "2026-04-10",
      endDate: "2026-04-15",
      limit: "10",
      nextToken: "opaque-token",
    }),
    {
      startDate: "2026-04-10",
      endDate: "2026-04-15",
      limit: 10,
      nextToken: "opaque-token",
    }
  );
});

test("validateListAttendanceQuery rejects invalid date ranges and unknown query params", () => {
  assert.throws(
    () => validateListAttendanceQuery({ startDate: "2026-04-31" }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "startDate");
      return true;
    }
  );

  assert.throws(
    () =>
      validateListAttendanceQuery({
        startDate: "2026-04-16",
        endDate: "2026-04-15",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "startDate");
      return true;
    }
  );

  assert.throws(
    () => validateListAttendanceQuery({ cursor: "abc" }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["cursor"] });
      return true;
    }
  );
});
