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
        {
          sessionQuality: 3,
          drillUsefulness: 3,
          imageAnalysisAccuracy: "not_used",
          missingFeatures: "Wanted easier edit flow.",
        },
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
      sessionQuality: 4,
      drillUsefulness: 5,
      imageAnalysisAccuracy: "high",
      missingFeatures: "Wanted easier drill editing.",
      flowMode: "setup_to_drill",
      schemaVersion: 2,
    },
  };

  const result = await submitSessionFeedback(
    makeTenantContext(),
    "session-123",
    {
      sessionQuality: 4,
      drillUsefulness: 5,
      imageAnalysisAccuracy: "high",
      missingFeatures: "Wanted easier drill editing.",
      flowMode: "setup_to_drill",
    },
    {
      sessionRepository: {
        getSessionById: async () => ({ sessionId: "session-123" }),
        createSessionFeedback: async (tenantCtx, sessionId, input, options) => {
          assert.equal(tenantCtx.tenantId, "tenant_authoritative");
          assert.equal(sessionId, "session-123");
          assert.deepEqual(input, {
            sessionQuality: 4,
            drillUsefulness: 5,
            imageAnalysisAccuracy: "high",
            missingFeatures: "Wanted easier drill editing.",
            flowMode: "setup_to_drill",
          });
          assert.deepEqual(options, {
            feedbackEventMetadata: {
              flowMode: "setup_to_drill",
              imageAnalysisAccuracy: "high",
            },
          });
          return expectedResult;
        },
      },
    }
  );

  assert.deepEqual(result, expectedResult);
});
