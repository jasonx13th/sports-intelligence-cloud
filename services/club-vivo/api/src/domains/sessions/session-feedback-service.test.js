"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { submitSessionFeedback } = require("./session-feedback-service");

function makeTenantContext() {
  return {
    tenantId: "tenant_authoritative",
    userId: "user-123",
  };
}

test("submitSessionFeedback returns 404 when the tenant-scoped session does not exist", async () => {
  const calls = [];

  await assert.rejects(
    () =>
      submitSessionFeedback(
        makeTenantContext(),
        "session-404",
        { rating: 3, runStatus: "not_run" },
        {
          sessionRepository: {
            getSessionById: async (tenantCtx, sessionId) => {
              calls.push({ tenantCtx, sessionId });
              return null;
            },
            createSessionFeedback: async () => {
              throw new Error("createSessionFeedback should not be called");
            },
          },
        }
      ),
    (err) => {
      assert.equal(err.code, "sessions.not_found");
      assert.equal(err.statusCode, 404);
      assert.deepEqual(err.details, { entityType: "SESSION" });
      return true;
    }
  );

  assert.deepEqual(calls, [
    {
      tenantCtx: makeTenantContext(),
      sessionId: "session-404",
    },
  ]);
});

test("submitSessionFeedback passes minimal event metadata into the repository write path", async () => {
  const expectedResult = {
    feedback: {
      sessionId: "session-123",
      submittedAt: "2026-04-10T00:00:00.000Z",
      submittedBy: "user-123",
      rating: 4,
      runStatus: "ran_with_changes",
      schemaVersion: 1,
    },
  };

  const result = await submitSessionFeedback(
    makeTenantContext(),
    "session-123",
    { rating: 4, runStatus: "ran_with_changes" },
    {
      sessionRepository: {
        getSessionById: async () => ({ sessionId: "session-123" }),
        createSessionFeedback: async (tenantCtx, sessionId, input, options) => {
          assert.equal(tenantCtx.tenantId, "tenant_authoritative");
          assert.equal(sessionId, "session-123");
          assert.deepEqual(input, { rating: 4, runStatus: "ran_with_changes" });
          assert.deepEqual(options, {
            feedbackEventMetadata: { runStatus: "ran_with_changes" },
            runConfirmedEventMetadata: { runStatus: "ran_with_changes" },
          });
          return expectedResult;
        },
      },
    }
  );

  assert.deepEqual(result, expectedResult);
});
