"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { DynamoDBClient, PutItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");

const { TeamRepository } = require("./team-repository");

function makeTenantContext({
  tenantId = "tenant_authoritative",
  userId = "user-123",
  role = "coach",
} = {}) {
  return {
    tenantId,
    userId,
    role,
  };
}

function decodeToken(nextToken) {
  return nextToken
    ? JSON.parse(Buffer.from(nextToken, "base64").toString("utf8"))
    : undefined;
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

test("createTeam persists Team ownership, optional durable context, and defaults status to active", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("team-123", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof PutItemCommand, true);
      return {};
    }, async () => {
      const result = await repo.createTeam(makeTenantContext({ role: "coach" }), {
        name: " U14 Blue ",
        sport: " soccer ",
        ageBand: " U14 ",
        level: " competitive ",
        notes: "  Strong group  ",
        programType: "travel",
        playerCount: 18,
      });

      assert.deepEqual(result, {
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
          createdAt: result.team.createdAt,
          updatedAt: result.team.updatedAt,
          createdBy: "user-123",
        },
      });
    });
  });

  assert.equal(calls.length, 1);
  const written = unmarshall(calls[0].input.Item);
  assert.equal(written.PK, "TENANT#tenant_authoritative");
  assert.equal(written.SK, "TEAM#team-123");
  assert.equal(written.type, "TEAM");
  assert.equal(written.status, "active");
  assert.equal(written.sport, "soccer");
  assert.equal(written.ageBand, "U14");
  assert.equal(written.level, "competitive");
  assert.equal(written.notes, "Strong group");
  assert.equal(written.programType, "travel");
  assert.equal(written.playerCount, 18);
});

test("getTeamById returns an owned team for a coach via a tenant-scoped exact-key query", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-123",
          type: "TEAM",
          teamId: "team-123",
          tenantId: "tenant_authoritative",
          name: "U14 Blue",
          sport: "soccer",
          ageBand: "U14",
          programType: "travel",
          playerCount: 18,
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.getTeamById(makeTenantContext({ role: "coach" }), "team-123");
    assert.deepEqual(result, {
      team: {
        teamId: "team-123",
        tenantId: "tenant_authoritative",
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        programType: "travel",
        playerCount: 18,
        status: "active",
        createdAt: "2026-04-10T00:00:00.000Z",
        updatedAt: "2026-04-10T00:00:00.000Z",
        createdBy: "user-123",
      },
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.KeyConditionExpression, "PK = :pk AND SK = :sk");
  assert.deepEqual(calls[0].input.ExpressionAttributeValues, {
    ":pk": { S: "TENANT#tenant_authoritative" },
    ":sk": { S: "TEAM#team-123" },
  });
});

test("getTeamById returns null when the team is missing in the tenant scope", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    return { Items: [] };
  }, async () => {
    const result = await repo.getTeamById(makeTenantContext(), "team-404");
    assert.equal(result, null);
  });
});

test("getTeamById returns null for a non-owner coach and 404 can be enforced at the handler layer", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-123",
          type: "TEAM",
          teamId: "team-123",
          tenantId: "tenant_authoritative",
          name: "U14 Blue",
          sport: "soccer",
          ageBand: "U14",
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-999",
        }),
      ],
    };
  }, async () => {
    const result = await repo.getTeamById(makeTenantContext({ role: "coach" }), "team-123");
    assert.equal(result, null);
  });
});

test("getTeamById lets an admin fetch another coach's team", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-123",
          type: "TEAM",
          teamId: "team-123",
          tenantId: "tenant_authoritative",
          name: "U14 Blue",
          sport: "soccer",
          ageBand: "U14",
          notes: "Strong group",
          programType: "ost",
          playerCount: 12,
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-999",
        }),
      ],
    };
  }, async () => {
    const result = await repo.getTeamById(makeTenantContext({ role: "admin" }), "team-123");
    assert.deepEqual(result, {
      team: {
        teamId: "team-123",
        tenantId: "tenant_authoritative",
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
        notes: "Strong group",
        programType: "ost",
        playerCount: 12,
        status: "active",
        createdAt: "2026-04-10T00:00:00.000Z",
        updatedAt: "2026-04-10T00:00:00.000Z",
        createdBy: "user-999",
      },
    });
  });
});

test("listTeams keeps admin visibility tenant-wide", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    assert.equal(command.input.KeyConditionExpression, "PK = :pk AND begins_with(SK, :skPrefix)");
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-123",
          type: "TEAM",
          teamId: "team-123",
          tenantId: "tenant_authoritative",
          name: "U14 Blue",
          sport: "soccer",
          ageBand: "U14",
          notes: "Strong group",
          programType: "ost",
          playerCount: 12,
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-123",
        }),
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-456",
          type: "TEAM",
          teamId: "team-456",
          tenantId: "tenant_authoritative",
          name: "U12 White",
          sport: "soccer",
          ageBand: "U12",
          status: "active",
          createdAt: "2026-04-11T00:00:00.000Z",
          updatedAt: "2026-04-11T00:00:00.000Z",
          createdBy: "user-999",
        }),
      ],
    };
  }, async () => {
    const result = await repo.listTeams(makeTenantContext({ role: "admin" }), { limit: 10 });
    assert.deepEqual(result, {
      items: [
        {
          teamId: "team-123",
          tenantId: "tenant_authoritative",
          name: "U14 Blue",
          sport: "soccer",
          ageBand: "U14",
          notes: "Strong group",
          programType: "ost",
          playerCount: 12,
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-123",
        },
        {
          teamId: "team-456",
          tenantId: "tenant_authoritative",
          name: "U12 White",
          sport: "soccer",
          ageBand: "U12",
          status: "active",
          createdAt: "2026-04-11T00:00:00.000Z",
          updatedAt: "2026-04-11T00:00:00.000Z",
          createdBy: "user-999",
        },
      ],
      nextToken: undefined,
    });
  });
});

test("listTeams returns only owner-visible teams and keeps filtered pagination correct", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    assert.equal(command instanceof QueryCommand, true);

    if (calls.length === 1) {
      return {
        Items: [
          marshall({
            PK: "TENANT#tenant_authoritative",
            SK: "TEAM#team-100",
            type: "TEAM",
            teamId: "team-100",
            tenantId: "tenant_authoritative",
            name: "Hidden One",
            sport: "soccer",
            ageBand: "U10",
            status: "active",
            createdAt: "2026-04-10T00:00:00.000Z",
            updatedAt: "2026-04-10T00:00:00.000Z",
            createdBy: "user-999",
          }),
        ],
        LastEvaluatedKey: marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-100",
        }),
      };
    }

    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-200",
          type: "TEAM",
          teamId: "team-200",
          tenantId: "tenant_authoritative",
          name: "Owned One",
          sport: "soccer",
          ageBand: "U12",
          status: "active",
          createdAt: "2026-04-11T00:00:00.000Z",
          updatedAt: "2026-04-11T00:00:00.000Z",
          createdBy: "user-123",
        }),
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-201",
          type: "TEAM",
          teamId: "team-201",
          tenantId: "tenant_authoritative",
          name: "Owned Two",
          sport: "soccer",
          ageBand: "U13",
          status: "active",
          createdAt: "2026-04-12T00:00:00.000Z",
          updatedAt: "2026-04-12T00:00:00.000Z",
          createdBy: "user-123",
        }),
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-202",
          type: "TEAM",
          teamId: "team-202",
          tenantId: "tenant_authoritative",
          name: "Owned Three",
          sport: "soccer",
          ageBand: "U14",
          status: "active",
          createdAt: "2026-04-13T00:00:00.000Z",
          updatedAt: "2026-04-13T00:00:00.000Z",
          createdBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.listTeams(makeTenantContext({ role: "coach" }), { limit: 2 });
    assert.deepEqual(result.items, [
      {
        teamId: "team-200",
        tenantId: "tenant_authoritative",
        name: "Owned One",
        sport: "soccer",
        ageBand: "U12",
        status: "active",
        createdAt: "2026-04-11T00:00:00.000Z",
        updatedAt: "2026-04-11T00:00:00.000Z",
        createdBy: "user-123",
      },
      {
        teamId: "team-201",
        tenantId: "tenant_authoritative",
        name: "Owned Two",
        sport: "soccer",
        ageBand: "U13",
        status: "active",
        createdAt: "2026-04-12T00:00:00.000Z",
        updatedAt: "2026-04-12T00:00:00.000Z",
        createdBy: "user-123",
      },
    ]);
    assert.deepEqual(decodeToken(result.nextToken), {
      PK: { S: "TENANT#tenant_authoritative" },
      SK: { S: "TEAM#team-201" },
    });
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].input.ExclusiveStartKey, undefined);
  assert.deepEqual(calls[1].input.ExclusiveStartKey, {
    PK: { S: "TENANT#tenant_authoritative" },
    SK: { S: "TEAM#team-100" },
  });
});

test("updateTeam persists edited Team fields and optional durable context for an owning coach", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);

    if (calls.length === 1) {
      assert.equal(command instanceof QueryCommand, true);
      return {
        Items: [
          marshall({
            PK: "TENANT#tenant_authoritative",
            SK: "TEAM#team-123",
            type: "TEAM",
            teamId: "team-123",
            tenantId: "tenant_authoritative",
            name: "U14 Blue",
            sport: "soccer",
            ageBand: "U14",
            status: "active",
            createdAt: "2026-04-10T00:00:00.000Z",
            updatedAt: "2026-04-10T00:00:00.000Z",
            createdBy: "user-123",
          }),
        ],
      };
    }

    assert.equal(command instanceof PutItemCommand, true);
    return {};
  }, async () => {
    const result = await repo.updateTeam(makeTenantContext({ role: "coach" }), "team-123", {
      name: " U14 Blue East ",
      sport: " soccer ",
      ageBand: " U14 ",
      level: " competitive ",
      notes: "  Strong group  ",
      status: "archived",
      programType: "travel",
      playerCount: 18,
    });

    assert.deepEqual(result, {
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
        createdAt: "2026-04-10T00:00:00.000Z",
        updatedAt: result.team.updatedAt,
        createdBy: "user-123",
      },
    });
  });

  assert.equal(calls.length, 2);
  const written = unmarshall(calls[1].input.Item);
  assert.equal(written.PK, "TENANT#tenant_authoritative");
  assert.equal(written.SK, "TEAM#team-123");
  assert.equal(written.type, "TEAM");
  assert.equal(written.name, "U14 Blue East");
  assert.equal(written.programType, "travel");
  assert.equal(written.playerCount, 18);
  assert.equal(written.createdAt, "2026-04-10T00:00:00.000Z");
  assert.equal(written.createdBy, "user-123");
});

test("updateTeam returns 404 when a coach tries to update a team they do not own", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAM#team-404",
          type: "TEAM",
          teamId: "team-404",
          tenantId: "tenant_authoritative",
          name: "U14 Blue",
          sport: "soccer",
          ageBand: "U14",
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-999",
        }),
      ],
    };
  }, async () => {
    await assert.rejects(
      () =>
        repo.updateTeam(makeTenantContext({ role: "coach" }), "team-404", {
          name: "U14 Blue",
          sport: "soccer",
          ageBand: "U14",
        }),
      (err) => {
        assert.equal(err.code, "teams.not_found");
        assert.equal(err.statusCode, 404);
        assert.deepEqual(err.details, {
          entityType: "TEAM",
          teamId: "team-404",
        });
        return true;
      }
    );
  });
});

test("getSessionSummaryForAssignment uses query-only lookup and returns a small session summary", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    assert.equal(command instanceof QueryCommand, true);

    if (calls.length === 1) {
      return {
        Items: [
          marshall({
            PK: "TENANT#tenant_authoritative",
            SK: "SESSIONLOOKUP#session-123",
            targetPK: "TENANT#tenant_authoritative",
            targetSK: "SESSION#2026-04-01T00:00:00.000Z#session-123",
          }),
        ],
      };
    }

    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "SESSION#2026-04-01T00:00:00.000Z#session-123",
          type: "SESSION",
          sessionId: "session-123",
          createdAt: "2026-04-01T00:00:00.000Z",
          sport: "soccer",
          ageBand: "U14",
          durationMin: 45,
          objectiveTags: ["pressing"],
        }),
      ],
    };
  }, async () => {
    const result = await repo.getSessionSummaryForAssignment(makeTenantContext(), "session-123");
    assert.deepEqual(result, {
      sessionId: "session-123",
      sessionCreatedAt: "2026-04-01T00:00:00.000Z",
      sport: "soccer",
      ageBand: "U14",
      durationMin: 45,
      objectiveTags: ["pressing"],
    });
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].input.KeyConditionExpression, "PK = :pk AND SK = :sk");
  assert.deepEqual(calls[0].input.ExpressionAttributeValues, {
    ":pk": { S: "TENANT#tenant_authoritative" },
    ":sk": { S: "SESSIONLOOKUP#session-123" },
  });
  assert.equal(calls[1].input.KeyConditionExpression, "PK = :pk AND SK = :sk");
  assert.deepEqual(calls[1].input.ExpressionAttributeValues, {
    ":pk": { S: "TENANT#tenant_authoritative" },
    ":sk": { S: "SESSION#2026-04-01T00:00:00.000Z#session-123" },
  });
});

test("assignSessionToTeam writes a tenant-scoped TEAMSESSION item and returns created=true", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    if (calls.length === 1) {
      assert.equal(command instanceof QueryCommand, true);
      return { Items: [] };
    }

    assert.equal(command instanceof PutItemCommand, true);
    return {};
  }, async () => {
    const result = await repo.assignSessionToTeam(makeTenantContext(), {
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
    });

    assert.equal(result.created, true);
    assert.deepEqual(result.assignment, {
      teamId: "team-123",
      sessionId: "session-123",
      assignedAt: result.assignment.assignedAt,
      assignedBy: "user-123",
      notes: "Use next Tuesday",
      sessionCreatedAt: "2026-04-01T00:00:00.000Z",
      sport: "soccer",
      ageBand: "U14",
      durationMin: 45,
      objectiveTags: ["pressing"],
    });
  });

  assert.equal(calls.length, 2);
  const written = unmarshall(calls[1].input.Item);
  assert.equal(written.PK, "TENANT#tenant_authoritative");
  assert.equal(written.SK, "TEAMSESSION#team-123#session-123");
  assert.equal(written.type, "TEAM_SESSION_ASSIGNMENT");
  assert.equal(written.notes, "Use next Tuesday");
  assert.equal(written.sport, "soccer");
  assert.equal(written.ageBand, "U14");
  assert.equal(written.durationMin, 45);
  assert.deepEqual(written.objectiveTags, ["pressing"]);
});

test("assignSessionToTeam returns the existing assignment on duplicate replay", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMSESSION#team-123#session-123",
          type: "TEAM_SESSION_ASSIGNMENT",
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
        }),
      ],
    };
  }, async () => {
    const result = await repo.assignSessionToTeam(makeTenantContext(), {
      teamId: "team-123",
      sessionId: "session-123",
      sessionSummary: {
        sessionId: "session-123",
      },
    });

    assert.deepEqual(result, {
      created: false,
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
  });

  assert.equal(calls.length, 1);
});

test("listAssignedSessionsForTeam remains query-based and returns tenant-scoped assignments", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    assert.equal(command.input.KeyConditionExpression, "PK = :pk AND begins_with(SK, :skPrefix)");
    assert.deepEqual(command.input.ExpressionAttributeValues, {
      ":pk": { S: "TENANT#tenant_authoritative" },
      ":skPrefix": { S: "TEAMSESSION#team-123#" },
    });
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMSESSION#team-123#session-123",
          type: "TEAM_SESSION_ASSIGNMENT",
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
        }),
      ],
    };
  }, async () => {
    const result = await repo.listAssignedSessionsForTeam(makeTenantContext(), "team-123");
    assert.deepEqual(result, {
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
  });
});

test("getAttendanceByKey uses a tenant-scoped exact-key query and returns the attendance item", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMATTENDANCE#team-123#2026-04-15#session-123",
          type: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-15",
          status: "completed",
          notes: "Good intensity",
          recordedAt: "2026-04-15T23:00:00.000Z",
          recordedBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.getAttendanceByKey(makeTenantContext(), {
      teamId: "team-123",
      sessionDate: "2026-04-15",
      sessionId: "session-123",
    });

    assert.deepEqual(result, {
      teamId: "team-123",
      sessionId: "session-123",
      sessionDate: "2026-04-15",
      status: "completed",
      notes: "Good intensity",
      recordedAt: "2026-04-15T23:00:00.000Z",
      recordedBy: "user-123",
    });
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input.KeyConditionExpression, "PK = :pk AND SK = :sk");
  assert.deepEqual(calls[0].input.ExpressionAttributeValues, {
    ":pk": { S: "TENANT#tenant_authoritative" },
    ":sk": { S: "TEAMATTENDANCE#team-123#2026-04-15#session-123" },
  });
});

test("createAttendanceForTeam writes a TEAM_ATTENDANCE item and returns created=true", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    assert.equal(command instanceof PutItemCommand, true);
    return {};
  }, async () => {
    const result = await repo.createAttendanceForTeam(makeTenantContext(), {
      teamId: "team-123",
      sessionId: "session-123",
      sessionDate: "2026-04-15",
      status: "completed",
      notes: "Good intensity",
    });

    assert.equal(result.created, true);
    assert.deepEqual(result.attendance, {
      teamId: "team-123",
      sessionId: "session-123",
      sessionDate: "2026-04-15",
      status: "completed",
      notes: "Good intensity",
      recordedAt: result.attendance.recordedAt,
      recordedBy: "user-123",
    });
  });

  assert.equal(calls.length, 1);
  const written = unmarshall(calls[0].input.Item);
  assert.equal(written.PK, "TENANT#tenant_authoritative");
  assert.equal(written.SK, "TEAMATTENDANCE#team-123#2026-04-15#session-123");
  assert.equal(written.type, "TEAM_ATTENDANCE");
  assert.equal(written.status, "completed");
  assert.equal(written.notes, "Good intensity");
});

test("createAttendanceForTeam returns the existing attendance on exact replay after conditional failure", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    if (calls.length === 1) {
      const err = new Error("duplicate");
      err.name = "ConditionalCheckFailedException";
      throw err;
    }

    assert.equal(command instanceof QueryCommand, true);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMATTENDANCE#team-123#2026-04-15#session-123",
          type: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-15",
          status: "completed",
          notes: "Good intensity",
          recordedAt: "2026-04-15T23:00:00.000Z",
          recordedBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.createAttendanceForTeam(makeTenantContext(), {
      teamId: "team-123",
      sessionId: "session-123",
      sessionDate: "2026-04-15",
      status: "completed",
      notes: "Good intensity",
    });

    assert.deepEqual(result, {
      created: false,
      attendance: {
        teamId: "team-123",
        sessionId: "session-123",
        sessionDate: "2026-04-15",
        status: "completed",
        notes: "Good intensity",
        recordedAt: "2026-04-15T23:00:00.000Z",
        recordedBy: "user-123",
      },
    });
  });

  assert.equal(calls.length, 2);
});

test("createAttendanceForTeam throws a 409 conflict on conflicting replay after conditional failure", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    if (calls.length === 1) {
      const err = new Error("duplicate");
      err.name = "ConditionalCheckFailedException";
      throw err;
    }

    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMATTENDANCE#team-123#2026-04-15#session-123",
          type: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-15",
          status: "planned",
          recordedAt: "2026-04-15T23:00:00.000Z",
          recordedBy: "user-123",
        }),
      ],
    };
  }, async () => {
    await assert.rejects(
      () =>
        repo.createAttendanceForTeam(makeTenantContext(), {
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-15",
          status: "completed",
        }),
      (err) => {
        assert.equal(err.code, "teams.attendance_exists");
        assert.equal(err.statusCode, 409);
        assert.deepEqual(err.details, {
          entityType: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-15",
        });
        return true;
      }
    );
  });

  assert.equal(calls.length, 2);
});

test("listAttendanceForTeam uses a history prefix query when no date filters are supplied", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    assert.equal(command.input.KeyConditionExpression, "PK = :pk AND begins_with(SK, :skPrefix)");
    assert.deepEqual(command.input.ExpressionAttributeValues, {
      ":pk": { S: "TENANT#tenant_authoritative" },
      ":skPrefix": { S: "TEAMATTENDANCE#team-123#" },
    });
    assert.equal(command.input.ScanIndexForward, false);
    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMATTENDANCE#team-123#2026-04-15#session-123",
          type: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-15",
          status: "completed",
          recordedAt: "2026-04-15T23:00:00.000Z",
          recordedBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.listAttendanceForTeam(makeTenantContext(), "team-123");
    assert.deepEqual(result, {
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
      nextToken: undefined,
    });
  });
});

test("listAttendanceForTeam uses a lower-bounded query for startDate-only filters", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    assert.equal(command.input.KeyConditionExpression, "PK = :pk AND SK BETWEEN :from AND :to");
    assert.deepEqual(command.input.ExpressionAttributeValues, {
      ":pk": { S: "TENANT#tenant_authoritative" },
      ":from": { S: "TEAMATTENDANCE#team-123#2026-04-10#" },
      ":to": { S: "TEAMATTENDANCE#team-123#\uFFFF" },
    });
    return { Items: [] };
  }, async () => {
    await repo.listAttendanceForTeam(makeTenantContext(), "team-123", {
      startDate: "2026-04-10",
    });
  });
});

test("listAttendanceForTeam uses an upper-bounded query for endDate-only filters", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    assert.equal(command.input.KeyConditionExpression, "PK = :pk AND SK BETWEEN :from AND :to");
    assert.deepEqual(command.input.ExpressionAttributeValues, {
      ":pk": { S: "TENANT#tenant_authoritative" },
      ":from": { S: "TEAMATTENDANCE#team-123#" },
      ":to": { S: "TEAMATTENDANCE#team-123#2026-04-15#\uFFFF" },
    });
    return { Items: [] };
  }, async () => {
    await repo.listAttendanceForTeam(makeTenantContext(), "team-123", {
      endDate: "2026-04-15",
    });
  });
});

test("listAttendanceForTeam uses a bounded BETWEEN query and nextToken round-trip", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const inputToken = Buffer.from(
    JSON.stringify({
      PK: { S: "TENANT#tenant_authoritative" },
      SK: { S: "TEAMATTENDANCE#team-123#2026-04-09#session-999" },
    }),
    "utf8"
  ).toString("base64");

  await withMockedSend(async (command) => {
    assert.equal(command instanceof QueryCommand, true);
    assert.equal(command.input.KeyConditionExpression, "PK = :pk AND SK BETWEEN :from AND :to");
    assert.deepEqual(command.input.ExpressionAttributeValues, {
      ":pk": { S: "TENANT#tenant_authoritative" },
      ":from": { S: "TEAMATTENDANCE#team-123#2026-04-10#" },
      ":to": { S: "TEAMATTENDANCE#team-123#2026-04-15#\uFFFF" },
    });
    assert.deepEqual(command.input.ExclusiveStartKey, {
      PK: { S: "TENANT#tenant_authoritative" },
      SK: { S: "TEAMATTENDANCE#team-123#2026-04-09#session-999" },
    });
    return {
      Items: [],
      LastEvaluatedKey: {
        PK: { S: "TENANT#tenant_authoritative" },
        SK: { S: "TEAMATTENDANCE#team-123#2026-04-08#session-888" },
      },
    };
  }, async () => {
    const result = await repo.listAttendanceForTeam(makeTenantContext(), "team-123", {
      startDate: "2026-04-10",
      endDate: "2026-04-15",
      nextToken: inputToken,
      limit: 10,
    });

    assert.deepEqual(result, {
      items: [],
      nextToken: Buffer.from(
        JSON.stringify({
          PK: { S: "TENANT#tenant_authoritative" },
          SK: { S: "TEAMATTENDANCE#team-123#2026-04-08#session-888" },
        }),
        "utf8"
      ).toString("base64"),
      });
  });
});

test("getWeeklyPlanningForTeam derives the UTC Monday-through-Sunday week window correctly", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedSend(async (command) => {
    calls.push(command);
    assert.equal(command instanceof QueryCommand, true);
    return { Items: [] };
  }, async () => {
    const result = await repo.getWeeklyPlanningForTeam(makeTenantContext(), "team-123", {
      now: new Date("2026-04-11T12:00:00.000Z"),
    });

    assert.deepEqual(result, {
      teamId: "team-123",
      weekStart: "2026-04-06",
      weekEnd: "2026-04-12",
      summary: {
        attendanceCount: 0,
        assignmentOnlyCount: 0,
        completedCount: 0,
        plannedCount: 0,
        cancelledCount: 0,
      },
      items: [],
    });
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].input.ExpressionAttributeValues, {
    ":pk": { S: "TENANT#tenant_authoritative" },
    ":skPrefix": { S: "TEAMSESSION#team-123#" },
  });
  assert.deepEqual(calls[1].input.ExpressionAttributeValues, {
    ":pk": { S: "TENANT#tenant_authoritative" },
    ":from": { S: "TEAMATTENDANCE#team-123#2026-04-06#" },
    ":to": { S: "TEAMATTENDANCE#team-123#2026-04-12#\uFFFF" },
  });
});

test("getWeeklyPlanningForTeam merges attendance and assignment-only items correctly and computes summary", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  let callCount = 0;

  await withMockedSend(async (command) => {
    callCount += 1;
    assert.equal(command instanceof QueryCommand, true);

    if (callCount === 1) {
      return {
        Items: [
          marshall({
            PK: "TENANT#tenant_authoritative",
            SK: "TEAMSESSION#team-123#session-123",
            type: "TEAM_SESSION_ASSIGNMENT",
            teamId: "team-123",
            sessionId: "session-123",
            assignedAt: "2026-04-05T18:00:00.000Z",
            assignedBy: "user-123",
            sport: "soccer",
            ageBand: "U14",
            durationMin: 45,
            objectiveTags: ["pressing"],
          }),
          marshall({
            PK: "TENANT#tenant_authoritative",
            SK: "TEAMSESSION#team-123#session-456",
            type: "TEAM_SESSION_ASSIGNMENT",
            teamId: "team-123",
            sessionId: "session-456",
            assignedAt: "2026-04-05T19:00:00.000Z",
            assignedBy: "user-123",
            sport: "soccer",
            ageBand: "U14",
            durationMin: 60,
            objectiveTags: ["finishing"],
          }),
        ],
      };
    }

    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMATTENDANCE#team-123#2026-04-08#session-123",
          type: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-08",
          status: "completed",
          notes: "Good intensity",
          recordedAt: "2026-04-08T22:15:00.000Z",
          recordedBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.getWeeklyPlanningForTeam(makeTenantContext(), "team-123", {
      now: new Date("2026-04-11T12:00:00.000Z"),
    });

    assert.deepEqual(result, {
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
          notes: "Good intensity",
          recordedAt: "2026-04-08T22:15:00.000Z",
          recordedBy: "user-123",
          sessionSummary: {
            sport: "soccer",
            ageBand: "U14",
            durationMin: 45,
            objectiveTags: ["pressing"],
          },
        },
        {
          sessionId: "session-456",
          source: "assignment",
          assignedAt: "2026-04-05T19:00:00.000Z",
          assignedBy: "user-123",
          sessionSummary: {
            sport: "soccer",
            ageBand: "U14",
            durationMin: 60,
            objectiveTags: ["finishing"],
          },
        },
      ],
    });
  });
});

test("getWeeklyPlanningForTeam preserves multiple attendance items for the same sessionId on different dates", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  let callCount = 0;

  await withMockedSend(async () => {
    callCount += 1;

    if (callCount === 1) {
      return {
        Items: [
          marshall({
            PK: "TENANT#tenant_authoritative",
            SK: "TEAMSESSION#team-123#session-123",
            type: "TEAM_SESSION_ASSIGNMENT",
            teamId: "team-123",
            sessionId: "session-123",
            assignedAt: "2026-04-05T18:00:00.000Z",
            assignedBy: "user-123",
            sessionCreatedAt: "2026-04-01T00:00:00.000Z",
            sport: "soccer",
            ageBand: "U14",
            durationMin: 45,
            objectiveTags: ["pressing"],
          }),
        ],
      };
    }

    return {
      Items: [
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMATTENDANCE#team-123#2026-04-08#session-123",
          type: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-08",
          status: "planned",
          recordedAt: "2026-04-08T18:00:00.000Z",
          recordedBy: "user-123",
        }),
        marshall({
          PK: "TENANT#tenant_authoritative",
          SK: "TEAMATTENDANCE#team-123#2026-04-10#session-123",
          type: "TEAM_ATTENDANCE",
          teamId: "team-123",
          sessionId: "session-123",
          sessionDate: "2026-04-10",
          status: "completed",
          recordedAt: "2026-04-10T20:00:00.000Z",
          recordedBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.getWeeklyPlanningForTeam(makeTenantContext(), "team-123", {
      now: new Date("2026-04-11T12:00:00.000Z"),
    });

    assert.equal(result.items.length, 2);
    assert.deepEqual(result.summary, {
      attendanceCount: 2,
      assignmentOnlyCount: 0,
      completedCount: 1,
      plannedCount: 1,
      cancelledCount: 0,
    });
    assert.deepEqual(
      result.items.map((item) => ({
        sessionId: item.sessionId,
        source: item.source,
        sessionDate: item.sessionDate,
        status: item.status,
      })),
      [
        {
          sessionId: "session-123",
          source: "attendance",
          sessionDate: "2026-04-08",
          status: "planned",
        },
        {
          sessionId: "session-123",
          source: "attendance",
          sessionDate: "2026-04-10",
          status: "completed",
        },
      ]
    );
  });
});
