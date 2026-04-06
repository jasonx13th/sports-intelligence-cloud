// services/club-vivo/api/session-packs/handler.js
"use strict";

const { withPlatform } = require("../src/platform/http/with-platform");
const { parseJsonBody } = require("../src/platform/http/parse-body");
const { processSessionPackRequest } = require("../src/domains/session-builder/session-builder-pipeline");
const { BadRequestError, NotFoundError, InternalError } = require("../src/platform/errors/errors");

function assertEnv() {
  const missing = [];
  if (!process.env.TENANT_ENTITLEMENTS_TABLE) missing.push("TENANT_ENTITLEMENTS_TABLE");
  if (missing.length) {
    throw new InternalError({
      code: "platform.misconfig.missing_env",
      message: "Internal server error",
      details: { missing },
      retryable: false,
    });
  }
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

function createSessionPacksInner({
  processSessionPackFn = processSessionPackRequest,
} = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    assertEnv();

    const rk = routeKey(event);

    // -------------------------
    // POST /session-packs
    // -------------------------
    if (rk === "POST /session-packs") {
      let body;
      try {
        body = parseJsonBody(event);
      } catch (e) {
        throw new BadRequestError({
          code: e?.code || "platform.bad_request",
          message: "Bad request",
          details: e?.details || {},
          cause: e,
        });
      }

      let pipelineResult;
      try {
        pipelineResult = processSessionPackFn(body);
      } catch (e) {
        if (e?.statusCode === 400) {
          throw new BadRequestError({
            code: "platform.bad_request",
            message: "Bad request",
            details: e?.details || {},
            cause: e,
          });
        }
        throw e;
      }

      const pack = pipelineResult.validatedPack;

      logger.info("pack_generated_success", "session pack generated", {
        http: { statusCode: 201 },
        tenant: { tenantId: tenantCtx?.tenantId, role: tenantCtx?.role, tier: tenantCtx?.tier },
        pack: { packId: pack.packId, sessionsCount: pack.sessionsCount, theme: pack.theme },
      });

      return json(201, { pack });
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

const inner = createSessionPacksInner();

module.exports = {
  handler: withPlatform(inner),
  createSessionPacksInner,
};
