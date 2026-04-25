"use strict";

const {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const crypto = require("crypto");
const { validateCreateTeam, validateUpdateTeam } = require("./team-validate");

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

function requireUserId(tenantContext) {
  const userId = tenantContext?.userId;
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    const err = new Error("Missing userId in tenantContext");
    err.code = "missing_user_context";
    err.statusCode = 500;
    throw err;
  }
  return userId.trim();
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
    ...(obj.programType ? { programType: obj.programType } : {}),
    ...(obj.playerCount !== undefined ? { playerCount: obj.playerCount } : {}),
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy ?? null,
  };
}

function isAdminActor(tenantContext) {
  return tenantContext?.role === "admin";
}

function canAccessTeam(tenantContext, team) {
  if (isAdminActor(tenantContext)) {
    return true;
  }

  const userId = tenantContext?.userId;
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return false;
  }

  return team?.createdBy === userId.trim();
}

function toItemKey(item) {
  if (!item?.PK || !item?.SK) {
    return undefined;
  }

  return {
    PK: item.PK,
    SK: item.SK,
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

function normalizeAttendance(obj) {
  return {
    teamId: obj.teamId,
    sessionId: obj.sessionId,
    sessionDate: obj.sessionDate,
    status: obj.status,
    ...(obj.notes ? { notes: obj.notes } : {}),
    recordedAt: obj.recordedAt,
    recordedBy: obj.recordedBy,
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

function canAccessSessionForUse(tenantContext, session) {
  if (isAdminActor(tenantContext)) {
    return true;
  }

  const userId = tenantContext?.userId;
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return false;
  }

  return session?.createdBy === userId.trim();
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

function requireSessionDate(sessionDate) {
  if (typeof sessionDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    const err = new Error("sessionDate is required");
    err.code = "invalid_request";
    err.statusCode = 400;
    throw err;
  }

  return sessionDate;
}

function requireAttendanceStatus(status) {
  if (typeof status !== "string" || !["planned", "completed", "cancelled"].includes(status)) {
    const err = new Error("status is invalid");
    err.code = "invalid_request";
    err.statusCode = 400;
    throw err;
  }

  return status;
}

function attendanceSortKey(teamId, sessionDate, sessionId) {
  return `TEAMATTENDANCE#${teamId}#${sessionDate}#${sessionId}`;
}

function attendanceSortKeyPrefix(teamId) {
  return `TEAMATTENDANCE#${teamId}#`;
}

function normalizeAttendancePayload({ teamId, sessionId, sessionDate, status, notes }) {
  return {
    teamId,
    sessionId,
    sessionDate,
    status,
    ...(notes !== undefined ? { notes } : {}),
  };
}

function attendancePayloadMatches(existing, incoming) {
  return (
    JSON.stringify(normalizeAttendancePayload(existing)) ===
    JSON.stringify(normalizeAttendancePayload(incoming))
  );
}

function formatUtcDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function deriveCurrentWeekWindowUtc(now = new Date()) {
  const current = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  const currentDay = new Date(
    Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate())
  );
  const daysFromMonday = (currentDay.getUTCDay() + 6) % 7;
  const weekStartDate = new Date(currentDay.getTime());
  weekStartDate.setUTCDate(currentDay.getUTCDate() - daysFromMonday);

  const weekEndDate = new Date(weekStartDate.getTime());
  weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);

  return {
    weekStart: formatUtcDateOnly(weekStartDate),
    weekEnd: formatUtcDateOnly(weekEndDate),
  };
}

function pickWeeklyPlanningSessionSummary(obj) {
  const summary = {
    ...(obj?.sessionCreatedAt ? { sessionCreatedAt: obj.sessionCreatedAt } : {}),
    ...(obj?.sport ? { sport: obj.sport } : {}),
    ...(obj?.ageBand ? { ageBand: obj.ageBand } : {}),
    ...(obj?.durationMin !== undefined ? { durationMin: obj.durationMin } : {}),
    ...(Array.isArray(obj?.objectiveTags) ? { objectiveTags: obj.objectiveTags } : {}),
  };

  return Object.keys(summary).length > 0 ? summary : undefined;
}

function buildWeeklyPlanningSummary(items) {
  const summary = {
    attendanceCount: 0,
    assignmentOnlyCount: 0,
    completedCount: 0,
    plannedCount: 0,
    cancelledCount: 0,
  };

  for (const item of items || []) {
    if (item?.source === "attendance") {
      summary.attendanceCount += 1;
      if (item.status === "completed") summary.completedCount += 1;
      if (item.status === "planned") summary.plannedCount += 1;
      if (item.status === "cancelled") summary.cancelledCount += 1;
      continue;
    }

    if (item?.source === "assignment") {
      summary.assignmentOnlyCount += 1;
    }
  }

  return summary;
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
    let exclusiveStartKey = decodeNextToken(nextToken);

    const queryPage = async (startKey) =>
      ddb.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
          ExpressionAttributeValues: {
            ":pk": { S: `TENANT#${tenantId}` },
            ":skPrefix": { S: "TEAM#" },
          },
          Limit: safeLimit,
          ...(startKey ? { ExclusiveStartKey: startKey } : {}),
        })
      );

    if (isAdminActor(tenantContext)) {
      const res = await queryPage(exclusiveStartKey);

      return {
        items: (res.Items ?? []).map((item) => normalizeTeam(unmarshall(item))),
        nextToken: encodeNextToken(res.LastEvaluatedKey),
      };
    }

    const visibleItems = [];
    let nextVisibleTokenKey;

    while (visibleItems.length < safeLimit) {
      const res = await queryPage(exclusiveStartKey);
      const pageItems = res.Items ?? [];

      for (let index = 0; index < pageItems.length; index += 1) {
        const item = pageItems[index];
        const normalizedTeam = normalizeTeam(unmarshall(item));
        if (!canAccessTeam(tenantContext, normalizedTeam)) {
          continue;
        }

        visibleItems.push(normalizedTeam);

        if (visibleItems.length === safeLimit) {
          const hasMoreRawItems = index < pageItems.length - 1 || Boolean(res.LastEvaluatedKey);
          nextVisibleTokenKey = hasMoreRawItems ? toItemKey(item) : undefined;
          break;
        }
      }

      if (visibleItems.length === safeLimit || !res.LastEvaluatedKey) {
        break;
      }

      exclusiveStartKey = res.LastEvaluatedKey;
    }

    return {
      items: visibleItems,
      nextToken: encodeNextToken(nextVisibleTokenKey),
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

    const normalizedTeam = normalizeTeam(unmarshall(item));
    if (!canAccessTeam(tenantContext, normalizedTeam)) {
      return null;
    }

    return {
      team: normalizedTeam,
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

    const session = unmarshall(sessionItem);
    if (!canAccessSessionForUse(tenantContext, session)) {
      return null;
    }

    return normalizeSessionSummaryForAssignment(session);
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

  async getAttendanceByKey(tenantContext, { teamId, sessionDate, sessionId }) {
    const tenantId = requireTenantId(tenantContext);
    const safeTeamId = requireTeamId(teamId);
    const safeSessionDate = requireSessionDate(sessionDate);
    const safeSessionId = requireSessionId(sessionId);

    const res = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": { S: `TENANT#${tenantId}` },
          ":sk": { S: attendanceSortKey(safeTeamId, safeSessionDate, safeSessionId) },
        },
        ConsistentRead: true,
        Limit: 1,
      })
    );

    const item = res.Items?.[0];
    if (!item) return null;
    return normalizeAttendance(unmarshall(item));
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

  async createAttendanceForTeam(
    tenantContext,
    { teamId, sessionId, sessionDate, status, notes }
  ) {
    const tenantId = requireTenantId(tenantContext);
    const safeTeamId = requireTeamId(teamId);
    const safeSessionId = requireSessionId(sessionId);
    const safeSessionDate = requireSessionDate(sessionDate);
    const safeStatus = requireAttendanceStatus(status);

    const attendanceItem = {
      PK: `TENANT#${tenantId}`,
      SK: attendanceSortKey(safeTeamId, safeSessionDate, safeSessionId),
      type: "TEAM_ATTENDANCE",
      teamId: safeTeamId,
      sessionId: safeSessionId,
      sessionDate: safeSessionDate,
      status: safeStatus,
      ...(notes !== undefined ? { notes } : {}),
      recordedAt: new Date().toISOString(),
      recordedBy: tenantContext?.userId || null,
    };

    try {
      await ddb.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall(attendanceItem),
          ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
        })
      );

      return {
        attendance: normalizeAttendance(attendanceItem),
        created: true,
      };
    } catch (err) {
      if (err?.name === "ConditionalCheckFailedException") {
        const replay = await this.getAttendanceByKey(tenantContext, {
          teamId: safeTeamId,
          sessionDate: safeSessionDate,
          sessionId: safeSessionId,
        });

        if (replay) {
          const incoming = normalizeAttendancePayload({
            teamId: safeTeamId,
            sessionId: safeSessionId,
            sessionDate: safeSessionDate,
            status: safeStatus,
            ...(notes !== undefined ? { notes } : {}),
          });

          if (attendancePayloadMatches(replay, incoming)) {
            return { attendance: replay, created: false };
          }

          const conflict = new Error("Attendance already exists");
          conflict.code = "teams.attendance_exists";
          conflict.statusCode = 409;
          conflict.details = {
            entityType: "TEAM_ATTENDANCE",
            teamId: safeTeamId,
            sessionId: safeSessionId,
            sessionDate: safeSessionDate,
          };
          throw conflict;
        }
      }

      throw err;
    }
  }

  async listAttendanceForTeam(
    tenantContext,
    teamId,
    { startDate, endDate, limit, nextToken } = {}
  ) {
    const tenantId = requireTenantId(tenantContext);
    const safeTeamId = requireTeamId(teamId);
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const exclusiveStartKey = decodeNextToken(nextToken);
    const teamPrefix = attendanceSortKeyPrefix(safeTeamId);

    let keyConditionExpression = "PK = :pk AND begins_with(SK, :skPrefix)";
    const expressionAttributeValues = {
      ":pk": { S: `TENANT#${tenantId}` },
      ":skPrefix": { S: teamPrefix },
    };

    if (startDate || endDate) {
      keyConditionExpression = "PK = :pk AND SK BETWEEN :from AND :to";
      delete expressionAttributeValues[":skPrefix"];
      expressionAttributeValues[":from"] = {
        S: startDate ? `${teamPrefix}${requireSessionDate(startDate)}#` : teamPrefix,
      };
      expressionAttributeValues[":to"] = {
        S: endDate ? `${teamPrefix}${requireSessionDate(endDate)}#\uFFFF` : `${teamPrefix}\uFFFF`,
      };
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: safeLimit,
        ScanIndexForward: false,
        ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
      })
    );

    return {
      items: (res.Items ?? []).map((item) => normalizeAttendance(unmarshall(item))),
      nextToken: encodeNextToken(res.LastEvaluatedKey),
    };
  }

  async getWeeklyPlanningForTeam(tenantContext, teamId, { now } = {}) {
    const safeTeamId = requireTeamId(teamId);
    const { weekStart, weekEnd } = deriveCurrentWeekWindowUtc(now);

    const [assignmentResult, attendanceResult] = await Promise.all([
      this.listAssignedSessionsForTeam(tenantContext, safeTeamId),
      this.listAttendanceForTeam(tenantContext, safeTeamId, {
        startDate: weekStart,
        endDate: weekEnd,
      }),
    ]);

    const assignments = assignmentResult.items || [];
    const attendanceItems = attendanceResult.items || [];
    const assignmentBySessionId = new Map(
      assignments.map((assignment) => [assignment.sessionId, assignment])
    );
    const sessionsWithAttendance = new Set();

    const items = attendanceItems.map((attendance) => {
      sessionsWithAttendance.add(attendance.sessionId);
      const sessionSummary = pickWeeklyPlanningSessionSummary(
        assignmentBySessionId.get(attendance.sessionId)
      );

      return {
        sessionId: attendance.sessionId,
        source: "attendance",
        sessionDate: attendance.sessionDate,
        status: attendance.status,
        ...(attendance.notes ? { notes: attendance.notes } : {}),
        recordedAt: attendance.recordedAt,
        recordedBy: attendance.recordedBy,
        ...(sessionSummary ? { sessionSummary } : {}),
      };
    });

    for (const assignment of assignments) {
      if (sessionsWithAttendance.has(assignment.sessionId)) continue;

      const sessionSummary = pickWeeklyPlanningSessionSummary(assignment);
      items.push({
        sessionId: assignment.sessionId,
        source: "assignment",
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy,
        ...(sessionSummary ? { sessionSummary } : {}),
      });
    }

    return {
      teamId: safeTeamId,
      weekStart,
      weekEnd,
      summary: buildWeeklyPlanningSummary(items),
      items,
    };
  }

  async createTeam(tenantContext, input) {
    const tenantId = requireTenantId(tenantContext);
    const createdBy = requireUserId(tenantContext);
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
      ...(teamInput.programType !== undefined ? { programType: teamInput.programType } : {}),
      ...(teamInput.playerCount !== undefined ? { playerCount: teamInput.playerCount } : {}),
      status: teamInput.status,
      createdAt: now,
      updatedAt: now,
      createdBy,
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

  async updateTeam(tenantContext, teamId, input) {
    const tenantId = requireTenantId(tenantContext);
    const safeTeamId = requireTeamId(teamId);
    const teamInput = validateUpdateTeam(input);
    const existing = await this.getTeamById(tenantContext, safeTeamId);

    if (!existing?.team) {
      const err = new Error("Team not found");
      err.code = "teams.not_found";
      err.statusCode = 404;
      err.details = {
        entityType: "TEAM",
        teamId: safeTeamId,
      };
      throw err;
    }

    const currentTeam = existing.team;
    const updatedItem = {
      PK: `TENANT#${tenantId}`,
      SK: `TEAM#${safeTeamId}`,
      type: "TEAM",
      teamId: safeTeamId,
      tenantId,
      name: teamInput.name,
      sport: teamInput.sport,
      ageBand: teamInput.ageBand,
      ...(teamInput.level !== undefined ? { level: teamInput.level } : {}),
      ...(teamInput.notes !== undefined ? { notes: teamInput.notes } : {}),
      ...(teamInput.programType !== undefined ? { programType: teamInput.programType } : {}),
      ...(teamInput.playerCount !== undefined ? { playerCount: teamInput.playerCount } : {}),
      status: teamInput.status,
      createdAt: currentTeam.createdAt,
      updatedAt: new Date().toISOString(),
      createdBy: currentTeam.createdBy ?? null,
    };

    await ddb.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(updatedItem),
      })
    );

    return {
      team: normalizeTeam(updatedItem),
    };
  }
}

module.exports = { TeamRepository };
