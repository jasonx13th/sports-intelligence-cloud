"use strict";

const { SessionRepository } = require("./session-repository");

let sessionRepository;
function getSessionRepository() {
  if (!sessionRepository) {
    sessionRepository = new SessionRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }
  return sessionRepository;
}

function notFound(code, message, details) {
  const err = new Error(message || "Not found");
  err.code = code;
  err.statusCode = 404;
  err.details = details;
  return err;
}

async function submitSessionFeedback(tenantCtx, sessionId, input, deps = {}) {
  const repo = deps.sessionRepository || getSessionRepository();

  const session = await repo.getSessionById(tenantCtx, sessionId);
  if (!session) {
    throw notFound("sessions.not_found", "Not found", { entityType: "SESSION" });
  }

  const eventMetadata = {
    ...(input?.flowMode ? { flowMode: input.flowMode } : {}),
    imageAnalysisAccuracy: input?.imageAnalysisAccuracy,
  };

  return repo.createSessionFeedback(tenantCtx, sessionId, input, {
    feedbackEventMetadata: eventMetadata,
  });
}

module.exports = {
  submitSessionFeedback,
};
