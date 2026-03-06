// services/auth/pre-token-generation/handler.js

function normalizeTenantId(raw) {
  if (!raw) return null;

  // If already normalized, keep it
  if (raw.startsWith("tenant_")) return raw;

  // Option A: enforce tenant_ prefix
  // Convert club-vivo-1234 -> tenant_club-vivo-1234
  return `tenant_${String(raw).toLowerCase()}`;
}

function deriveRoleFromGroups(groups = []) {
  // MVP rule: first group wins; fallback to "member"
  // You can tighten this later with an explicit mapping table.
  if (Array.isArray(groups) && groups.length > 0) return String(groups[0]);
  return "member";
}

exports.handler = async (event) => {
  const attrs = event?.request?.userAttributes || {};
  const rawTenantId = attrs["custom:tenant_id"] || null;

  // Cognito sends groups under request.groupConfiguration in this trigger
  const groups =
    event?.request?.groupConfiguration?.groupsToOverride ||
    event?.request?.groupConfiguration?.groupsToSuppress ||
    event?.request?.groupConfiguration?.groupsToAdd ||
    event?.request?.groupConfiguration?.groups ||
    [];

  const tenantId = normalizeTenantId(rawTenantId);
  const role = deriveRoleFromGroups(groups);
  const tier = "dev"; // TEMP: until tenant entitlements exist

  event.response = event.response || {};
  event.response.claimsOverrideDetails = event.response.claimsOverrideDetails || {};

  // ID token overrides (historical / default map)
  event.response.claimsOverrideDetails.claimsToAddOrOverride =
    event.response.claimsOverrideDetails.claimsToAddOrOverride || {};

  // Access token overrides (THIS is what we were missing)
  event.response.claimsOverrideDetails.accessTokenClaimsToAddOrOverride =
    event.response.claimsOverrideDetails.accessTokenClaimsToAddOrOverride || {};

  const idClaims = event.response.claimsOverrideDetails.claimsToAddOrOverride;
  const accessClaims =
    event.response.claimsOverrideDetails.accessTokenClaimsToAddOrOverride;

  if (tenantId) {
    // Convenience alias + middleware-expected key
    idClaims["tenant_id"] = tenantId;
    idClaims["custom:tenant_id"] = tenantId;

    accessClaims["tenant_id"] = tenantId;
    accessClaims["custom:tenant_id"] = tenantId;
  }

  idClaims["custom:role"] = role;
  idClaims["custom:tier"] = tier;

  accessClaims["custom:role"] = role;
  accessClaims["custom:tier"] = tier;

  console.log(
    "PreTokenGeneration",
    JSON.stringify(
      {
        username: event?.userName,
        rawTenantId,
        tenantId,
        role,
        tier,
        groups,
        triggerSource: event?.triggerSource,
        wrote: {
          idClaims: Object.keys(idClaims),
          accessClaims: Object.keys(accessClaims),
        },
      },
      null,
      2
    )
  );

  return event;
};