const { buildTenantContext } = require("../_lib/tenant-context");

exports.handler = async (event) => {
  try {
    const tenant = await buildTenantContext(event);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        ok: true,
        userId: tenant.userId,
        tenantId: tenant.tenantId,
        role: tenant.role,
        tier: tenant.tier
      })
    };
  } catch (err) {
    console.error("me_handler_error", {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode
    });

    return {
      statusCode: err.statusCode || 500,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        ok: false,
        error: err.code || "internal_error",
        message: err.statusCode && err.statusCode < 500
          ? err.message
          : "Internal server error"
      })
    };
  }
};
