"use strict";

const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
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

function normalizeMethodology(obj) {
  return {
    scope: obj.scope,
    title: obj.title,
    content: obj.content,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy ?? null,
    updatedBy: obj.updatedBy ?? null,
  };
}

class MethodologyRepository {
  constructor({ tableName }) {
    if (!tableName) {
      const err = new Error("MethodologyRepository requires tableName");
      err.code = "missing_table_name";
      err.statusCode = 500;
      throw err;
    }

    this.tableName = tableName;
  }

  async getMethodologyByScope(tenantContext, scope) {
    const tenantId = requireTenantId(tenantContext);
    const result = await ddb.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({
          PK: `TENANT#${tenantId}`,
          SK: `METHODOLOGY#${scope}`,
        }),
        ConsistentRead: true,
      })
    );

    if (!result.Item) return null;

    return {
      methodology: normalizeMethodology(unmarshall(result.Item)),
    };
  }

  async putMethodology(tenantContext, methodology) {
    const tenantId = requireTenantId(tenantContext);
    const item = {
      PK: `TENANT#${tenantId}`,
      SK: `METHODOLOGY#${methodology.scope}`,
      entityType: "METHODOLOGY",
      scope: methodology.scope,
      title: methodology.title,
      content: methodology.content,
      status: methodology.status,
      createdAt: methodology.createdAt,
      updatedAt: methodology.updatedAt,
      createdBy: methodology.createdBy ?? null,
      updatedBy: methodology.updatedBy ?? null,
    };

    await ddb.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(item),
      })
    );

    return {
      methodology: normalizeMethodology(item),
    };
  }
}

module.exports = {
  MethodologyRepository,
};
