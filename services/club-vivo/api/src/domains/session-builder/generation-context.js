"use strict";

const REQUEST_SOURCE = "request";

function buildGenerationContext(normalizedRequest) {
  return {
    sport: normalizedRequest.sport,
    ...(normalizedRequest.sportPackId !== undefined
      ? { sportPackId: normalizedRequest.sportPackId }
      : {}),
    ageBand: normalizedRequest.ageBand,
    durationMin: normalizedRequest.durationMin,
    theme: normalizedRequest.theme,
    ...(normalizedRequest.sessionMode !== undefined
      ? { sessionMode: normalizedRequest.sessionMode }
      : {}),
    ...(normalizedRequest.coachNotes !== undefined
      ? { coachNotes: normalizedRequest.coachNotes }
      : {}),
    sessionsCount: normalizedRequest.sessionsCount,
    equipment: Array.isArray(normalizedRequest.equipment) ? normalizedRequest.equipment : [],
    ...(normalizedRequest.confirmedProfile !== undefined
      ? { confirmedProfile: normalizedRequest.confirmedProfile }
      : {}),
    sources: {
      durationMinSource: REQUEST_SOURCE,
      ageBandSource: REQUEST_SOURCE,
      themeSource: REQUEST_SOURCE,
      equipmentSource: REQUEST_SOURCE,
    },
    methodologyScope: null,
    teamContextUsed: false,
  };
}

module.exports = {
  REQUEST_SOURCE,
  buildGenerationContext,
};
