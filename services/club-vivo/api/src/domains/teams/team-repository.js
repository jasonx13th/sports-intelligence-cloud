"use strict";

const {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");
const { validateCreateTeam } = require("./team-validate");

const ddb = new DynamoDBClient({});

function requireTenantId(tenantContext) {
  const tenantId = tenantContext?.tenantId;
  if (!tenantId) {
    const err = new Error("Missing tenantId in tenantContext");
    err.code = "missing_tenant_context";
    err.statusCode = 500;
    throw err;
  }
  return tenantId;
}

function newTeamId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString("hex");
}

function encodeNextToken(lastEvaluatedKey) {
  if (!lastEvaluatedKey) return undefined;
  return Buffer.from(JSON.stringify(lastEvaluatedKey), "utf8").toString("base64");
}

function decodeNextToken(nextToken) {
  if (!nextToken) return undefined;

  if (typeof nextToken !== "string" || nextToken.length > 2048) {
    const err = new Error("Invalid nextToken");
    err.code = "invalid_next_token";
    err.statusCode = 400;
    throw err;
  }

  try {
    const json = Buffer.from(nextToken, "base64").toString("utf8");
    const key = JSON.parse(json);

    if (!key || typeof key !== "object") throw new Error("bad_token");
    if (
      !key.PK ||
      !key.SK ||
      typeof key.PK !== "object" ||
      typeof key.SK !== "object" ||
      typeof key.PK.S !== "string" ||
      typeof key.SK.S !== "string"
    ) {
      throw new Error("bad_token_shape");
    }

    return key;
  } catch {
    const err = new Error("Invalid nextToken");
    err.code = "invalid_next_token";
    err.statusCode = 400;
    throw err;
  }
}

function normalizeTeam(obj) {
  return {
    teamId: obj.teamId,
    tenantId: obj.tenantId,
    name: obj.name,
    sport: obj.sport,
    ageBand: obj.ageBand,
    ...(obj.level ? { level: obj.level } : {}),
    ...(obj.notes ? { notes: obj.notes } : {}),
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy,
  };
}

function normalizeAssignedSession(obj) {
  return {
    teamId: obj.teamId,
    sessionId: obj.sessionId,
    assignedAt: obj.assignedAt,
    assignedBy: obj.assignedBy,
    ...(obj.notes ? { notes: obj.notes } : {}),
    ...(obj.sessionCreatedAt ? { sessionCreatedAt: obj.sessionCreatedAt } : {}),
    ...(obj.sport ? { sport: obj.sport } : {}),
    ...(obj.ageBand ? { ageBand: obj.ageBand } : {}),
    ...(obj.durationMin !== undefined ? { durationMin: obj.durationMin } : {}),
    ...(Array.isArray(obj.objectiveTags) ? { objectiveTags: obj.objectiveTags } : {}),
  };
}

function normalizeSessionSummaryForAssignment(obj) {
  return {
    sessionId: obj.sessionId,
    sessionCreatedAt: obj.createdAt,
    sport: obj.sport,
    ageBand: obj.ageBand,
    durationMin: obj.durationMin,
    objectiveTags: obj.objectiveTags || [],
  };
}

function requireTeamId(teamId) {
  if (typeof teamId !== "string" || !teamId.trim()) {
    const err = new Error("teamId is required");
    err.code = "invalid_request";
    err.statusCode = 400;
    throw err;
  }

  return teamId.trim();
}

function requireSessionId(sessionId) {
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    const err = new Error("sessionId is required");
    err.code = "invalid_request";
    err.statusCode = 400;
    throw err;
  }

  return sessionId.trim();
}

class TeamRepository {
  constructor({ tableName }) {
    if (!tableName) {
      const err = new Error("TeamRepository requires tableName");
      err.code = "missing_table_name";
      err.statusCode = 500;
      throw err;
    }
    this.tableName = tableName;
  }

  async listTeams(tenantContext, { limit, nextToken } = {}) {
    const tenantId = requireTenantId(tenantContext);
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const exclusiveStartKey = decodeNextToken(nextToken);

    const res = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": { S: `TENANT#${tenantId}` },
          ":skPrefix": { S: "TEAM#" },
        },
        Limit: safeLimit,
        ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
      })
    );

    return {
      items: (res.Items ?? []).map((item) => normalizeTeam(unmarshall(item))),
      nextToken: encodeNextToken(res.LastEvaluatedKey),
    };
  }

  async getTeamById(tenantContext, teamId) {
    const tenantId = requireTenantId(tenantContext);
    const safeTeamId = requireTeamId(teamId);
    const res = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": { S: `TENANT#${tenantId}` },
          ":sk": { S: `TEAM#${safeTeamId}` },
        },
        ConsistentRead: true,
        Limit: 1,
      })
    );

    const item = res.Items?.[0];
    if (!item) return null;

    return {
      team: normalizeTeam(unmarshall(item)),
    };
  }

  async getSessionSummaryForAssignment(tenantContext, sessionId) {
    const tenantId = requireTenantId(tenantContext);
    const safeSessionId = requireSessionId(sessionId);
    const tenantPk = `TENANT#${tenantId}`;

    const lookupRes = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": { S: tenantPk },
          ":sk": { S: `SESSIONLOOKUP#${safeSessionId}` },
        },
        ConsistentRead: true,
        Limit: 1,
      })
    );

    const lookupItem = lookupRes.Items?.[0];
    if (!lookupItem) return null;

    const lookup = unmarshall(lookupItem);
    if (!lookup?.targetPK || !lookup?.targetSK) return null;

    const sessionRes = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": { S: lookup.targetPK },
          ":sk": { S: lookup.targetSK },
        },
        ConsistentRead: true,
        Limit: 1,
      })
    );

    const sessionItem = sessionRes.Items?.[0];
    if (!sessionItem) return null;

    return normalizeSessionSummaryForAssignment(unmarshall(sessionItem));
  }

  async getAssignedSessionByIds(tenantContext, { teamId, sessionId }) {
    const tenantId = requireTenantId(tenantContext);
    const safeTeamId = requireTeamId(teamId);
    const safeSessionId = requireSessionId(sessionId);

    const res = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": { S: `TENANT#${tenantId}` },
          ":sk": { S: `TEAMSESSION#${safeTeamId}#${safeSessionId}` },
        },
        ConsistentRead: true,
        Limit: 1,
      })
    );

    const item = res.Items?.[0];
    if (!item) return null;
    return normalizeAssignedSession(unmarshall(item));
  }

  async assignSessionToTeam(tenantContext, { teamId, sessionId, notes, sessionSummary }) {
    const tenantId = requireTenantId(tenantContext);
    const safeTeamId = requireTeamId(teamId);
    const safeSessionId = requireSessionId(sessionId);

    if (!sessionSummary || typeof sessionSummary !== "object") {
      const err = new Error("sessionSummary is required");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const existing = await this.getAssignedSessionByIds(tenantContext, {
      teamId: safeTeamId,
      sessionId: safeSessionId,
    });
    if (existing) {
      return { assignment: existing, created: false };
    }

    const assignmentItem = {
      PK: `TENANT#${tenantId}`,
      SK: `TEAMSESSION#${safeTeamId}#${safeSessionId}`,
      type: "TEAM_SESSION_ASSIGNMENT",
      teamId: safeTeamId,
      sessionId: safeSessionId,
      assignedAt: new Date().toISOString(),
      assignedBy: tenantContext?.userId || null,
      ...(notes !== undefined ? { notes } : {}),
      ...(sessionSummary.sessionCreatedAt ? { sessionCreatedAt: sessionSummary.sessionCreatedAt } : {}),
      ...(sessionSummary.sport ? { sport: sessionSummary.sport } : {}),
      ...(sessionSummary.ageBand ? { ageBand: sessionSummary.ageBand } : {}),
      ...(sessionSummary.durationMin !== undefined ? { durationMin: sessionSummary.durationMin } : {}),
      ...(Array.isArray(sessionSummary.objectiveTags)
        ? { objectiveTags: sessionSummary.objectiveTags }
        : {}),
    };

    try {
      await ddb.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall(assignmentItem),
          ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
        })
      );

      return {
        assignment: normalizeAssignedSession(assignmentItem),
        created: true,
      };
    } catch (err) {
      if (err?.name === "ConditionalCheckFailedException") {
        const replay = await this.getAssignedSessionByIds(tenantContext, {
          teamId: safeTeamId,
          sessionId: safeSessionId,
        });

        if (replay) {
          return { assignment: replay, created: false };
        }
      }

      throw err;
    }
  }

  async listAssignedSessionsForTeam(tenantContext, teamId) {
    const tenantId = requireTenantId(tenantContext);
    const safeTeamId = requireTeamId(teamId);

    const res = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": { S: `TENANT#${tenantId}` },
          ":skPrefix": { S: `TEAMSESSION#${safeTeamId}#` },
        },
      })
    );

    return {
      items: (res.Items ?? []).map((item) => normalizeAssignedSession(unmarshall(item))),
    };
  }

  async createTeam(tenantContext, input) {
    const tenantId = requireTenantId(tenantContext);
    const teamInput = validateCreateTeam(input);

    const now = new Date().toISOString();
    const teamId = newTeamId();
    const teamItem = {
      PK: `TENANT#${tenantId}`,
      SK: `TEAM#${teamId}`,
      type: "TEAM",
      teamId,
      tenantId,
      name: teamInput.name,
      sport: teamInput.sport,
      ageBand: teamInput.ageBand,
      ...(teamInput.level !== undefined ? { level: teamInput.level } : {}),
      ...(teamInput.notes !== undefined ? { notes: teamInput.notes } : {}),
      status: teamInput.status,
      createdAt: now,
      updatedAt: now,
      createdBy: tenantContext?.userId || null,
    };

    await ddb.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(teamItem),
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );

    return {
      team: normalizeTeam(teamItem),
    };
  }
}

module.exports = { TeamRepository };
