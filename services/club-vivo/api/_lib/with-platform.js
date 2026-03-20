// services/club-vivo/api/_lib/with-platform.js
"use strict";

const { createLogger, resolveCorrelation } = require("./logger");
const { toErrorResponse, InternalError } = require("./errors");

function loadBuildTenantContext() {
  // Lazy-load to avoid local require-time dependency issues (AWS SDK) during simple node sanity checks.
  // In Lambda runtime, this still loads normally when the handler executes.
  return require("./tenant-context").buildTenantContext;
}

function getHttpMethod(event) {
  return event?.requestContext?.http?.method || event?.httpMethod || "UNKNOWN";
}

function getHttpPath(event) {
  return event?.rawPath || event?.path || "UNKNOWN";
}

function ensureHeaders(resp) {
  if (!resp || typeof resp !== "object") return { headers: {} };
  if (!resp.headers || typeof resp.headers !== "object") resp.headers = {};
  return resp;
}

function inferEnv() {
  const v = process.env.SIC_ENV || process.env.STAGE || process.env.NODE_ENV || "dev";
  if (v === "production") return "prod";
  if (v === "staging") return "stage";
  return v;
}

function inferService() {
  return process.env.SIC_SERVICE_NAME || "sic-api";
}

/**
 * Wrap a Lambda handler so logging + correlation is "operable by default".
 *
 * inner signature:
 *   async ({ event, context, tenantCtx, logger, requestId, correlationId }) => response
 */
function withPlatform(inner) {
  return async function platformHandler(event, context) {
    const startedAt = Date.now();

    const requestId = context?.awsRequestId || event?.requestContext?.requestId || "unknown";
    const apigwRequestId = event?.requestContext?.requestId;

    const { correlationId, correlationInvalid, suppliedLength } = resolveCorrelation(
      event?.headers,
      requestId
    );

    const baseLogger = createLogger({
      service: inferService(),
      env: inferEnv(),
      requestId,
      correlationId,
      ...(apigwRequestId ? { apigwRequestId } : {}),
    });

    const method = getHttpMethod(event);
    const path = getHttpPath(event);

    baseLogger.info("request_start", "request started", {
      http: { method, path },
    });

    if (correlationInvalid) {
      baseLogger.warn("correlation_invalid", "invalid x-correlation-id; using fallback", {
        suppliedLength,
      });
    }

    let tenantCtx;
    try {
      // fail-closed: do not touch data before tenancy resolves
      const buildTenantContext = loadBuildTenantContext();
      tenantCtx = await buildTenantContext(event);

      const logger = baseLogger.child({
        tenantId: tenantCtx.tenantId,
        userId: tenantCtx.userId,
      });

      logger.info("tenant_context_resolved", "tenant context resolved");

      const resp = await inner({
        event,
        context,
        tenantCtx,
        logger,
        requestId,
        correlationId,
      });

      const safeResp = ensureHeaders(resp);

      // Ensure Lambda proxy response shape is compatible with HTTP API
      if (safeResp.body !== undefined && typeof safeResp.body !== "string") {
        safeResp.body = JSON.stringify(safeResp.body);
      }
      if (typeof safeResp.isBase64Encoded !== "boolean") {
        safeResp.isBase64Encoded = false;
      }

      safeResp.headers["x-correlation-id"] = correlationId;
      safeResp.headers["X-Correlation-Id"] = correlationId;

      if (!safeResp.headers["content-type"]) {
        safeResp.headers["content-type"] = "application/json";
      }

      const statusCode = safeResp.statusCode || 200;
      const latencyMs = Date.now() - startedAt;

      logger.info("request_end", "request completed", {
        http: { method, path, statusCode },
        latencyMs,
      });

      return safeResp;
    } catch (rawErr) {
      const latencyMs = Date.now() - startedAt;

      // Normalize thrown values into an Error
      const err = rawErr instanceof Error ? rawErr : new Error("non_error_thrown");

      // If tenancy resolved, we can include tenant/user in logs. Otherwise, stay baseLogger.
      const errorLogger =
        tenantCtx?.tenantId && tenantCtx?.userId
          ? baseLogger.child({ tenantId: tenantCtx.tenantId, userId: tenantCtx.userId })
          : baseLogger;

      // Build deterministic contract response
      const contract = toErrorResponse(err, correlationId);
      const statusCode = contract.httpStatus || 500;

      // Ensure log gets stable classification fields
      // - For unknown errors, wrap for logging classification without changing the client response shape.
      const classifiedForLog =
        statusCode >= 500 && (!err.code || typeof err.code !== "string")
          ? new InternalError({ cause: err })
          : err;

      // Attach code/retryable for normalized logger error shape (logger.js already extracts these)
      if (contract?.body?.error?.code) classifiedForLog.code = contract.body.error.code;
      if (typeof contract?.body?.error?.retryable === "boolean") {
        classifiedForLog.retryable = contract.body.error.retryable;
      }

      // ----- Logging semantics fix -----
      // Reserve handler_error/ERROR for 5XX only. 4XX are expected failures -> WARN.
      const code = contract?.body?.error?.code;

      let eventType = "handler_error";
      if (statusCode < 500) {
        if (statusCode === 400 || code === "platform.bad_request") eventType = "validation_failed";
        else if (statusCode === 401) eventType = "auth_unauthenticated";
        else if (statusCode === 403) eventType = "auth_forbidden";
        else eventType = "request_failed";
      }

      const logExtra = {
        http: { method, path, statusCode },
        latencyMs,
        error: {
          code,
          retryable: contract.body?.error?.retryable,
        },
      };

      if (statusCode >= 500) {
        errorLogger.error(eventType, "request failed", classifiedForLog, logExtra);
      } else {
        // logger.warn signature: (eventType, message, extra)
        errorLogger.warn(eventType, "request failed", {
          ...logExtra,
          // include a minimal error shape for expected failures without logging huge stacks
          error: {
            ...logExtra.error,
            name: classifiedForLog?.name,
          },
        });
      }
      // ----- end fix -----

      const resp = ensureHeaders({
        statusCode,
        body: JSON.stringify({
          ...contract.body,
          requestId,
        }),
      });

      // Explicit proxy response flag (helps avoid body being dropped in some integrations)
      resp.isBase64Encoded = false;

      resp.headers["content-type"] = "application/json";
      resp.headers["x-correlation-id"] = correlationId;
      resp.headers["X-Correlation-Id"] = correlationId;

      return resp;
    }
  };
}

module.exports = { withPlatform };
