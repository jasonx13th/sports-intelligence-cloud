"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createBuildTenantContext } = require("./tenant-context");
const {
  UnauthorizedError,
  ForbiddenError,
} = require("./errors");

function makeEvent({
  requestId = "req-123",
  claims = { sub: "user-123", "cognito:groups": "cv-athlete" },
  headers,
  queryStringParameters,
  body,
} = {}) {
  return {
    requestContext: {
      requestId,
      authorizer: {
        jwt: {
          claims,
        },
      },
    },
    headers,
    queryStringParameters,
    body,
  };
}

function makeEntitlementsItem({
  tenantId = "tenant_club-vivo",
  role = "athlete",
  tier = "free",
} = {}) {
  return {
    tenant_id: { S: tenantId },
    role: { S: role },
    tier: { S: tier },
  };
}

test("buildTenantContext fails closed when claims.sub is missing", async () => {
  const buildTenantContext = createBuildTenantContext({
    getTableName: () => "sic-tenant-entitlements-test",
    fetchEntitlements: async () => {
      throw new Error("fetch should not be called when claims.sub is missing");
    },
  });

  await assert.rejects(
    () =>
      buildTenantContext(
        makeEvent({
          claims: { "cognito:groups": "cv-athlete" },
        })
      ),
    (err) => {
      assert.ok(err instanceof UnauthorizedError);
      assert.equal(err.code, "platform.unauthorized");
      assert.equal(err.httpStatus, 401);
      return true;
    }
  );
});

test("buildTenantContext fails closed when entitlements row is missing", async () => {
  const fetchCalls = [];
  const buildTenantContext = createBuildTenantContext({
    getTableName: () => "sic-tenant-entitlements-test",
    fetchEntitlements: async (args) => {
      fetchCalls.push(args);
      return null;
    },
  });

  await assert.rejects(
    () => buildTenantContext(makeEvent()),
    (err) => {
      assert.ok(err instanceof ForbiddenError);
      assert.equal(err.code, "platform.forbidden");
      assert.equal(err.httpStatus, 403);
      return true;
    }
  );

  assert.deepEqual(fetchCalls, [
    {
      tableName: "sic-tenant-entitlements-test",
      userSub: "user-123",
      event: makeEvent(),
    },
  ]);
});

test("buildTenantContext fails closed when entitlements are missing required fields", async (t) => {
  const cases = [
    {
      name: "tenant_id missing",
      item: makeEntitlementsItem({ tenantId: "" }),
      expectedCode: "platform.entitlements.missing_tenant_id",
    },
    {
      name: "role missing",
      item: makeEntitlementsItem({ role: "" }),
      expectedCode: "platform.entitlements.missing_role",
    },
    {
      name: "tier missing",
      item: makeEntitlementsItem({ tier: "" }),
      expectedCode: "platform.entitlements.missing_tier",
    },
    {
      name: "tenant_id invalid",
      item: makeEntitlementsItem({ tenantId: "spoofed-tenant" }),
      expectedCode: "platform.entitlements.invalid_tenant_id",
    },
  ];

  for (const { name, item, expectedCode } of cases) {
    await t.test(name, async () => {
      const buildTenantContext = createBuildTenantContext({
        getTableName: () => "sic-tenant-entitlements-test",
        fetchEntitlements: async () => item,
      });

      await assert.rejects(
        () =>
          buildTenantContext(
            makeEvent({
              headers: { "x-tenant-id": "tenant_from_header" },
              queryStringParameters: { tenant_id: "tenant_from_query" },
              body: JSON.stringify({ tenant_id: "tenant_from_body" }),
            })
          ),
        (err) => {
          assert.ok(err instanceof ForbiddenError);
          assert.equal(err.code, expectedCode);
          assert.equal(err.httpStatus, 403);
          return true;
        }
      );
    });
  }
});

test("buildTenantContext succeeds from entitlements and ignores client-supplied tenant_id values", async () => {
  const buildTenantContext = createBuildTenantContext({
    getTableName: () => "sic-tenant-entitlements-test",
    fetchEntitlements: async () =>
      makeEntitlementsItem({
        tenantId: "tenant_authoritative",
        role: "coach",
        tier: "pro",
      }),
  });

  const event = makeEvent({
    claims: {
      sub: "user-123",
      "cognito:groups": ["cv-athlete", "cv-coach"],
      tenant_id: "tenant_from_claim",
      "custom:tenant_id": "tenant_from_custom_claim",
    },
    headers: { "x-tenant-id": "tenant_from_header" },
    queryStringParameters: { tenant_id: "tenant_from_query" },
    body: JSON.stringify({ tenant_id: "tenant_from_body" }),
  });

  const tenantContext = await buildTenantContext(event);

  assert.deepEqual(tenantContext, {
    requestId: "req-123",
    apigwRequestId: "req-123",
    userId: "user-123",
    tenantId: "tenant_authoritative",
    role: "coach",
    tier: "pro",
    groups: ["cv-athlete", "cv-coach"],
    claims: event.requestContext.authorizer.jwt.claims,
  });
});
