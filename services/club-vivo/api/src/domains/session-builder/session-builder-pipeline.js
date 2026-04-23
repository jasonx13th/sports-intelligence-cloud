"use strict";

const crypto = require("crypto");

const {
  validateCreateSessionPack,
  validateSessionPackV2Draft,
} = require("./session-pack-validate");
const { buildGenerationContext } = require("./generation-context");
const { loadGenerationContextLookups } = require("./generation-context-lookups");
const { resolveGenerationContext } = require("./generation-context-resolver");
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

function deriveMethodologyInfluence(resolvedGenerationContext) {
  const resolvedMethodologyScope = resolvedGenerationContext?.resolvedMethodologyScope;
  const styleBias =
    resolvedMethodologyScope === "travel"
      ? "travel"
      : resolvedMethodologyScope === "ost"
        ? "ost"
        : "default";

  return {
    styleBias,
    methodologyApplied: styleBias !== "default",
    guidanceSnippets:
      styleBias === "travel"
        ? ["travel-tempo", "travel-competitive-repetition"]
        : styleBias === "ost"
          ? ["ost-clear-directions", "ost-guided-repetition"]
          : [],
  };
}

function planSessionPack(resolvedGenerationContext) {
  return {
    ...resolvedGenerationContext,
    methodologyInfluence: deriveMethodologyInfluence(resolvedGenerationContext),
  };
}

function shouldLoadGenerationContextLookups(options = {}) {
  if (!options.tenantCtx || !options.methodologyRepository) {
    return false;
  }

  if (options.teamId && !options.teamRepository) {
    return false;
  }

  return true;
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

async function processSessionPackRequest(rawInput, options = {}) {
  const normalizedInput = normalizeSessionPackInput(rawInput);
  const generationContext = buildGenerationContext(normalizedInput);
  const lookupInputs = shouldLoadGenerationContextLookups(options)
    ? await loadGenerationContextLookups({
        tenantCtx: options.tenantCtx,
        teamId: options.teamId,
        teamRepository: options.teamRepository,
        methodologyRepository: options.methodologyRepository,
      })
    : {};
  const resolvedGenerationContext = resolveGenerationContext({
    generationContext,
    teamContext:
      lookupInputs.teamContext !== undefined ? lookupInputs.teamContext : options.teamContext,
    methodologyRecords:
      lookupInputs.methodologyRecords !== undefined
        ? lookupInputs.methodologyRecords
        : options.methodologyRecords,
  });
  const plannedSessionPack = planSessionPack(resolvedGenerationContext);
  const generatedPack = generateSessionPack(plannedSessionPack);
  const validatedPack = validateGeneratedPack(generatedPack);
  const coachLiteDraft = generateCoachLiteDraft(validatedPack);
  const validatedCoachLiteDraft = validateCoachLiteDraft(coachLiteDraft);

  return {
    normalizedInput,
    generationContext,
    resolvedGenerationContext,
    methodologyInfluence: plannedSessionPack.methodologyInfluence,
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
  deriveMethodologyInfluence,
  processSessionPackRequest,
  processSessionImageAnalysisRequest,
  persistSession,
  exportPersistedSession,
};
