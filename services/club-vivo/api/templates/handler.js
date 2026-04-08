"use strict";

const { withPlatform } = require("../src/platform/http/with-platform");
const { parseJsonBody } = require("../src/platform/http/parse-body");
const { TemplateRepository } = require("../src/domains/templates/template-repository");
const {
  validateCreateTemplate,
  validateGenerateFromTemplate,
} = require("../src/domains/templates/template-validate");
const {
  createTemplateFromSession,
  generateSessionFromTemplate,
} = require("../src/domains/templates/template-pipeline");
const {
  BadRequestError,
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

let templateRepo;
function getTemplateRepo() {
  if (!templateRepo) {
    templateRepo = new TemplateRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }
  return templateRepo;
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

function toBadRequest(err) {
  return new BadRequestError({
    code: "platform.bad_request",
    message: "Bad request",
    details: err?.details || {},
    cause: err,
  });
}

function rethrowDomainError(err) {
  if (err?.httpStatus) {
    throw err;
  }

  if (err?.statusCode === 404) {
    throw new NotFoundError({
      code: err.code || "platform.not_found",
      message: "Not found",
      details: err.details || {},
      cause: err,
    });
  }

  if (err?.statusCode === 400) {
    throw new BadRequestError({
      code: "platform.bad_request",
      message: "Bad request",
      details: err.details || {},
      cause: err,
    });
  }

  throw err;
}

function createTemplatesInner({
  getTemplateRepoFn = getTemplateRepo,
  validateCreateTemplateFn = validateCreateTemplate,
  validateGenerateFromTemplateFn = validateGenerateFromTemplate,
  createTemplateFromSessionFn = createTemplateFromSession,
  generateSessionFromTemplateFn = generateSessionFromTemplate,
} = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    assertEnv();

    const rk = routeKey(event);

    if (rk === "POST /templates") {
      let body;
      try {
        body = parseJsonBody(event);
      } catch (err) {
        throw new BadRequestError({
          code: err?.code || "platform.bad_request",
          message: "Bad request",
          details: err?.details || {},
          cause: err,
        });
      }

      let input;
      try {
        input = validateCreateTemplateFn(body);
      } catch (err) {
        throw toBadRequest(err);
      }

      try {
        const result = await createTemplateFromSessionFn(tenantCtx, input);

        logger.info("template_created", "template created", {
          http: { statusCode: 201 },
          resource: { entityType: "TEMPLATE", entityId: result?.template?.templateId },
        });

        return json(201, result);
      } catch (err) {
        rethrowDomainError(err);
      }
    }

    if (rk === "GET /templates") {
      const { limit, nextToken } = event?.queryStringParameters || {};
      const result = await getTemplateRepoFn().listTemplates(tenantCtx, {
        limit,
        nextToken,
      });

      logger.info("template_listed", "templates listed", {
        http: { statusCode: 200 },
      });

      return json(200, result);
    }

    if (rk === "POST /templates/{templateId}/generate") {
      const templateId = event?.pathParameters?.templateId;

      if (!templateId) {
        throw new BadRequestError({
          code: "platform.bad_request",
          message: "Bad request",
          details: { missing: ["templateId"] },
        });
      }

      let body;
      try {
        body = parseJsonBody(event);
      } catch (err) {
        throw new BadRequestError({
          code: err?.code || "platform.bad_request",
          message: "Bad request",
          details: err?.details || {},
          cause: err,
        });
      }

      let input;
      try {
        input = validateGenerateFromTemplateFn(body);
      } catch (err) {
        throw toBadRequest(err);
      }

      try {
        const result = await generateSessionFromTemplateFn(tenantCtx, templateId, input);

        logger.info("template_generated", "template generated into session", {
          http: { statusCode: 201 },
          resource: {
            entityType: "TEMPLATE",
            entityId: templateId,
          },
        });

        return json(201, result);
      } catch (err) {
        rethrowDomainError(err);
      }
    }

    logger.warn("route_not_found", "route not found", {
      http: { statusCode: 404 },
      route: rk,
    });

    throw new NotFoundError({
      code: "platform.not_found",
      message: "Not found",
    });
  };
}

const inner = createTemplatesInner();

module.exports = {
  handler: withPlatform(inner),
  createTemplatesInner,
};
