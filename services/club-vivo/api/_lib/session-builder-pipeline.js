"use strict";

const { validateCreateSessionPack } = require("./session-pack-validate");
const { generatePack, minutesSum } = require("./session-pack-templates");
const { validateCreateSession } = require("./session-validate");
const { validationError } = require("./validate");

function normalizeSessionPackInput(rawInput) {
  return validateCreateSessionPack(rawInput);
}

function generateSessionPack(normalizedInput) {
  return generatePack(normalizedInput);
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

  return {
    normalizedInput,
    generatedPack,
    validatedPack,
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
  validateGeneratedPack,
  processSessionPackRequest,
  persistSession,
  exportPersistedSession,
};
