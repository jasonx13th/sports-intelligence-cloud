// services/club-vivo/api/athletes/handler.js

"use strict";

const { buildTenantContext } = require("../_lib/tenant-context");
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

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function logEvent(fields) {
  console.log(JSON.stringify(fields));
}

function routeKey(event) {
  const method = event?.requestContext?.http?.method || event?.httpMethod;
  const path = event?.rawPath || event?.path;
  return `${method} ${path}`;
}

exports.handler = async (event) => {
  assertEnv();

  const rk = routeKey(event);
  const requestId =
    event?.requestContext?.requestId ||
    event?.headers?.["x-amzn-requestid"] ||
    "unknown";

  let tenantCtx;
  try {
    // FAIL-CLOSED TENANCY: derive tenant before touching data
    tenantCtx = await buildTenantContext(event);

    // -------------------------
    // POST /athletes
    // -------------------------
    if (rk === "POST /athletes") {
      const idempotencyKey =
        event?.headers?.["Idempotency-Key"] ||
        event?.headers?.["idempotency-key"];

      if (!idempotencyKey) {
        logEvent({
          eventCode: "invalid_request",
          requestId,
          tenantId: tenantCtx.tenantId,
          route: rk,
          statusCode: 400,
          reason: "missing_idempotency_key",
        });
        return json(400, { code: "invalid_request", message: "Missing Idempotency-Key" });
      }

      const body = parseJsonBody(event);

      // Require only what we need at the handler layer.
      // Repository still validates displayName strictly (length/trim/etc).
      requireFields(body, ["displayName"]);

      const result = await athleteRepo.createAthlete(tenantCtx, body, idempotencyKey);

      logEvent({
        eventCode: result.replayed
          ? "athlete_create_idempotent_replay"
          : "athlete_create_success",
        requestId,
        tenantId: tenantCtx.tenantId,
        route: rk,
        statusCode: result.replayed ? 200 : 201,
        entityType: "ATHLETE",
        entityId: result.athlete?.athleteId,
        actorUserId: tenantCtx.userId,
        replayed: !!result.replayed,
      });

      return json(result.replayed ? 200 : 201, result);
    }

    // -------------------------
    // GET /athletes
    // -------------------------
    if (rk === "GET /athletes") {
      const { cursor, limit } = event?.queryStringParameters || {};

      const result = await athleteRepo.listAthletes(tenantCtx, {
        limit,
        nextToken: cursor,
      });

      logEvent({
        eventCode: "athlete_list_success",
        requestId,
        tenantId: tenantCtx.tenantId,
        route: rk,
        statusCode: 200,
      });

      return json(200, result);
    }

    // -------------------------
    // GET /athletes/{athleteId}
    // -------------------------
    const method = event?.requestContext?.http?.method || event?.httpMethod;
    if (
      method === "GET" &&
      (event?.pathParameters?.athleteId || rk === "GET /athletes/{athleteId}")
    ) {
      const athleteId = event?.pathParameters?.athleteId;
      if (!athleteId) {
        return json(400, { code: "invalid_request", message: "Missing athleteId" });
      }

      const athlete = await athleteRepo.getAthlete(tenantCtx, athleteId);

      if (!athlete) {
        logEvent({
          eventCode: "athlete_get_not_found",
          requestId,
          tenantId: tenantCtx.tenantId,
          route: rk,
          statusCode: 404,
          entityType: "ATHLETE",
          entityId: athleteId,
        });
        return json(404, { code: "athlete_not_found", message: "Athlete not found" });
      }

      logEvent({
        eventCode: "athlete_get_success",
        requestId,
        tenantId: tenantCtx.tenantId,
        route: rk,
        statusCode: 200,
        entityType: "ATHLETE",
        entityId: athleteId,
      });

      return json(200, { athlete });
    }

    // -------------------------
    // Unknown route
    // -------------------------
    logEvent({
      eventCode: "invalid_request",
      requestId,
      tenantId: tenantCtx.tenantId,
      route: rk,
      statusCode: 404,
      reason: "route_not_found",
    });
    return json(404, { code: "route_not_found" });
  } catch (err) {
    const statusCode = err?.__sic?.statusCode || err?.statusCode || 500;
    const code = err?.__sic?.code || err?.code || "internal_error";

    logEvent({
      eventCode: rk === "POST /athletes" ? "athlete_create_failure" : "request_failure",
      requestId,
      tenantId: tenantCtx?.tenantId,
      route: rk,
      statusCode,
      code,
      message: err?.message,
    });

    return json(statusCode, { code, message: err?.message || "Internal error" });
  }
};