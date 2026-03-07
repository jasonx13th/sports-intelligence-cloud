// services/club-vivo/api/me/handler.js

const { buildTenantContext } = require("../_lib/tenant-context");

exports.handler = async (event) => {
  try {
    const tenant = await buildTenantContext(event);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ok: true,
        userId: tenant.userId,
        tenantId: tenant.tenantId,
        role: tenant.role,
        tier: tenant.tier,
      }),
    };
  } catch (err) {
    const requestId = event?.requestContext?.requestId || null;
    const claims = event?.requestContext?.authorizer?.jwt?.claims || null;
    const userId = claims?.sub || null;

    console.error("me_handler_error", {
      requestId,
      userId,
      tenantId: null, // not available when entitlements are missing
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    });

    return {
      statusCode: err.statusCode || 500,
      headers: {
        "content-type": "application/json",
      },
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
