// services/club-vivo/api/src/domains/templates/template-repository.js
"use strict";

const {
  DynamoDBClient,
  QueryCommand,
  TransactWriteItemsCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");

const ddb = new DynamoDBClient({});

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

function newId() {
  return crypto.randomUUID();
}

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

function normalizeTemplate(obj, { includeActivities }) {
  const base = {
    templateId: obj.templateId,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy,
    name: obj.name,
    description: obj.description,
    sport: obj.sport,
    ageBand: obj.ageBand,
    durationMin: obj.durationMin,
    objectiveTags: obj.objectiveTags || [],
    tags: obj.tags || [],
    equipment: obj.equipment || [],
    usageCount: obj.usageCount || 0,
    lastGeneratedAt: obj.lastGeneratedAt,
    sourceSessionId: obj.sourceSessionId,
    schemaVersion: obj.schemaVersion,
  };

  if (includeActivities) {
    return {
      ...base,
      activities: obj.activities || [],
    };
  }

  return {
    templateId: base.templateId,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    name: base.name,
    description: base.description,
    sport: base.sport,
    ageBand: base.ageBand,
    durationMin: base.durationMin,
    objectiveTags: base.objectiveTags,
    tags: base.tags,
    usageCount: base.usageCount,
    lastGeneratedAt: base.lastGeneratedAt,
    activityCount: Array.isArray(obj.activities) ? obj.activities.length : 0,
  };
}

class TemplateRepository {
  constructor({ tableName }) {
    if (!tableName) {
      const err = new Error("TemplateRepository requires tableName");
      err.code = "missing_table_name";
      err.statusCode = 500;
      throw err;
    }
    this.tableName = tableName;
  }

  async createTemplate(tenantContext, templateInput) {
    const tenantId = requireTenantId(tenantContext);

    if (!templateInput || typeof templateInput !== "object") {
      const err = new Error("Missing template input");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const templateId = newId();
    const now = new Date().toISOString();

    const pk = `TENANT#${tenantId}`;
    const templateSk = `TEMPLATE#${now}#${templateId}`;
    const lookupSk = `TEMPLATELOOKUP#${templateId}`;

    const templateItem = {
      PK: pk,
      SK: templateSk,
      type: "TEMPLATE",
      templateId,
      createdAt: now,
      updatedAt: now,
      createdBy: tenantContext?.userId || null,
      schemaVersion: 1,

      name: templateInput.name,
      ...(templateInput.description ? { description: templateInput.description } : {}),
      sport: templateInput.sport,
      ageBand: templateInput.ageBand,
      durationMin: templateInput.durationMin,
      objectiveTags: templateInput.objectiveTags || [],
      tags: templateInput.tags || [],
      equipment: templateInput.equipment || [],
      activities: templateInput.activities || [],
      usageCount: 0,

      ...(templateInput.sourceSessionId ? { sourceSessionId: templateInput.sourceSessionId } : {}),
    };

    const lookupItem = {
      PK: pk,
      SK: lookupSk,
      type: "TEMPLATE_LOOKUP",
      templateId,
      createdAt: now,
      targetPK: pk,
      targetSK: templateSk,
    };

    await ddb.send(
      new TransactWriteItemsCommand({
        ReturnCancellationReasons: true,
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: marshall(templateItem),
              ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: marshall(lookupItem),
              ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            },
          },
        ],
      })
    );

    return {
      template: normalizeTemplate(templateItem, { includeActivities: true }),
    };
  }

  async listTemplates(tenantContext, { limit, nextToken } = {}) {
    const tenantId = requireTenantId(tenantContext);

    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const exclusiveStartKey = decodeNextToken(nextToken);

    const cmd = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": { S: `TENANT#${tenantId}` },
        ":skPrefix": { S: "TEMPLATE#" },
      },
      ScanIndexForward: false,
      Limit: safeLimit,
      ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
    });

    const res = await ddb.send(cmd);

    const items = (res.Items ?? []).map((it) => {
      const obj = unmarshall(it);
      return normalizeTemplate(obj, { includeActivities: false });
    });

    return {
      items,
      nextToken: encodeNextToken(res.LastEvaluatedKey),
    };
  }

  async getTemplateById(tenantContext, templateId) {
    const tenantId = requireTenantId(tenantContext);

    if (!templateId || typeof templateId !== "string" || templateId.length > 128) {
      const err = new Error("Missing or invalid templateId");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const pk = `TENANT#${tenantId}`;
    const lookupSk = `TEMPLATELOOKUP#${templateId}`;

    const lookupRes = await ddb.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ PK: pk, SK: lookupSk }),
        ConsistentRead: true,
      })
    );

    if (!lookupRes.Item) return null;

    const lookup = unmarshall(lookupRes.Item);
    if (!lookup?.targetPK || !lookup?.targetSK) return null;

    const templateRes = await ddb.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ PK: lookup.targetPK, SK: lookup.targetSK }),
        ConsistentRead: true,
      })
    );

    if (!templateRes.Item) return null;

    const obj = unmarshall(templateRes.Item);
    return normalizeTemplate(obj, { includeActivities: true });
  }

  async markTemplateGenerated(tenantContext, templateId) {
    const tenantId = requireTenantId(tenantContext);

    if (!templateId || typeof templateId !== "string" || templateId.length > 128) {
      const err = new Error("Missing or invalid templateId");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const existing = await this.getTemplateById(tenantContext, templateId);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const nextUsageCount = Number(existing.usageCount || 0) + 1;

    const pk = `TENANT#${tenantId}`;
    const templateSk = `TEMPLATE#${existing.createdAt}#${templateId}`;

    await ddb.send(
      new TransactWriteItemsCommand({
        ReturnCancellationReasons: true,
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: marshall({
                PK: pk,
                SK: templateSk,
                type: "TEMPLATE",
                templateId,
                createdAt: existing.createdAt,
                updatedAt: now,
                createdBy: existing.createdBy || null,
                schemaVersion: existing.schemaVersion || 1,
                name: existing.name,
                ...(existing.description ? { description: existing.description } : {}),
                sport: existing.sport,
                ageBand: existing.ageBand,
                durationMin: existing.durationMin,
                objectiveTags: existing.objectiveTags || [],
                tags: existing.tags || [],
                equipment: existing.equipment || [],
                activities: existing.activities || [],
                usageCount: nextUsageCount,
                lastGeneratedAt: now,
                ...(existing.sourceSessionId ? { sourceSessionId: existing.sourceSessionId } : {}),
              }),
              ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
            },
          },
        ],
      })
    );

    return {
      ...existing,
      updatedAt: now,
      usageCount: nextUsageCount,
      lastGeneratedAt: now,
    };
  }
}

module.exports = { TemplateRepository };
