"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { buildGenerationContext, REQUEST_SOURCE } = require("./generation-context");

function makeNormalizedSessionPackRequest(overrides = {}) {
  return {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 3,
    equipment: ["cones", "balls"],
    ...overrides,
  };
}

test("buildGenerationContext builds context from a valid normalized request", () => {
  const context = buildGenerationContext(makeNormalizedSessionPackRequest());

  assert.deepEqual(context, {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 3,
    equipment: ["cones", "balls"],
    sources: {
      durationMinSource: "request",
      ageBandSource: "request",
      themeSource: "request",
      equipmentSource: "request",
    },
    methodologyScope: null,
    teamContextUsed: false,
  });
});

test("buildGenerationContext preserves sportPackId when present", () => {
  const context = buildGenerationContext(
    makeNormalizedSessionPackRequest({
      sportPackId: "fut-soccer",
    })
  );

  assert.equal(context.sportPackId, "fut-soccer");
});

test("buildGenerationContext preserves confirmedProfile when present", () => {
  const confirmedProfile = {
    mode: "environment_profile",
    schemaVersion: 1,
    analysisId: "analysis-123",
    status: "confirmed",
    sourceImageId: "image-123",
    sourceImageMimeType: "image/jpeg",
    summary: "Small turf area with one goal.",
    surfaceType: "turf",
    spaceSize: "small",
    boundaryType: "small-grid",
    visibleEquipment: ["cones", "goal"],
    constraints: ["limited-width"],
    safetyNotes: [],
    assumptions: [],
    analysisConfidence: "medium",
  };

  const context = buildGenerationContext(
    makeNormalizedSessionPackRequest({
      confirmedProfile,
    })
  );

  assert.deepEqual(context.confirmedProfile, confirmedProfile);
});

test("buildGenerationContext stamps request ownership sources", () => {
  const context = buildGenerationContext(makeNormalizedSessionPackRequest());

  assert.deepEqual(context.sources, {
    durationMinSource: REQUEST_SOURCE,
    ageBandSource: REQUEST_SOURCE,
    themeSource: REQUEST_SOURCE,
    equipmentSource: REQUEST_SOURCE,
  });
});

test("buildGenerationContext sets methodologyScope to null", () => {
  const context = buildGenerationContext(makeNormalizedSessionPackRequest());

  assert.equal(context.methodologyScope, null);
});

test("buildGenerationContext sets teamContextUsed to false", () => {
  const context = buildGenerationContext(makeNormalizedSessionPackRequest());

  assert.equal(context.teamContextUsed, false);
});
