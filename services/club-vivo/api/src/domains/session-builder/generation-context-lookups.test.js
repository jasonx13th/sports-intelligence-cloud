"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  METHODOLOGY_SCOPES,
  loadGenerationContextLookups,
} = require("./generation-context-lookups");

function makeTenantContext() {
  return {
    tenantId: "tenant-123",
    userId: "user-123",
  };
}

function makePublishedMethodology(scope, overrides = {}) {
  return {
    scope,
    title: `${scope} methodology`,
    content: `${scope} guidance`,
    status: "published",
    ...overrides,
  };
}

test("loadGenerationContextLookups returns null teamContext when no teamId is provided", async () => {
  const teamCalls = [];

  const result = await loadGenerationContextLookups({
    tenantCtx: makeTenantContext(),
    teamRepository: {
      getTeamById: async (...args) => {
        teamCalls.push(args);
        return null;
      },
    },
    methodologyRepository: {
      getMethodologyByScope: async () => null,
    },
  });

  assert.equal(result.teamContext, null);
  assert.deepEqual(result.methodologyRecords, {});
  assert.deepEqual(teamCalls, []);
});

test("loadGenerationContextLookups tolerates team records that omit programType", async () => {
  const result = await loadGenerationContextLookups({
    tenantCtx: makeTenantContext(),
    teamId: "team-123",
    teamRepository: {
      getTeamById: async () => ({
        team: {
          teamId: "team-123",
          ageBand: "U14",
          playerCount: 16,
        },
      }),
    },
    methodologyRepository: {
      getMethodologyByScope: async () => null,
    },
  });

  assert.deepEqual(result.teamContext, {
    programType: null,
    ageBand: "u14",
    playerCount: 16,
  });
});

test("loadGenerationContextLookups returns normalized travel team context when programType is present", async () => {
  const tenantCtx = makeTenantContext();
  const teamCalls = [];

  const result = await loadGenerationContextLookups({
    tenantCtx,
    teamId: "team-travel",
    teamRepository: {
      getTeamById: async (...args) => {
        teamCalls.push(args);
        return {
          team: {
            teamId: "team-travel",
            programType: " Travel ",
            ageBand: "U15",
            playerCount: 18,
          },
        };
      },
    },
    methodologyRepository: {
      getMethodologyByScope: async () => null,
    },
  });

  assert.deepEqual(teamCalls, [[tenantCtx, "team-travel"]]);
  assert.deepEqual(result.teamContext, {
    programType: "travel",
    ageBand: "u15",
    playerCount: 18,
  });
});

test("loadGenerationContextLookups returns published methodology records by scope", async () => {
  const methodologyCalls = [];

  const result = await loadGenerationContextLookups({
    tenantCtx: makeTenantContext(),
    methodologyRepository: {
      getMethodologyByScope: async (_tenantCtx, scope) => {
        methodologyCalls.push(scope);

        if (scope === "shared") {
          return {
            methodology: makePublishedMethodology("shared", {
              title: "Shared principles",
              content: "Shared guidance",
            }),
          };
        }

        if (scope === "travel") {
          return {
            methodology: makePublishedMethodology("travel", {
              title: "Travel principles",
              content: "Travel guidance",
            }),
          };
        }

        return null;
      },
    },
  });

  assert.deepEqual(methodologyCalls.sort(), [...METHODOLOGY_SCOPES].sort());
  assert.deepEqual(result.methodologyRecords, {
    shared: {
      scope: "shared",
      title: "Shared principles",
      content: "Shared guidance",
      status: "published",
    },
    travel: {
      scope: "travel",
      title: "Travel principles",
      content: "Travel guidance",
      status: "published",
    },
  });
});

test("loadGenerationContextLookups excludes draft methodology records", async () => {
  const result = await loadGenerationContextLookups({
    tenantCtx: makeTenantContext(),
    methodologyRepository: {
      getMethodologyByScope: async (_tenantCtx, scope) => {
        if (scope === "shared") {
          return {
            methodology: makePublishedMethodology("shared", {
              status: "draft",
            }),
          };
        }

        if (scope === "travel") {
          return {
            methodology: makePublishedMethodology("travel"),
          };
        }

        return null;
      },
    },
  });

  assert.deepEqual(result.methodologyRecords, {
    travel: {
      scope: "travel",
      title: "travel methodology",
      content: "travel guidance",
      status: "published",
    },
  });
});

test("loadGenerationContextLookups returns empty methodology records cleanly when no published records exist", async () => {
  const result = await loadGenerationContextLookups({
    tenantCtx: makeTenantContext(),
    methodologyRepository: {
      getMethodologyByScope: async () => null,
    },
  });

  assert.equal(result.teamContext, null);
  assert.deepEqual(result.methodologyRecords, {});
});
