"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  processSessionPackRequest,
  normalizeSessionPackInput,
  generateSessionPack,
  validateGeneratedPack,
  persistSession,
  exportPersistedSession,
} = require("./session-builder-pipeline");

test("normalizeSessionPackInput returns canonical request shape", () => {
  const normalizedInput = normalizeSessionPackInput({
    sport: "soccer",
    ageBand: "U14",
    durationMin: 60,
    theme: "Finishing",
    sessionsCount: 2,
    equipment: ["Cones", "Goals"],
  });

  assert.deepEqual(normalizedInput, {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "Finishing",
    sessionsCount: 2,
    equipment: ["cones", "goals"],
  });
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
  assert.deepEqual(result.validatedPack.sessions[0].equipment, ["cones", "balls"]);
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
