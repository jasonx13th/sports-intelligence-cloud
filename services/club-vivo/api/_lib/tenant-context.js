// services/club-vivo/api/_lib/tenant-context.js

const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

function authError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

const ddb = new DynamoDBClient({});

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

/**
 * Path 2 contract:
 * - Access token proves identity (sub) and groups
 * - Tenant entitlements come from DynamoDB (tenant_id, tier)
 */
async function buildTenantContext(event) {
  const claims = event?.requestContext?.authorizer?.jwt?.claims;

  if (!claims) {
    throw authError(401, "missing_auth_claims", "Authentication claims not present");
  }

  const userSub = getClaimSub(claims);
  if (!userSub) {
    throw authError(403, "missing_sub_claim", "User sub claim missing");
  }

  const tableName = process.env.TENANT_ENTITLEMENTS_TABLE;
  if (!tableName) {
    throw authError(500, "missing_entitlements_table", "TENANT_ENTITLEMENTS_TABLE not configured");
  }

  const item = await fetchEntitlementsBySub({ tableName, userSub });
  if (!item) {
    throw authError(403, "missing_entitlements", "No tenant entitlements for user");
  }

  const tenantId = item.tenant_id?.S || null;
  const tier = item.tier?.S || null;

  const groups = getGroupsFromClaims(claims);
  const role = groups[0] || null; // MVP: first group wins

  if (!tenantId) {
    throw authError(403, "missing_tenant_claim", "Tenant claim missing");
  }

  const tenantRegex = /^tenant_[a-z0-9-]{3,}$/;
  if (!tenantRegex.test(tenantId)) {
    throw authError(403, "invalid_tenant_claim", "Tenant claim invalid");
  }

  if (!role) {
    throw authError(403, "missing_role_claim", "Role claim missing");
  }

  if (!tier) {
    throw authError(403, "missing_tier_claim", "Tier claim missing");
  }

  return { userId: userSub, tenantId, role, tier, claims };
}

module.exports = { buildTenantContext };