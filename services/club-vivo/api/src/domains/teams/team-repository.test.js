"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { DynamoDBClient, PutItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");

const { TeamRepository } = require("./team-repository");

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

test("createTeam persists Team v1 fields and defaults status to active", async () => {
  const repo = new TeamRepository({ tableName: "domain-table" });
  const calls = [];

  await withMockedUuid("team-123", async () => {
    await withMockedSend(async (command) => {
      calls.push(command);
      assert.equal(command instanceof PutItemCommand, true);
      return {};
    }, async () => {
      const result = await repo.createTeam(makeTenantContext(), {
        name: " U14 Blue ",
        sport: " soccer ",
        ageBand: " U14 ",
        level: " competitive ",
        notes: "  Strong group  ",
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
});

test("getTeamById uses a tenant-scoped exact-key query and returns the team", async () => {
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
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.getTeamById(makeTenantContext(), "team-123");
    assert.deepEqual(result, {
      team: {
        teamId: "team-123",
        tenantId: "tenant_authoritative",
        name: "U14 Blue",
        sport: "soccer",
        ageBand: "U14",
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

test("listTeams remains query-based and normalizes Team v1 fields", async () => {
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
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-123",
        }),
      ],
    };
  }, async () => {
    const result = await repo.listTeams(makeTenantContext(), { limit: 10 });
    assert.deepEqual(result, {
      items: [
        {
          teamId: "team-123",
          tenantId: "tenant_authoritative",
          name: "U14 Blue",
          sport: "soccer",
          ageBand: "U14",
          notes: "Strong group",
          status: "active",
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z",
          createdBy: "user-123",
        },
      ],
      nextToken: undefined,
    });
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
