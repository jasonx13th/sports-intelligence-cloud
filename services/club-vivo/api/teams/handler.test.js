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

test("POST /teams allows a coach to create a team with normalized optional Team context", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx({ role: "coach" });
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
            programType: input.programType,
            playerCount: input.playerCount,
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
        programType: " Travel ",
        playerCount: 18,
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
      programType: "travel",
      playerCount: 18,
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
        programType: "travel",
        playerCount: 18,
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
              programType: "travel",
              playerCount: 18,
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
        programType: "travel",
        playerCount: 18,
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
            programType: "ost",
            playerCount: 12,
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
      programType: "ost",
      playerCount: 12,
      status: "active",
      createdAt: "2026-03-28T00:00:00.000Z",
      updatedAt: "2026-03-28T00:00:00.000Z",
      createdBy: "user-123",
    },
  });
  assert.deepEqual(calls, [{ actualTenantCtx: tenantCtx, teamId: "team-123" }]);
});

test("GET /teams/{teamId} returns 404 when a coach requests a team they do not own", async () => {
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

test("PUT /teams/{teamId} lets an owning coach update editable Team fields", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx({ role: "coach" });
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      updateTeam: async (actualTenantCtx, teamId, input) => {
        calls.push({ actualTenantCtx, teamId, input });
        return {
          team: {
            teamId,
            tenantId: actualTenantCtx.tenantId,
            name: input.name,
            sport: input.sport,
            ageBand: input.ageBand,
            level: input.level,
            notes: input.notes,
            status: input.status,
            programType: input.programType,
            playerCount: input.playerCount,
            createdAt: "2026-03-28T00:00:00.000Z",
            updatedAt: "2026-04-23T00:00:00.000Z",
            createdBy: actualTenantCtx.userId,
          },
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123",
      method: "PUT",
      routeKey: "PUT /teams/{teamId}",
      pathParameters: { teamId: "team-123" },
      headers: {},
      queryStringParameters: {},
      body: {
        name: " U14 Blue East ",
        sport: " soccer ",
        ageBand: " U14 ",
        level: " competitive ",
        notes: "  Strong group  ",
        status: "archived",
        programType: " Travel ",
        playerCount: 18,
      },
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    team: {
      teamId: "team-123",
      tenantId: "tenant_authoritative",
      name: "U14 Blue East",
      sport: "soccer",
      ageBand: "U14",
      level: "competitive",
      notes: "Strong group",
      status: "archived",
      programType: "travel",
      playerCount: 18,
      createdAt: "2026-03-28T00:00:00.000Z",
      updatedAt: "2026-04-23T00:00:00.000Z",
      createdBy: "user-123",
    },
  });
  assert.deepEqual(calls, [
    {
      actualTenantCtx: tenantCtx,
      teamId: "team-123",
      input: {
        name: "U14 Blue East",
        sport: "soccer",
        ageBand: "U14",
        level: "competitive",
        notes: "Strong group",
        status: "archived",
        programType: "travel",
        playerCount: 18,
      },
    },
  ]);
  assert.equal(loggerEvents[0].eventType, "team_updated");
});

test("PUT /teams/{teamId} returns 400 when tenant scope is supplied from body query or headers", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      updateTeam: async () => {
        throw new Error("repo should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-123",
          method: "PUT",
          routeKey: "PUT /teams/{teamId}",
          pathParameters: { teamId: "team-123" },
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

test("PUT /teams/{teamId} returns 404 when a coach tries to update a team they do not own", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      updateTeam: async () => {
        const err = new Error("missing");
        err.code = "teams.not_found";
        err.statusCode = 404;
        err.details = {
          entityType: "TEAM",
          teamId: "team-404",
        };
        throw err;
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-404",
          method: "PUT",
          routeKey: "PUT /teams/{teamId}",
          pathParameters: { teamId: "team-404" },
          headers: {},
          queryStringParameters: {},
          body: {
            name: "U14 Blue",
            sport: "soccer",
            ageBand: "U14",
          },
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

test("POST /teams/{teamId}/attendance returns 201 with the recorded attendance", async () => {
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
        return { sessionId };
      },
      createAttendanceForTeam: async (actualTenantCtx, input) => {
        calls.push({ step: "create", actualTenantCtx, input });
        return {
          created: true,
          attendance: {
            teamId: input.teamId,
            sessionId: input.sessionId,
            sessionDate: input.sessionDate,
            status: input.status,
            notes: input.notes,
            recordedAt: "2026-04-15T23:00:00.000Z",
            recordedBy: actualTenantCtx.userId,
          },
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/attendance",
      method: "POST",
      routeKey: "POST /teams/{teamId}/attendance",
      pathParameters: { teamId: "team-123" },
      headers: {},
      queryStringParameters: {},
      body: {
        sessionId: " session-123 ",
        sessionDate: "2026-04-15",
        status: "completed",
        notes: "  Good intensity, full group  ",
      },
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), {
    attendance: {
      teamId: "team-123",
      sessionId: "session-123",
      sessionDate: "2026-04-15",
      status: "completed",
      notes: "Good intensity, full group",
      recordedAt: "2026-04-15T23:00:00.000Z",
      recordedBy: "user-123",
    },
  });
  assert.deepEqual(calls, [
    { step: "team", actualTenantCtx: tenantCtx, teamId: "team-123" },
    { step: "session", actualTenantCtx: tenantCtx, sessionId: "session-123" },
    {
      step: "create",
      actualTenantCtx: tenantCtx,
      input: {
        teamId: "team-123",
        sessionId: "session-123",
        sessionDate: "2026-04-15",
        status: "completed",
        notes: "Good intensity, full group",
      },
    },
  ]);
  assert.equal(loggerEvents[0].eventType, "team_attendance_recorded");
});

test("POST /teams/{teamId}/attendance returns 200 on exact replay", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      getSessionSummaryForAssignment: async () => ({ sessionId: "session-123" }),
      createAttendanceForTeam: async () => ({
        created: false,
        attendance: {
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-15",
          status: "completed",
          recordedAt: "2026-04-15T23:00:00.000Z",
          recordedBy: "user-123",
        },
      }),
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/attendance",
      method: "POST",
      routeKey: "POST /teams/{teamId}/attendance",
      pathParameters: { teamId: "team-123" },
      headers: {},
      queryStringParameters: {},
      body: {
        sessionId: "session-123",
        sessionDate: "2026-04-15",
        status: "completed",
      },
    }),
    tenantCtx: makeTenantCtx({ role: "coach" }),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).attendance.sessionId, "session-123");
});

test("POST /teams/{teamId}/attendance returns 409 on conflicting replay", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      getSessionSummaryForAssignment: async () => ({ sessionId: "session-123" }),
      createAttendanceForTeam: async () => {
        const err = new Error("conflict");
        err.code = "teams.attendance_exists";
        err.statusCode = 409;
        err.details = {
          entityType: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-15",
        };
        throw err;
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-123/attendance",
          method: "POST",
          routeKey: "POST /teams/{teamId}/attendance",
          pathParameters: { teamId: "team-123" },
          headers: {},
          queryStringParameters: {},
          body: {
            sessionId: "session-123",
            sessionDate: "2026-04-15",
            status: "completed",
          },
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "teams.attendance_exists");
      assert.equal(err.httpStatus, 409);
      return true;
    }
  );
});

test("POST /teams/{teamId}/attendance returns 404 when the team is missing in tenant scope", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => null,
      getSessionSummaryForAssignment: async () => ({ sessionId: "session-123" }),
      createAttendanceForTeam: async () => {
        throw new Error("repo should not create");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-404/attendance",
          method: "POST",
          routeKey: "POST /teams/{teamId}/attendance",
          pathParameters: { teamId: "team-404" },
          headers: {},
          queryStringParameters: {},
          body: {
            sessionId: "session-123",
            sessionDate: "2026-04-15",
            status: "completed",
          },
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

test("POST /teams/{teamId}/attendance returns 404 when the session is missing in tenant scope", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      getSessionSummaryForAssignment: async () => null,
      createAttendanceForTeam: async () => {
        throw new Error("repo should not create");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-123/attendance",
          method: "POST",
          routeKey: "POST /teams/{teamId}/attendance",
          pathParameters: { teamId: "team-123" },
          headers: {},
          queryStringParameters: {},
          body: {
            sessionId: "session-404",
            sessionDate: "2026-04-15",
            status: "completed",
          },
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

test("POST /teams/{teamId}/attendance returns 400 when tenant scope is spoofed", async () => {
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
          rawPath: "/teams/team-123/attendance",
          method: "POST",
          routeKey: "POST /teams/{teamId}/attendance",
          pathParameters: { teamId: "team-123" },
          headers: {},
          queryStringParameters: {},
          body: {
            sessionId: "session-123",
            sessionDate: "2026-04-15",
            status: "completed",
            tenantId: "tenant-from-body",
          },
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

test("GET /teams/{teamId}/attendance returns history with 200", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const tenantCtx = makeTenantCtx({ role: "coach" });
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async (actualTenantCtx, teamId) => {
        calls.push({ step: "team", actualTenantCtx, teamId });
        return { team: { teamId } };
      },
      listAttendanceForTeam: async (actualTenantCtx, teamId, query) => {
        calls.push({ step: "list", actualTenantCtx, teamId, query });
        return {
          items: [
            {
              teamId,
              sessionId: "session-123",
              sessionDate: "2026-04-15",
              status: "completed",
              recordedAt: "2026-04-15T23:00:00.000Z",
              recordedBy: actualTenantCtx.userId,
            },
          ],
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/attendance",
      method: "GET",
      routeKey: "GET /teams/{teamId}/attendance",
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
        sessionDate: "2026-04-15",
        status: "completed",
        recordedAt: "2026-04-15T23:00:00.000Z",
        recordedBy: "user-123",
      },
    ],
  });
  assert.deepEqual(calls, [
    { step: "team", actualTenantCtx: tenantCtx, teamId: "team-123" },
    { step: "list", actualTenantCtx: tenantCtx, teamId: "team-123", query: {} },
  ]);
});

test("GET /teams/{teamId}/attendance accepts a startDate-only filter", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      listAttendanceForTeam: async (_actualTenantCtx, _teamId, query) => {
        calls.push(query);
        return { items: [] };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/attendance",
      method: "GET",
      routeKey: "GET /teams/{teamId}/attendance",
      pathParameters: { teamId: "team-123" },
      headers: {},
      queryStringParameters: { startDate: "2026-04-10" },
    }),
    tenantCtx: makeTenantCtx({ role: "coach" }),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [{ startDate: "2026-04-10" }]);
});

test("GET /teams/{teamId}/attendance accepts an endDate-only filter", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      listAttendanceForTeam: async (_actualTenantCtx, _teamId, query) => {
        calls.push(query);
        return { items: [] };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/attendance",
      method: "GET",
      routeKey: "GET /teams/{teamId}/attendance",
      pathParameters: { teamId: "team-123" },
      headers: {},
      queryStringParameters: { endDate: "2026-04-15" },
    }),
    tenantCtx: makeTenantCtx({ role: "coach" }),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [{ endDate: "2026-04-15" }]);
});

test("GET /teams/{teamId}/attendance accepts a bounded date window and nextToken", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      listAttendanceForTeam: async (_actualTenantCtx, _teamId, query) => {
        calls.push(query);
        return { items: [], nextToken: "opaque-token" };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/attendance",
      method: "GET",
      routeKey: "GET /teams/{teamId}/attendance",
      pathParameters: { teamId: "team-123" },
      headers: {},
      queryStringParameters: {
        startDate: "2026-04-10",
        endDate: "2026-04-15",
        limit: "10",
        nextToken: "opaque-token",
      },
    }),
    tenantCtx: makeTenantCtx({ role: "coach" }),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, [
    {
      startDate: "2026-04-10",
      endDate: "2026-04-15",
      limit: 10,
      nextToken: "opaque-token",
    },
  ]);
});

test("GET /teams/{teamId}/attendance returns 400 for invalid date filters", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      listAttendanceForTeam: async () => {
        throw new Error("repo should not list");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-123/attendance",
          method: "GET",
          routeKey: "GET /teams/{teamId}/attendance",
          pathParameters: { teamId: "team-123" },
          headers: {},
          queryStringParameters: { startDate: "2026-04-31" },
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

test("GET /teams/{teamId}/attendance returns 404 when the team is missing in tenant scope", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => null,
      listAttendanceForTeam: async () => {
        throw new Error("repo should not list");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-404/attendance",
          method: "GET",
          routeKey: "GET /teams/{teamId}/attendance",
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

test("GET /teams/{teamId}/planning/weekly returns 200 with the current weekly planning view", async () => {
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
      getWeeklyPlanningForTeam: async (actualTenantCtx, teamId, query) => {
        calls.push({ step: "weekly", actualTenantCtx, teamId, query });
        return {
          teamId,
          weekStart: "2026-04-06",
          weekEnd: "2026-04-12",
          summary: {
            attendanceCount: 1,
            assignmentOnlyCount: 1,
            completedCount: 1,
            plannedCount: 0,
            cancelledCount: 0,
          },
          items: [
            {
              sessionId: "session-123",
              source: "attendance",
              sessionDate: "2026-04-08",
              status: "completed",
              recordedAt: "2026-04-08T22:15:00.000Z",
              recordedBy: actualTenantCtx.userId,
            },
            {
              sessionId: "session-456",
              source: "assignment",
              assignedAt: "2026-04-05T18:00:00.000Z",
              assignedBy: actualTenantCtx.userId,
            },
          ],
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/teams/team-123/planning/weekly",
      method: "GET",
      routeKey: "GET /teams/{teamId}/planning/weekly",
      pathParameters: { teamId: "team-123" },
      headers: {},
      queryStringParameters: {},
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    teamId: "team-123",
    weekStart: "2026-04-06",
    weekEnd: "2026-04-12",
    summary: {
      attendanceCount: 1,
      assignmentOnlyCount: 1,
      completedCount: 1,
      plannedCount: 0,
      cancelledCount: 0,
    },
    items: [
      {
        sessionId: "session-123",
        source: "attendance",
        sessionDate: "2026-04-08",
        status: "completed",
        recordedAt: "2026-04-08T22:15:00.000Z",
        recordedBy: "user-123",
      },
      {
        sessionId: "session-456",
        source: "assignment",
        assignedAt: "2026-04-05T18:00:00.000Z",
        assignedBy: "user-123",
      },
    ],
  });
  assert.deepEqual(calls, [
    { step: "team", actualTenantCtx: tenantCtx, teamId: "team-123" },
    { step: "weekly", actualTenantCtx: tenantCtx, teamId: "team-123", query: {} },
  ]);
  assert.equal(loggerEvents[0].eventType, "team_weekly_planning_fetched");
});

test("GET /teams/{teamId}/planning/weekly returns 404 when the team is missing in tenant scope", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => null,
      getWeeklyPlanningForTeam: async () => {
        throw new Error("repo should not fetch weekly planning");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-404/planning/weekly",
          method: "GET",
          routeKey: "GET /teams/{teamId}/planning/weekly",
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

test("GET /teams/{teamId}/planning/weekly returns 400 for forbidden query params", async () => {
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTeamsInner({
    getTeamRepoFn: () => ({
      getTeamById: async () => ({ team: { teamId: "team-123" } }),
      getWeeklyPlanningForTeam: async () => {
        throw new Error("repo should not fetch weekly planning");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/teams/team-123/planning/weekly",
          method: "GET",
          routeKey: "GET /teams/{teamId}/planning/weekly",
          pathParameters: { teamId: "team-123" },
          headers: {},
          queryStringParameters: { weekStart: "2026-04-06" },
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

test("GET /teams/{teamId}/planning/weekly returns 400 when tenant scope is spoofed", async () => {
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
          rawPath: "/teams/team-123/planning/weekly",
          method: "GET",
          routeKey: "GET /teams/{teamId}/planning/weekly",
          pathParameters: { teamId: "team-123" },
          headers: { "x-tenant-id": "tenant-from-header" },
          queryStringParameters: {},
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
