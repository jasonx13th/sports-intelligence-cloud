// services/club-vivo/api/src/domains/athletes/athlete-repository.js
"use strict";

/**
 * ---------------------------------------------
 * Imports + AWS SDK clients
 * ---------------------------------------------
 * DynamoDBClient:
 *   - Low-level DynamoDB client (v3) used to send commands.
 * QueryCommand:
 *   - Used for tenant-scoped listing (Query, not Scan).
 * TransactWriteItemsCommand:
 *   - Used for idempotent create (atomic write of idempotency record + athlete record + audit record).
 * GetItemCommand:
 *   - Used to fetch idempotency record + original athlete on replay + fetch athlete by id.
 *
 * marshall/unmarshall:
 *   - Converts JS objects <-> DynamoDB AttributeValue maps safely.
 *
 * crypto:
 *   - Used to generate server-side UUIDs for athleteId.
 */
const {
  DynamoDBClient,
  QueryCommand,
  TransactWriteItemsCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");

// Single DynamoDB client instance reused across invocations (best practice in Lambda)
const ddb = new DynamoDBClient({});

/**
 * ---------------------------------------------
 * Cursor helpers (pagination)
 * ---------------------------------------------
 * encodeNextToken:
 *   - Takes DynamoDB LastEvaluatedKey and turns it into an opaque base64 token.
 *
 * decodeNextToken:
 *   - Converts base64 token back into LastEvaluatedKey.
 *   - Enforces strict validation so clients can’t crash us or inject weird shapes.
 */
function encodeNextToken(lastEvaluatedKey) {
  if (!lastEvaluatedKey) return undefined;
  return Buffer.from(JSON.stringify(lastEvaluatedKey), "utf8").toString("base64");
}

function decodeNextToken(nextToken) {
  if (!nextToken) return undefined;

  // Hard cap to avoid abuse (oversized tokens)
  if (typeof nextToken !== "string" || nextToken.length > 2048) {
    const err = new Error("Invalid nextToken");
    err.code = "invalid_next_token";
    err.statusCode = 400;
    throw err;
  }

  try {
    const json = Buffer.from(nextToken, "base64").toString("utf8");
    const key = JSON.parse(json);

    // Basic shape check (LastEvaluatedKey should be an object of AttributeValues)
    if (!key || typeof key !== "object") throw new Error("bad_token");

    // Stricter checks for our access pattern: expect PK/SK string attributes
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

/**
 * ---------------------------------------------
 * ID helper
 * ---------------------------------------------
 * newId:
 *   - Generates a UUID for new athlete records.
 *   - Server-generated IDs avoid client collisions and keep control in the backend.
 */
function newId() {
  return crypto.randomUUID();
}

/**
 * ---------------------------------------------
 * AthleteRepository (tenant-safe boundary)
 * ---------------------------------------------
 * This repository is the “data access wall.”
 * It enforces:
 * - Tenant scoping by construction (PK is always TENANT#<tenantId>)
 * - DynamoDB Query patterns (no Scan access pattern in code)
 */
class AthleteRepository {
  /**
   * ---------------------------------------------
   * Constructor
   * ---------------------------------------------
   * tableName is injected from the Lambda environment (SIC_DOMAIN_TABLE).
   * This avoids hard-coding infra names inside business logic.
   */
  constructor({ tableName }) {
    if (!tableName) {
      const err = new Error("AthleteRepository requires tableName");
      err.code = "missing_table_name";
      err.statusCode = 500;
      throw err;
    }
    this.tableName = tableName;
  }

  /**
   * ---------------------------------------------
   * getAthlete (tenant-scoped)
   * ---------------------------------------------
   * Access pattern:
   * - PK = TENANT#<tenantId>
   * - SK = ATHLETE#<athleteId>
   *
   * Returns:
   * - null if not found
   * - normalized athlete object if found
   */
  async getAthlete(tenantContext, athleteId) {
    const tenantId = tenantContext?.tenantId;
    if (!tenantId) {
      const err = new Error("Missing tenantId in tenantContext");
      err.code = "missing_tenant_context";
      err.statusCode = 500;
      throw err;
    }

    if (!athleteId || typeof athleteId !== "string" || athleteId.length > 128) {
      const err = new Error("Missing or invalid athleteId");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const pk = `TENANT#${tenantId}`;
    const sk = `ATHLETE#${athleteId}`;

    const res = await ddb.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ PK: pk, SK: sk }),
        ConsistentRead: true,
      })
    );

    if (!res.Item) return null;

    const obj = unmarshall(res.Item);
    return {
      athleteId: obj.athleteId,
      displayName: obj.displayName,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  /**
   * ---------------------------------------------
   * listAthletes (tenant-scoped)
   * ---------------------------------------------
   * Access pattern:
   * - PK = TENANT#<tenantId>
   * - SK begins_with ATHLETE#
   *
   * Inputs:
   * - tenantContext.tenantId must be present (authoritative from entitlements)
   * - limit: clamped to [1..50]
   * - nextToken: opaque cursor (base64 LastEvaluatedKey)
   *
   * Output:
   * - items: clean JSON objects (NOT DynamoDB AttributeValue maps)
   * - nextToken: new cursor if there are more results
   */
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
      ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
    });

    const res = await ddb.send(cmd);

    const items = (res.Items ?? []).map((it) => {
      const obj = unmarshall(it);
      return {
        athleteId: obj.athleteId,
        displayName: obj.displayName,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      };
    });

    return {
      items,
      nextToken: encodeNextToken(res.LastEvaluatedKey),
    };
  }

  /**
   * ---------------------------------------------
   * createAthlete (idempotent, Option A)
   * ---------------------------------------------
   * Output:
   * - { athlete: <normalized>, replayed: boolean }
   */
  async createAthlete(tenantContext, input, idempotencyKey) {
    const tenantId = tenantContext?.tenantId;
    if (!tenantId) {
      const err = new Error("Missing tenantId in tenantContext");
      err.code = "missing_tenant_context";
      err.statusCode = 500;
      throw err;
    }

    // Idempotency key validation
    if (!idempotencyKey || typeof idempotencyKey !== "string" || idempotencyKey.length > 200) {
      const err = new Error("Missing or invalid Idempotency-Key");
      err.code = "invalid_idempotency_key";
      err.statusCode = 400;
      throw err;
    }

    // Minimal payload validation for v1
    const displayName = input?.displayName;
    if (
      !displayName ||
      typeof displayName !== "string" ||
      displayName.trim().length < 1 ||
      displayName.length > 120
    ) {
      const err = new Error("displayName is required");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const athleteId = newId();
    const now = new Date().toISOString();

    // Tenant-partitioned single-table keys
    const pk = `TENANT#${tenantId}`;
    const athleteSk = `ATHLETE#${athleteId}`;
    const idemSk = `IDEMPOTENCY#${idempotencyKey}`;

    // Idempotency record stores pointer to the created athleteId
    const idemItem = {
      PK: pk,
      SK: idemSk,
      type: "IDEMPOTENCY",
      entity: "ATHLETE",
      athleteId,
      createdAt: now,
    };

    // Athlete record (internal shape includes PK/SK; do NOT return this directly)
    const athleteItem = {
      PK: pk,
      SK: athleteSk,
      type: "ATHLETE",
      athleteId,
      displayName: displayName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    // Audit record (append-only, minimal payload)
    const auditSk = `AUDIT#${now}#CREATE_ATHLETE#${athleteId}`;
    const auditItem = {
      PK: pk,
      SK: auditSk,
      type: "AUDIT",
      action: "CREATE_ATHLETE",
      entityType: "ATHLETE",
      entityId: athleteId,
      createdAt: now,
      replayed: false,
    };

    try {
      await ddb.send(
        new TransactWriteItemsCommand({
          ReturnCancellationReasons: true,
          TransactItems: [
            {
              Put: {
                TableName: this.tableName,
                Item: marshall(idemItem),
                ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
              },
            },
            {
              Put: {
                TableName: this.tableName,
                Item: marshall(athleteItem),
              },
            },
            {
              Put: {
                TableName: this.tableName,
                Item: marshall(auditItem),
              },
            },
          ],
        })
      );

      // ✅ Normalize first-write response (no PK/SK leakage)
      return {
        athlete: {
          athleteId: athleteItem.athleteId,
          displayName: athleteItem.displayName,
          createdAt: athleteItem.createdAt,
          updatedAt: athleteItem.updatedAt,
        },
        replayed: false,
      };
    } catch (e) {
      // Replay handling (hardened)
      if (e?.name !== "TransactionCanceledException") throw e;

      const reasons = e?.CancellationReasons || e?.cancellationReasons || null;

      if (Array.isArray(reasons) && reasons.length > 0) {
        const first = reasons[0];
        const code = first?.Code || first?.code || null;

        if (code !== "ConditionalCheckFailed") {
          const err = new Error("DynamoDB transaction canceled");
          err.code = "dynamodb_transaction_failed";
          err.statusCode = 500;
          err.details = { cancellationCode: code };
          throw err;
        }
      }

      // Fetch idempotency record
      const idemRes = await ddb.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: marshall({ PK: pk, SK: idemSk }),
          ConsistentRead: true,
        })
      );

      const idem = idemRes.Item ? unmarshall(idemRes.Item) : null;
      if (!idem?.athleteId) {
        const err = new Error("Idempotency conflict but no record found");
        err.code = "idempotency_inconsistent_state";
        err.statusCode = 500;
        throw err;
      }

      // Fetch the originally-created athlete
      const athleteRes = await ddb.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: marshall({ PK: pk, SK: `ATHLETE#${idem.athleteId}` }),
          ConsistentRead: true,
        })
      );

      const athlete = athleteRes.Item ? unmarshall(athleteRes.Item) : null;
      if (!athlete) {
        const err = new Error("Idempotency record exists but athlete missing");
        err.code = "idempotency_orphaned_record";
        err.statusCode = 500;
        throw err;
      }

      // Normalize replayed athlete (avoid leaking PK/SK)
      return {
        athlete: {
          athleteId: athlete.athleteId,
          displayName: athlete.displayName,
          createdAt: athlete.createdAt,
          updatedAt: athlete.updatedAt,
        },
        replayed: true,
      };
    }
  }
}

module.exports = { AthleteRepository };
