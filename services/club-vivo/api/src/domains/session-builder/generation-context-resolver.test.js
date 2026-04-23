"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { buildGenerationContext } = require("./generation-context");
const { resolveGenerationContext } = require("./generation-context-resolver");

function makeBaseGenerationContext(overrides = {}) {
  return buildGenerationContext({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 3,
    equipment: ["cones", "balls"],
    ...overrides,
  });
}

function makeMethodologyRecord(scope, overrides = {}) {
  return {
    scope,
    title: `${scope} methodology`,
    content: `${scope} guidance content`,
    status: "published",
    ...overrides,
  };
}

test("resolveGenerationContext keeps request-owned fields unchanged with base context only", () => {
  const generationContext = makeBaseGenerationContext();

  const resolvedContext = resolveGenerationContext({
    generationContext,
  });

  assert.equal(resolvedContext.durationMin, generationContext.durationMin);
  assert.equal(resolvedContext.ageBand, generationContext.ageBand);
  assert.equal(resolvedContext.theme, generationContext.theme);
  assert.deepEqual(resolvedContext.equipment, generationContext.equipment);
  assert.equal(resolvedContext.sources.durationMinSource, "request");
  assert.equal(resolvedContext.teamContextUsed, false);
  assert.equal(resolvedContext.resolvedProgramType, null);
  assert.equal(resolvedContext.resolvedMethodologyScope, null);
  assert.deepEqual(resolvedContext.appliedMethodologyScopes, []);
  assert.equal(resolvedContext.methodologyGuidance, null);
});

test("resolveGenerationContext resolves travel program type from team context", () => {
  const resolvedContext = resolveGenerationContext({
    generationContext: makeBaseGenerationContext(),
    teamContext: {
      programType: "travel",
      ageBand: "u15",
      playerCount: 16,
    },
  });

  assert.equal(resolvedContext.teamContextUsed, true);
  assert.equal(resolvedContext.resolvedProgramType, "travel");
  assert.equal(resolvedContext.durationMin, 60);
  assert.equal(resolvedContext.sources.durationMinSource, "request");
});

test("resolveGenerationContext resolves ost program type from team context", () => {
  const resolvedContext = resolveGenerationContext({
    generationContext: makeBaseGenerationContext(),
    teamContext: {
      programType: "ost",
      ageBand: "u12",
      playerCount: 12,
    },
  });

  assert.equal(resolvedContext.teamContextUsed, true);
  assert.equal(resolvedContext.resolvedProgramType, "ost");
  assert.equal(resolvedContext.durationMin, 60);
  assert.equal(resolvedContext.sources.durationMinSource, "request");
});

test("resolveGenerationContext applies shared methodology alone", () => {
  const resolvedContext = resolveGenerationContext({
    generationContext: makeBaseGenerationContext(),
    methodologyRecords: {
      shared: makeMethodologyRecord("shared", {
        title: "Shared principles",
        content: "Shared methodology guidance.",
      }),
    },
  });

  assert.equal(resolvedContext.teamContextUsed, false);
  assert.equal(resolvedContext.resolvedProgramType, null);
  assert.equal(resolvedContext.resolvedMethodologyScope, "shared");
  assert.deepEqual(resolvedContext.appliedMethodologyScopes, ["shared"]);
  assert.match(resolvedContext.methodologyGuidance, /Shared principles/);
  assert.match(resolvedContext.methodologyGuidance, /Shared methodology guidance\./);
});

test("resolveGenerationContext applies shared and travel methodology for travel team", () => {
  const resolvedContext = resolveGenerationContext({
    generationContext: makeBaseGenerationContext(),
    teamContext: {
      programType: "travel",
    },
    methodologyRecords: {
      shared: makeMethodologyRecord("shared", {
        title: "Shared principles",
        content: "Shared methodology guidance.",
      }),
      travel: makeMethodologyRecord("travel", {
        title: "Travel principles",
        content: "Travel methodology guidance.",
      }),
    },
  });

  assert.equal(resolvedContext.resolvedProgramType, "travel");
  assert.equal(resolvedContext.resolvedMethodologyScope, "travel");
  assert.deepEqual(resolvedContext.appliedMethodologyScopes, ["shared", "travel"]);
  assert.match(resolvedContext.methodologyGuidance, /Shared principles/);
  assert.match(resolvedContext.methodologyGuidance, /Travel principles/);
  assert.equal(resolvedContext.durationMin, 60);
  assert.equal(resolvedContext.sources.durationMinSource, "request");
});

test("resolveGenerationContext applies shared and ost methodology for ost team", () => {
  const resolvedContext = resolveGenerationContext({
    generationContext: makeBaseGenerationContext(),
    teamContext: {
      programType: "ost",
    },
    methodologyRecords: {
      shared: makeMethodologyRecord("shared", {
        title: "Shared principles",
        content: "Shared methodology guidance.",
      }),
      ost: makeMethodologyRecord("ost", {
        title: "OST principles",
        content: "OST methodology guidance.",
      }),
    },
  });

  assert.equal(resolvedContext.resolvedProgramType, "ost");
  assert.equal(resolvedContext.resolvedMethodologyScope, "ost");
  assert.deepEqual(resolvedContext.appliedMethodologyScopes, ["shared", "ost"]);
  assert.match(resolvedContext.methodologyGuidance, /Shared principles/);
  assert.match(resolvedContext.methodologyGuidance, /OST principles/);
  assert.equal(resolvedContext.durationMin, 60);
  assert.equal(resolvedContext.sources.durationMinSource, "request");
});
