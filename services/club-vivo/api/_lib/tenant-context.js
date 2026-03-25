// services/club-vivo/api/_lib/tenant-context.js
"use strict";

const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { UnauthorizedError, ForbiddenError, InternalError } = require("./errors");

const ddb = new DynamoDBClient({});
const TENANT_ID_RE = /^tenant_[a-z0-9-]{3,}$/;

function getClaims(event) {
  return event?.requestContext?.authorizer?.jwt?.claims || null;
}

function getApigwRequestId(event) {
  // API Gateway (HTTP API) request id
  return event?.requestContext?.requestId || null;
}

function getClaimSub(claims) {
  return claims?.sub || null;
}

function getGroupsFromClaims(claims) {
  const g = claims?.["cognito:groups"];
  if (!g) return [];
  if (Array.isArray(g)) return g;
  if (typeof g === "string") return [g];
  return [];
}

async function fetchEntitlementsBySub({ tableName, userSub }) {
  const resp = await ddb.send(
    new GetItemCommand({
      TableName: tableName,
      Key: { user_sub: { S: userSub } },
      ConsistentRead: true,
    })
  );
  return resp.Item || null;
}

function requireStringAttr(item, attrName, errorCodeForLog) {
  const v = item?.[attrName]?.S || null;
  if (!v) {
    // Authenticated identity exists, but entitlements record is malformed -> Forbidden (fail closed).
    // Keep client message generic; keep specifics for logs only via details (optional).
    throw new ForbiddenError({
      code: `platform.entitlements.${errorCodeForLog || "missing_attr"}`,
      message: "Forbidden",
      details: { attrName },
    });
  }
  return v;
}

function getTenantEntitlementsTableName() {
  return process.env.TENANT_ENTITLEMENTS_TABLE;
}

/**
 * Tenant Context contract:
 * - JWT authorizer must supply claims (sub + groups)
 * - Entitlements MUST exist in DynamoDB keyed by user_sub
 * - Entitlements supply: tenant_id, role, tier (authoritative)
 *
 * Note: This module can only access API Gateway request id from the event.
 * Canonical Lambda request id (context.awsRequestId) is handled by the platform wrapper.
 */
function createBuildTenantContext({
  fetchEntitlements = fetchEntitlementsBySub,
  getTableName = getTenantEntitlementsTableName,
} = {}) {
  return async function buildTenantContext(event) {
    const apigwRequestId = getApigwRequestId(event);
    const claims = getClaims(event);

    // Diagnostic: confirm we have claims and can start tenant resolution
    console.log(
      JSON.stringify({
        eventType: "tenant_context_start",
        apigwRequestId,
        hasJwtClaims: !!claims,
        hasSub: !!claims?.sub,
      })
    );

    // 401: cannot establish authenticated identity
    if (!claims) {
      throw new UnauthorizedError({
        code: "platform.unauthorized",
        message: "Unauthorized",
        details: { apigwRequestId },
      });
    }

    const userSub = getClaimSub(claims);

    // If sub is missing, treat as auth failure (not an entitlement failure).
    // 401: identity cannot be established from claims.
    if (!userSub) {
      throw new UnauthorizedError({
        code: "platform.unauthorized",
        message: "Unauthorized",
        details: { apigwRequestId },
      });
    }

    const tableName = getTableName();
    if (!tableName) {
      // Misconfiguration: platform fault (5XX). Do not leak internals.
      throw new InternalError({
        code: "platform.misconfig.entitlements_table",
        message: "Internal server error",
        details: { apigwRequestId },
        retryable: false,
      });
    }

    const ddbStart = Date.now();
    const item = await fetchEntitlements({ tableName, userSub, event });
    const ddbLatencyMs = Date.now() - ddbStart;

    // Diagnostic: confirm DDB returned and whether an item was found
    console.log(
      JSON.stringify({
        eventType: "tenant_context_entitlements_loaded",
        apigwRequestId,
        userSub,
        found: !!item,
        ddbLatencyMs,
        tableName,
      })
    );

    // 403: authenticated identity exists but no entitlement record -> fail closed
    if (!item) {
      throw new ForbiddenError({
        code: "platform.forbidden",
        message: "Forbidden",
        details: { apigwRequestId, userSub },
      });
    }

    // Authoritative attributes from entitlements store
    const tenantId = requireStringAttr(item, "tenant_id", "missing_tenant_id");
    const role = requireStringAttr(item, "role", "missing_role");
    const tier = requireStringAttr(item, "tier", "missing_tier");

    // Validate tenant id format (fail closed)
    if (!TENANT_ID_RE.test(tenantId)) {
      throw new ForbiddenError({
        code: "platform.entitlements.invalid_tenant_id",
        message: "Forbidden",
        details: { apigwRequestId },
      });
    }

    const groups = getGroupsFromClaims(claims);

    return {
      // Back-compat: historically this field was named requestId but is actually API GW request id.
      // Canonical requestId is the Lambda awsRequestId in the platform wrapper logs.
      requestId: apigwRequestId,
      apigwRequestId,
      userId: userSub,
      tenantId,
      role,
      tier,
      groups,
      claims,
    };
  };
}

const buildTenantContext = createBuildTenantContext();

module.exports = {
  buildTenantContext,
  createBuildTenantContext,
};
