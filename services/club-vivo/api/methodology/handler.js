"use strict";

const { withPlatform } = require("../src/platform/http/with-platform");
const { parseJsonBody } = require("../src/platform/http/parse-body");
const {
  validateMethodologyScope,
  validateSaveMethodology,
  validatePublishMethodology,
} = require("../src/domains/methodology/methodology-validate");
const {
  getMethodology,
  saveMethodology,
  publishMethodology,
} = require("../src/domains/methodology/methodology-service");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  InternalError,
} = require("../src/platform/errors/errors");

function assertEnv() {
  const missing = [];
  if (!process.env.TENANT_ENTITLEMENTS_TABLE) missing.push("TENANT_ENTITLEMENTS_TABLE");
  if (!process.env.SIC_DOMAIN_TABLE) missing.push("SIC_DOMAIN_TABLE");

  if (missing.length) {
    throw new InternalError({
      code: "platform.misconfig.missing_env",
      message: "Internal server error",
      details: { missing },
      retryable: false,
    });
  }
}

function json(statusCode, body, headers) {
  return {
    statusCode,
    headers: { "content-type": "application/json", ...(headers || {}) },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

function getHttpMethod(event) {
  return event?.requestContext?.http?.method || event?.httpMethod;
}

function getRequestPath(event) {
  return event?.requestContext?.http?.path || event?.rawPath || event?.path || "";
}

function routeKey(event) {
  if (event?.routeKey) return event.routeKey;
  return `${getHttpMethod(event)} ${getRequestPath(event)}`;
}

function isGetMethodologyRoute(event) {
  const rk = routeKey(event);
  if (rk === "GET /methodology/{scope}") return true;
  return getHttpMethod(event) === "GET" && /^\/methodology\/[^/]+$/.test(getRequestPath(event));
}

function isPutMethodologyRoute(event) {
  const rk = routeKey(event);
  if (rk === "PUT /methodology/{scope}") return true;
  return getHttpMethod(event) === "PUT" && /^\/methodology\/[^/]+$/.test(getRequestPath(event));
}

function isPublishMethodologyRoute(event) {
  const rk = routeKey(event);
  if (rk === "POST /methodology/{scope}/publish") return true;
  return getHttpMethod(event) === "POST" && /^\/methodology\/[^/]+\/publish$/.test(getRequestPath(event));
}

function findDisallowedTenantKeys(values) {
  return Object.keys(values || {}).filter((key) => {
    const normalized = String(key).toLowerCase();
    return normalized === "tenant_id" || normalized === "tenantid" || normalized === "x-tenant-id";
  });
}

function assertNoClientTenantInputs(event) {
  const headerKeys = findDisallowedTenantKeys(event?.headers);
  if (headerKeys.length) {
    throw new BadRequestError({
      code: "platform.bad_request",
      message: "Bad request",
      details: { unknown: headerKeys },
    });
  }

  const queryKeys = findDisallowedTenantKeys(event?.queryStringParameters);
  if (queryKeys.length) {
    throw new BadRequestError({
      code: "platform.bad_request",
      message: "Bad request",
      details: { unknown: queryKeys },
    });
  }
}

function toBadRequest(err) {
  return new BadRequestError({
    code: "platform.bad_request",
    message: "Bad request",
    details: err?.details || {},
    cause: err,
  });
}

function requireAdminRole(tenantCtx) {
  if (tenantCtx?.role !== "admin") {
    throw new ForbiddenError({
      code: "methodology.admin_required",
      message: "Forbidden",
      details: { requiredRole: "admin" },
    });
  }
}

function rethrowMethodologyDomainError(err) {
  if (err?.httpStatus) {
    throw err;
  }

  if (err?.statusCode === 404) {
    throw new NotFoundError({
      code: err.code || "methodology.not_found",
      message: "Not found",
      details: err.details || { entityType: "METHODOLOGY" },
      cause: err,
    });
  }

  if (err?.statusCode === 400) {
    throw toBadRequest(err);
  }

  throw err;
}

function createMethodologyInner({
  validateMethodologyScopeFn = validateMethodologyScope,
  validateSaveMethodologyFn = validateSaveMethodology,
  validatePublishMethodologyFn = validatePublishMethodology,
  getMethodologyFn = getMethodology,
  saveMethodologyFn = saveMethodology,
  publishMethodologyFn = publishMethodology,
} = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    assertEnv();

    if (isGetMethodologyRoute(event)) {
      assertNoClientTenantInputs(event);

      const rawScope = event?.pathParameters?.scope;
      if (!rawScope) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["scope"] },
        });
      }

      let scope;
      try {
        scope = validateMethodologyScopeFn(rawScope);
      } catch (err) {
        throw toBadRequest(err);
      }

      try {
        const result = await getMethodologyFn(tenantCtx, scope);

        logger.info("methodology_fetched", "methodology fetched", {
          http: { statusCode: 200 },
          resource: { entityType: "METHODOLOGY", entityId: scope },
        });

        return json(200, result);
      } catch (err) {
        rethrowMethodologyDomainError(err);
      }
    }

    if (isPutMethodologyRoute(event)) {
      requireAdminRole(tenantCtx);
      assertNoClientTenantInputs(event);

      const rawScope = event?.pathParameters?.scope;
      if (!rawScope) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["scope"] },
        });
      }

      let scope;
      try {
        scope = validateMethodologyScopeFn(rawScope);
      } catch (err) {
        throw toBadRequest(err);
      }

      let body;
      try {
        body = parseJsonBody(event);
      } catch (err) {
        throw toBadRequest(err);
      }

      let input;
      try {
        input = validateSaveMethodologyFn(body);
      } catch (err) {
        throw toBadRequest(err);
      }

      try {
        const result = await saveMethodologyFn(tenantCtx, scope, input);

        logger.info("methodology_saved", "methodology saved", {
          http: { statusCode: 200 },
          resource: { entityType: "METHODOLOGY", entityId: scope },
        });

        return json(200, result);
      } catch (err) {
        rethrowMethodologyDomainError(err);
      }
    }

    if (isPublishMethodologyRoute(event)) {
      requireAdminRole(tenantCtx);
      assertNoClientTenantInputs(event);

      const rawScope = event?.pathParameters?.scope;
      if (!rawScope) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["scope"] },
        });
      }

      let scope;
      try {
        scope = validateMethodologyScopeFn(rawScope);
      } catch (err) {
        throw toBadRequest(err);
      }

      let body;
      try {
        body = parseJsonBody(event);
      } catch (err) {
        throw toBadRequest(err);
      }

      try {
        validatePublishMethodologyFn(body);
      } catch (err) {
        throw toBadRequest(err);
      }

      try {
        const result = await publishMethodologyFn(tenantCtx, scope);

        logger.info("methodology_published", "methodology published", {
          http: { statusCode: 200 },
          resource: { entityType: "METHODOLOGY", entityId: scope },
        });

        return json(200, result);
      } catch (err) {
        rethrowMethodologyDomainError(err);
      }
    }

    logger.warn("route_not_found", "route not found", {
      http: { statusCode: 404 },
      route: routeKey(event),
    });

    throw new NotFoundError({
      code: "platform.not_found",
      message: "Not found",
    });
  };
}

const inner = createMethodologyInner();

module.exports = {
  handler: withPlatform(inner),
  createMethodologyInner,
};
