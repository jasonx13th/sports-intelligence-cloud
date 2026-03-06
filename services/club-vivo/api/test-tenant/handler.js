const { buildTenantContext } = require("../_lib/tenant-context");
const { parseJsonBody } = require("../_lib/parse-body");
const { requireFields } = require("../_lib/validate");

exports.handler = async (event) => {
  try {
    const tenant = await buildTenantContext(event); // <-- ONLY critical change
    const body = parseJsonBody(event);

    requireFields(body, ["name"]);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ok: true,
        tenantId: tenant.tenantId,
        userId: tenant.userId,
        received: {
          name: body.name,
        },
      }),
    };
  } catch (err) {
    console.error("test_tenant_handler_error", {
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
          err.statusCode && err.statusCode < 500 ? err.message : "Internal server error",
      }),
    };
  }
};