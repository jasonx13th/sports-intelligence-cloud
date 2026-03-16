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
 *
 * Note: This module can only access API Gateway request id from the event.
 * Canonical Lambda request id (context.awsRequestId) is handled by the platform wrapper.
 */
async function buildTenantContext(event) {
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

  if (!claims) {
    throw authError(401, "missing_auth_claims", "Authentication claims not present", { apigwRequestId });
  }

  const userSub = getClaimSub(claims);
  if (!userSub) {
    throw authError(403, "missing_sub_claim", "User sub claim missing", { apigwRequestId });
  }

  const tableName = process.env.TENANT_ENTITLEMENTS_TABLE;
  if (!tableName) {
    throw authError(500, "missing_entitlements_table", "TENANT_ENTITLEMENTS_TABLE not configured", {
      apigwRequestId,
    });
  }

  const ddbStart = Date.now();
  const item = await fetchEntitlementsBySub({ tableName, userSub });
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

  if (!item) {
    throw authError(403, "missing_entitlements", "No tenant entitlements for user", {
      apigwRequestId,
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
      apigwRequestId,
      tenantId,
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
}

module.exports = { buildTenantContext, authError };