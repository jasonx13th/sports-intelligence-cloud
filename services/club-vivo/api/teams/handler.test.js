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
  pathParameters,
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
    pathParameters:
      pathParameters !== undefined
        ? pathParameters
        : rawPath !== "/teams"
          ? { teamId: rawPath.split("/").at(-1) }
          : undefined,
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

test("POST /teams creates a team for an admin with normalized Team v1 fields", async () => {
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
            name: input.name,
            sport: input.sport,
            ageBand: input.ageBand,
            level: input.level,
            notes: input.notes,
            status: input.status,
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
        name: " U14 Blue ",
        sport: " soccer ",
        ageBand: " U14 ",
        level: " competitive ",
        notes: "  Strong group  ",
      },
      headers: {},
      queryStringParameters: {},
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
      sport: "soccer",
      ageBand: "U14",
      level: "competitive",
      notes: "Strong group",
      status: "active",
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
        sport: "soccer",
        ageBand: "U14",
        level: "competitive",
        notes: "Strong group",
        status: "active",
      },
    },
  ]);
  assert.equal(loggerEvents[0].eventType, "team_created");
});

test("POST /teams returns 400 when tenant scope is supplied from body query or headers", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      createTeam: async () => {
        throw new Error("repo should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          method: "POST",
          body: {
            name: "U14 Blue",
            sport: "soccer",
            ageBand: "U14",
            tenantId: "tenant_from_body",
          },
          headers: { "x-tenant-id": "tenant_from_header" },
          queryStringParameters: { tenant_id: "tenant_from_query" },
        }),
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "platform.bad_request");
      assert.equal(err.httpStatus, 400);
      return true;
    }
  );
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
          body: { name: "U14 Blue", sport: "soccer", ageBand: "U14" },
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
              sport: "soccer",
              ageBand: "U14",
              status: "active",
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
      headers: {},
      queryStringParameters: {
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
        sport: "soccer",
        ageBand: "U14",
        status: "active",
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

test("GET /teams returns 400 when client tenant scope is supplied", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      listTeams: async () => {
        throw new Error("repo should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          method: "GET",
          headers: { "x-tenant-id": "tenant_from_header" },
          queryStringParameters: { limit: "10" },
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "platform.bad_request");
      assert.equal(err.httpStatus, 400);
      return true;
    }
  );
});

test("GET /teams returns 200 with an empty list", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      listTeams: async () => ({ items: [] }),
    }),
  });

  const response = await inner({
    event: makeEvent({
      method: "GET",
      headers: {},
      queryStringParameters: {},
    }),
    tenantCtx: makeTenantCtx({ role: "coach" }),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { items: [] });
});

test("GET /teams/{teamId} returns 200 with the tenant-scoped team detail", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async (actualTenantCtx, teamId) => {
        calls.push({ actualTenantCtx, teamId });
        return {
          team: {
            teamId,
            tenantId: actualTenantCtx.tenantId,
            name: "U14 Blue",
            sport: "soccer",
            ageBand: "U14",
            level: "competitive",
            notes: "Strong group",
            status: "active",
            createdAt: "2026-03-28T00:00:00.000Z",
            updatedAt: "2026-03-28T00:00:00.000Z",
            createdBy: actualTenantCtx.userId,
          },
        };
      },
    }),
  });

  const tenantCtx = makeTenantCtx({ role: "coach" });
  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123",
      method: "GET",
      routeKey: "GET /teams/{teamId}",
      headers: {},
      queryStringParameters: {},
    }),
    tenantCtx,
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    team: {
      teamId: "team-123",
      tenantId: "tenant_authoritative",
      name: "U14 Blue",
      sport: "soccer",
      ageBand: "U14",
      level: "competitive",
      notes: "Strong group",
      status: "active",
      createdAt: "2026-03-28T00:00:00.000Z",
      updatedAt: "2026-03-28T00:00:00.000Z",
      createdBy: "user-123",
    },
  });
  assert.deepEqual(calls, [{ actualTenantCtx: tenantCtx, teamId: "team-123" }]);
});

test("GET /teams/{teamId} returns 404 when the team is not found in tenant scope", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => null,
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-404",
          method: "GET",
          routeKey: "GET /teams/{teamId}",
          headers: {},
          queryStringParameters: {},
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "teams.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );
});

test("POST /teams/{teamId}/sessions/{sessionId}/assign returns 201 and persists the tenant-scoped assignment", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx({ role: "coach" });
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async (actualTenantCtx, teamId) => {
        calls.push({ step: "team", actualTenantCtx, teamId });
        return { team: { teamId } };
      },
      getSessionSummaryForAssignment: async (actualTenantCtx, sessionId) => {
        calls.push({ step: "session", actualTenantCtx, sessionId });
        return {
          sessionId,
          sessionCreatedAt: "2026-04-01T00:00:00.000Z",
          sport: "soccer",
          ageBand: "U14",
          durationMin: 45,
          objectiveTags: ["pressing"],
        };
      },
      assignSessionToTeam: async (actualTenantCtx, input) => {
        calls.push({ step: "assign", actualTenantCtx, input });
        return {
          created: true,
          assignment: {
            teamId: input.teamId,
            sessionId: input.sessionId,
            assignedAt: "2026-04-10T00:00:00.000Z",
            assignedBy: actualTenantCtx.userId,
            notes: input.notes,
            sessionCreatedAt: input.sessionSummary.sessionCreatedAt,
            sport: input.sessionSummary.sport,
            ageBand: input.sessionSummary.ageBand,
            durationMin: input.sessionSummary.durationMin,
            objectiveTags: input.sessionSummary.objectiveTags,
          },
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/sessions/session-123/assign",
      method: "POST",
      routeKey: "POST /teams/{teamId}/sessions/{sessionId}/assign",
      pathParameters: { teamId: "team-123", sessionId: "session-123" },
      headers: {},
      queryStringParameters: {},
      body: { notes: "  Use next Tuesday  " },
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), {
    assignment: {
      teamId: "team-123",
      sessionId: "session-123",
      assignedAt: "2026-04-10T00:00:00.000Z",
      assignedBy: "user-123",
      notes: "Use next Tuesday",
      sessionCreatedAt: "2026-04-01T00:00:00.000Z",
      sport: "soccer",
      ageBand: "U14",
      durationMin: 45,
      objectiveTags: ["pressing"],
    },
  });
  assert.deepEqual(calls, [
    { step: "team", actualTenantCtx: tenantCtx, teamId: "team-123" },
    { step: "session", actualTenantCtx: tenantCtx, sessionId: "session-123" },
    {
      step: "assign",
      actualTenantCtx: tenantCtx,
      input: {
        teamId: "team-123",
        sessionId: "session-123",
        notes: "Use next Tuesday",
        sessionSummary: {
          sessionId: "session-123",
          sessionCreatedAt: "2026-04-01T00:00:00.000Z",
          sport: "soccer",
          ageBand: "U14",
          durationMin: 45,
          objectiveTags: ["pressing"],
        },
      },
    },
  ]);
  assert.equal(loggerEvents[0].eventType, "team_session_assigned");
});

test("POST /teams/{teamId}/sessions/{sessionId}/assign returns 200 on idempotent replay", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      getSessionSummaryForAssignment: async () => ({
        sessionId: "session-123",
        sessionCreatedAt: "2026-04-01T00:00:00.000Z",
        sport: "soccer",
        ageBand: "U14",
        durationMin: 45,
        objectiveTags: ["pressing"],
      }),
      assignSessionToTeam: async () => ({
        created: false,
        assignment: {
          teamId: "team-123",
          sessionId: "session-123",
          assignedAt: "2026-04-10T00:00:00.000Z",
          assignedBy: "user-123",
          sessionCreatedAt: "2026-04-01T00:00:00.000Z",
          sport: "soccer",
          ageBand: "U14",
          durationMin: 45,
          objectiveTags: ["pressing"],
        },
      }),
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/sessions/session-123/assign",
      method: "POST",
      routeKey: "POST /teams/{teamId}/sessions/{sessionId}/assign",
      pathParameters: { teamId: "team-123", sessionId: "session-123" },
      headers: {},
      queryStringParameters: {},
      body: {},
    }),
    tenantCtx: makeTenantCtx({ role: "coach" }),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).assignment.sessionId, "session-123");
});

test("POST /teams/{teamId}/sessions/{sessionId}/assign returns 404 when the session is missing in tenant scope", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      getSessionSummaryForAssignment: async () => null,
      assignSessionToTeam: async () => {
        throw new Error("repo should not assign");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-123/sessions/session-404/assign",
          method: "POST",
          routeKey: "POST /teams/{teamId}/sessions/{sessionId}/assign",
          pathParameters: { teamId: "team-123", sessionId: "session-404" },
          headers: {},
          queryStringParameters: {},
          body: {},
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "sessions.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );
});

test("POST /teams/{teamId}/sessions/{sessionId}/assign returns 400 when client tenant scope is supplied", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => {
        throw new Error("repo should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-123/sessions/session-123/assign",
          method: "POST",
          routeKey: "POST /teams/{teamId}/sessions/{sessionId}/assign",
          pathParameters: { teamId: "team-123", sessionId: "session-123" },
          headers: {},
          queryStringParameters: {},
          body: { tenantId: "tenant_from_body" },
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "platform.bad_request");
      assert.equal(err.httpStatus, 400);
      return true;
    }
  );
});

test("GET /teams/{teamId}/sessions returns tenant-scoped assignments", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const tenantCtx = makeTenantCtx({ role: "coach" });
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async (actualTenantCtx, teamId) => {
        calls.push({ step: "team", actualTenantCtx, teamId });
        return { team: { teamId } };
      },
      listAssignedSessionsForTeam: async (actualTenantCtx, teamId) => {
        calls.push({ step: "list", actualTenantCtx, teamId });
        return {
          items: [
            {
              teamId,
              sessionId: "session-123",
              assignedAt: "2026-04-10T00:00:00.000Z",
              assignedBy: actualTenantCtx.userId,
              notes: "Use next Tuesday",
              sessionCreatedAt: "2026-04-01T00:00:00.000Z",
              sport: "soccer",
              ageBand: "U14",
              durationMin: 45,
              objectiveTags: ["pressing"],
            },
          ],
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/sessions",
      method: "GET",
      routeKey: "GET /teams/{teamId}/sessions",
      pathParameters: { teamId: "team-123" },
      headers: {},
      queryStringParameters: {},
    }),
    tenantCtx,
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    items: [
      {
        teamId: "team-123",
        sessionId: "session-123",
        assignedAt: "2026-04-10T00:00:00.000Z",
        assignedBy: "user-123",
        notes: "Use next Tuesday",
        sessionCreatedAt: "2026-04-01T00:00:00.000Z",
        sport: "soccer",
        ageBand: "U14",
        durationMin: 45,
        objectiveTags: ["pressing"],
      },
    ],
  });
  assert.deepEqual(calls, [
    { step: "team", actualTenantCtx: tenantCtx, teamId: "team-123" },
    { step: "list", actualTenantCtx: tenantCtx, teamId: "team-123" },
  ]);
});

test("GET /teams/{teamId}/sessions returns 404 when the team is missing in tenant scope", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => null,
      listAssignedSessionsForTeam: async () => {
        throw new Error("repo should not list");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-404/sessions",
          method: "GET",
          routeKey: "GET /teams/{teamId}/sessions",
          pathParameters: { teamId: "team-404" },
          headers: {},
          queryStringParameters: {},
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "teams.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );
});
