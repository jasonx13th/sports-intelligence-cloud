"use strict";

const PROGRAM_TYPES = ["travel", "ost"];

function resolveProgramType(teamContext) {
  const programType = teamContext?.programType;

  return PROGRAM_TYPES.includes(programType) ? programType : null;
}

function resolvePlayerCount(teamContext) {
  const playerCount = teamContext?.playerCount;

  if (!Number.isInteger(playerCount) || playerCount < 1) {
    return null;
  }

  return playerCount;
}

function normalizeAgeBandSignal(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "adult" || normalized === "adults") {
    return "adult";
  }

  if (normalized === "mixed age" || normalized === "mixed-age" || normalized === "mixed") {
    return "mixed_age";
  }

  const youthMatch = normalized.match(/^u(\d{1,2})$/);
  if (youthMatch) {
    return `u${Number.parseInt(youthMatch[1], 10)}`;
  }

  return normalized || null;
}

function resolveTeamAgeBand(teamContext) {
  return normalizeAgeBandSignal(teamContext?.ageBand);
}

function isYouthBandInRange(ageBand, minInclusive, maxInclusive) {
  const youthMatch = String(ageBand || "").match(/^u(\d{1,2})$/);

  if (!youthMatch) {
    return false;
  }

  const numericAge = Number.parseInt(youthMatch[1], 10);
  return numericAge >= minInclusive && numericAge <= maxInclusive;
}

function resolveTeamAgeBandConsistency({ generationContext, teamAgeBand }) {
  const requestAgeBand = normalizeAgeBandSignal(generationContext?.ageBand);

  if (!teamAgeBand || !requestAgeBand) {
    return null;
  }

  if (teamAgeBand === "adult") {
    return requestAgeBand === "adult";
  }

  if (teamAgeBand === "mixed_age") {
    return isYouthBandInRange(requestAgeBand, 7, 10);
  }

  return teamAgeBand === requestAgeBand;
}

function pickAppliedMethodologyRecords({ methodologyRecords, resolvedProgramType }) {
  const appliedRecords = [];

  if (methodologyRecords?.shared) {
    appliedRecords.push(methodologyRecords.shared);
  }

  if (resolvedProgramType === "travel" && methodologyRecords?.travel) {
    appliedRecords.push(methodologyRecords.travel);
  }

  if (resolvedProgramType === "ost" && methodologyRecords?.ost) {
    appliedRecords.push(methodologyRecords.ost);
  }

  return appliedRecords;
}

function buildMethodologyGuidance(appliedRecords) {
  if (!appliedRecords.length) {
    return null;
  }

  return appliedRecords
    .map((record) => `${record.title}\n${record.content}`)
    .join("\n\n");
}

function resolveMethodologyScope(appliedScopes) {
  if (appliedScopes.includes("travel")) {
    return "travel";
  }

  if (appliedScopes.includes("ost")) {
    return "ost";
  }

  if (appliedScopes.includes("shared")) {
    return "shared";
  }

  return null;
}

function resolveGenerationContext({
  generationContext,
  teamContext,
  methodologyRecords,
} = {}) {
  const resolvedProgramType = resolveProgramType(teamContext);
  const resolvedPlayerCount = resolvePlayerCount(teamContext);
  const teamAgeBand = resolveTeamAgeBand(teamContext);
  const teamAgeBandConsistentWithRequest = resolveTeamAgeBandConsistency({
    generationContext,
    teamAgeBand,
  });
  const teamContextUsed =
    resolvedProgramType !== null ||
    resolvedPlayerCount !== null ||
    teamAgeBand !== null;
  const appliedMethodologyRecords = pickAppliedMethodologyRecords({
    methodologyRecords,
    resolvedProgramType,
  });
  const appliedMethodologyScopes = appliedMethodologyRecords.map((record) => record.scope);
  const resolvedMethodologyScope = resolveMethodologyScope(appliedMethodologyScopes);

  return {
    ...generationContext,
    teamContextUsed,
    resolvedProgramType,
    resolvedPlayerCount,
    teamAgeBand,
    teamAgeBandConsistentWithRequest,
    resolvedMethodologyScope,
    appliedMethodologyScopes,
    methodologyGuidance: buildMethodologyGuidance(appliedMethodologyRecords),
    resolutionSources: {
      resolvedProgramTypeSource:
        resolvedProgramType !== null ? "teamContext.programType" : null,
      resolvedPlayerCountSource:
        resolvedPlayerCount !== null ? "teamContext.playerCount" : null,
      teamAgeBandSource: teamAgeBand !== null ? "teamContext.ageBand" : null,
      teamAgeBandConsistencySource:
        teamAgeBandConsistentWithRequest !== null
          ? "teamContext.ageBand->request.ageBand"
          : null,
      resolvedMethodologyScopeSource: resolvedMethodologyScope
        ? `methodology.${resolvedMethodologyScope}`
        : null,
      appliedMethodologySources: appliedMethodologyScopes.map((scope) => `methodology.${scope}`),
    },
  };
}

module.exports = {
  PROGRAM_TYPES,
  resolveGenerationContext,
};
