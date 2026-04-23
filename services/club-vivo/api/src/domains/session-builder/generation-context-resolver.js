"use strict";

const PROGRAM_TYPES = ["travel", "ost"];

function resolveProgramType(teamContext) {
  const programType = teamContext?.programType;

  return PROGRAM_TYPES.includes(programType) ? programType : null;
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
  const teamContextUsed = resolvedProgramType !== null;
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
    resolvedMethodologyScope,
    appliedMethodologyScopes,
    methodologyGuidance: buildMethodologyGuidance(appliedMethodologyRecords),
    resolutionSources: {
      resolvedProgramTypeSource: teamContextUsed ? "teamContext.programType" : null,
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
