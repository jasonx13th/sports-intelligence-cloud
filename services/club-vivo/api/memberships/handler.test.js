"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createMembershipsInner } = require("./handler");

function makeLogger(events) {
  return {
    info: (eventType, message, extra = {}) =>
      events.push({ level: "INFO", eventType, message, ...extra }),
    warn: (eventType, message, extra = {}) =>
      events.push({ level: "WARN", eventType, message, ...extra }),
    error: (eventType, message, err, extra = {}) =>
      events.push({
        level: "ERROR",
        eventType,
        message,
        error: { name: err?.name, message: err?.message },
        ...extra,
      }),
  };
}

function makeEvent({
  rawPath = "/memberships",
  method = "GET",
  body,
  headers = { "x-tenant-id": "tenant_from_header" },
  queryStringParameters = { tenant_id: "tenant_from_query" },
  routeKey,
} = {}) {
  return {
    rawPath,
    path: rawPath,
    routeKey: routeKey ?? `${method} ${rawPath}`,
    requestContext: {
      http: {
        method,
        path: rawPath,
      },
    },
    headers,
    queryStringParameters,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

function makeTenantCtx({
  tenantId = "tenant_authoritative",
  userId = "user-123",
  role = "admin",
  tier = "free",
} = {}) {
  return { tenantId, userId, role, tier };
}

test("POST /memberships creates or upserts for admin and ignores spoofed tenant input", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx();

  const inner = createMembershipsInner({
    getMembershipRepoFn: () => ({
      putMembership: async (actualTenantCtx, input) => {
        calls.push({ actualTenantCtx, input });
        return {
          membership: {
            tenantId: actualTenantCtx.tenantId,
            userSub: input.userSub,
            role: input.role,
            createdAt: "2026-03-28T00:00:00.000Z",
            updatedAt: "2026-03-28T00:00:00.000Z",
          },
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      method: "POST",
      body: {
        userSub: "user-sub-123",
        role: "coach",
        tenantId: "tenant_from_body",
        tenant_id: "tenant_from_body_snake",
      },
      headers: { "x-tenant-id": "tenant_from_header" },
      queryStringParameters: { tenantId: "tenant_from_query" },
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), {
    membership: {
      tenantId: "tenant_authoritative",
      userSub: "user-sub-123",
      role: "coach",
      createdAt: "2026-03-28T00:00:00.000Z",
      updatedAt: "2026-03-28T00:00:00.000Z",
    },
  });

  // ✅ IMPORTANT: handler must NOT pass spoofable tenant fields through to the repo
  assert.deepEqual(calls, [
    {
      actualTenantCtx: tenantCtx,
      input: {
        userSub: "user-sub-123",
        role: "coach",
      },
    },
  ]);

  assert.equal(loggerEvents[0].eventType, "membership_upserted");
});

test("POST /memberships returns 403 for non-admin and repo not called", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  let repoCalled = false;
  const inner = createMembershipsInner({
    getMembershipRepoFn: () => ({
      putMembership: async () => {
        repoCalled = true;
        throw new Error("repo should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          method: "POST",
          body: { userSub: "user-sub-123", role: "coach" },
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "memberships.admin_required");
      assert.equal(err.httpStatus, 403);
      assert.equal(repoCalled, false);
      return true;
    }
  );
});

test("GET /memberships returns 200 empty list", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createMembershipsInner({
    getMembershipRepoFn: () => ({
      listMemberships: async () => ({ items: [] }),
    }),
  });

  const response = await inner({
    event: makeEvent({ method: "GET" }),
    tenantCtx: makeTenantCtx(),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { items: [] });
});

test("GET /memberships returns 403 for non-admin and repo not called", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  let repoCalled = false;
  const inner = createMembershipsInner({
    getMembershipRepoFn: () => ({
      listMemberships: async () => {
        repoCalled = true;
        throw new Error("repo should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({ method: "GET" }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "memberships.admin_required");
      assert.equal(err.httpStatus, 403);
      assert.equal(repoCalled, false);
      return true;
    }
  );
});

test("GET /memberships uses tenantCtx only and ignores spoofed tenant input from query and x-tenant-id", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const tenantCtx = makeTenantCtx();

  const inner = createMembershipsInner({
    getMembershipRepoFn: () => ({
      listMemberships: async (actualTenantCtx, opts) => {
        calls.push({ actualTenantCtx, opts });
        return {
          items: [
            {
              tenantId: actualTenantCtx.tenantId,
              userSub: "user-sub-123",
              role: "coach",
              createdAt: "2026-03-28T00:00:00.000Z",
              updatedAt: "2026-03-28T00:00:00.000Z",
            },
          ],
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      method: "GET",
      headers: { "x-tenant-id": "tenant_spoofed_header" },
      queryStringParameters: {
        tenant_id: "tenant_spoofed_query",
        tenantId: "tenant_spoofed_query_camel",
        limit: "10",
        nextToken: "opaque-token",
      },
    }),
    tenantCtx,
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    items: [
      {
        tenantId: "tenant_authoritative",
        userSub: "user-sub-123",
        role: "coach",
        createdAt: "2026-03-28T00:00:00.000Z",
        updatedAt: "2026-03-28T00:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(calls, [
    {
      actualTenantCtx: tenantCtx,
      opts: {
        limit: "10",
        nextToken: "opaque-token",
      },
    },
  ]);
});
