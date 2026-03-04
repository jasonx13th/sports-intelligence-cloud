// services/club-vivo/api/me/handler.js

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function getClaims(event) {
  // HTTP API JWT authorizer (preferred)
  const jwtClaims = event?.requestContext?.authorizer?.jwt?.claims;
  // REST API / older integrations
  const legacyClaims = event?.requestContext?.authorizer?.claims;
  return jwtClaims || legacyClaims || {};
}

function requireTenantContext(event) {
  const claims = getClaims(event);

  const sub = claims.sub || null;

  // Contract: prefer custom:tenant_id (Cognito custom claim)
  const tenantId =
    claims["custom:tenant_id"] ||
    claims["custom:tenantId"] || // tolerate variant (but we should standardize)
    claims["tenant_id"] ||
    null;

  const tier = claims["custom:tier"] || claims["tier"] || null;
  const role = claims["custom:role"] || claims["role"] || null;

  // 401 vs 403:
  // - If there are no claims at all, likely no/invalid auth context => 401
  if (!claims || Object.keys(claims).length === 0) {
    return { ok: false, response: json(401, { ok: false, code: "UNAUTHORIZED" }) };
  }

  // Authenticated but missing required claim => 403
  if (!sub) {
    return { ok: false, response: json(403, { ok: false, code: "SUB_MISSING" }) };
  }
  if (!tenantId) {
    return { ok: false, response: json(403, { ok: false, code: "TENANT_CLAIM_MISSING" }) };
  }

  // Contract regex
  const tenantIdRegex = /^(COACH|ORG)#[A-Za-z0-9_-]{3,64}$/;
  if (!tenantIdRegex.test(tenantId)) {
    return { ok: false, response: json(403, { ok: false, code: "TENANT_CLAIM_INVALID" }) };
  }

  // tier/role constraints (baseline)
  if (tier === "org") {
    const allowed = new Set(["org_admin", "coach", "analyst"]);
    if (!role || !allowed.has(role)) {
      return { ok: false, response: json(403, { ok: false, code: "ROLE_INVALID_FOR_TIER" }) };
    }
  } else {
    // basic/pro: role should not be present (or should be "member" if you standardize that later)
    if (role && role !== "member") {
      return { ok: false, response: json(403, { ok: false, code: "ROLE_NOT_ALLOWED_FOR_TIER" }) };
    }
  }

  return {
    ok: true,
    tenantContext: { sub, tenantId, tier, role },
  };
}

exports.handler = async (event) => {
  const guard = requireTenantContext(event);
  if (!guard.ok) {
    // Minimal log: no JWT, no raw claims
    console.log("ME authz denied", {
      requestId: event?.requestContext?.requestId,
      code: JSON.parse(guard.response.body).code,
    });
    return guard.response;
  }

  const { tenantContext } = guard;

  // Cognito groups may come as string or array depending on integration
  const claims = getClaims(event);
  const groups =
    claims["cognito:groups"] ||
    claims["groups"] ||
    [];

  console.log("ME endpoint called", {
    requestId: event?.requestContext?.requestId,
    tenantId: tenantContext.tenantId,
    tier: tenantContext.tier,
    role: tenantContext.role,
  });

  return json(200, {
    ok: true,
    tenantId: tenantContext.tenantId,
    tier: tenantContext.tier,
    role: tenantContext.role,
    groups,
    sub: tenantContext.sub,
  });
};