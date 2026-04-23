"use strict";

const METHODOLOGY_SCOPES = ["shared", "travel", "ost"];
const PROGRAM_TYPES = ["travel", "ost"];

function normalizeProgramType(value) {
  const normalizedValue = typeof value === "string" ? value.trim().toLowerCase() : null;
  return PROGRAM_TYPES.includes(normalizedValue) ? normalizedValue : null;
}

function normalizeAgeBand(value) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return value.trim().toLowerCase();
}

function normalizePlayerCount(value) {
  return Number.isInteger(value) ? value : null;
}

function normalizeTeamContext(team) {
  if (!team) {
    return null;
  }

  return {
    programType: normalizeProgramType(team.programType),
    ...(normalizeAgeBand(team.ageBand) !== undefined
      ? { ageBand: normalizeAgeBand(team.ageBand) }
      : {}),
    playerCount: normalizePlayerCount(team.playerCount),
  };
}

function normalizePublishedMethodology(methodology) {
  if (!methodology || methodology.status !== "published") {
    return null;
  }

  return {
    scope: methodology.scope,
    title: methodology.title,
    content: methodology.content,
    status: methodology.status,
  };
}

async function loadTeamContext({ tenantCtx, teamId, teamRepository } = {}) {
  if (!teamId) {
    return null;
  }

  if (!teamRepository || typeof teamRepository.getTeamById !== "function") {
    const err = new Error("teamRepository.getTeamById is required when teamId is provided");
    err.code = "missing_dependency";
    throw err;
  }

  const result = await teamRepository.getTeamById(tenantCtx, teamId);
  return normalizeTeamContext(result?.team || null);
}

async function loadPublishedMethodologyRecords({ tenantCtx, methodologyRepository } = {}) {
  if (!methodologyRepository || typeof methodologyRepository.getMethodologyByScope !== "function") {
    const err = new Error(
      "methodologyRepository.getMethodologyByScope is required for methodology lookups"
    );
    err.code = "missing_dependency";
    throw err;
  }

  const records = await Promise.all(
    METHODOLOGY_SCOPES.map(async (scope) => {
      const result = await methodologyRepository.getMethodologyByScope(tenantCtx, scope);
      const methodology = normalizePublishedMethodology(result?.methodology || null);
      return methodology ? [scope, methodology] : null;
    })
  );

  return Object.fromEntries(records.filter(Boolean));
}

async function loadGenerationContextLookups({
  tenantCtx,
  teamId,
  teamRepository,
  methodologyRepository,
} = {}) {
  const [teamContext, methodologyRecords] = await Promise.all([
    loadTeamContext({ tenantCtx, teamId, teamRepository }),
    loadPublishedMethodologyRecords({ tenantCtx, methodologyRepository }),
  ]);

  return {
    teamContext,
    methodologyRecords,
  };
}

module.exports = {
  METHODOLOGY_SCOPES,
  loadGenerationContextLookups,
  loadPublishedMethodologyRecords,
  loadTeamContext,
};
