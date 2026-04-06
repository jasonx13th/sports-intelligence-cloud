"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { ConflictError } = require("../src/platform/errors/errors");
const { createClubsInner } = require("./handler");

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
  rawPath = "/clubs",
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
  return {
    tenantId,
    userId,
    role,
    tier,
  };
}

test("POST /clubs creates a club for an admin and ignores spoofed tenant input", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx();

  const inner = createClubsInner({
    getClubRepoFn: () => ({
      createClub: async (actualTenantCtx, input) => {
        calls.push({ actualTenantCtx, input });
        return {
          club: {
            clubId: actualTenantCtx.tenantId,
            tenantId: actualTenantCtx.tenantId,
            name: input.name.trim(),
            createdAt: "2026-03-27T00:00:00.000Z",
            updatedAt: "2026-03-27T00:00:00.000Z",
            createdBy: actualTenantCtx.userId,
          },
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      method: "POST",
      body: {
        name: "Club Vivo",
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
    club: {
      clubId: "tenant_authoritative",
      tenantId: "tenant_authoritative",
      name: "Club Vivo",
      createdAt: "2026-03-27T00:00:00.000Z",
      updatedAt: "2026-03-27T00:00:00.000Z",
      createdBy: "user-123",
    },
  });
  assert.deepEqual(calls, [
    {
      actualTenantCtx: tenantCtx,
      input: {
        name: "Club Vivo",
        tenantId: "tenant_from_body",
        tenant_id: "tenant_from_body_snake",
      },
    },
  ]);
  assert.equal(loggerEvents[0].eventType, "club_created");
});

test("POST /clubs returns 409 when the club already exists", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createClubsInner({
    getClubRepoFn: () => ({
      createClub: async () => {
        throw new ConflictError({
          code: "clubs.already_exists",
          message: "Conflict",
          details: { entityType: "CLUB" },
        });
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          method: "POST",
          body: { name: "Club Vivo" },
        }),
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "clubs.already_exists");
      assert.equal(err.httpStatus, 409);
      return true;
    }
  );
});

test("POST /clubs returns 403 for non-admin users", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createClubsInner({
    getClubRepoFn: () => ({
      createClub: async () => {
        throw new Error("repo should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          method: "POST",
          body: { name: "Club Vivo" },
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "clubs.admin_required");
      assert.equal(err.httpStatus, 403);
      return true;
    }
  );
});

test("GET /clubs returns 200 for the tenant-scoped club", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const inner = createClubsInner({
    getClubRepoFn: () => ({
      getClub: async (tenantCtx) => {
        calls.push(tenantCtx);
        return {
          club: {
            clubId: tenantCtx.tenantId,
            tenantId: tenantCtx.tenantId,
            name: "Club Vivo",
            createdAt: "2026-03-27T00:00:00.000Z",
            updatedAt: "2026-03-27T00:00:00.000Z",
            createdBy: tenantCtx.userId,
          },
        };
      },
    }),
  });

  const tenantCtx = makeTenantCtx({ role: "coach" });
  const response = await inner({
    event: makeEvent({
      method: "GET",
      headers: { "x-tenant-id": "tenant_from_header" },
    }),
    tenantCtx,
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    club: {
      clubId: "tenant_authoritative",
      tenantId: "tenant_authoritative",
      name: "Club Vivo",
      createdAt: "2026-03-27T00:00:00.000Z",
      updatedAt: "2026-03-27T00:00:00.000Z",
      createdBy: "user-123",
    },
  });
  assert.deepEqual(calls, [tenantCtx]);
});

test("GET /clubs returns 404 when the tenant club is missing", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createClubsInner({
    getClubRepoFn: () => ({
      getClub: async () => null,
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
      assert.equal(err.code, "clubs.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );
});

test("GET /clubs uses tenantCtx.tenantId only for cross-tenant denial behavior", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const tenantCtx = makeTenantCtx({
    tenantId: "tenant_authoritative",
    role: "coach",
  });

  const inner = createClubsInner({
    getClubRepoFn: () => ({
      getClub: async (actualTenantCtx) => {
        calls.push({ actualTenantCtx });
        return {
          club: {
            clubId: actualTenantCtx.tenantId,
            tenantId: actualTenantCtx.tenantId,
            name: "Club Vivo",
            createdAt: "2026-03-27T00:00:00.000Z",
            updatedAt: "2026-03-27T00:00:00.000Z",
            createdBy: actualTenantCtx.userId,
          },
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
      },
    }),
    tenantCtx,
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      actualTenantCtx: tenantCtx,
    },
  ]);
  assert.equal(JSON.parse(response.body).club.tenantId, "tenant_authoritative");
});
