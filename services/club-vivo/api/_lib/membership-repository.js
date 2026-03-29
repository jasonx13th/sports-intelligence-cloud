"use strict";

const { DynamoDBClient, PutItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

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

function normalizeMembership(obj) {
  return {
    tenantId: obj.tenantId,
    userSub: obj.userSub,
    role: obj.role,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

class MembershipRepository {
  constructor({ tableName }) {
    if (!tableName) {
      const err = new Error("MembershipRepository requires tableName");
      err.code = "missing_table_name";
      err.statusCode = 500;
      throw err;
    }
    this.tableName = tableName;
  }

  async putMembership(tenantContext, { userSub, role } = {}) {
    const tenantId = requireTenantId(tenantContext);

    if (!userSub || typeof userSub !== "string" || userSub.trim().length < 1) {
      const err = new Error("userSub is required");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    if (!role || typeof role !== "string" || role.trim().length < 1) {
      const err = new Error("role is required");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const normalizedUserSub = userSub.trim();
    const normalizedRole = role.trim();

    const now = new Date().toISOString();
    const membershipItem = {
      PK: `TENANT#${tenantId}`,
      SK: `MEMBERSHIP#USER#${normalizedUserSub}`,
      entityType: "Membership",
      tenantId,
      userSub: normalizedUserSub,
      role: normalizedRole,
      createdAt: now,
      updatedAt: now,
    };

    await ddb.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(membershipItem),
      })
    );

    return { membership: normalizeMembership(membershipItem) };
  }

  async listMemberships(tenantContext, { limit, nextToken } = {}) {
    const tenantId = requireTenantId(tenantContext);
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const exclusiveStartKey = decodeNextToken(nextToken);

    const res = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": { S: `TENANT#${tenantId}` },
          ":skPrefix": { S: "MEMBERSHIP#" },
        },
        Limit: safeLimit,
        ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
      })
    );

    return {
      items: (res.Items ?? []).map((item) => normalizeMembership(unmarshall(item))),
      nextToken: encodeNextToken(res.LastEvaluatedKey),
    };
  }
}

module.exports = { MembershipRepository };
