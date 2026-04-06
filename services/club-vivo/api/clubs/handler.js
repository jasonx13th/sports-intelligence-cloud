"use strict";

const { withPlatform } = require("../src/platform/http/with-platform");
const { parseJsonBody } = require("../src/platform/http/parse-body");
const { requireFields } = require("../src/platform/validation/validate");
const { ClubRepository } = require("../_lib/club-repository");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
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

let clubRepo;
function getClubRepo() {
  if (!clubRepo) {
    clubRepo = new ClubRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }
  return clubRepo;
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

function requireAdminRole(tenantCtx) {
  if (tenantCtx?.role !== "admin") {
    throw new ForbiddenError({
      code: "clubs.admin_required",
      message: "Forbidden",
      details: { requiredRole: "admin" },
    });
  }
}

function createClubsInner({ getClubRepoFn = getClubRepo } = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    assertEnv();

    const rk = routeKey(event);

    if (rk === "POST /clubs") {
      requireAdminRole(tenantCtx);

      let body;
      try {
        body = parseJsonBody(event);
      } catch (err) {
        throw new BadRequestError({
          code: err?.code || "platform.bad_request",
          message: "Bad request",
          details: err?.details || {},
          cause: err,
        });
      }

      try {
        requireFields(body, ["name"]);
      } catch (err) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: err?.details || { missing: ["name"] },
          cause: err,
        });
      }

      const result = await getClubRepoFn().createClub(tenantCtx, body);

      logger.info("club_created", "club created", {
        http: { statusCode: 201 },
        resource: { entityType: "CLUB", entityId: result.club?.clubId },
      });

      return json(201, result);
    }

    if (rk === "GET /clubs") {
      const result = await getClubRepoFn().getClub(tenantCtx);

      if (!result) {
        logger.warn("club_not_found", "club not found", {
          http: { statusCode: 404 },
          resource: { entityType: "CLUB", entityId: tenantCtx?.tenantId },
        });

        throw new NotFoundError({
          code: "clubs.not_found",
          message: "Not found",
          details: { entityType: "CLUB" },
        });
      }

      logger.info("club_fetched", "club fetched", {
        http: { statusCode: 200 },
        resource: { entityType: "CLUB", entityId: result.club?.clubId },
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

const inner = createClubsInner();

module.exports = {
  handler: withPlatform(inner),
  createClubsInner,
};
