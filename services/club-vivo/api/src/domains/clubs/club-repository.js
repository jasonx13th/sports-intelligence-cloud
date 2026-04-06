"use strict";

const {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { ConflictError } = require("../../platform/errors/errors");

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

function normalizeClub(obj) {
  return {
    clubId: obj.clubId,
    tenantId: obj.tenantId,
    name: obj.name,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy,
  };
}

class ClubRepository {
  constructor({ tableName }) {
    if (!tableName) {
      const err = new Error("ClubRepository requires tableName");
      err.code = "missing_table_name";
      err.statusCode = 500;
      throw err;
    }
    this.tableName = tableName;
  }

  async getClub(tenantContext) {
    const tenantId = requireTenantId(tenantContext);
    const pk = `TENANT#${tenantId}`;
    const sk = `CLUB#${tenantId}`;

    const res = await ddb.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ PK: pk, SK: sk }),
        ConsistentRead: true,
      })
    );

    if (!res.Item) return null;

    return {
      club: normalizeClub(unmarshall(res.Item)),
    };
  }

  async createClub(tenantContext, input) {
    const tenantId = requireTenantId(tenantContext);
    const name = input?.name;

    if (!name || typeof name !== "string" || name.trim().length < 1 || name.length > 120) {
      const err = new Error("name is required");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const clubItem = {
      PK: `TENANT#${tenantId}`,
      SK: `CLUB#${tenantId}`,
      type: "CLUB",
      clubId: tenantId,
      tenantId,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      createdBy: tenantContext?.userId || null,
    };

    try {
      await ddb.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall(clubItem),
          ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
        })
      );
    } catch (err) {
      if (err?.name === "ConditionalCheckFailedException") {
        throw new ConflictError({
          code: "clubs.already_exists",
          message: "Conflict",
          details: { entityType: "CLUB" },
          cause: err,
        });
      }
      throw err;
    }

    return {
      club: normalizeClub(clubItem),
    };
  }
}

module.exports = { ClubRepository };
