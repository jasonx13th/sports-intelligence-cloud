"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createHandler,
  createTenantId,
  buildEntitlementsPut,
} = require("./handler");

test("createTenantId generates a stable tenant id in the required format", () => {
  const tenantId = createTenantId("user-sub-123");

  assert.match(tenantId, /^tenant_[a-z0-9-]{3,}$/);
  assert.equal(tenantId, "tenant_0dfb6bb7797a");
});

test("buildEntitlementsPut uses conditional write for idempotency", () => {
  const command = buildEntitlementsPut({
    tableName: "sic-tenant-entitlements-test",
    userSub: "user-sub-123",
    tenantId: "tenant_3c3792478769",
    role: "athlete",
    tier: "free",
  });

  assert.equal(command.input.TableName, "sic-tenant-entitlements-test");
  assert.equal(command.input.ConditionExpression, "attribute_not_exists(user_sub)");
  assert.deepEqual(command.input.Item, {
    user_sub: { S: "user-sub-123" },
    tenant_id: { S: "tenant_3c3792478769" },
    role: { S: "athlete" },
    tier: { S: "free" },
  });
});

test("handler generates tenant id when custom tenant attribute is missing", async () => {
  const sent = [];
  const handler = createHandler({
    cognitoClient: {
      send: async (command) => {
        sent.push(command);
        return {};
      },
    },
    dynamoClient: {
      send: async (command) => {
        sent.push(command);
        return {};
      },
    },
  });

  process.env.TENANT_ENTITLEMENTS_TABLE = "sic-tenant-entitlements-test";

  const event = {
    userPoolId: "pool-123",
    userName: "user-sub-123",
    request: {
      userAttributes: {},
    },
  };

  const result = await handler(event);

  assert.equal(result, event);
  assert.equal(sent.length, 2);
  assert.equal(sent[1].input.TableName, "sic-tenant-entitlements-test");
  assert.equal(sent[1].input.Item.user_sub.S, "user-sub-123");
  assert.equal(sent[1].input.Item.tenant_id.S, "tenant_0dfb6bb7797a");
  assert.equal(sent[1].input.ConditionExpression, "attribute_not_exists(user_sub)");
});

test("handler returns cleanly when entitlements row already exists", async () => {
  const handler = createHandler({
    cognitoClient: {
      send: async () => ({}),
    },
    dynamoClient: {
      send: async () => {
        const err = new Error("exists");
        err.name = "ConditionalCheckFailedException";
        throw err;
      },
    },
  });

  process.env.TENANT_ENTITLEMENTS_TABLE = "sic-tenant-entitlements-test";

  const event = {
    userPoolId: "pool-123",
    userName: "user-sub-123",
    request: {
      userAttributes: {},
    },
  };

  const result = await handler(event);

  assert.equal(result, event);
});
