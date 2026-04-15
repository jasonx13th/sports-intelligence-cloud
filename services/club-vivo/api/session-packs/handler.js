// services/club-vivo/api/session-packs/handler.js
"use strict";

const { withPlatform } = require("../src/platform/http/with-platform");
const { parseJsonBody } = require("../src/platform/http/parse-body");
const {
  processSessionPackRequest,
  processSessionImageAnalysisRequest,
} = require("../src/domains/session-builder/session-builder-pipeline");
const { createSessionBuilderImageAnalysis } = require("../src/platform/bedrock/session-builder-image-analysis");
const { createSessionBuilderImageStorage } = require("../src/platform/storage/session-builder-image-storage");
const { BadRequestError, NotFoundError, InternalError } = require("../src/platform/errors/errors");

function assertEnv() {
  const missing = [];
  if (!process.env.TENANT_ENTITLEMENTS_TABLE) missing.push("TENANT_ENTITLEMENTS_TABLE");
  if (missing.length) {
    throw new InternalError({
      code: "platform.misconfig.missing_env",
      message: "Internal server error",
      details: { missing },
      retryable: false,
    });
  }
}

function assertImageAnalysisEnv() {
  const missing = [];
  if (!process.env.SESSION_IMAGE_BUCKET_NAME) missing.push("SESSION_IMAGE_BUCKET_NAME");
  if (!process.env.SESSION_IMAGE_ANALYSIS_MODEL_ID) missing.push("SESSION_IMAGE_ANALYSIS_MODEL_ID");
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

function routeKey(event) {
  const method = event?.requestContext?.http?.method || event?.httpMethod;
  const path = event?.rawPath || event?.path;
  return `${method} ${path}`;
}

function createSessionPacksInner({
  processSessionPackFn = processSessionPackRequest,
  processSessionImageAnalysisFn = processSessionImageAnalysisRequest,
} = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    assertEnv();

    const rk = routeKey(event);

    // -------------------------
    // POST /session-packs
    // -------------------------
    if (rk === "POST /session-packs") {
      let body;
      try {
        body = parseJsonBody(event);
      } catch (e) {
        throw new BadRequestError({
          code: e?.code || "platform.bad_request",
          message: "Bad request",
          details: e?.details || {},
          cause: e,
        });
      }

      if (body?.requestType === "image-analysis") {
        assertImageAnalysisEnv();

        try {
          const imageStorage = createSessionBuilderImageStorage({
            bucketName: process.env.SESSION_IMAGE_BUCKET_NAME,
          });
          const imageAnalysis = createSessionBuilderImageAnalysis();
          const analysisResult = await processSessionImageAnalysisFn({
            rawInput: body,
            tenantCtx,
            imageStorage,
            imageAnalysis,
          });

          logger.info("session_image_analysis_success", "session image analysis completed", {
            tenant: { tenantId: tenantCtx?.tenantId, role: tenantCtx?.role, tier: tenantCtx?.tier },
            analysis: {
              analysisId: analysisResult.analysisId,
              mode: analysisResult.profile.mode,
              stopReason: analysisResult.stopReason,
            },
          });

          return json(201, {
            analysis: {
              analysisId: analysisResult.analysisId,
              profile: analysisResult.profile,
            },
          });
        } catch (e) {
          logger.warn("session_image_analysis_failure", "session image analysis failed", {
            tenant: { tenantId: tenantCtx?.tenantId, role: tenantCtx?.role, tier: tenantCtx?.tier },
            error: {
              code: e?.code,
              details: e?.details,
            },
          });

          if (e?.statusCode === 400 || e?.httpStatus === 400) {
            throw new BadRequestError({
              code: "platform.bad_request",
              message: "Bad request",
              details: e?.details || {},
              cause: e,
            });
          }
          throw e;
        }
      }

      let pipelineResult;
      try {
        pipelineResult = await processSessionPackFn(body);
      } catch (e) {
        if (e?.statusCode === 400) {
          throw new BadRequestError({
            code: "platform.bad_request",
            message: "Bad request",
            details: e?.details || {},
            cause: e,
          });
        }
        throw e;
      }

      const pack = pipelineResult.validatedPack;

      if (pipelineResult.normalizedInput?.confirmedProfile) {
        logger.info("session_image_profile_confirmed", "confirmed image profile used for generation", {
          tenant: { tenantId: tenantCtx?.tenantId, role: tenantCtx?.role, tier: tenantCtx?.tier },
          analysis: {
            analysisId: pipelineResult.normalizedInput.confirmedProfile.analysisId,
            mode: pipelineResult.normalizedInput.confirmedProfile.mode,
          },
        });
      }

      logger.info("pack_generated_success", "session pack generated", {
        http: { statusCode: 201 },
        tenant: { tenantId: tenantCtx?.tenantId, role: tenantCtx?.role, tier: tenantCtx?.tier },
        pack: { packId: pack.packId, sessionsCount: pack.sessionsCount, theme: pack.theme },
      });

      return json(201, { pack });
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

const inner = createSessionPacksInner();

module.exports = {
  handler: withPlatform(inner),
  createSessionPacksInner,
};
