"use strict";

const { SessionRepository } = require("../sessions/session-repository");
const { TemplateRepository } = require("./template-repository");
const { persistSession } = require("../session-builder/session-builder-pipeline");

let sessionRepository;
function getSessionRepository() {
  if (!sessionRepository) {
    sessionRepository = new SessionRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }
  return sessionRepository;
}

let templateRepository;
function getTemplateRepository() {
  if (!templateRepository) {
    templateRepository = new TemplateRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }
  return templateRepository;
}

function notFound(code, message) {
  const err = new Error(message || "Not found");
  err.code = code;
  err.statusCode = 404;
  return err;
}

async function createTemplateFromSession(tenantCtx, input, deps = {}) {
  const sessionRepo = deps.sessionRepository || getSessionRepository();
  const templateRepo = deps.templateRepository || getTemplateRepository();

  const sourceSession = await sessionRepo.getSessionById(tenantCtx, input.sourceSessionId);
  if (!sourceSession) {
    throw notFound("sessions.not_found", "Not found");
  }

  const templateInput = {
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    sport: sourceSession.sport,
    ageBand: sourceSession.ageBand,
    durationMin: sourceSession.durationMin,
    objectiveTags: sourceSession.objectiveTags || [],
    ...(input.tags?.length ? { tags: input.tags } : {}),
    ...(sourceSession.equipment?.length ? { equipment: sourceSession.equipment } : {}),
    activities: sourceSession.activities || [],
    sourceSessionId: input.sourceSessionId,
  };

  return templateRepo.createTemplate(tenantCtx, templateInput);
}

async function generateSessionFromTemplate(tenantCtx, templateId, input = {}, deps = {}) {
  const templateRepo = deps.templateRepository || getTemplateRepository();
  const sessionRepo = deps.sessionRepository || getSessionRepository();
  const persistSessionFn = deps.persistSessionFn || persistSession;

  const template = await templateRepo.getTemplateById(tenantCtx, templateId);
  if (!template) {
    throw notFound("templates.not_found", "Not found");
  }

  const normalizedInput = {
    sport: template.sport,
    ageBand: template.ageBand,
    durationMin: template.durationMin,
    objectiveTags: template.objectiveTags || [],
    ...(template.tags?.length ? { tags: template.tags } : {}),
    sourceTemplateId: templateId,
    ...(template.equipment?.length ? { equipment: template.equipment } : {}),
    activities: template.activities || [],
  };

  const sessionRepositoryWithGeneratedEvent = {
    ...sessionRepo,
    createSession: (actualTenantCtx, actualInput) =>
      sessionRepo.createSession(actualTenantCtx, actualInput, {
        sessionGeneratedEventMetadata: { templateId },
      }),
  };

  const persistResult = await persistSessionFn({
    tenantCtx,
    normalizedInput,
    sessionRepository: sessionRepositoryWithGeneratedEvent,
  });

  await templateRepo.markTemplateGenerated(tenantCtx, templateId);

  return {
    session: persistResult.persistedSession,
  };
}

module.exports = {
  createTemplateFromSession,
  generateSessionFromTemplate,
};
