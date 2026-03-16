// services/club-vivo/api/me/handler.js
"use strict";

const { withPlatform } = require("../_lib/with-platform");

async function inner({ tenantCtx }) {
  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ok: true,
      userId: tenantCtx.userId,
      tenantId: tenantCtx.tenantId,
      role: tenantCtx.role,
      tier: tenantCtx.tier,
    }),
  };
}

exports.handler = withPlatform(inner);