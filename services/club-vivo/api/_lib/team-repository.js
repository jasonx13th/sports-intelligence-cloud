"use strict";

const {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");

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
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy,
  };
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

  async createTeam(tenantContext, input) {
    const tenantId = requireTenantId(tenantContext);
    const name = input?.name;

    if (!name || typeof name !== "string" || name.trim().length < 1 || name.length > 120) {
      const err = new Error("name is required");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const teamId = newTeamId();
    const teamItem = {
      PK: `TENANT#${tenantId}`,
      SK: `TEAM#${teamId}`,
      type: "TEAM",
      teamId,
      tenantId,
      name: name.trim(),
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
