"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createTeamsInner } = require("./handler");

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
  rawPath = "/teams",
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

test("POST /teams creates a team for an admin and ignores spoofed tenant input", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx();
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      createTeam: async (actualTenantCtx, input) => {
        calls.push({ actualTenantCtx, input });
        return {
          team: {
            teamId: "team-123",
            tenantId: actualTenantCtx.tenantId,
            name: input.name.trim(),
            createdAt: "2026-03-28T00:00:00.000Z",
            updatedAt: "2026-03-28T00:00:00.000Z",
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
        name: "U14 Blue",
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
    team: {
      teamId: "team-123",
      tenantId: "tenant_authoritative",
      name: "U14 Blue",
      createdAt: "2026-03-28T00:00:00.000Z",
      updatedAt: "2026-03-28T00:00:00.000Z",
      createdBy: "user-123",
    },
  });
  assert.deepEqual(calls, [
    {
      actualTenantCtx: tenantCtx,
      input: {
        name: "U14 Blue",
        tenantId: "tenant_from_body",
        tenant_id: "tenant_from_body_snake",
      },
    },
  ]);
  assert.equal(loggerEvents[0].eventType, "team_created");
});

test("POST /teams returns 403 for non-admin users and does not call the repo", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  let repoCalled = false;
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      createTeam: async () => {
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
          body: { name: "U14 Blue" },
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "teams.admin_required");
      assert.equal(err.httpStatus, 403);
      assert.equal(repoCalled, false);
      return true;
    }
  );
});

test("GET /teams returns 200 with items and uses tenantCtx only", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const tenantCtx = makeTenantCtx({ role: "coach" });
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      listTeams: async (actualTenantCtx, opts) => {
        calls.push({ actualTenantCtx, opts });
        return {
          items: [
            {
              teamId: "team-123",
              tenantId: actualTenantCtx.tenantId,
              name: "U14 Blue",
              createdAt: "2026-03-28T00:00:00.000Z",
              updatedAt: "2026-03-28T00:00:00.000Z",
              createdBy: actualTenantCtx.userId,
            },
          ],
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      method: "GET",
      headers: { "x-tenant-id": "tenant_from_header" },
      queryStringParameters: {
        tenant_id: "tenant_from_query",
        limit: "10",
      },
    }),
    tenantCtx,
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    items: [
      {
        teamId: "team-123",
        tenantId: "tenant_authoritative",
        name: "U14 Blue",
        createdAt: "2026-03-28T00:00:00.000Z",
        updatedAt: "2026-03-28T00:00:00.000Z",
        createdBy: "user-123",
      },
    ],
  });
  assert.deepEqual(calls, [
    {
      actualTenantCtx: tenantCtx,
      opts: {
        limit: "10",
        nextToken: undefined,
      },
    },
  ]);
});

test("GET /teams returns 200 with an empty list", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      listTeams: async () => ({ items: [] }),
    }),
  });

  const response = await inner({
    event: makeEvent({ method: "GET" }),
    tenantCtx: makeTenantCtx({ role: "coach" }),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { items: [] });
});
