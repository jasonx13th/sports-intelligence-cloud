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
  assert.match(session.activities[0].description, /Setup:/);
  assert.match(session.activities[0].description, /Scoring:/);
  assert.match(session.activities[0].description, /Cues:/);
  assert.match(session.activities[0].description, /Watch:/);
  assert.match(session.activities[0].description, /Progress:/);
  assert.match(session.activities[0].description, /Regress:/);
});

test("generatePack avoids goal-required wording when no goal equipment is selected", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 20,
    theme: "attacking gates",
    sessionMode: "drill",
    coachNotes: "Use cone gates only.",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  const [session] = pack.sessions;
  const text = session.activities.map((activity) => `${activity.name} ${activity.description}`).join(" ");

  assert.equal(/to goal|full-size goals?|mini goals|pugg goals/i.test(text), false);
  assert.match(text, /cone gates|end zones|target lines|passing gates|scoring zones/i);
});

test("generatePack uses small-goal language when Pugg goals are selected", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 20,
    theme: "finishing",
    sessionMode: "drill",
    coachNotes: "Use the Pugg goals for a small-sided finishing activity.",
    sessionsCount: 1,
    equipment: ["balls", "mini disc cones", "Pugg goals"],
  });

  const [session] = pack.sessions;
  const text = session.activities.map((activity) => `${activity.name} ${activity.description}`).join(" ");

  assert.deepEqual(session.equipment, ["balls", "mini disc cones", "pugg goals"]);
  assert.match(text, /pugg goals|mini goals|small goals|target goals|goals/i);
});

test("generatePack carries OST mixed-age playful context into activity text", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u10",
    durationMin: 20,
    theme: "attacking gates",
    sessionMode: "drill",
    coachNotes:
      "originalTeamAgeBand:Mixed age | mixedAge:true | assumedAgeRange:6-11 | programType:OST | coachingStyle:playful beginner-friendly inclusive simple rules easy/harder variations",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  const description = pack.sessions[0].activities[0].description;

  assert.equal(pack.sessions[0].ageBand, "u10");
  assert.match(description, /programType:OST/);
  assert.match(description, /playful beginner-friendly inclusive/i);
  assert.match(description, /Progress:/);
  assert.match(description, /Regress:/);
});

test("generatePack carries Travel U10 context into activity text", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u10",
    durationMin: 30,
    theme: "passing under pressure",
    sessionMode: "drill",
    coachNotes:
      "originalTeamAgeBand:U10 | programType:Travel | coachingStyle:soccer-specific technical tactical decision-making game-realistic",
    sessionsCount: 1,
    equipment: ["cones", "balls"],
  });

  const description = pack.sessions[0].activities[0].description;

  assert.equal(pack.sessions[0].ageBand, "u10");
  assert.match(description, /programType:Travel/);
  assert.match(description, /technical tactical decision-making/i);
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
  assert.equal(/Coach note:/i.test(text), false);
});

test("generatePack gives every full-session activity coach-ready sections", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 45,
    theme: "attacking overloads",
    sessionMode: "full_session",
    coachNotes: "Use 2v3 attacking with cones and balls, 20 players, and quick transition moments.",
    sessionsCount: 1,
    equipment: ["balls", "cones"],
  });

  const [session] = pack.sessions;

  assert.equal(session.activities.length, 4);
  assert.deepEqual(session.activities.map((activity) => activity.minutes), [9, 13, 14, 9]);

  for (const activity of session.activities) {
    assert.match(activity.description, /Setup:/);
    assert.match(activity.description, /Run:/);
    assert.match(activity.description, /Scoring:/);
    assert.match(activity.description, /Cues:/);
    assert.match(activity.description, /Watch:/);
    assert.match(activity.description, /Progress:/);
    assert.match(activity.description, /Regress:/);
    assert.equal(/full-size goals?/i.test(activity.description), false);
  }
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

  assert.match(session.activities[0].description, /Setup: use turf/i);
  assert.match(session.activities[1].description, /Coach notes: first pass after regain\./i);
});

test("generatePack preserves meaningful coach notes instead of tiny truncation", () => {
  const notes =
    "Give me a drill similar to duck duck goose for players under 12, but make the tag moment become a first-touch escape through cone gates with quick rotations.";
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 20,
    theme: "quick | format:quick_activity | first touch escape",
    sessionMode: "quick_activity",
    coachNotes: notes,
    sessionsCount: 1,
    equipment: ["balls", "cones"],
  });

  const description = pack.sessions[0].activities[0].description;

  assert.match(description, /duck, duck, goose|duck duck goose/i);
  assert.match(description, /first-touch escape|first touch escape|first touch into space/i);
  assert.equal(/give me a drill sim\./i.test(description), false);
});

function assertDuckDuckGooseSoccerActivity(activity) {
  assert.match(activity.name, /duck duck goose escape gates/i);
  assert.match(activity.description, /Setup:/);
  assert.match(activity.description, /How to start:/);
  assert.match(activity.description, /How to run it:/);
  assert.match(activity.description, /Rules \/ scoring:/);
  assert.match(activity.description, /Coaching cues:/);
  assert.match(activity.description, /What to watch for:/);
  assert.match(activity.description, /Progression:/);
  assert.match(activity.description, /Regression:/);
  assert.match(activity.description, /Safety \/ space adjustment:/);
  assert.match(activity.description, /duck, duck, goose/i);
  assert.match(activity.description, /first touch/i);
  assert.match(activity.description, /chases? as a defender|defender chases/i);
  assert.match(activity.description, /cone gates?|gate/i);
  assert.match(activity.description, /quick|rotate/i);
}

test("generatePack turns a quick duck-duck-goose prompt into one soccer chase escape activity", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 20,
    theme: "quick | format:quick_activity | game like duck duck goose",
    sessionMode: "quick_activity",
    coachNotes: "create a game like activity similar to duck duck goose",
    sessionsCount: 1,
    equipment: ["balls", "cones"],
  });

  const [session] = pack.sessions;
  const [activity] = session.activities;

  assert.equal(session.activities.length, 1);
  assert.equal(activity.minutes, 20);
  assert.equal(session.objectiveTags.includes("reaction"), true);
  assert.equal(session.objectiveTags.includes("escape"), true);
  assertDuckDuckGooseSoccerActivity(activity);
});

test("generatePack gives full-session duck-duck-goose brainstorm one related soccer activity", () => {
  const pack = generatePack({
    sport: "soccer",
    ageBand: "u12",
    durationMin: 60,
    theme: "playful reaction game",
    sessionMode: "full_session",
    coachNotes: "i want a game like activity similar to duck duck goose",
    sessionsCount: 1,
    equipment: ["balls", "cones", "pinnies"],
  });

  const [session] = pack.sessions;
  const relatedActivities = session.activities.filter((activity) =>
    /duck duck goose escape gates|How to start:.*duck, duck, goose|How to run it:.*chases? as a defender/i.test(
      `${activity.name} ${activity.description}`
    )
  );

  assert.equal(session.activities.length, 4);
  assert.equal(relatedActivities.length, 1);
  assertDuckDuckGooseSoccerActivity(relatedActivities[0]);
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
    /Setup:|Run:|Cues:/
  );
  assert.match(
    session.activities[1].description,
    /Setup:|Run:|Cues:/
  );
  assert.match(
    session.activities[2].description,
    /Progress:|Regress:/
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
  assert.match(session.activities[0].description, /Setup:/);
  assert.match(session.activities[1].description, /Cues:/);
  assert.match(session.activities.at(-1).name, /Water break \+ .* final game/);
  assert.match(session.activities.at(-1).description, /real .*final game|Run:/i);
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
