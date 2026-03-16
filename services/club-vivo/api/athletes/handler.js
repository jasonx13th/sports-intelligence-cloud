// services/club-vivo/api/athletes/handler.js
"use strict";

const { withPlatform } = require("../_lib/with-platform");
const { parseJsonBody } = require("../_lib/parse-body");
const { requireFields } = require("../_lib/validate");
const { AthleteRepository } = require("../_lib/athlete-repository");

function assertEnv() {
  const missing = [];
  if (!process.env.TENANT_ENTITLEMENTS_TABLE) missing.push("TENANT_ENTITLEMENTS_TABLE");
  if (!process.env.SIC_DOMAIN_TABLE) missing.push("SIC_DOMAIN_TABLE");
  if (missing.length) {
    const err = new Error(`missing_env:${missing.join(",")}`);
    err.__sic = { statusCode: 500, code: "misconfig_missing_env", missing };
    throw err;
  }
}

// Instantiate once per Lambda container (reuse across invocations)
const athleteRepo = new AthleteRepository({
  tableName: process.env.SIC_DOMAIN_TABLE,
});

function json(statusCode, body, headers) {
  return {
    statusCode,
    headers: { "content-type": "application/json", ...(headers || {}) },
    body: JSON.stringify(body),
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
  // POST /athletes
  // -------------------------
  if (rk === "POST /athletes") {
    const idempotencyKey =
      event?.headers?.["Idempotency-Key"] ||
      event?.headers?.["idempotency-key"];

    if (!idempotencyKey) {
      logger.warn("validation_failed", "missing idempotency key", {
        http: { statusCode: 400 },
        reason: "missing_idempotency_key",
      });
      const err = new Error("Missing Idempotency-Key");
      err.code = "VALIDATION_FAILED";
      err.statusCode = 400;
      throw err;
    }

    const body = parseJsonBody(event);
    requireFields(body, ["displayName"]);

    const result = await athleteRepo.createAthlete(tenantCtx, body, idempotencyKey);

    logger.info("request_end", "athlete create completed", {
      http: { statusCode: result.replayed ? 200 : 201 },
      resource: {
        entityType: "ATHLETE",
        entityId: result.athlete?.athleteId,
      },
      replayed: !!result.replayed,
      idempotencyKey,
    });

    return json(result.replayed ? 200 : 201, result);
  }

  // -------------------------
  // GET /athletes
  // -------------------------
  if (rk === "GET /athletes") {
    const { nextToken, cursor, limit } = event?.queryStringParameters || {};
    const effectiveNextToken = nextToken || cursor;

    const result = await athleteRepo.listAthletes(tenantCtx, {
      limit,
      nextToken: effectiveNextToken,
    });

    logger.info("request_end", "athlete list completed", {
      http: { statusCode: 200 },
    });

    return json(200, result);
  }

  // -------------------------
  // GET /athletes/{athleteId}
  // -------------------------
  const method = event?.requestContext?.http?.method || event?.httpMethod;
  if (method === "GET" && event?.pathParameters?.athleteId) {
    const athleteId = event?.pathParameters?.athleteId;
    if (!athleteId) {
      const err = new Error("Missing athleteId");
      err.code = "VALIDATION_FAILED";
      err.statusCode = 400;
      throw err;
    }

    const athlete = await athleteRepo.getAthlete(tenantCtx, athleteId);

    if (!athlete) {
      logger.warn("validation_failed", "athlete not found", {
        http: { statusCode: 404 },
        resource: { entityType: "ATHLETE", entityId: athleteId },
      });
      return json(404, { code: "athlete_not_found", message: "Athlete not found" });
    }

    logger.info("request_end", "athlete get completed", {
      http: { statusCode: 200 },
      resource: { entityType: "ATHLETE", entityId: athleteId },
    });

    return json(200, { athlete });
  }

  logger.warn("validation_failed", "route not found", {
    http: { statusCode: 404 },
    reason: "route_not_found",
    route: rk,
  });
  return json(404, { code: "route_not_found" });
}

exports.handler = withPlatform(inner);