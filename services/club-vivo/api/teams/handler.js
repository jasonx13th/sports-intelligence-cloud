"use strict";

const { withPlatform } = require("../src/platform/http/with-platform");
const { parseJsonBody } = require("../src/platform/http/parse-body");
const { TeamRepository } = require("../src/domains/teams/team-repository");
const { validateCreateTeam, validateUpdateTeam } = require("../src/domains/teams/team-validate");
const {
  validateAssignSession,
} = require("../src/domains/teams/team-session-assignment-validate");
const {
  validateCreateAttendance,
  validateListAttendanceQuery,
} = require("../src/domains/teams/team-attendance-validate");
const {
  validateWeeklyPlanningQuery,
} = require("../src/domains/teams/team-weekly-planning-validate");
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
  InternalError,
} = require("../src/platform/errors/errors");

function assertEnv() {
  const missing = [];
  if (!process.env.SIC_DOMAIN_TABLE) missing.push("SIC_DOMAIN_TABLE");
  if (missing.length) {
    throw new InternalError({
      code: "platform.misconfig.missing_env",
      message: "Internal server error",
      details: { missing },
      retryable: false,
    });
  }
}

let teamRepo;
function getTeamRepo() {
  if (!teamRepo) {
    teamRepo = new TeamRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }
  return teamRepo;
}

function json(statusCode, body, headers) {
  return {
    statusCode,
    headers: { "content-type": "application/json", ...(headers || {}) },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

function routeKey(event) {
  if (event?.routeKey) return event.routeKey;
  const method = event?.requestContext?.http?.method || event?.httpMethod;
  const path = event?.requestContext?.http?.path || event?.rawPath || event?.path;
  return `${method} ${path}`;
}

function findDisallowedTenantKeys(values) {
  return Object.keys(values || {}).filter((key) => {
    const normalized = String(key).toLowerCase();
    return normalized === "tenant_id" || normalized === "tenantid" || normalized === "x-tenant-id";
  });
}

function assertNoClientTenantInputs(event) {
  const headerKeys = findDisallowedTenantKeys(event?.headers);
  if (headerKeys.length) {
    throw new BadRequestError({
      code: "platform.bad_request",
      message: "Bad request",
      details: { unknown: headerKeys },
    });
  }

  const queryKeys = findDisallowedTenantKeys(event?.queryStringParameters);
  if (queryKeys.length) {
    throw new BadRequestError({
      code: "platform.bad_request",
      message: "Bad request",
      details: { unknown: queryKeys },
    });
  }
}

function toBadRequest(err) {
  return new BadRequestError({
    code: "platform.bad_request",
    message: "Bad request",
    details: err?.details || {},
    cause: err,
  });
}

function isGetTeamByIdRoute(event) {
  const rk = routeKey(event);
  if (rk === "GET /teams/{teamId}") return true;
  return /^GET \/teams\/[^/]+$/.test(rk);
}

function isUpdateTeamRoute(event) {
  const rk = routeKey(event);
  if (rk === "PUT /teams/{teamId}") return true;
  return /^PUT \/teams\/[^/]+$/.test(rk);
}

function isListAssignedSessionsRoute(event) {
  const rk = routeKey(event);
  if (rk === "GET /teams/{teamId}/sessions") return true;
  return /^GET \/teams\/[^/]+\/sessions$/.test(rk);
}

function isListAttendanceRoute(event) {
  const rk = routeKey(event);
  if (rk === "GET /teams/{teamId}/attendance") return true;
  return /^GET \/teams\/[^/]+\/attendance$/.test(rk);
}

function isGetWeeklyPlanningRoute(event) {
  const rk = routeKey(event);
  if (rk === "GET /teams/{teamId}/planning/weekly") return true;
  return /^GET \/teams\/[^/]+\/planning\/weekly$/.test(rk);
}

function isAssignSessionRoute(event) {
  const rk = routeKey(event);
  if (rk === "POST /teams/{teamId}/sessions/{sessionId}/assign") return true;
  return /^POST \/teams\/[^/]+\/sessions\/[^/]+\/assign$/.test(rk);
}

function isCreateAttendanceRoute(event) {
  const rk = routeKey(event);
  if (rk === "POST /teams/{teamId}/attendance") return true;
  return /^POST \/teams\/[^/]+\/attendance$/.test(rk);
}

function rethrowTeamDomainError(err) {
  if (err?.httpStatus) {
    throw err;
  }

  if (err?.statusCode === 404) {
    throw new NotFoundError({
      code: err.code || "teams.not_found",
      message: "Not found",
      details: err.details || { entityType: "TEAM" },
      cause: err,
    });
  }

  if (err?.statusCode === 409) {
    throw new ConflictError({
      code: err.code || "teams.attendance_exists",
      message: "Conflict",
      details: err.details || { entityType: "TEAM_ATTENDANCE" },
      cause: err,
    });
  }

  if (err?.statusCode === 400) {
    throw toBadRequest(err);
  }

  throw err;
}

function createTeamsInner({
  getTeamRepoFn = getTeamRepo,
  validateCreateTeamFn = validateCreateTeam,
  validateUpdateTeamFn = validateUpdateTeam,
  validateAssignSessionFn = validateAssignSession,
  validateCreateAttendanceFn = validateCreateAttendance,
  validateListAttendanceQueryFn = validateListAttendanceQuery,
  validateWeeklyPlanningQueryFn = validateWeeklyPlanningQuery,
} = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    assertEnv();

    const rk = routeKey(event);

    if (rk === "POST /teams") {
      assertNoClientTenantInputs(event);

      let body;
      try {
        body = parseJsonBody(event);
      } catch (e) {
        throw toBadRequest(e);
      }

      let teamInput;
      try {
        teamInput = validateCreateTeamFn(body);
      } catch (e) {
        throw toBadRequest(e);
      }

      const result = await getTeamRepoFn().createTeam(tenantCtx, teamInput);

      logger.info("team_created", "team created", {
        http: { statusCode: 201 },
        resource: { entityType: "TEAM", entityId: result.team?.teamId },
      });

      return json(201, result);
    }

    if (rk === "GET /teams") {
      assertNoClientTenantInputs(event);
      const { nextToken, cursor, limit } = event?.queryStringParameters || {};
      const result = await getTeamRepoFn().listTeams(tenantCtx, {
        limit,
        nextToken: nextToken || cursor,
      });

      logger.info("team_listed", "teams listed", {
        http: { statusCode: 200 },
      });

      return json(200, result);
    }

    if (isUpdateTeamRoute(event)) {
      assertNoClientTenantInputs(event);

      const teamId = event?.pathParameters?.teamId;
      if (!teamId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["teamId"] },
        });
      }

      let body;
      try {
        body = parseJsonBody(event);
      } catch (e) {
        throw toBadRequest(e);
      }

      let teamInput;
      try {
        teamInput = validateUpdateTeamFn(body);
      } catch (e) {
        throw toBadRequest(e);
      }

      let result;
      try {
        result = await getTeamRepoFn().updateTeam(tenantCtx, teamId, teamInput);
      } catch (err) {
        rethrowTeamDomainError(err);
      }

      logger.info("team_updated", "team updated", {
        http: { statusCode: 200 },
        resource: { entityType: "TEAM", entityId: result.team?.teamId },
      });

      return json(200, result);
    }

    if (isAssignSessionRoute(event)) {
      assertNoClientTenantInputs(event);

      const teamId = event?.pathParameters?.teamId;
      const sessionId = event?.pathParameters?.sessionId;
      const missing = [];
      if (!teamId) missing.push("teamId");
      if (!sessionId) missing.push("sessionId");
      if (missing.length) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing },
        });
      }

      let body;
      try {
        body = parseJsonBody(event);
      } catch (e) {
        throw toBadRequest(e);
      }

      let assignmentInput;
      try {
        assignmentInput = validateAssignSessionFn(body);
      } catch (e) {
        throw toBadRequest(e);
      }

      const repo = getTeamRepoFn();
      const team = await repo.getTeamById(tenantCtx, teamId);
      if (!team) {
        throw new NotFoundError({
          code: "teams.not_found",
          message: "Not found",
          details: { entityType: "TEAM", teamId },
        });
      }

      const sessionSummary = await repo.getSessionSummaryForAssignment(tenantCtx, sessionId);
      if (!sessionSummary) {
        throw new NotFoundError({
          code: "sessions.not_found",
          message: "Not found",
          details: { entityType: "SESSION", sessionId },
        });
      }

      const result = await repo.assignSessionToTeam(tenantCtx, {
        teamId,
        sessionId,
        ...assignmentInput,
        sessionSummary,
      });

      const statusCode = result.created ? 201 : 200;
      logger.info(
        result.created ? "team_session_assigned" : "team_session_assignment_replayed",
        result.created ? "team session assigned" : "team session assignment replayed",
        {
          http: { statusCode },
          resource: { entityType: "TEAM_SESSION_ASSIGNMENT", entityId: `${teamId}:${sessionId}` },
        }
      );

      return json(statusCode, { assignment: result.assignment });
    }

    if (isCreateAttendanceRoute(event)) {
      assertNoClientTenantInputs(event);

      const teamId = event?.pathParameters?.teamId;
      if (!teamId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["teamId"] },
        });
      }

      let body;
      try {
        body = parseJsonBody(event);
      } catch (e) {
        throw toBadRequest(e);
      }

      let attendanceInput;
      try {
        attendanceInput = validateCreateAttendanceFn(body);
      } catch (e) {
        throw toBadRequest(e);
      }

      const repo = getTeamRepoFn();
      const team = await repo.getTeamById(tenantCtx, teamId);
      if (!team) {
        throw new NotFoundError({
          code: "teams.not_found",
          message: "Not found",
          details: { entityType: "TEAM", teamId },
        });
      }

      const sessionSummary = await repo.getSessionSummaryForAssignment(
        tenantCtx,
        attendanceInput.sessionId
      );
      if (!sessionSummary) {
        throw new NotFoundError({
          code: "sessions.not_found",
          message: "Not found",
          details: { entityType: "SESSION", sessionId: attendanceInput.sessionId },
        });
      }

      try {
        const result = await repo.createAttendanceForTeam(tenantCtx, {
          teamId,
          ...attendanceInput,
        });

        const statusCode = result.created ? 201 : 200;
        logger.info(
          result.created ? "team_attendance_recorded" : "team_attendance_replayed",
          result.created ? "team attendance recorded" : "team attendance replayed",
          {
            http: { statusCode },
            resource: {
              entityType: "TEAM_ATTENDANCE",
              entityId: `${teamId}:${attendanceInput.sessionDate}:${attendanceInput.sessionId}`,
            },
          }
        );

        return json(statusCode, { attendance: result.attendance });
      } catch (err) {
        rethrowTeamDomainError(err);
      }
    }

    if (isListAttendanceRoute(event)) {
      assertNoClientTenantInputs(event);

      const teamId = event?.pathParameters?.teamId;
      if (!teamId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["teamId"] },
        });
      }

      let query;
      try {
        query = validateListAttendanceQueryFn(event?.queryStringParameters || {});
      } catch (e) {
        throw toBadRequest(e);
      }

      const repo = getTeamRepoFn();
      const team = await repo.getTeamById(tenantCtx, teamId);
      if (!team) {
        throw new NotFoundError({
          code: "teams.not_found",
          message: "Not found",
          details: { entityType: "TEAM", teamId },
        });
      }

      let result;
      try {
        result = await repo.listAttendanceForTeam(tenantCtx, teamId, query);
      } catch (err) {
        rethrowTeamDomainError(err);
      }

      logger.info("team_attendance_listed", "team attendance listed", {
        http: { statusCode: 200 },
        resource: { entityType: "TEAM", entityId: teamId },
      });

      return json(200, result);
    }

    if (isGetWeeklyPlanningRoute(event)) {
      assertNoClientTenantInputs(event);

      const teamId = event?.pathParameters?.teamId;
      if (!teamId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["teamId"] },
        });
      }

      let query;
      try {
        query = validateWeeklyPlanningQueryFn(event?.queryStringParameters || {});
      } catch (e) {
        throw toBadRequest(e);
      }

      const repo = getTeamRepoFn();
      const team = await repo.getTeamById(tenantCtx, teamId);
      if (!team) {
        throw new NotFoundError({
          code: "teams.not_found",
          message: "Not found",
          details: { entityType: "TEAM", teamId },
        });
      }

      const result = await repo.getWeeklyPlanningForTeam(tenantCtx, teamId, query);

      logger.info("team_weekly_planning_fetched", "team weekly planning fetched", {
        http: { statusCode: 200 },
        resource: { entityType: "TEAM", entityId: teamId },
      });

      return json(200, result);
    }

    if (isListAssignedSessionsRoute(event)) {
      assertNoClientTenantInputs(event);

      const teamId = event?.pathParameters?.teamId;
      if (!teamId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["teamId"] },
        });
      }

      const repo = getTeamRepoFn();
      const team = await repo.getTeamById(tenantCtx, teamId);
      if (!team) {
        throw new NotFoundError({
          code: "teams.not_found",
          message: "Not found",
          details: { entityType: "TEAM", teamId },
        });
      }

      const result = await repo.listAssignedSessionsForTeam(tenantCtx, teamId);

      logger.info("team_sessions_listed", "team sessions listed", {
        http: { statusCode: 200 },
        resource: { entityType: "TEAM", entityId: teamId },
      });

      return json(200, result);
    }

    if (isGetTeamByIdRoute(event)) {
      assertNoClientTenantInputs(event);

      const teamId = event?.pathParameters?.teamId;
      if (!teamId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["teamId"] },
        });
      }

      const result = await getTeamRepoFn().getTeamById(tenantCtx, teamId);
      if (!result) {
        throw new NotFoundError({
          code: "teams.not_found",
          message: "Not found",
          details: { entityType: "TEAM", teamId },
        });
      }

      logger.info("team_fetched", "team fetched", {
        http: { statusCode: 200 },
        resource: { entityType: "TEAM", entityId: teamId },
      });

      return json(200, result);
    }

    logger.warn("route_not_found", "route not found", {
      http: { statusCode: 404 },
      route: rk,
    });

    throw new NotFoundError({
      code: "platform.not_found",
      message: "Not found",
    });
  };
}

const inner = createTeamsInner();

module.exports = {
  handler: withPlatform(inner),
  createTeamsInner,
};
