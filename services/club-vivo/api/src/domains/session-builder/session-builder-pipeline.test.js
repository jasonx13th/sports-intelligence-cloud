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

test("processSessionPackRequest keeps sportPackId in normalized input while preserving the public pack shape", () => {
  const result = processSessionPackRequest({
    sport: "soccer",
    sportPackId: "fut-soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  assert.equal(result.normalizedInput.sportPackId, "fut-soccer");
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

test("processSessionPackRequest returns explicit pipeline stages", () => {
  const result = processSessionPackRequest({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 2,
    equipment: ["cones", "balls"],
  });

  assert.deepEqual(result.normalizedInput.equipment, ["cones", "balls"]);
  assert.ok(result.generatedPack.packId);
  assert.ok(result.validatedPack.packId);
  assert.equal(result.coachLiteDraft.specVersion, "session-pack.v2");
  assert.equal(result.validatedCoachLiteDraft.specVersion, "session-pack.v2");
  assert.deepEqual(result.validatedPack.sessions[0].equipment, ["cones", "balls"]);
});

test("processSessionPackRequest uses confirmed setup profile only after confirmation and keeps pack shape unchanged", () => {
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

  const result = processSessionPackRequest({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    confirmedProfile,
  });

  assert.deepEqual(result.normalizedInput.confirmedProfile, confirmedProfile);
  assert.equal(result.validatedPack.sessions[0].activities[0].name, "Passing Support");
  assert.match(result.validatedPack.sessions[0].activities[0].description, /Layout: box\./);
  assert.deepEqual(result.validatedPack.sessions[0].equipment, ["cones", "mini-goals"]);
  assert.equal(Object.hasOwn(result.validatedPack, "confirmedProfile"), false);
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
