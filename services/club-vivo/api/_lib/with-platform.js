// services/club-vivo/api/_lib/with-platform.js
"use strict";

const { createLogger, resolveCorrelation } = require("./logger");

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
      safeResp.headers["x-correlation-id"] = correlationId;
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
    } catch (err) {
      const statusCode = err?.__sic?.statusCode || err?.statusCode || 500;
      err = err || new Error("unknown_error");
      err.code = err?.__sic?.code || err?.code || "INTERNAL_ERROR";

      const latencyMs = Date.now() - startedAt;

      baseLogger.error("handler_error", "request failed", err, {
        http: { method, path, statusCode },
        latencyMs,
      });

      const message = statusCode < 500 ? err?.message || "Request failed" : "Internal server error";

      const resp = ensureHeaders({
        statusCode,
        body: JSON.stringify({
          error: { code: err.code, message },
          requestId,
          correlationId,
        }),
      });

      resp.headers["content-type"] = "application/json";
      resp.headers["x-correlation-id"] = correlationId;

      return resp;
    }
  };
}

module.exports = { withPlatform };