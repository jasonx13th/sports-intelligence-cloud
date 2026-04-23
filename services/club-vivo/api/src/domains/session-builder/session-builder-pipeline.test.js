"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  processSessionPackRequest,
  processSessionImageAnalysisRequest,
  normalizeSessionPackInput,
  generateSessionPack,
  generateCoachLiteDraft,
  validateCoachLiteDraft,
  validateGeneratedPack,
  persistSession,
  exportPersistedSession,
} = require("./session-builder-pipeline");

function stripPackIdentity(pack) {
  return {
    ...pack,
    packId: undefined,
    createdAt: undefined,
  };
}

test("normalizeSessionPackInput returns canonical request shape", () => {
  const normalizedInput = normalizeSessionPackInput({
    sport: "soccer",
    sportPackId: "fut-soccer",
    ageBand: "U14",
    durationMin: 60,
    theme: "Finishing",
    sessionsCount: 2,
    equipment: ["Cones", "Goals"],
  });

  assert.deepEqual(normalizedInput, {
    sport: "soccer",
    sportPackId: "fut-soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "Finishing",
    sessionsCount: 2,
    equipment: ["cones", "goals"],
  });
});

test("processSessionPackRequest keeps sportPackId in normalized input while preserving the public pack shape", async () => {
  const result = await processSessionPackRequest({
    sport: "soccer",
    sportPackId: "fut-soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  assert.equal(result.normalizedInput.sportPackId, "fut-soccer");
  assert.equal(result.generationContext.sportPackId, "fut-soccer");
  assert.equal(result.resolvedGenerationContext.sportPackId, "fut-soccer");
  assert.equal(Object.hasOwn(result.validatedPack, "sportPackId"), false);
  assert.equal(result.validatedPack.sport, "soccer");
});

test("generateSessionPack produces deterministic pack content from canonical input", () => {
  const normalizedInput = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 2,
    equipment: ["cones", "balls"],
  };

  const packA = generateSessionPack(normalizedInput);
  const packB = generateSessionPack(normalizedInput);

  assert.notEqual(packA.packId, packB.packId);
  assert.deepEqual(
    { ...packA, packId: undefined, createdAt: undefined },
    { ...packB, packId: undefined, createdAt: undefined }
  );
});

test("validateGeneratedPack enforces exact generated duration invariants", () => {
  const validatedPack = validateGeneratedPack({
    packId: "pack-1",
    createdAt: "2026-04-01T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    sessions: [
      {
        sport: "soccer",
        ageBand: "u14",
        durationMin: 60,
        objectiveTags: ["pressing"],
        activities: [
          { name: "Warm-up", minutes: 10, description: "Prep" },
          { name: "Game", minutes: 50, description: "Play" },
        ],
      },
    ],
  });

  assert.equal(validatedPack.sessions.length, 1);
  assert.equal(validatedPack.sessions[0].durationMin, 60);
});

test("processSessionPackRequest returns explicit pipeline stages", async () => {
  const result = await processSessionPackRequest({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 2,
    equipment: ["cones", "balls"],
  });

  assert.deepEqual(result.normalizedInput.equipment, ["cones", "balls"]);
  assert.deepEqual(result.generationContext.equipment, ["cones", "balls"]);
  assert.equal(result.generationContext.durationMin, 60);
  assert.equal(result.generationContext.sources.durationMinSource, "request");
  assert.equal(result.generationContext.methodologyScope, null);
  assert.equal(result.generationContext.teamContextUsed, false);
  assert.deepEqual(result.resolvedGenerationContext.equipment, ["cones", "balls"]);
  assert.equal(result.resolvedGenerationContext.durationMin, 60);
  assert.equal(result.resolvedGenerationContext.sources.durationMinSource, "request");
  assert.equal(result.resolvedGenerationContext.resolvedProgramType, null);
  assert.equal(result.resolvedGenerationContext.resolvedMethodologyScope, null);
  assert.deepEqual(result.methodologyInfluence, {
    styleBias: "default",
    methodologyApplied: false,
    guidanceSnippets: [],
  });
  assert.ok(result.generatedPack.packId);
  assert.ok(result.validatedPack.packId);
  assert.equal(result.coachLiteDraft.specVersion, "session-pack.v2");
  assert.equal(result.validatedCoachLiteDraft.specVersion, "session-pack.v2");
  assert.deepEqual(result.validatedPack.sessions[0].equipment, ["cones", "balls"]);
  assert.equal(Object.hasOwn(result.validatedPack, "generationContext"), false);
  assert.equal(Object.hasOwn(result.validatedPack, "resolvedGenerationContext"), false);
});

test("processSessionPackRequest uses confirmed setup profile only after confirmation and keeps pack shape unchanged", async () => {
  const confirmedProfile = {
    mode: "setup_to_drill",
    schemaVersion: 1,
    analysisId: "analysis-123",
    status: "confirmed",
    sourceImageId: "image-123",
    sourceImageMimeType: "image/png",
    summary: "Cone box with two end lines.",
    layoutType: "box",
    spaceSize: "small",
    playerOrganization: "two-lines",
    visibleEquipment: ["cones", "mini-goals"],
    focusTags: ["passing", "support"],
    constraints: ["tight-space"],
    assumptions: [],
    analysisConfidence: "medium",
  };

  const result = await processSessionPackRequest({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    confirmedProfile,
  });

  assert.deepEqual(result.normalizedInput.confirmedProfile, confirmedProfile);
  assert.deepEqual(result.generationContext.confirmedProfile, confirmedProfile);
  assert.deepEqual(result.resolvedGenerationContext.confirmedProfile, confirmedProfile);
  assert.equal(result.validatedPack.sessions[0].activities[0].name, "Passing Support");
  assert.match(result.validatedPack.sessions[0].activities[0].description, /Layout: box\./);
  assert.deepEqual(result.validatedPack.sessions[0].equipment, ["cones", "mini-goals"]);
  assert.equal(Object.hasOwn(result.validatedPack, "confirmedProfile"), false);
});

test("processSessionPackRequest keeps existing single-argument usage and default pack output unchanged", async () => {
  const rawInput = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  };

  const resultWithoutOptions = await processSessionPackRequest(rawInput);
  const resultWithEmptyOptions = await processSessionPackRequest(rawInput, {});

  assert.deepEqual(
    stripPackIdentity(resultWithoutOptions.validatedPack),
    stripPackIdentity(resultWithEmptyOptions.validatedPack)
  );
  assert.equal(resultWithoutOptions.generationContext.durationMin, 60);
  assert.equal(resultWithoutOptions.resolvedGenerationContext.durationMin, 60);
  assert.equal(resultWithoutOptions.resolvedGenerationContext.resolvedProgramType, null);
});

test("optional internal teamContext influences only resolvedGenerationContext", async () => {
  const rawInput = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  };

  const baseResult = await processSessionPackRequest(rawInput);
  const resolvedResult = await processSessionPackRequest(rawInput, {
    teamContext: {
      programType: "travel",
      ageBand: "u15",
      playerCount: 16,
    },
  });

  assert.equal(resolvedResult.generationContext.teamContextUsed, false);
  assert.equal(resolvedResult.resolvedGenerationContext.teamContextUsed, true);
  assert.equal(resolvedResult.resolvedGenerationContext.resolvedProgramType, "travel");
  assert.equal(resolvedResult.resolvedGenerationContext.resolvedPlayerCount, 16);
  assert.equal(resolvedResult.resolvedGenerationContext.teamAgeBand, "u15");
  assert.equal(resolvedResult.resolvedGenerationContext.teamAgeBandConsistentWithRequest, false);
  assert.equal(resolvedResult.generationContext.durationMin, 60);
  assert.equal(resolvedResult.resolvedGenerationContext.durationMin, 60);
  assert.deepEqual(
    stripPackIdentity(baseResult.validatedPack),
    stripPackIdentity(resolvedResult.validatedPack)
  );
});

test("optional internal methodologyRecords influence only resolvedGenerationContext", async () => {
  const rawInput = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  };

  const baseResult = await processSessionPackRequest(rawInput);
  const resolvedResult = await processSessionPackRequest(rawInput, {
    teamContext: {
      programType: "travel",
    },
    methodologyRecords: {
      shared: {
        scope: "shared",
        title: "Shared principles",
        content: "Shared methodology guidance.",
        status: "published",
      },
      travel: {
        scope: "travel",
        title: "Travel principles",
        content: "Travel methodology guidance.",
        status: "published",
      },
    },
  });

  assert.equal(resolvedResult.generationContext.methodologyScope, null);
  assert.equal(resolvedResult.resolvedGenerationContext.resolvedMethodologyScope, "travel");
  assert.deepEqual(resolvedResult.methodologyInfluence, {
    styleBias: "travel",
    methodologyApplied: true,
    guidanceSnippets: ["travel-tempo", "travel-competitive-repetition"],
  });
  assert.deepEqual(resolvedResult.resolvedGenerationContext.appliedMethodologyScopes, [
    "shared",
    "travel",
  ]);
  assert.match(resolvedResult.resolvedGenerationContext.methodologyGuidance, /Shared principles/);
  assert.match(resolvedResult.resolvedGenerationContext.methodologyGuidance, /Travel principles/);
  assert.equal(resolvedResult.generationContext.durationMin, 60);
  assert.equal(resolvedResult.resolvedGenerationContext.durationMin, 60);
  assert.equal(resolvedResult.validatedPack.durationMin, rawInput.durationMin);
  assert.equal(resolvedResult.validatedPack.theme, rawInput.theme);
  assert.deepEqual(resolvedResult.validatedPack.equipment, rawInput.equipment);
  assert.notDeepEqual(
    stripPackIdentity(baseResult.validatedPack),
    stripPackIdentity(resolvedResult.validatedPack)
  );
  assert.match(
    resolvedResult.validatedPack.sessions[0].activities[0].description,
    /Keep the tempo sharp and the details game-realistic\./
  );
  assert.equal(Object.hasOwn(resolvedResult.validatedPack, "resolvedMethodologyScope"), false);
  assert.equal(Object.hasOwn(resolvedResult.validatedPack, "methodologyInfluence"), false);
});

test("processSessionPackRequest carries compact builder notes and environment into generated session detail without changing the public shape", async () => {
  const result = await processSessionPackRequest({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing | notes:first pass after regain | env:turf",
    sessionsCount: 1,
  });

  assert.match(result.validatedPack.sessions[0].activities[0].description, /Today's focus: pressing\./i);
  assert.match(result.validatedPack.sessions[0].activities[0].description, /available turf\./i);
  assert.match(
    result.validatedPack.sessions[0].activities[1].description,
    /Coach note: first pass after regain\./i
  );
  assert.equal(result.validatedPack.theme, "pressing | notes:first pass after regain | env:turf");
  assert.equal(Object.hasOwn(result.validatedPack, "promptSignals"), false);
});

test("lookup path loads teamContext and published methodology records when tenant inputs and repositories are supplied", async () => {
  const tenantCtx = {
    tenantId: "tenant-123",
    userId: "user-123",
  };
  const rawInput = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  };
  const calls = [];

  const result = await processSessionPackRequest(rawInput, {
    tenantCtx,
    teamId: "team-123",
    teamRepository: {
      getTeamById: async (...args) => {
        calls.push({ type: "team", args });
        return {
          team: {
            teamId: "team-123",
            ageBand: "U14",
            playerCount: 14,
          },
        };
      },
    },
    methodologyRepository: {
      getMethodologyByScope: async (...args) => {
        calls.push({ type: "methodology", args });
        const scope = args[1];

        if (scope === "shared") {
          return {
            methodology: {
              scope: "shared",
              title: "Shared principles",
              content: "Shared methodology guidance.",
              status: "published",
            },
          };
        }

        if (scope === "travel") {
          return {
            methodology: {
              scope: "travel",
              title: "Travel draft",
              content: "Should not apply.",
              status: "draft",
            },
          };
        }

        return null;
      },
    },
  });

  assert.deepEqual(result.resolvedGenerationContext.teamContextUsed, true);
  assert.equal(result.resolvedGenerationContext.resolvedProgramType, null);
  assert.equal(result.resolvedGenerationContext.resolvedPlayerCount, 14);
  assert.equal(result.resolvedGenerationContext.teamAgeBand, "u14");
  assert.equal(result.resolvedGenerationContext.teamAgeBandConsistentWithRequest, true);
  assert.equal(result.resolvedGenerationContext.resolvedMethodologyScope, "shared");
  assert.deepEqual(result.resolvedGenerationContext.appliedMethodologyScopes, ["shared"]);
  assert.match(result.resolvedGenerationContext.methodologyGuidance, /Shared principles/);
  assert.equal(result.generationContext.durationMin, 60);
  assert.equal(result.resolvedGenerationContext.durationMin, 60);
  assert.equal(Object.hasOwn(result.validatedPack, "resolvedGenerationContext"), false);
  assert.deepEqual(calls, [
    { type: "team", args: [tenantCtx, "team-123"] },
    { type: "methodology", args: [tenantCtx, "shared"] },
    { type: "methodology", args: [tenantCtx, "travel"] },
    { type: "methodology", args: [tenantCtx, "ost"] },
  ]);
});

test("lookup path can resolve missing team programType and published travel methodology without leaking public fields", async () => {
  const rawInput = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  };

  const result = await processSessionPackRequest(rawInput, {
    tenantCtx: {
      tenantId: "tenant-123",
      userId: "user-123",
    },
    teamId: "team-789",
    teamRepository: {
      getTeamById: async () => ({
        team: {
          teamId: "team-789",
          programType: "travel",
          ageBand: "U15",
          playerCount: 18,
        },
      }),
    },
    methodologyRepository: {
      getMethodologyByScope: async (_tenantCtx, scope) => {
        if (scope === "shared") {
          return {
            methodology: {
              scope: "shared",
              title: "Shared principles",
              content: "Shared methodology guidance.",
              status: "published",
            },
          };
        }

        if (scope === "travel") {
          return {
            methodology: {
              scope: "travel",
              title: "Travel principles",
              content: "Travel methodology guidance.",
              status: "published",
            },
          };
        }

        return null;
      },
    },
  });

  assert.equal(result.generationContext.teamContextUsed, false);
  assert.equal(result.resolvedGenerationContext.teamContextUsed, true);
  assert.equal(result.resolvedGenerationContext.resolvedProgramType, "travel");
  assert.equal(result.resolvedGenerationContext.resolvedPlayerCount, 18);
  assert.equal(result.resolvedGenerationContext.teamAgeBand, "u15");
  assert.equal(result.resolvedGenerationContext.teamAgeBandConsistentWithRequest, false);
  assert.equal(result.resolvedGenerationContext.sources.durationMinSource, "request");
  assert.deepEqual(result.methodologyInfluence, {
    styleBias: "travel",
    methodologyApplied: true,
    guidanceSnippets: ["travel-tempo", "travel-competitive-repetition"],
  });
  assert.deepEqual(result.resolvedGenerationContext.appliedMethodologyScopes, [
    "shared",
    "travel",
  ]);
  assert.equal(result.validatedPack.durationMin, rawInput.durationMin);
  assert.equal(result.validatedPack.theme, rawInput.theme);
  assert.deepEqual(result.validatedPack.equipment, rawInput.equipment);
  assert.match(
    result.validatedPack.sessions[0].activities[0].description,
    /Keep the tempo sharp and the details game-realistic\./
  );
  assert.equal(Object.hasOwn(result.validatedPack, "resolvedProgramType"), false);
  assert.equal(Object.hasOwn(result.validatedPack, "appliedMethodologyScopes"), false);
  assert.equal(Object.hasOwn(result.validatedPack, "methodologyInfluence"), false);
});

test("ost methodology context applies only an internal ost style bias while preserving request-owned fields", async () => {
  const rawInput = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  };

  const baseResult = await processSessionPackRequest(rawInput);
  const resolvedResult = await processSessionPackRequest(rawInput, {
    teamContext: {
      programType: "ost",
    },
    methodologyRecords: {
      shared: {
        scope: "shared",
        title: "Shared principles",
        content: "Shared methodology guidance.",
        status: "published",
      },
      ost: {
        scope: "ost",
        title: "OST principles",
        content: "OST methodology guidance.",
        status: "published",
      },
    },
  });

  assert.equal(resolvedResult.resolvedGenerationContext.resolvedMethodologyScope, "ost");
  assert.deepEqual(resolvedResult.methodologyInfluence, {
    styleBias: "ost",
    methodologyApplied: true,
    guidanceSnippets: ["ost-clear-directions", "ost-guided-repetition"],
  });
  assert.equal(resolvedResult.validatedPack.durationMin, rawInput.durationMin);
  assert.equal(resolvedResult.validatedPack.theme, rawInput.theme);
  assert.deepEqual(resolvedResult.validatedPack.equipment, rawInput.equipment);
  assert.notDeepEqual(
    stripPackIdentity(baseResult.validatedPack),
    stripPackIdentity(resolvedResult.validatedPack)
  );
  assert.match(
    resolvedResult.validatedPack.sessions[0].activities[0].description,
    /Keep directions clear and scaffold the first few reps\./
  );
  assert.equal(Object.hasOwn(resolvedResult.validatedPack, "methodologyInfluence"), false);
});

test("processSessionImageAnalysisRequest stores one tenant-scoped image and returns a draft profile", async () => {
  const storageCalls = [];
  const analysisCalls = [];

  const result = await processSessionImageAnalysisRequest({
    rawInput: {
      requestType: "image-analysis",
      mode: "environment_profile",
      sourceImage: {
        filename: "field.jpg",
        mimeType: "image/jpeg",
        bytesBase64: Buffer.from("fake-image").toString("base64"),
      },
    },
    tenantCtx: { tenantId: "tenant_authoritative" },
    imageStorage: {
      putSourceImage: async (args) => {
        storageCalls.push(args);
        return { key: "tenant/tenant_authoritative/session-builder/image-intake/v1/environment_profile/analysis/source/image.jpg" };
      },
    },
    imageAnalysis: {
      analyzeImage: async (args) => {
        analysisCalls.push(args);
        return {
          text: JSON.stringify({
            summary: "Small turf space with one goal.",
            surfaceType: "turf",
            spaceSize: "small",
            boundaryType: "small-grid",
            visibleEquipment: ["cones", "goal"],
            constraints: ["limited-width"],
            safetyNotes: [],
            assumptions: [],
            analysisConfidence: "medium",
          }),
          usage: { inputTokens: 1, outputTokens: 1 },
          metrics: {},
          stopReason: "end_turn",
        };
      },
    },
  });

  assert.equal(storageCalls[0].tenantId, "tenant_authoritative");
  assert.equal(storageCalls[0].mode, "environment_profile");
  assert.equal(analysisCalls[0].mode, "environment_profile");
  assert.equal(result.profile.status, "draft");
  assert.equal(result.profile.mode, "environment_profile");
  assert.equal(result.storageKey.includes("tenant/tenant_authoritative/"), true);
});

test("generateCoachLiteDraft derives an internal Coach Lite draft without changing pack shape", () => {
  const generatedPack = generateSessionPack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  const draft = generateCoachLiteDraft(generatedPack);

  assert.equal(draft.specVersion, "session-pack.v2");
  assert.equal(draft.sport, "soccer");
  assert.equal(draft.sessionPackId, generatedPack.packId);
  assert.equal(generatedPack.packId !== undefined, true);
  assert.equal(Object.hasOwn(generatedPack, "sessionPackId"), false);
});

test("validateCoachLiteDraft accepts the derived internal draft", () => {
  const generatedPack = generateSessionPack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 50,
    theme: "passing shape",
    sessionsCount: 1,
  });

  const draft = generateCoachLiteDraft(generatedPack);
  const validatedDraft = validateCoachLiteDraft(draft);

  assert.equal(validatedDraft.specVersion, "session-pack.v2");
  assert.equal(validatedDraft.durationMinutes, 50);
});

test("persistSession returns explicit persist stage output", async () => {
  const normalizedInput = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    objectiveTags: ["pressing"],
    activities: [{ name: "Warm-up", minutes: 60, description: "Prep" }],
  };

  const result = await persistSession({
    tenantCtx: { tenantId: "tenant_authoritative", userId: "user-123" },
    normalizedInput,
    sessionRepository: {
      createSession: async (tenantCtx, sessionInput) => ({
        session: {
          sessionId: "session-123",
          createdAt: "2026-04-01T00:00:00.000Z",
          createdBy: tenantCtx.userId,
          ...sessionInput,
        },
      }),
    },
  });

  assert.deepEqual(result.normalizedInput, normalizedInput);
  assert.equal(result.persistedSession.sessionId, "session-123");
});

test("exportPersistedSession returns explicit export stage output", async () => {
  const calls = [];
  const persistedSession = {
    sessionId: "session-123",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    objectiveTags: ["pressing"],
    activities: [{ name: "Warm-up", minutes: 60, description: "Prep" }],
  };

  const result = await exportPersistedSession({
    tenantCtx: { tenantId: "tenant_authoritative" },
    persistedSession,
    createSessionPdfBufferFn: ({ tenantId, session }) => {
      calls.push({ tenantId, session });
      return Buffer.from("%PDF-1.4\nfake\n", "utf8");
    },
    sessionPdfStorage: {
      putSessionPdf: async (args) => {
        calls.push({ putArgs: args });
      },
      presignSessionPdfGet: async (args) => {
        calls.push({ presignArgs: args });
        return {
          url: "https://example.com/presigned.pdf",
          expiresInSeconds: 300,
        };
      },
    },
  });

  assert.equal(result.persistedSession.sessionId, "session-123");
  assert.deepEqual(result.exportResult, {
    url: "https://example.com/presigned.pdf",
    expiresInSeconds: 300,
  });
  assert.deepEqual(calls, [
    { tenantId: "tenant_authoritative", session: persistedSession },
    {
      putArgs: {
        tenantId: "tenant_authoritative",
        sessionId: "session-123",
        pdfBuffer: Buffer.from("%PDF-1.4\nfake\n", "utf8"),
      },
    },
    {
      presignArgs: {
        tenantId: "tenant_authoritative",
        sessionId: "session-123",
      },
    },
  ]);
});
