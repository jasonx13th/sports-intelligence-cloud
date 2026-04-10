// services/club-vivo/api/src/domains/sessions/session-repository.js
"use strict";

const {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  TransactWriteItemsCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");

const ddb = new DynamoDBClient({});

/**
 * Cursor helpers (pagination) — mirrored from athlete-repository.js
 */
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

function normalizeSession(obj, { includeActivities }) {
  // obj is unmarshalled item
  const base = {
    sessionId: obj.sessionId,
    createdAt: obj.createdAt,
    createdBy: obj.createdBy,
    sport: obj.sport,
    ageBand: obj.ageBand,
    durationMin: obj.durationMin,
    objectiveTags: obj.objectiveTags || [],
    tags: obj.tags || [],
    equipment: obj.equipment || [],
    clubId: obj.clubId,
    teamId: obj.teamId,
    seasonId: obj.seasonId,
    sourceTemplateId: obj.sourceTemplateId,
    schemaVersion: obj.schemaVersion,
  };

  if (includeActivities) {
    return { ...base, activities: obj.activities || [] };
  }

  // summary: omit activities
  return {
    sessionId: base.sessionId,
    createdAt: base.createdAt,
    sport: base.sport,
    ageBand: base.ageBand,
    durationMin: base.durationMin,
    objectiveTags: base.objectiveTags,
    activityCount: Array.isArray(obj.activities) ? obj.activities.length : 0,
  };
}

function normalizeSessionFeedback(obj) {
  return {
    sessionId: obj.sessionId,
    submittedAt: obj.submittedAt,
    submittedBy: obj.submittedBy,
    rating: obj.rating,
    runStatus: obj.runStatus,
    ...(obj.objectiveMet !== undefined ? { objectiveMet: obj.objectiveMet } : {}),
    ...(obj.difficulty !== undefined ? { difficulty: obj.difficulty } : {}),
    ...(obj.wouldReuse !== undefined ? { wouldReuse: obj.wouldReuse } : {}),
    ...(obj.notes !== undefined ? { notes: obj.notes } : {}),
    ...(obj.changesNextTime !== undefined ? { changesNextTime: obj.changesNextTime } : {}),
    schemaVersion: obj.schemaVersion,
  };
}

const SESSION_EVENT_TYPES = new Set([
  "session_generated",
  "session_exported",
  "feedback_submitted",
  "session_run_confirmed",
]);

function validateSessionEventType(eventType) {
  if (!SESSION_EVENT_TYPES.has(eventType)) {
    const err = new Error("Invalid session event type");
    err.code = "invalid_session_event_type";
    err.statusCode = 400;
    err.details = { eventType };
    throw err;
  }

  return eventType;
}

function requireSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 128) {
    const err = new Error("Missing or invalid sessionId");
    err.code = "invalid_request";
    err.statusCode = 400;
    throw err;
  }

  return sessionId;
}

function normalizeSessionEventMetadata(metadata) {
  if (metadata === undefined) return undefined;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    const err = new Error("Invalid session event metadata");
    err.code = "invalid_request";
    err.statusCode = 400;
    throw err;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) continue;

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
      continue;
    }

    if (value === null) {
      sanitized[key] = null;
      continue;
    }

    const err = new Error("Invalid session event metadata");
    err.code = "invalid_request";
    err.statusCode = 400;
    err.details = { key };
    throw err;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

class SessionRepository {
  constructor({ tableName }) {
    if (!tableName) {
      const err = new Error("SessionRepository requires tableName");
      err.code = "missing_table_name";
      err.statusCode = 500;
      throw err;
    }
    this.tableName = tableName;
  }

  /**
   * createSession (atomic write of Session + SessionLookup)
   * - Uses TransactWriteItems
   * - Both puts are conditional (fail if either exists)
   */
  async createSession(tenantContext, sessionInput, options = {}) {
    const tenantId = requireTenantId(tenantContext);

    if (!sessionInput || typeof sessionInput !== "object") {
      const err = new Error("Missing session input");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const sessionId = newId();
    const now = new Date().toISOString();

    const pk = `TENANT#${tenantId}`;
    const sessionSk = `SESSION#${now}#${sessionId}`;
    const lookupSk = `SESSIONLOOKUP#${sessionId}`;

    const sessionItem = {
      PK: pk,
      SK: sessionSk,
      type: "SESSION",
      sessionId,
      createdAt: now,
      createdBy: tenantContext?.userId || null,
      schemaVersion: 1,

      // domain fields (already validated upstream)
      sport: sessionInput.sport,
      ageBand: sessionInput.ageBand,
      durationMin: sessionInput.durationMin,
      objectiveTags: sessionInput.objectiveTags || [],
      tags: sessionInput.tags || [],
      equipment: sessionInput.equipment || [],
      activities: sessionInput.activities || [],

      ...(sessionInput.clubId ? { clubId: sessionInput.clubId } : {}),
      ...(sessionInput.teamId ? { teamId: sessionInput.teamId } : {}),
      ...(sessionInput.seasonId ? { seasonId: sessionInput.seasonId } : {}),
      ...(sessionInput.sourceTemplateId ? { sourceTemplateId: sessionInput.sourceTemplateId } : {}),
    };

    const lookupItem = {
      PK: pk,
      SK: lookupSk,
      type: "SESSION_LOOKUP",
      sessionId,
      createdAt: now,
      targetPK: pk,
      targetSK: sessionSk,
    };

    const eventTransactItems = options.sessionGeneratedEventMetadata
      ? [
          this.buildSessionEventTransactItem(tenantContext, {
            sessionId,
            eventType: "session_generated",
            occurredAt: now,
            metadata: options.sessionGeneratedEventMetadata,
          }),
        ]
      : [];

    await ddb.send(
      new TransactWriteItemsCommand({
        ReturnCancellationReasons: true,
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: marshall(sessionItem),
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
          ...eventTransactItems,
        ],
      })
    );

    return {
      session: normalizeSession(sessionItem, { includeActivities: true }),
    };
  }

  /**
   * listSessions (tenant-scoped, time-ordered)
   * Access pattern:
   * - PK = TENANT#<tenantId>
   * - SK begins_with SESSION#
   *
   * Returns summaries only (no activities[]).
   */
  async listSessions(tenantContext, { limit, nextToken } = {}) {
    const tenantId = requireTenantId(tenantContext);

    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const exclusiveStartKey = decodeNextToken(nextToken);

    const cmd = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": { S: `TENANT#${tenantId}` },
        ":skPrefix": { S: "SESSION#" },
      },
      // newest first
      ScanIndexForward: false,
      Limit: safeLimit,
      ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
    });

    const res = await ddb.send(cmd);

    const items = (res.Items ?? []).map((it) => {
      const obj = unmarshall(it);
      return normalizeSession(obj, { includeActivities: false });
    });

    return {
      items,
      nextToken: encodeNextToken(res.LastEvaluatedKey),
    };
  }

  /**
   * getSessionById (tenant-scoped, 2-step GetItem)
   * 1) Get lookup item by sessionId
   * 2) Get target session item by targetPK/targetSK
   */
  async getSessionById(tenantContext, sessionId) {
    const tenantId = requireTenantId(tenantContext);

    requireSessionId(sessionId);

    const pk = `TENANT#${tenantId}`;
    const lookupSk = `SESSIONLOOKUP#${sessionId}`;

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

    const sessionRes = await ddb.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ PK: lookup.targetPK, SK: lookup.targetSK }),
        ConsistentRead: true,
      })
    );

    if (!sessionRes.Item) return null;

    const obj = unmarshall(sessionRes.Item);
    return normalizeSession(obj, { includeActivities: true });
  }

  buildSessionEventItem(tenantContext, { sessionId, eventType, occurredAt, actorUserId, metadata } = {}) {
    const tenantId = requireTenantId(tenantContext);
    requireSessionId(sessionId);
    validateSessionEventType(eventType);

    const effectiveOccurredAt = occurredAt || new Date().toISOString();
    const eventId = newId();
    const normalizedMetadata = normalizeSessionEventMetadata(metadata);

    return {
      PK: `TENANT#${tenantId}`,
      SK: `SESSIONEVENT#${sessionId}#${effectiveOccurredAt}#${eventType}`,
      type: "SESSION_EVENT",
      eventId,
      sessionId,
      eventType,
      occurredAt: effectiveOccurredAt,
      actorUserId: actorUserId || tenantContext?.userId || null,
      schemaVersion: 1,
      ...(normalizedMetadata ? { metadata: normalizedMetadata } : {}),
    };
  }

  buildSessionEventTransactItem(tenantContext, eventInput) {
    const eventItem = this.buildSessionEventItem(tenantContext, eventInput);

    return {
      Put: {
        TableName: this.tableName,
        Item: marshall(eventItem),
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      },
    };
  }

  buildFeedbackEventTransactItems(
    tenantContext,
    { sessionId, runStatus, occurredAt, actorUserId, feedbackMetadata, runConfirmedMetadata } = {}
  ) {
    const effectiveOccurredAt = occurredAt || new Date().toISOString();
    const transactItems = [
      this.buildSessionEventTransactItem(tenantContext, {
        sessionId,
        eventType: "feedback_submitted",
        occurredAt: effectiveOccurredAt,
        actorUserId,
        metadata: feedbackMetadata,
      }),
    ];

    if (runStatus && runStatus !== "not_run") {
      transactItems.push(
        this.buildSessionEventTransactItem(tenantContext, {
          sessionId,
          eventType: "session_run_confirmed",
          occurredAt: effectiveOccurredAt,
          actorUserId,
          metadata: runConfirmedMetadata,
        })
      );
    }

    return transactItems;
  }

  async writeSessionExportedEvent(
    tenantContext,
    { sessionId, occurredAt, actorUserId, metadata } = {}
  ) {
    const eventItem = this.buildSessionEventItem(tenantContext, {
      sessionId,
      eventType: "session_exported",
      occurredAt,
      actorUserId,
      metadata,
    });

    await ddb.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(eventItem),
        ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );

    return { event: eventItem };
  }

  async createSessionFeedback(tenantContext, sessionId, feedbackInput, options = {}) {
    const tenantId = requireTenantId(tenantContext);
    requireSessionId(sessionId);

    if (!feedbackInput || typeof feedbackInput !== "object") {
      const err = new Error("Missing feedback input");
      err.code = "invalid_request";
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const feedbackItem = {
      PK: `TENANT#${tenantId}`,
      SK: `SESSIONFEEDBACK#${sessionId}`,
      type: "SESSION_FEEDBACK",
      sessionId,
      submittedAt: now,
      submittedBy: tenantContext?.userId || null,
      schemaVersion: 1,
      rating: feedbackInput.rating,
      runStatus: feedbackInput.runStatus,
      ...(feedbackInput.objectiveMet !== undefined ? { objectiveMet: feedbackInput.objectiveMet } : {}),
      ...(feedbackInput.difficulty !== undefined ? { difficulty: feedbackInput.difficulty } : {}),
      ...(feedbackInput.wouldReuse !== undefined ? { wouldReuse: feedbackInput.wouldReuse } : {}),
      ...(feedbackInput.notes !== undefined ? { notes: feedbackInput.notes } : {}),
      ...(feedbackInput.changesNextTime !== undefined
        ? { changesNextTime: feedbackInput.changesNextTime }
        : {}),
    };

    const eventTransactItems = this.buildFeedbackEventTransactItems(tenantContext, {
      sessionId,
      runStatus: feedbackInput.runStatus,
      occurredAt: now,
      feedbackMetadata: options.feedbackEventMetadata,
      runConfirmedMetadata: options.runConfirmedEventMetadata,
    });

    try {
      await ddb.send(
        new TransactWriteItemsCommand({
          ReturnCancellationReasons: true,
          TransactItems: [
            {
              Put: {
                TableName: this.tableName,
                Item: marshall(feedbackItem),
                ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
              },
            },
            ...eventTransactItems,
          ],
        })
      );
    } catch (err) {
      const hasConditionalFailure =
        err?.name === "ConditionalCheckFailedException" ||
        (err?.name === "TransactionCanceledException" &&
          Array.isArray(err?.CancellationReasons) &&
          err.CancellationReasons.some((reason) => reason?.Code === "ConditionalCheckFailed"));

      if (hasConditionalFailure) {
        const conflictErr = new Error("Feedback already exists");
        conflictErr.code = "sessions.feedback_exists";
        conflictErr.statusCode = 409;
        conflictErr.details = { entityType: "SESSION_FEEDBACK", sessionId };
        throw conflictErr;
      }

      throw err;
    }

    return {
      feedback: normalizeSessionFeedback(feedbackItem),
    };
  }
}

module.exports = { SessionRepository };
