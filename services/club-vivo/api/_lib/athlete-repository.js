// services/club-vivo/api/src/repositories/athlete-repository.js
const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");

const ddb = new DynamoDBClient({});

function encodeNextToken(lastEvaluatedKey) {
  if (!lastEvaluatedKey) return undefined;
  return Buffer.from(JSON.stringify(lastEvaluatedKey), "utf8").toString("base64");
}

function decodeNextToken(nextToken) {
  if (!nextToken) return undefined;
  try {
    const json = Buffer.from(nextToken, "base64").toString("utf8");
    const key = JSON.parse(json);
    if (!key || typeof key !== "object") throw new Error("bad_token");
    return key;
  } catch {
    const err = new Error("Invalid nextToken");
    err.code = "invalid_next_token";
    err.statusCode = 400;
    throw err;
  }
}

class AthleteRepository {
  constructor({ tableName }) {
    if (!tableName) throw new Error("AthleteRepository requires tableName");
    this.tableName = tableName;
  }

  async listAthletes(tenantContext, { limit, nextToken } = {}) {
    const tenantId = tenantContext?.tenantId;
    if (!tenantId) {
      const err = new Error("Missing tenantId in tenantContext");
      err.code = "missing_tenant_context";
      err.statusCode = 500;
      throw err;
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const exclusiveStartKey = decodeNextToken(nextToken);

    const cmd = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": { S: `TENANT#${tenantId}` },
        ":skPrefix": { S: "ATHLETE#" },
      },
      Limit: safeLimit,
      ExclusiveStartKey: exclusiveStartKey,
    });

    const res = await ddb.send(cmd);

    return {
      items: res.Items ?? [],
      nextToken: encodeNextToken(res.LastEvaluatedKey),
    };
  }
}

module.exports = { AthleteRepository };