"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const {
  DynamoDBClient,
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
