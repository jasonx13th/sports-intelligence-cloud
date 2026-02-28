// services/auth/pre-token-generation/handler.js

exports.handler = async (event) => {
  const attrs = event?.request?.userAttributes || {};
  const tenantId = attrs["custom:tenant_id"] || null;

  // Add tenant_id into the token claims
  event.response = event.response || {};
  event.response.claimsOverrideDetails = event.response.claimsOverrideDetails || {};
  event.response.claimsOverrideDetails.claimsToAddOrOverride =
    event.response.claimsOverrideDetails.claimsToAddOrOverride || {};

  if (tenantId) {
    // Put it as "tenant_id" (simpler claim name for APIs)
    event.response.claimsOverrideDetails.claimsToAddOrOverride["tenant_id"] = tenantId;
  }

  console.log(
    "PreTokenGeneration",
    JSON.stringify(
      {
        username: event?.userName,
        hasTenantId: Boolean(tenantId),
        tenantId,
      },
      null,
      2
    )
  );

  return event;
};