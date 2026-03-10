// services/club-vivo/api/test-tenant/handler.js
"use strict";

/**
 * ---------------------------------------------
 * Imports
 * ---------------------------------------------
 * AthleteRepository:
 *   - Our tenant-safe DynamoDB boundary for athlete data access.
 * buildTenantContext:
 *   - Builds authoritative tenant context from verified auth + entitlements (never from client input).
 * parseJsonBody:
 *   - Safely parses JSON request body (and throws deterministic errors on invalid JSON).
 * requireFields:
 *   - Simple validation helper for required fields.
 */
const { AthleteRepository } = require("../_lib/athlete-repository");
const { buildTenantContext } = require("../_lib/tenant-context");
const { parseJsonBody } = require("../_lib/parse-body");
const { requireFields } = require("../_lib/validate");

exports.handler = async (event) => {
  /**
   * ---------------------------------------------
   * Request metadata extraction (for logging)
   * ---------------------------------------------
   * We always extract these first so we can log a useful event even if:
   * - buildTenantContext fails
   * - JSON parsing fails
   */
  const requestId = event?.requestContext?.requestId || null;
  const claims = event?.requestContext?.authorizer?.jwt?.claims || null;
  const userId = claims?.sub || null;

  // Will be filled by buildTenantContext(event)
  let tenant = null;

  try {
    /**
     * ---------------------------------------------
     * Tenant context + body parsing
     * ---------------------------------------------
     * Tenant context is authoritative and fail-closed:
     * - tenantId must come from entitlements derived from verified auth context.
     */
    tenant = await buildTenantContext(event);
    const body = parseJsonBody(event);

    /**
     * ---------------------------------------------
     * Operation: create_athlete (idempotent)
     * ---------------------------------------------
     * Purpose:
     * - Create an athlete record under the caller's tenant (club).
     * - Enforce idempotency using Idempotency-Key header (Option A in repository).
     *
     * Inputs:
     * - body.op = "create_athlete"
     * - body.displayName (validated inside repository)
     * - Header "Idempotency-Key" (required)
     *
     * Output:
     * - 201 Created on first create
     * - 200 OK on replay with same Idempotency-Key (returns original athlete)
     */
    if (body?.op === "create_athlete") {
      const tableName = process.env.SIC_DOMAIN_TABLE;

      // Misconfiguration (env var missing). Not an infra-missing problem.
      if (!tableName) {
        const e = new Error("SIC_DOMAIN_TABLE not configured");
        e.statusCode = 500;
        e.code = "misconfig_missing_env";
        throw e;
      }

      // API Gateway may normalize header keys; accept common variants.
      const idemKey =
        event?.headers?.["Idempotency-Key"] ||
        event?.headers?.["idempotency-key"] ||
        event?.headers?.["IDEMPOTENCY-KEY"] ||
        null;

      if (!idemKey) {
        const e = new Error("Missing Idempotency-Key header");
        e.statusCode = 400;
        e.code = "missing_idempotency_key";
        throw e;
      }

      const repo = new AthleteRepository({ tableName });
      const result = await repo.createAthlete(tenant, body, idemKey);

      return {
        statusCode: result.replayed ? 200 : 201,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    /**
     * ---------------------------------------------
     * Operation: list_athletes (tenant-scoped)
     * ---------------------------------------------
     * Purpose:
     * - List athlete records ONLY for the caller's tenant.
     *
     * Inputs:
     * - body.op = "list_athletes"
     * - body.limit (optional)
     * - body.nextToken (optional cursor token)
     *
     * Output:
     * - 200 OK with { items: [...], nextToken? }
     */
    if (body?.op === "list_athletes") {
      const tableName = process.env.SIC_DOMAIN_TABLE;

      // Misconfiguration (env var missing). Not an infra-missing problem.
      if (!tableName) {
        const e = new Error("SIC_DOMAIN_TABLE not configured");
        e.statusCode = 500;
        e.code = "misconfig_missing_env";
        throw e;
      }

      const repo = new AthleteRepository({ tableName });
      const result = await repo.listAthletes(tenant, {
        limit: body.limit,
        nextToken: body.nextToken,
      });

      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    /**
     * ---------------------------------------------
     * Default behavior (existing / legacy)
     * ---------------------------------------------
     * This is your original "ping-like" behavior that requires a `name` field.
     * We keep it to avoid breaking existing tests.
     */
    requireFields(body, ["name"]);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        tenantId: tenant.tenantId,
        userId: tenant.userId,
        received: { name: body.name },
      }),
    };
  } catch (err) {
    /**
     * ---------------------------------------------
     * Error handling + structured logs
     * ---------------------------------------------
     * We log:
     * - requestId/userId/tenantId for correlation
     * - deterministic error code for quick triage
     *
     * We return:
     * - client-safe message for 4xx
     * - generic message for 5xx (don’t leak internals)
     */
    console.error("test_tenant_handler_error", {
      requestId,
      userId,
      tenantId: tenant?.tenantId || null,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    });

    return {
      statusCode: err.statusCode || 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: err.code || "internal_error",
        message:
          err.statusCode && err.statusCode < 500
            ? err.message
            : "Internal server error",
      }),
    };
  }
};