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
