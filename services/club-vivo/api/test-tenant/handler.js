// services/club-vivo/api/test-tenant/handler.js

const { buildTenantContext } = require("../_lib/tenant-context");
const { parseJsonBody } = require("../_lib/parse-body");
const { requireFields } = require("../_lib/validate");

exports.handler = async (event) => {
  // Always extract these so we can log even if buildTenantContext fails
  const requestId = event?.requestContext?.requestId || null;
  const claims = event?.requestContext?.authorizer?.jwt?.claims || null;
  const userId = claims?.sub || null;

  let tenant = null;

  try {
    tenant = await buildTenantContext(event); // consistent path with /me
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
      requestId,
      userId,
      tenantId: tenant?.tenantId || null,
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