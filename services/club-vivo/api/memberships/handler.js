"use strict";

const { withPlatform } = require("../src/platform/http/with-platform");
const { parseJsonBody } = require("../src/platform/http/parse-body");
const { requireFields } = require("../src/platform/validation/validate");
const { MembershipRepository } = require("../src/domains/memberships/membership-repository");
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

let membershipRepo;
function getMembershipRepo() {
  if (!membershipRepo) {
    membershipRepo = new MembershipRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }
  return membershipRepo;
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
      code: "memberships.admin_required",
      message: "Forbidden",
      details: { requiredRole: "admin" },
    });
  }
}

function createMembershipsInner({ getMembershipRepoFn = getMembershipRepo } = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    assertEnv();

    const rk = routeKey(event);

    if (rk === "POST /memberships") {
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
        requireFields(body, ["userSub", "role"]);
      } catch (err) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: err?.details || { missing: ["userSub", "role"] },
          cause: err,
        });
      }

      // IMPORTANT: never pass through spoofable tenant fields from client input
      const input = { userSub: body.userSub, role: body.role };
      const result = await getMembershipRepoFn().putMembership(tenantCtx, input);

      logger.info("membership_upserted", "membership upserted", {
        http: { statusCode: 201 },
        resource: { entityType: "Membership", entityId: result.membership?.userSub },
      });

      return json(201, result);
    }

    if (rk === "GET /memberships") {
      requireAdminRole(tenantCtx);

      const { nextToken, cursor, limit } = event?.queryStringParameters || {};
      const result = await getMembershipRepoFn().listMemberships(tenantCtx, {
        limit,
        nextToken: nextToken || cursor,
      });

      logger.info("membership_listed", "memberships listed", {
        http: { statusCode: 200 },
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

const inner = createMembershipsInner();

module.exports = {
  handler: withPlatform(inner),
  createMembershipsInner,
};
