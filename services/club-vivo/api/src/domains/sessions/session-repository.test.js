"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  TransactWriteItemsCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const { SessionRepository } = require("./session-repository");

function makeTenantContext() {
  return {
    tenantId: "tenant_authoritative",
    userId: "user-123",
  };
}

function withMockedSend(sendImpl, fn) {
  const originalSend = DynamoDBClient.prototype.send;
  DynamoDBClient.prototype.send = sendImpl;

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      DynamoDBClient.prototype.send = originalSend;
    });
}

function withMockedUuid(uuid, fn) {
  const originalRandomUuid = crypto.randomUUID;
  crypto.randomUUID = () => uuid;

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      crypto.randomUUID = originalRandomUuid;
    });
}

test("createSession persists equipment when provided and returns it in the response", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("session-123", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof TransactWriteItemsCommand, true);
      return {};
    }, async () => {
      const result = await repo.createSession(makeTenantContext(), {
        sport: "soccer",
        ageBand: "u14",
        durationMin: 45,
        objectiveTags: ["pressing"],
        equipment: ["cones", "balls"],
        activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
        clubId: "club-1",
      });

      assert.deepEqual(result.session.equipment, ["cones", "balls"]);
      assert.equal(result.session.sessionId, "session-123");
      assert.equal(result.session.clubId, "club-1");
    });
  });

  assert.equal(calls.length, 1);
  const write = calls[0].input.TransactItems[0].Put.Item;
  const writtenSession = unmarshall(write);
  assert.deepEqual(writtenSession.equipment, ["cones", "balls"]);
  assert.equal(Object.hasOwn(writtenSession, "clubId"), true);
});

test("getSessionById returns Week 13 detail metadata when present", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });
  const commands = [];

  await withMockedSend(async (command) => {
    commands.push(command);

    if (commands.length === 1) {
      assert.equal(command instanceof GetItemCommand, true);
      return {
        Item: marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "SESSIONLOOKUP#session-123",
          targetPK: "TENANT#tenant_authoritative",
          targetSK: "SESSION#2026-04-01T00:00:00.000Z#session-123",
        }),
      };
    }

    assert.equal(command instanceof GetItemCommand, true);
    return {
      Item: marshall({
        PK: "TENANT#tenant_authoritative",
        SK: "SESSION#2026-04-01T00:00:00.000Z#session-123",
        type: "SESSION",
        sessionId: "session-123",
        createdAt: "2026-04-01T00:00:00.000Z",
        createdBy: "user-123",
        schemaVersion: 1,
        sport: "soccer",
        ageBand: "u14",
        durationMin: 45,
        objectiveTags: ["pressing"],
        tags: ["defending", "transition"],
        sourceTemplateId: "template-123",
        equipment: ["cones", "balls"],
        activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
        teamId: "team-1",
      }),
    };
  }, async () => {
    const session = await repo.getSessionById(makeTenantContext(), "session-123");

    assert.deepEqual(session.equipment, ["cones", "balls"]);
    assert.deepEqual(session.tags, ["defending", "transition"]);
    assert.equal(session.sourceTemplateId, "template-123");
    assert.deepEqual(session.activities, [{ name: "Warm-up", minutes: 10, description: "Prep" }]);
    assert.equal(session.teamId, "team-1");
  });
});

test("listSessions summary remains unchanged and does not include detail-only Week 13 fields", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "SESSION#2026-04-01T00:00:00.000Z#session-123",
          sessionId: "session-123",
          createdAt: "2026-04-01T00:00:00.000Z",
          sport: "soccer",
          ageBand: "u14",
          durationMin: 45,
          objectiveTags: ["pressing"],
          tags: ["defending", "transition"],
          sourceTemplateId: "template-123",
          equipment: ["cones", "balls"],
          activities: [
            { name: "Warm-up", minutes: 10, description: "Prep" },
            { name: "Game", minutes: 20, description: "Play" },
          ],
        }),
      ],
    };
  }, async () => {
    const result = await repo.listSessions(makeTenantContext(), { limit: 10 });

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].sessionId, "session-123");
    assert.equal(result.items[0].activityCount, 2);
    assert.equal(Object.hasOwn(result.items[0], "equipment"), false);
    assert.equal(Object.hasOwn(result.items[0], "activities"), false);
    assert.equal(Object.hasOwn(result.items[0], "tags"), false);
    assert.equal(Object.hasOwn(result.items[0], "sourceTemplateId"), false);
  });
});

test("createSession persists Week 13 tags and sourceTemplateId", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("session-123", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof TransactWriteItemsCommand, true);
      return {};
    }, async () => {
      const result = await repo.createSession(makeTenantContext(), {
        sport: "soccer",
        ageBand: "u14",
        durationMin: 45,
        objectiveTags: ["pressing"],
        tags: ["defending", "transition"],
        sourceTemplateId: "template-123",
        equipment: ["cones", "balls"],
        activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
      });

      assert.deepEqual(result.session.tags, ["defending", "transition"]);
      assert.equal(result.session.sourceTemplateId, "template-123");
    });
  });

  assert.equal(calls.length, 1);
  const write = calls[0].input.TransactItems[0].Put.Item;
  const writtenSession = unmarshall(write);

  assert.deepEqual(writtenSession.tags, ["defending", "transition"]);
  assert.equal(writtenSession.sourceTemplateId, "template-123");
});

test("createSession can include session_generated in the same tenant-scoped transaction", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("session-123", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof TransactWriteItemsCommand, true);
      return {};
    }, async () => {
      const result = await repo.createSession(
        makeTenantContext(),
        {
          sport: "soccer",
          ageBand: "u14",
          durationMin: 45,
          objectiveTags: ["pressing"],
          sourceTemplateId: "template-123",
          activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
        },
        {
          sessionGeneratedEventMetadata: { templateId: "template-123" },
        }
      );

      assert.equal(result.session.sessionId, "session-123");
      assert.equal(result.session.sourceTemplateId, "template-123");
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.TransactItems.length, 3);

  const sessionWrite = unmarshall(calls[0].input.TransactItems[0].Put.Item);
  const lookupWrite = unmarshall(calls[0].input.TransactItems[1].Put.Item);
  const eventWrite = unmarshall(calls[0].input.TransactItems[2].Put.Item);

  assert.equal(sessionWrite.PK, "TENANT#tenant_authoritative");
  assert.equal(lookupWrite.SK, "SESSIONLOOKUP#session-123");
  assert.equal(eventWrite.type, "SESSION_EVENT");
  assert.equal(eventWrite.eventType, "session_generated");
  assert.equal(eventWrite.sessionId, "session-123");
  assert.deepEqual(eventWrite.metadata, { templateId: "template-123" });
});

test("createSessionFeedback persists one tenant-scoped feedback record per session", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("event-feedback", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof TransactWriteItemsCommand, true);
      return {};
    }, async () => {
      const result = await repo.createSessionFeedback(
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
          feedbackEventMetadata: {
            flowMode: "setup_to_drill",
            imageAnalysisAccuracy: "high",
          },
        }
      );

      assert.equal(result.feedback.sessionId, "session-123");
      assert.equal(result.feedback.sessionQuality, 4);
      assert.equal(result.feedback.drillUsefulness, 5);
      assert.equal(result.feedback.imageAnalysisAccuracy, "high");
      assert.equal(result.feedback.flowMode, "setup_to_drill");
      assert.equal(result.feedback.schemaVersion, 2);
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.TransactItems.length, 2);

  const feedbackWrite = unmarshall(calls[0].input.TransactItems[0].Put.Item);
  const feedbackSubmittedEvent = unmarshall(calls[0].input.TransactItems[1].Put.Item);

  assert.equal(feedbackWrite.PK, "TENANT#tenant_authoritative");
  assert.equal(feedbackWrite.SK, "SESSIONFEEDBACK#session-123");
  assert.equal(feedbackWrite.type, "SESSION_FEEDBACK");
  assert.equal(feedbackWrite.submittedBy, "user-123");
  assert.equal(feedbackWrite.sessionQuality, 4);
  assert.equal(feedbackWrite.drillUsefulness, 5);
  assert.equal(feedbackWrite.imageAnalysisAccuracy, "high");
  assert.equal(feedbackWrite.missingFeatures, "Wanted easier drill editing.");
  assert.equal(feedbackWrite.flowMode, "setup_to_drill");
  assert.equal(feedbackWrite.schemaVersion, 2);
  assert.equal(
    calls[0].input.TransactItems[0].Put.ConditionExpression,
    "attribute_not_exists(PK) AND attribute_not_exists(SK)"
  );
  assert.equal(feedbackSubmittedEvent.eventType, "feedback_submitted");
  assert.deepEqual(feedbackSubmittedEvent.metadata, {
    flowMode: "setup_to_drill",
    imageAnalysisAccuracy: "high",
  });
});

test("createSessionFeedback writes only feedback_submitted metadata for non-image flow", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("event-feedback-not-run", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof TransactWriteItemsCommand, true);
      return {};
    }, async () => {
      const result = await repo.createSessionFeedback(
        makeTenantContext(),
        "session-123",
        {
          sessionQuality: 5,
          drillUsefulness: 4,
          imageAnalysisAccuracy: "not_used",
          missingFeatures: "Wanted easier export controls.",
        },
        {
          feedbackEventMetadata: { imageAnalysisAccuracy: "not_used" },
        }
      );

      assert.equal(result.feedback.imageAnalysisAccuracy, "not_used");
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.TransactItems.length, 2);
  const feedbackSubmittedEvent = unmarshall(calls[0].input.TransactItems[1].Put.Item);
  assert.equal(feedbackSubmittedEvent.eventType, "feedback_submitted");
  assert.deepEqual(feedbackSubmittedEvent.metadata, { imageAnalysisAccuracy: "not_used" });
});

test("createSessionFeedback maps duplicate submission to 409 conflict", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });

  await assert.rejects(
    () =>
      withMockedSend(async (command) => {
        assert.equal(command instanceof TransactWriteItemsCommand, true);
        const err = new Error("transaction cancelled");
        err.name = "TransactionCanceledException";
        err.CancellationReasons = [{ Code: "ConditionalCheckFailed" }];
        throw err;
      }, async () =>
        repo.createSessionFeedback(makeTenantContext(), "session-123", {
          sessionQuality: 5,
          drillUsefulness: 4,
          imageAnalysisAccuracy: "medium",
          missingFeatures: "Wanted easier export controls.",
        })
      ),
    (err) => {
      assert.equal(err.code, "sessions.feedback_exists");
      assert.equal(err.statusCode, 409);
      assert.deepEqual(err.details, {
        entityType: "SESSION_FEEDBACK",
        sessionId: "session-123",
      });
      return true;
    }
  );
});

test("buildSessionEventItem creates a tenant-scoped session event key by construction", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });

  await withMockedUuid("event-123", async () => {
    const event = repo.buildSessionEventItem(makeTenantContext(), {
      sessionId: "session-123",
      eventType: "session_generated",
      occurredAt: "2026-04-10T12:00:00.000Z",
      metadata: {
        templateId: "template-123",
        source: "template_generate",
        ignored: undefined,
      },
    });

    assert.deepEqual(event, {
      PK: "TENANT#tenant_authoritative",
      SK: "SESSIONEVENT#session-123#2026-04-10T12:00:00.000Z#session_generated",
      type: "SESSION_EVENT",
      eventId: "event-123",
      sessionId: "session-123",
      eventType: "session_generated",
      occurredAt: "2026-04-10T12:00:00.000Z",
      actorUserId: "user-123",
      schemaVersion: 1,
      metadata: {
        templateId: "template-123",
        source: "template_generate",
      },
    });
  });
});

test("buildSessionEventItem rejects unsupported event types", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });

  assert.throws(
    () =>
      repo.buildSessionEventItem(makeTenantContext(), {
        sessionId: "session-123",
        eventType: "unexpected_event",
      }),
    (err) => {
      assert.equal(err.code, "invalid_session_event_type");
      assert.equal(err.statusCode, 400);
      assert.deepEqual(err.details, { eventType: "unexpected_event" });
      return true;
    }
  );
});

test("buildFeedbackEventTransactItems always includes a single feedback_submitted event", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });

  await withMockedUuid("event-feedback", async () => {
    const feedbackOnly = repo.buildFeedbackEventTransactItems(makeTenantContext(), {
      sessionId: "session-123",
      occurredAt: "2026-04-10T12:00:00.000Z",
      feedbackMetadata: { imageAnalysisAccuracy: "not_used" },
    });

    assert.equal(feedbackOnly.length, 1);
    const feedbackOnlyItem = unmarshall(feedbackOnly[0].Put.Item);
    assert.equal(feedbackOnlyItem.PK, "TENANT#tenant_authoritative");
    assert.equal(
      feedbackOnlyItem.SK,
      "SESSIONEVENT#session-123#2026-04-10T12:00:00.000Z#feedback_submitted"
    );
    assert.equal(feedbackOnlyItem.eventType, "feedback_submitted");
    assert.deepEqual(feedbackOnlyItem.metadata, { imageAnalysisAccuracy: "not_used" });
  });
});

test("writeSessionExportedEvent writes a standalone tenant-scoped put without broad scans", async () => {
  const repo = new SessionRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("event-exported", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof PutItemCommand, true);
      return {};
    }, async () => {
      const result = await repo.writeSessionExportedEvent(makeTenantContext(), {
        sessionId: "session-123",
        occurredAt: "2026-04-10T13:00:00.000Z",
        metadata: {
          exportFormat: "pdf",
        },
      });

      assert.equal(result.event.eventType, "session_exported");
      assert.equal(result.event.actorUserId, "user-123");
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0] instanceof PutItemCommand, true);
  const write = unmarshall(calls[0].input.Item);
  assert.equal(write.PK, "TENANT#tenant_authoritative");
  assert.equal(write.SK, "SESSIONEVENT#session-123#2026-04-10T13:00:00.000Z#session_exported");
  assert.equal(write.type, "SESSION_EVENT");
  assert.equal(write.eventId, "event-exported");
  assert.deepEqual(write.metadata, { exportFormat: "pdf" });
  assert.equal(calls[0].input.ConditionExpression, "attribute_not_exists(PK) AND attribute_not_exists(SK)");
});
