// services/club-vivo/api/sessions/handler.js
"use strict";

const { withPlatform } = require("../_lib/with-platform");
const { parseJsonBody } = require("../_lib/parse-body");
const { SessionRepository } = require("../_lib/session-repository");
const { createSessionPdfBuffer } = require("../_lib/session-pdf");
const { createSessionPdfStorage } = require("../_lib/session-pdf-storage");
const { validateCreateSession } = require("../_lib/session-validate");
const { BadRequestError, NotFoundError, InternalError } = require("../_lib/errors");

function assertEnv({ requirePdfBucket = false } = {}) {
  const missing = [];
  if (!process.env.TENANT_ENTITLEMENTS_TABLE) missing.push("TENANT_ENTITLEMENTS_TABLE");
  if (!process.env.SIC_DOMAIN_TABLE) missing.push("SIC_DOMAIN_TABLE");
  if (requirePdfBucket && !process.env.PDF_BUCKET_NAME) missing.push("PDF_BUCKET_NAME");
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

let sessionPdfStorage;
function getSessionPdfStorage() {
  if (!sessionPdfStorage) {
    sessionPdfStorage = createSessionPdfStorage({
      bucketName: process.env.PDF_BUCKET_NAME,
    });
  }
  return sessionPdfStorage;
}

function json(statusCode, body, headers) {
  return {
    statusCode,
    headers: { "content-type": "application/json", ...(headers || {}) },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

function getHttpMethod(event) {
  return event?.requestContext?.http?.method || event?.httpMethod;
}

function getRequestPath(event) {
  // Prefer HTTP API v2 canonical path if present, then rawPath/path
  return event?.requestContext?.http?.path || event?.rawPath || event?.path || "";
}

/**
 * Canonical routeKey for API Gateway HTTP API v2 is event.routeKey, e.g.:
 *   "GET /sessions/{sessionId}/pdf"
 *
 * Fall back to method+path only when routeKey isn't present (local mocks).
 */
function routeKey(event) {
  if (event?.routeKey) return event.routeKey; // <-- FIX: use templated routeKey when available
  const method = getHttpMethod(event);
  const path = getRequestPath(event);
  return `${method} ${path}`;
}

function isGetSessionPdfRoute(event) {
  const rk = routeKey(event);
  if (rk === "GET /sessions/{sessionId}/pdf") return true;

  // fallback if routeKey isn't present (e.g., some local tests/mocks)
  return getHttpMethod(event) === "GET" && /^\/sessions\/[^/]+\/pdf$/.test(getRequestPath(event));
}

function createSessionsInner({
  getSessionRepoFn = getSessionRepo,
  createSessionPdfBufferFn = createSessionPdfBuffer,
  getSessionPdfStorageFn = getSessionPdfStorage,
} = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    const rk = routeKey(event);

    // -------------------------
    // POST /sessions
    // -------------------------
    if (rk === "POST /sessions") {
      let body;
      try {
        body = parseJsonBody(event);
      } catch (e) {
        // parseJsonBody throws { statusCode: 400, code: "invalid_json" }
        // Wrap into a typed platform error so withPlatform maps it to 400 instead of 500.
        throw new BadRequestError({
          code: e?.code || "platform.bad_request",
          message: "Bad request",
          details: e?.details || {},
          cause: e,
        });
      }

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

      const result = await getSessionRepoFn().createSession(tenantCtx, sessionInput);

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

      const result = await getSessionRepoFn().listSessions(tenantCtx, {
        limit,
        nextToken: effectiveNextToken,
      });

      logger.info("session_listed", "sessions listed", {
        http: { statusCode: 200 },
      });

      return json(200, result);
    }

    // -------------------------
    // GET /sessions/{sessionId}/pdf
    // -------------------------
    if (isGetSessionPdfRoute(event)) {
      assertEnv({ requirePdfBucket: true });

      const sessionId = event?.pathParameters?.sessionId;

      if (!sessionId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["sessionId"] },
        });
      }

      const session = await getSessionRepoFn().getSessionById(tenantCtx, sessionId);

      if (!session) {
        logger.warn("session_pdf_not_found", "session not found", {
          http: { statusCode: 404 },
          resource: { entityType: "SESSION", entityId: sessionId },
        });

        throw new NotFoundError({
          code: "sessions.not_found",
          message: "Not found",
          details: { entityType: "SESSION" },
        });
      }

      let url;
      let expiresInSeconds;

      try {
        const pdfBuffer = createSessionPdfBufferFn({
          tenantId: tenantCtx.tenantId,
          session,
        });

        const storage = getSessionPdfStorageFn();

        await storage.putSessionPdf({
          tenantId: tenantCtx.tenantId,
          sessionId,
          pdfBuffer,
        });

        ({ url, expiresInSeconds } = await storage.presignSessionPdfGet({
          tenantId: tenantCtx.tenantId,
          sessionId,
        }));
      } catch (err) {
        logger.error("pdf_export_failed", "pdf export failed", err, {
          http: { method: getHttpMethod(event), path: getRequestPath(event) },
          route: routeKey(event),
          resource: { entityType: "SESSION", entityId: sessionId },
        });
        throw err;
      }

      logger.info("session_pdf_exported", "session pdf exported", {
        http: { statusCode: 200 },
        resource: { entityType: "SESSION", entityId: sessionId },
      });

      return json(200, { url, expiresInSeconds });
    }

    // Ensure baseline env for non-pdf routes
    assertEnv();

    // -------------------------
    // GET /sessions/{sessionId}
    // -------------------------
    const method = getHttpMethod(event);
    if (method === "GET" && event?.pathParameters?.sessionId) {
      const sessionId = event?.pathParameters?.sessionId;

      if (!sessionId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["sessionId"] },
        });
      }

      const session = await getSessionRepoFn().getSessionById(tenantCtx, sessionId);

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
  };
}

const inner = createSessionsInner();

module.exports = {
  handler: withPlatform(inner),
  createSessionsInner,
};
