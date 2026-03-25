"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { generatePack, minutesSum, normalizeTheme } = require("./session-pack-templates");

function stripPackMeta(pack) {
  return {
    sport: pack.sport,
    ageBand: pack.ageBand,
    durationMin: pack.durationMin,
    theme: pack.theme,
    sessionsCount: pack.sessionsCount,
    sessions: pack.sessions,
  };
}

test("generatePack returns deterministic session content for the same request", () => {
  const input = {
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "Passing shape",
    sessionsCount: 2,
  };

  const packA = generatePack(input);
  const packB = generatePack(input);

  assert.notEqual(packA.packId, packB.packId);
  assert.deepEqual(stripPackMeta(packA), stripPackMeta(packB));
});

test("normalizeTheme trims, lowercases, and collapses whitespace deterministically", () => {
  assert.equal(normalizeTheme("  Passing   SHAPE  "), "passing shape");
  assert.equal(normalizeTheme(""), "");
});

test("minutesSum totals activity minutes deterministically", () => {
  assert.equal(minutesSum([{ minutes: 10 }, { minutes: 15 }, { minutes: 20 }]), 45);
  assert.equal(minutesSum([]), 0);
});

test("generatePack pads generated sessions to the requested duration", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 60,
    theme: "Finishing",
    sessionsCount: 3,
  });

  assert.equal(pack.sessions.length, 3);

  for (const session of pack.sessions) {
    assert.equal(session.durationMin, 60);
    assert.equal(minutesSum(session.activities), 60);
    assert.equal(session.activities.at(-2).name, "Low-intensity technical reps");
    assert.equal(session.activities.at(-2).minutes, 5);
    assert.equal(session.activities.at(-1).name, "Cooldown");
    assert.equal(session.activities.at(-1).minutes, 10);
  }
});

test("generatePack uses only cooldown when remaining minutes are within the cooldown cap", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u16",
    durationMin: 50,
    theme: "Passing shape",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;
  assert.equal(minutesSum(session.activities), 50);
  assert.equal(session.activities.at(-1).name, "Cooldown");
  assert.equal(session.activities.at(-1).minutes, 5);
  assert.equal(
    session.activities.some((activity) => activity.name === "Low-intensity technical reps"),
    false
  );
});

test("generatePack fallback theme stays valid and tenant-neutral", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u16",
    durationMin: 75,
    theme: "Recovery block",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;
  assert.deepEqual(session.objectiveTags, ["theme"]);
  assert.equal(minutesSum(session.activities), 75);
  assert.equal(Object.hasOwn(session, "tenantId"), false);
  assert.equal(Object.hasOwn(session, "tenant_id"), false);
});
