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

const { TemplateRepository } = require("./template-repository");

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

test("createTemplate persists tags and equipment and returns detail shape", async () => {
  const repo = new TemplateRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("template-123", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof TransactWriteItemsCommand, true);
      return {};
    }, async () => {
      const result = await repo.createTemplate(makeTenantContext(), {
        name: "Pressing Template",
        description: "Reusable high press session",
        sport: "soccer",
        ageBand: "u14",
        durationMin: 60,
        objectiveTags: ["pressing"],
        tags: ["defending", "mid-block"],
        equipment: ["cones", "balls"],
        activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
        sourceSessionId: "session-abc",
        lastGeneratedAt: "2026-04-02T00:00:00.000Z",
      });

      assert.equal(result.template.templateId, "template-123");
      assert.equal(result.template.name, "Pressing Template");
      assert.deepEqual(result.template.tags, ["defending", "mid-block"]);
      assert.deepEqual(result.template.equipment, ["cones", "balls"]);
      assert.deepEqual(result.template.activities, [
        { name: "Warm-up", minutes: 10, description: "Prep" },
      ]);
      assert.equal(result.template.sourceSessionId, "session-abc");
      assert.equal(result.template.usageCount, 0);
      assert.equal(result.template.lastGeneratedAt, undefined);
    });
  });

  assert.equal(calls.length, 1);
  const writtenTemplate = unmarshall(calls[0].input.TransactItems[0].Put.Item);
  const writtenLookup = unmarshall(calls[0].input.TransactItems[1].Put.Item);

  assert.equal(writtenTemplate.type, "TEMPLATE");
  assert.equal(writtenTemplate.templateId, "template-123");
  assert.deepEqual(writtenTemplate.tags, ["defending", "mid-block"]);
  assert.deepEqual(writtenTemplate.equipment, ["cones", "balls"]);
  assert.equal(Object.hasOwn(writtenTemplate, "lastGeneratedAt"), false);
  assert.equal(writtenLookup.SK, "TEMPLATELOOKUP#template-123");
});

test("listTemplates returns summary items without activities or equipment", async () => {
  const repo = new TemplateRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEMPLATE#2026-04-01T00:00:00.000Z#template-123",
          type: "TEMPLATE",
          templateId: "template-123",
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:00:00.000Z",
          createdBy: "user-123",
          name: "Pressing Template",
          description: "Reusable high press session",
          sport: "soccer",
          ageBand: "u14",
          durationMin: 60,
          objectiveTags: ["pressing"],
          tags: ["defending", "mid-block"],
          equipment: ["cones", "balls"],
          usageCount: 2,
          activities: [
            { name: "Warm-up", minutes: 10, description: "Prep" },
            { name: "Game", minutes: 20, description: "Play" },
          ],
        }),
      ],
    };
  }, async () => {
    const result = await repo.listTemplates(makeTenantContext(), { limit: 10 });

    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].templateId, "template-123");
    assert.equal(result.items[0].activityCount, 2);
    assert.deepEqual(result.items[0].tags, ["defending", "mid-block"]);
    assert.equal(result.items[0].usageCount, 2);
    assert.equal(Object.hasOwn(result.items[0], "equipment"), false);
    assert.equal(Object.hasOwn(result.items[0], "activities"), false);
  });
});

test("getTemplateById returns full detail including activities, equipment, and tags", async () => {
  const repo = new TemplateRepository({ tableName: "domain-table" });
  const commands = [];

  await withMockedSend(async (command) => {
    commands.push(command);

    if (commands.length === 1) {
      assert.equal(command instanceof GetItemCommand, true);
      return {
        Item: marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEMPLATELOOKUP#template-123",
          targetPK: "TENANT#tenant_authoritative",
          targetSK: "TEMPLATE#2026-04-01T00:00:00.000Z#template-123",
        }),
      };
    }

    assert.equal(command instanceof GetItemCommand, true);
    return {
      Item: marshall({
        PK: "TENANT#tenant_authoritative",
        SK: "TEMPLATE#2026-04-01T00:00:00.000Z#template-123",
        type: "TEMPLATE",
        templateId: "template-123",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
        createdBy: "user-123",
        schemaVersion: 1,
        name: "Pressing Template",
        description: "Reusable high press session",
        sport: "soccer",
        ageBand: "u14",
        durationMin: 60,
        objectiveTags: ["pressing"],
        tags: ["defending", "mid-block"],
        equipment: ["cones", "balls"],
        usageCount: 3,
        lastGeneratedAt: "2026-04-02T00:00:00.000Z",
        activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
        sourceSessionId: "session-abc",
      }),
    };
  }, async () => {
    const template = await repo.getTemplateById(makeTenantContext(), "template-123");

    assert.equal(template.templateId, "template-123");
    assert.deepEqual(template.tags, ["defending", "mid-block"]);
    assert.deepEqual(template.equipment, ["cones", "balls"]);
    assert.deepEqual(template.activities, [
      { name: "Warm-up", minutes: 10, description: "Prep" },
    ]);
    assert.equal(template.sourceSessionId, "session-abc");
    assert.equal(template.usageCount, 3);
    assert.equal(template.lastGeneratedAt, "2026-04-02T00:00:00.000Z");
  });
});

test("listTemplates fails closed when tenantContext is missing tenantId", async () => {
  const repo = new TemplateRepository({ tableName: "domain-table" });

  await assert.rejects(
    () => repo.listTemplates({}, { limit: 10 }),
    (err) => {
      assert.equal(err.code, "missing_tenant_context");
      assert.equal(err.statusCode, 500);
      assert.match(err.message, /Missing tenantId/i);
      return true;
    }
  );
});

test("getTemplateById rejects missing or invalid templateId", async () => {
  const repo = new TemplateRepository({ tableName: "domain-table" });

  await assert.rejects(
    () => repo.getTemplateById(makeTenantContext(), ""),
    (err) => {
      assert.equal(err.code, "invalid_request");
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /templateId/i);
      return true;
    }
  );
});

test("markTemplateGenerated increments usageCount and sets lastGeneratedAt", async () => {
  const repo = new TemplateRepository({ tableName: "domain-table" });
  const existingTemplate = {
    templateId: "template-123",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    createdBy: "user-123",
    schemaVersion: 1,
    name: "Pressing Template",
    description: "Reusable high press session",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    objectiveTags: ["pressing"],
    tags: ["defending", "mid-block"],
    equipment: ["cones", "balls"],
    activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
    usageCount: 2,
    sourceSessionId: "session-abc",
  };

  const originalGetTemplateById = repo.getTemplateById;
  repo.getTemplateById = async (tenantContext, templateId) => {
    assert.deepEqual(tenantContext, makeTenantContext());
    assert.equal(templateId, "template-123");
    return existingTemplate;
  };

  const calls = [];
  try {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof TransactWriteItemsCommand, true);
      return {};
    }, async () => {
      const result = await repo.markTemplateGenerated(makeTenantContext(), "template-123");

      assert.equal(result.templateId, "template-123");
      assert.equal(result.usageCount, 3);
      assert.ok(result.lastGeneratedAt);
      assert.equal(result.updatedAt, result.lastGeneratedAt);
      assert.equal(result.sourceSessionId, "session-abc");
    });
  } finally {
    repo.getTemplateById = originalGetTemplateById;
  }

  assert.equal(calls.length, 1);
  const writtenTemplate = unmarshall(calls[0].input.TransactItems[0].Put.Item);

  assert.equal(writtenTemplate.templateId, "template-123");
  assert.equal(writtenTemplate.usageCount, 3);
  assert.ok(writtenTemplate.lastGeneratedAt);
  assert.equal(writtenTemplate.updatedAt, writtenTemplate.lastGeneratedAt);
  assert.deepEqual(writtenTemplate.tags, ["defending", "mid-block"]);
  assert.deepEqual(writtenTemplate.equipment, ["cones", "balls"]);
  assert.equal(writtenTemplate.sourceSessionId, "session-abc");
});

test("markTemplateGenerated fails closed on missing tenantId", async () => {
  const repo = new TemplateRepository({ tableName: "domain-table" });

  await assert.rejects(
    () => repo.markTemplateGenerated({}, "template-123"),
    (err) => {
      assert.equal(err.code, "missing_tenant_context");
      assert.equal(err.statusCode, 500);
      return true;
    }
  );
});
