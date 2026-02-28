// services/club-vivo/api/me/handler.js

exports.handler = async (event) => {
  // For HTTP API + JWT authorizer, claims are usually here:
  const claims =
    event?.requestContext?.authorizer?.jwt?.claims ||
    event?.requestContext?.authorizer?.claims ||
    {};

  const tenantId = claims["custom:tenant_id"] || claims["tenant_id"] || null;

  // Cognito groups may come as a string or array depending on integration
  const groups =
    claims["cognito:groups"] ||
    claims["groups"] ||
    [];

  console.log(
    "ME endpoint called",
    JSON.stringify(
      {
        requestId: event?.requestContext?.requestId,
        tenantId,
        groups,
        subject: claims?.sub || null,
      },
      null,
      2
    )
  );

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: true,
      tenantId,
      groups,
      sub: claims?.sub || null,
    }),
  };
};