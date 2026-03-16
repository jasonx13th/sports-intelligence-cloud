// services/club-vivo/api/_lib/tenant-context.js

"use strict";

const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

function authError(statusCode, code, message, details = undefined) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  if (details !== undefined) err.details = details;
  return err;
}

const ddb = new DynamoDBClient({});

function getClaims(event) {
  return event?.requestContext?.authorizer?.jwt?.claims || null;
}

function getRequestId(event) {
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

function requireStringAttr(item, attrName, errorCode) {
  const v = item?.[attrName]?.S || null;
  if (!v) {
    throw authError(403, errorCode, `Missing required entitlement attribute: ${attrName}`, {
      attrName,
    });
  }
  return v;
}

/**
 * Tenant Context contract:
 * - JWT authorizer must supply claims (sub + groups)
 * - Entitlements MUST exist in DynamoDB keyed by user_sub
 * - Entitlements supply: tenant_id, role, tier (authoritative)
 */
async function buildTenantContext(event) {
  const requestId = getRequestId(event);
  const claims = getClaims(event);

  // Diagnostic: confirm we have claims and can start tenant resolution
  console.log(
    JSON.stringify({
      eventType: "tenant_context_start",
      requestId,
      hasJwtClaims: !!claims,
      hasSub: !!claims?.sub,
    })
  );

  if (!claims) {
    throw authError(401, "missing_auth_claims", "Authentication claims not present", { requestId });
  }

  const userSub = getClaimSub(claims);
  if (!userSub) {
    throw authError(403, "missing_sub_claim", "User sub claim missing", { requestId });
  }

  const tableName = process.env.TENANT_ENTITLEMENTS_TABLE;
  if (!tableName) {
    throw authError(500, "missing_entitlements_table", "TENANT_ENTITLEMENTS_TABLE not configured", {
      requestId,
    });
  }

  const ddbStart = Date.now();
  const item = await fetchEntitlementsBySub({ tableName, userSub });
  const ddbLatencyMs = Date.now() - ddbStart;

  // Diagnostic: confirm DDB returned and whether an item was found
  console.log(
    JSON.stringify({
      eventType: "tenant_context_entitlements_loaded",
      requestId,
      userSub,
      found: !!item,
      ddbLatencyMs,
      tableName,
    })
  );

  if (!item) {
    throw authError(403, "missing_entitlements", "No tenant entitlements for user", {
      requestId,
      userSub,
    });
  }

  // Authoritative attributes from entitlements store
  const tenantId = requireStringAttr(item, "tenant_id", "missing_tenant_id");
  const role = requireStringAttr(item, "role", "missing_role");
  const tier = requireStringAttr(item, "tier", "missing_tier");

  // Validate tenant id format (fail closed)
  const tenantRegex = /^tenant_[a-z0-9-]{3,}$/;
  if (!tenantRegex.test(tenantId)) {
    throw authError(403, "invalid_tenant_id", "Tenant id invalid", {
      requestId,
      tenantId,
    });
  }

  const groups = getGroupsFromClaims(claims);

  return {
    requestId,
    userId: userSub,
    tenantId,
    role,
    tier,
    groups,
    claims,
  };
}

module.exports = { buildTenantContext, authError };