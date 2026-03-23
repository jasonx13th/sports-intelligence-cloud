// services/club-vivo/api/sessions/handler.js
"use strict";

const { withPlatform } = require("../_lib/with-platform");
const { parseJsonBody } = require("../_lib/parse-body");
const { SessionRepository } = require("../_lib/session-repository");
const { validateCreateSession } = require("../_lib/session-validate");
const { BadRequestError, NotFoundError, InternalError } = require("../_lib/errors");

function assertEnv() {
  const missing = [];
  if (!process.env.TENANT_ENTITLEMENTS_TABLE) missing.push("TENANT_ENTITLEMENTS_TABLE");
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

// Lazy init across invocations
let sessionRepo;
function getSessionRepo() {
  if (!sessionRepo) {
    sessionRepo = new SessionRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }
  return sessionRepo;
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
  const method = event?.requestContext?.http?.method || event?.httpMethod;
  const path = event?.rawPath || event?.path;
  return `${method} ${path}`;
}

async function inner({ event, tenantCtx, logger }) {
  assertEnv();

  const rk = routeKey(event);

  // -------------------------
  // POST /sessions
  // -------------------------
  if (rk === "POST /sessions") {
    const body = parseJsonBody(event);

    let sessionInput;
    try {
      sessionInput = validateCreateSession(body);
    } catch (e) {
      throw new BadRequestError({
        code: "platform.bad_request",
        message: "Bad request",
        details: e?.details || {},
        cause: e,
      });
    }

    const result = await getSessionRepo().createSession(tenantCtx, sessionInput);

    logger.info("session_created", "session created", {
      http: { statusCode: 201 },
      resource: { entityType: "SESSION", entityId: result.session?.sessionId },
    });

    return json(201, result);
  }

  // -------------------------
  // GET /sessions
  // -------------------------
  if (rk === "GET /sessions") {
    const { nextToken, cursor, limit } = event?.queryStringParameters || {};
    const effectiveNextToken = nextToken || cursor;

    const result = await getSessionRepo().listSessions(tenantCtx, {
      limit,
      nextToken: effectiveNextToken,
    });

    logger.info("session_listed", "sessions listed", {
      http: { statusCode: 200 },
    });

    return json(200, result);
  }

  // -------------------------
  // GET /sessions/{sessionId}
  // -------------------------
  const method = event?.requestContext?.http?.method || event?.httpMethod;
  if (method === "GET" && event?.pathParameters?.sessionId) {
    const sessionId = event?.pathParameters?.sessionId;

    if (!sessionId) {
      throw new BadRequestError({
        code: "platform.bad_request",
        message: "Bad request",
        details: { missing: ["sessionId"] },
      });
    }

    const session = await getSessionRepo().getSessionById(tenantCtx, sessionId);

    if (!session) {
      logger.warn("session_not_found", "session not found", {
        http: { statusCode: 404 },
        resource: { entityType: "SESSION", entityId: sessionId },
      });

      throw new NotFoundError({
        code: "sessions.not_found",
        message: "Not found",
        details: { entityType: "SESSION" },
      });
    }

    logger.info("session_fetched", "session fetched", {
      http: { statusCode: 200 },
      resource: { entityType: "SESSION", entityId: sessionId },
    });

    return json(200, { session });
  }

  logger.warn("route_not_found", "route not found", {
    http: { statusCode: 404 },
    route: rk,
  });

  throw new NotFoundError({
    code: "platform.not_found",
    message: "Not found",
  });
}

exports.handler = withPlatform(inner);