"use strict";

const crypto = require("crypto");

const {
  validateCreateSessionPack,
  validateSessionPackV2Draft,
} = require("./session-pack-validate");
const { generatePack, buildCoachLiteDraftFromPack, minutesSum } = require("./session-pack-templates");
const { validateCreateSession } = require("./session-validate");
const { validationError } = require("../../platform/validation/validate");
const { validateImageAnalysisRequest } = require("./image-intake-validate");
const { parseImageAnalysisText } = require("./image-intake-parser");

function normalizeSessionPackInput(rawInput) {
  return validateCreateSessionPack(rawInput);
}

function generateSessionPack(normalizedInput) {
  return generatePack(normalizedInput);
}

function generateCoachLiteDraft(generatedPack) {
  return buildCoachLiteDraftFromPack(generatedPack);
}

function validateCoachLiteDraft(coachLiteDraft) {
  return validateSessionPackV2Draft(coachLiteDraft);
}

function validateGeneratedPack(generatedPack) {
  if (!generatedPack || typeof generatedPack !== "object") {
    throw validationError("invalid_field", "Generated pack is invalid", {
      reason: "invalid_generated_pack",
    });
  }

  const sessions = Array.isArray(generatedPack.sessions) ? generatedPack.sessions : [];

  const validatedSessions = sessions.map((session, index) => {
    const validatedSession = validateCreateSession(session);
    const totalMinutes = minutesSum(validatedSession.activities);

    if (totalMinutes !== generatedPack.durationMin) {
      throw validationError("invalid_field", "Generated session duration total must equal durationMin", {
        reason: "invalid_generated_duration_total",
        durationMin: generatedPack.durationMin,
        totalMinutes,
        index,
      });
    }

    return validatedSession;
  });

  return {
    ...generatedPack,
    sessions: validatedSessions,
  };
}

function processSessionPackRequest(rawInput) {
  const normalizedInput = normalizeSessionPackInput(rawInput);
  const generatedPack = generateSessionPack(normalizedInput);
  const validatedPack = validateGeneratedPack(generatedPack);
  const coachLiteDraft = generateCoachLiteDraft(validatedPack);
  const validatedCoachLiteDraft = validateCoachLiteDraft(coachLiteDraft);

  return {
    normalizedInput,
    generatedPack,
    validatedPack,
    coachLiteDraft,
    validatedCoachLiteDraft,
  };
}

async function processSessionImageAnalysisRequest({
  rawInput,
  tenantCtx,
  imageStorage,
  imageAnalysis,
} = {}) {
  const normalizedInput = validateImageAnalysisRequest(rawInput);
  const analysisId = crypto.randomUUID();
  const sourceImageId = crypto.randomUUID();
  const imageBuffer = Buffer.from(normalizedInput.sourceImage.bytesBase64, "base64");
  const contentSha256 = crypto.createHash("sha256").update(imageBuffer).digest("hex");

  const { key: storageKey } = await imageStorage.putSourceImage({
    tenantId: tenantCtx.tenantId,
    mode: normalizedInput.mode,
    analysisId,
    sourceImageId,
    mimeType: normalizedInput.sourceImage.mimeType,
    imageBuffer,
    contentSha256,
  });

  const analysisResult = await imageAnalysis.analyzeImage({
    mode: normalizedInput.mode,
    mimeType: normalizedInput.sourceImage.mimeType,
    imageBase64: normalizedInput.sourceImage.bytesBase64,
  });

  const profile = parseImageAnalysisText({
    mode: normalizedInput.mode,
    text: analysisResult.text,
    analysisId,
    sourceImageId,
    sourceImageMimeType: normalizedInput.sourceImage.mimeType,
  });

  return {
    normalizedInput,
    analysisId,
    sourceImageId,
    contentSha256,
    storageKey,
    profile,
    usage: analysisResult.usage,
    metrics: analysisResult.metrics,
    stopReason: analysisResult.stopReason,
  };
}

async function persistSession({
  tenantCtx,
  normalizedInput,
  sessionRepository,
} = {}) {
  const result = await sessionRepository.createSession(tenantCtx, normalizedInput);

  return {
    normalizedInput,
    persistedSession: result?.session,
  };
}

async function exportPersistedSession({
  tenantCtx,
  persistedSession,
  sessionId,
  createSessionPdfBufferFn,
  sessionPdfStorage,
} = {}) {
  const effectiveSessionId = sessionId || persistedSession?.sessionId;
  const pdfBuffer = createSessionPdfBufferFn({
    tenantId: tenantCtx?.tenantId,
    session: persistedSession,
  });

  await sessionPdfStorage.putSessionPdf({
    tenantId: tenantCtx?.tenantId,
    sessionId: effectiveSessionId,
    pdfBuffer,
  });

  const { url, expiresInSeconds } = await sessionPdfStorage.presignSessionPdfGet({
    tenantId: tenantCtx?.tenantId,
    sessionId: effectiveSessionId,
  });

  return {
    persistedSession,
    exportResult: {
      url,
      expiresInSeconds,
    },
  };
}

module.exports = {
  normalizeSessionPackInput,
  generateSessionPack,
  generateCoachLiteDraft,
  validateCoachLiteDraft,
  validateGeneratedPack,
  processSessionPackRequest,
  processSessionImageAnalysisRequest,
  persistSession,
  exportPersistedSession,
};
