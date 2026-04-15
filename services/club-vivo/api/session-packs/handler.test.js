"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createSessionPacksInner } = require("./handler");

function makeLogger(events) {
  return {
    info: (eventType, message, extra = {}) =>
      events.push({ level: "INFO", eventType, message, ...extra }),
    warn: (eventType, message, extra = {}) =>
      events.push({ level: "WARN", eventType, message, ...extra }),
    error: (eventType, message, err, extra = {}) =>
      events.push({
        level: "ERROR",
        eventType,
        message,
        error: { name: err?.name, message: err?.message },
        ...extra,
      }),
  };
}

function makeTenantCtx() {
  return {
    tenantId: "tenant_authoritative",
    userId: "user-123",
    role: "coach",
    tier: "free",
  };
}

function makeEvent(body) {
  return {
    rawPath: "/session-packs",
    path: "/session-packs",
    requestContext: {
      http: {
        method: "POST",
      },
    },
    body: JSON.stringify(body),
  };
}

test("POST /session-packs returns validatedPack from the internal pipeline and keeps public response shape", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";

  const loggerEvents = [];
  const expectedPack = {
    packId: "pack-123",
    createdAt: "2026-04-01T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    sessions: [],
  };

  const inner = createSessionPacksInner({
    processSessionPackFn: (body) => ({
      normalizedInput: body,
      generatedPack: { ...expectedPack, packId: "generated-only" },
      validatedPack: expectedPack,
    }),
  });

  const response = await inner({
    event: makeEvent({
      sport: "soccer",
      ageBand: "u14",
      durationMin: 60,
      theme: "pressing",
    }),
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), { pack: expectedPack });
  assert.equal(loggerEvents[0].eventType, "pack_generated_success");
});

test("POST /session-packs accepts fut-soccer sportPackId while keeping the public response shape unchanged", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";

  const expectedPack = {
    packId: "pack-123",
    createdAt: "2026-04-01T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    sessions: [],
  };

  const inner = createSessionPacksInner({
    processSessionPackFn: (body) => {
      assert.equal(body.sport, "soccer");
      assert.equal(body.sportPackId, "fut-soccer");

      return {
        normalizedInput: body,
        generatedPack: expectedPack,
        validatedPack: expectedPack,
      };
    },
  });

  const response = await inner({
    event: makeEvent({
      sport: "soccer",
      sportPackId: "fut-soccer",
      ageBand: "u14",
      durationMin: 60,
      theme: "pressing",
    }),
    tenantCtx: makeTenantCtx(),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), { pack: expectedPack });
});

test("POST /session-packs maps pipeline validation errors to platform bad request", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";

  const inner = createSessionPacksInner({
    processSessionPackFn: () => {
      const err = new Error("bad input");
      err.statusCode = 400;
      err.details = { reason: "unsupported_age_band", field: "ageBand", value: "u7" };
      throw err;
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          sport: "soccer",
          ageBand: "u7",
          durationMin: 60,
          theme: "pressing",
        }),
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "platform.bad_request");
      assert.equal(err.httpStatus, 400);
      assert.deepEqual(err.details, {
        reason: "unsupported_age_band",
        field: "ageBand",
        value: "u7",
      });
      return true;
    }
  );
});

test("POST /session-packs returns analysis response for image-analysis requests inside the shared route", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SESSION_IMAGE_BUCKET_NAME = "session-image-bucket";
  process.env.SESSION_IMAGE_ANALYSIS_MODEL_ID = "amazon.nova-lite-v1:0";

  const loggerEvents = [];
  const inner = createSessionPacksInner({
    processSessionImageAnalysisFn: async () => ({
      analysisId: "analysis-123",
      profile: {
        mode: "environment_profile",
        schemaVersion: 1,
        analysisId: "analysis-123",
        status: "draft",
        sourceImageId: "image-123",
        sourceImageMimeType: "image/jpeg",
        summary: "Small turf space with one goal.",
        surfaceType: "turf",
        spaceSize: "small",
        boundaryType: "small-grid",
        visibleEquipment: ["cones", "goal"],
        constraints: [],
        safetyNotes: [],
        assumptions: [],
        analysisConfidence: "medium",
      },
      stopReason: "end_turn",
    }),
  });

  const response = await inner({
    event: makeEvent({
      requestType: "image-analysis",
      mode: "environment_profile",
      sourceImage: {
        mimeType: "image/jpeg",
        bytesBase64: "ZmFrZQ==",
      },
    }),
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), {
    analysis: {
      analysisId: "analysis-123",
      profile: {
        mode: "environment_profile",
        schemaVersion: 1,
        analysisId: "analysis-123",
        status: "draft",
        sourceImageId: "image-123",
        sourceImageMimeType: "image/jpeg",
        summary: "Small turf space with one goal.",
        surfaceType: "turf",
        spaceSize: "small",
        boundaryType: "small-grid",
        visibleEquipment: ["cones", "goal"],
        constraints: [],
        safetyNotes: [],
        assumptions: [],
        analysisConfidence: "medium",
      },
    },
  });
  assert.equal(loggerEvents[0].eventType, "session_image_analysis_success");
});

test("POST /session-packs logs confirmed image profile use while keeping the public response shape unchanged", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";

  const loggerEvents = [];
  const expectedPack = {
    packId: "pack-123",
    createdAt: "2026-04-01T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    sessions: [],
  };

  const inner = createSessionPacksInner({
    processSessionPackFn: () => ({
      normalizedInput: {
        confirmedProfile: {
          mode: "setup_to_drill",
          analysisId: "analysis-123",
          status: "confirmed",
        },
      },
      generatedPack: expectedPack,
      validatedPack: expectedPack,
    }),
  });

  const response = await inner({
    event: makeEvent({
      sport: "soccer",
      ageBand: "u14",
      durationMin: 60,
      theme: "pressing",
    }),
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), { pack: expectedPack });
  assert.deepEqual(
    loggerEvents.map((event) => event.eventType),
    ["session_image_profile_confirmed", "pack_generated_success"]
  );
});
