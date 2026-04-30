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

test("generatePack shapes full sessions to four exact activity blocks", () => {
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
    assert.equal(session.activities.length, 4);
    assert.deepEqual(session.activities.map((activity) => activity.minutes), [13, 19, 20, 13]);
    assert.match(session.activities.at(-1).name, /Water break \+ .* final game/);
  }
});

test("generatePack splits a 60-minute full session into 12 / 18 / 18 / 12", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "quick | possession session | 14 players",
    sessionMode: "full_session",
    coachNotes: "Use a full practice plan with a final game.",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;

  assert.equal(session.activities.length, 4);
  assert.deepEqual(session.activities.map((activity) => activity.minutes), [12, 18, 18, 12]);
  assert.match(session.activities.at(-1).name, /Water break \+ 7v7 final game/);
});

test("generatePack creates one 30-minute drill activity", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 30,
    theme: "quick | passing drill | 10 players",
    sessionMode: "drill",
    coachNotes: "Make it a drill with lots of repetition.",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;

  assert.equal(session.activities.length, 1);
  assert.deepEqual(session.activities.map((activity) => activity.minutes), [30]);
  assert.match(session.activities[0].description, /grid|gates|channels|target players/i);
});

test("generatePack creates one 20-minute quick activity when requested", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 20,
    theme: "quick | first touch under pressure | 12 players",
    sessionMode: "quick_activity",
    coachNotes: "First touch under pressure with quick rotations.",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;

  assert.equal(session.durationMin, 20);
  assert.equal(session.activities.length, 1);
  assert.equal(session.activities[0].minutes, 20);
  assert.match(session.activities[0].description, /grid|gates|target players/i);
});

test("generatePack treats quick_activity theme format as one activity for legacy callers", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 20,
    theme: "quick | format:quick_activity | attacking 2v3 | 5 players",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  const [session] = pack.sessions;

  assert.equal(session.activities.length, 1);
  assert.equal(session.activities[0].minutes, 20);
  assert.match(session.activities[0].description, /gates|target players/i);
});

test("generatePack descriptions avoid repeated Today focus copy", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "quick | pressing session | 14 players",
    sessionMode: "full_session",
    coachNotes: "Work on the press trigger after a bad touch.",
    sessionsCount: 1,
  });

  const text = pack.sessions[0].activities.map((activity) => activity.description).join(" ");

  assert.equal(/Today's focus/i.test(text), false);
  assert.equal(/Theme challenge/i.test(text), false);
  assert.equal(/Score the desired action/i.test(text), false);
});

test("generatePack does not end full sessions with generic cooldown", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u16",
    durationMin: 50,
    theme: "Passing shape",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;
  assert.equal(minutesSum(session.activities), 50);
  assert.equal(session.activities.length, 4);
  assert.deepEqual(session.activities.map((activity) => activity.minutes), [10, 15, 15, 10]);
  assert.match(session.activities.at(-1).name, /Water break \+ .* final game/);
  assert.equal(
    session.activities.some((activity) => activity.name === "Cooldown"),
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

  assert.match(session.activities[0].description, /available turf\./i);
  assert.match(session.activities[1].description, /Coach context: first pass after regain\./i);
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

test("generatePack derives useful quick-session tags, equipment, and coaching detail from compact prompt theme", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "quick | attacking transition 4v3 | 7 players",
    sessionsCount: 1,
    equipment: ["mini goals", "flat cones", "balls"],
  });

  const [session] = pack.sessions;

  assert.deepEqual(pack.equipment, ["mini goals", "flat cones", "balls"]);
  assert.deepEqual(session.equipment, ["mini goals", "flat cones", "balls"]);
  assert.deepEqual(session.objectiveTags.slice(0, 4), [
    "attacking",
    "transition",
    "4v3",
    "overloads",
  ]);
  assert.match(session.activities[0].description, /Cue first three steps/);
  assert.match(session.activities[1].description, /Scoring:/);
  assert.match(session.activities.at(-1).name, /Water break \+ .* final game/);
  assert.match(session.activities.at(-1).description, /real .*final game/i);
});

test("generatePack uses pressure and possession prompt words instead of falling back to theme-only tags", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 50,
    theme: "quick | possession under pressure",
    sessionsCount: 1,
  });

  const [session] = pack.sessions;

  assert.equal(session.objectiveTags.includes("theme"), false);
  assert.equal(session.objectiveTags.includes("possession"), true);
  assert.equal(session.objectiveTags.includes("pressure"), true);
});

test("generatePack keeps default quick sessions at 60 minutes with exact activity totals", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    theme: "quick | dribbling creativity | 10 players",
    sessionsCount: 1,
    equipment: ["cones", "pinnies"],
  });

  const [session] = pack.sessions;

  assert.equal(pack.durationMin, 60);
  assert.equal(session.durationMin, 60);
  assert.equal(minutesSum(session.activities), 60);
  assert.deepEqual(session.equipment, ["cones", "pinnies"]);
});

test("generatePack creates a valid compact one-drill quick activity under 25 minutes", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u14",
    durationMin: 25,
    theme: "quick | format:one_drill | 1v1 dribbling creativity | 10 players",
    sessionsCount: 1,
    equipment: ["cones", "pinnies"],
  });

  const [session] = pack.sessions;

  assert.equal(session.durationMin, 25);
  assert.equal(session.activities.length, 1);
  assert.equal(minutesSum(session.activities), 25);
  assert.deepEqual(session.activities.map((activity) => activity.minutes), [25]);
  assert.equal(session.objectiveTags.includes("1v1"), true);
  assert.equal(session.objectiveTags.includes("dribbling"), true);
  assert.match(session.activities[0].description, /grid|gates|target players/i);
  assert.match(session.activities[0].description, /Progress/i);
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
