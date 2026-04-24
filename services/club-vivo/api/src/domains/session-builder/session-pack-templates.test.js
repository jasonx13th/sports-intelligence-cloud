"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildCoachLiteDraftFromPack,
  generatePack,
  minutesSum,
  normalizeTheme,
} = require("./session-pack-templates");

function stripPackMeta(pack) {
  return {
    sport: pack.sport,
    ageBand: pack.ageBand,
    durationMin: pack.durationMin,
    theme: pack.theme,
    sessionsCount: pack.sessionsCount,
    equipment: pack.equipment,
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
    durationMin: 65,
    theme: "Pressing",
    sessionsCount: 3,
  });

  assert.equal(pack.sessions.length, 3);

  for (const session of pack.sessions) {
    assert.equal(session.durationMin, 65);
    assert.equal(minutesSum(session.activities), 65);
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

test("generatePack carries equipment to the pack and generated sessions when provided", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 2,
    equipment: ["cones", "balls"],
  });

  assert.deepEqual(pack.equipment, ["cones", "balls"]);
  assert.equal(pack.sessions.length, 2);

  for (const session of pack.sessions) {
    assert.deepEqual(session.equipment, ["cones", "balls"]);
  }
});

test("generatePack applies a deterministic fut-soccer passing bias without changing canonical sport", () => {
  const soccerPack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "Passing shape",
    sessionsCount: 1,
  });

  const futSoccerPack = generatePack({
    sport: "soccer",
    sportPackId: "fut-soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "Passing shape",
    sessionsCount: 1,
  });

  assert.equal(futSoccerPack.sport, "soccer");
  assert.equal(futSoccerPack.sessions[0].sport, "soccer");
  assert.notDeepEqual(futSoccerPack.sessions[0].activities, soccerPack.sessions[0].activities);
  assert.deepEqual(futSoccerPack.sessions[0].objectiveTags, [
    "passing",
    "build-up-under-pressure",
    "reduced-space",
  ]);
});

test("generatePack applies a deterministic fut-soccer pressing bias without changing canonical sport", () => {
  const soccerPack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  const futSoccerPack = generatePack({
    sport: "soccer",
    sportPackId: "fut-soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  assert.equal(futSoccerPack.sport, "soccer");
  assert.equal(futSoccerPack.sessions[0].sport, "soccer");
  assert.notDeepEqual(futSoccerPack.sessions[0].activities, soccerPack.sessions[0].activities);
  assert.deepEqual(futSoccerPack.sessions[0].objectiveTags, [
    "pressing",
    "pressure-cover",
    "reduced-space",
  ]);
});

test("generatePack applies compact builder prompt notes and environment to activity descriptions", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing | notes:first pass after regain | env:turf",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;

  assert.match(session.activities[0].description, /Today's focus: pressing\./i);
  assert.match(session.activities[0].description, /available turf\./i);
  assert.match(session.activities[1].description, /Coach note: first pass after regain\./i);
});

test("generatePack applies a quick-session bias that feels playful and easy to run", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 60,
    theme: "quick | finishing | notes:small teams | env:grass",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;

  assert.match(
    session.activities[0].description,
    /Keep the setup easy to run and let the players get into the activity quickly\./
  );
  assert.match(
    session.activities[1].description,
    /Use playful competition and simple rules so the session stays fun and game-like\./
  );
  assert.match(
    session.activities[2].description,
    /Finish with a free-flowing game that lets the players solve problems and enjoy the session\./
  );
});

test("buildCoachLiteDraftFromPack derives a minimal valid internal Coach Lite draft", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "pressing",
    sessionsCount: 2,
    equipment: ["cones", "balls"],
  });

  const draft = buildCoachLiteDraftFromPack(pack);

  assert.equal(draft.sessionPackId, pack.packId);
  assert.equal(draft.specVersion, "session-pack.v2");
  assert.equal(draft.sport, "soccer");
  assert.equal(draft.ageGroup, "U14");
  assert.equal(draft.durationMinutes, 60);
  assert.equal(draft.activities.length, pack.sessions[0].activities.length);
  assert.equal(
    draft.activities.reduce((sum, activity) => sum + activity.minutes, 0),
    draft.durationMinutes
  );
  assert.equal(Object.hasOwn(draft, "tenantId"), false);
  assert.equal(Object.hasOwn(draft, "tenant_id"), false);
});

test("buildCoachLiteDraftFromPack uses the primary objective rather than control segments in internal titles", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "quick | pressing | notes:first pass after regain",
    sessionsCount: 1,
  });

  const draft = buildCoachLiteDraftFromPack(pack);

  assert.equal(draft.title, "U14 Pressing Session");
  assert.equal(draft.objective, "Focus on pressing, transition.");
});
