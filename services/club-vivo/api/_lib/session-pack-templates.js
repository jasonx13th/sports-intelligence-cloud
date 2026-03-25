"use strict";

const { validateCreateSession } = require("./session-validate");

// Deterministic templates first. No Bedrock here.
function normalizeTheme(theme) {
  return String(theme || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function minutesSum(activities) {
  return (activities || []).reduce((acc, a) => acc + (Number(a.minutes) || 0), 0);
}

function padWithCoolDown({ durationMin, activities }) {
  const used = minutesSum(activities);
  const remaining = durationMin - used;
  const cooldownCap = 10;

  if (remaining <= 0) return activities;

  if (remaining <= cooldownCap) {
    return activities.concat([
      {
        name: "Cooldown",
        minutes: remaining,
        description: "Low-intensity cooldown.",
      },
    ]);
  }

  return activities.concat([
    {
      name: "Low-intensity technical reps",
      minutes: remaining - cooldownCap,
      description: "Low-intensity technical reps.",
    },
    {
      name: "Cooldown",
      minutes: cooldownCap,
      description: "Low-intensity cooldown.",
    },
  ]);
}

function baseSession({ sport, ageBand, durationMin, objectiveTags, activities }) {
  const session = {
    sport,
    ageBand,
    durationMin,
    objectiveTags: objectiveTags || [],
    activities: padWithCoolDown({ durationMin, activities }),
  };

  // Fail closed: validate generator output with the same validator used for user input.
  return validateCreateSession(session);
}

function templatePassingShape({ sport, ageBand, durationMin }) {
  const activities = [
    { name: "Dynamic warmup + ball mastery", minutes: 10, description: "Dynamic movement, then touches." },
    { name: "Rondo (numbers up)", minutes: 15, description: "Emphasis: angles, scanning, first touch." },
    { name: "Passing pattern to goals", minutes: 20, description: "Progression: add passive, then active pressure." },
  ];

  return baseSession({
    sport,
    ageBand,
    durationMin,
    objectiveTags: ["passing", "shape"],
    activities,
  });
}

function templateFinishing({ sport, ageBand, durationMin }) {
  const activities = [
    { name: "Warmup: finishing technique", minutes: 10, description: "Inside foot, laces, both feet." },
    { name: "1v1 to goal", minutes: 15, description: "Decision: early shot vs take a touch." },
    { name: "Combination play to finish", minutes: 20, description: "Wall pass / overlap into finish." },
  ];

  return baseSession({
    sport,
    ageBand,
    durationMin,
    objectiveTags: ["finishing", "decision-making"],
    activities,
  });
}

function templatePressingTransition({ sport, ageBand, durationMin }) {
  const activities = [
    { name: "Warmup: reaction & acceleration", minutes: 10, description: "Short bursts + quick stops/starts." },
    { name: "3v3+2 transition game", minutes: 20, description: "Win it → immediate counter / regain shape." },
    { name: "Pressing cues in small-sided game", minutes: 20, description: "Triggers: bad touch, back pass, sideline." },
  ];

  return baseSession({
    sport,
    ageBand,
    durationMin,
    objectiveTags: ["pressing", "transition"],
    activities,
  });
}

function templateFallback({ sport, ageBand, durationMin, theme }) {
  const activities = [
    { name: "Warmup", minutes: 10, description: "Dynamic movement + ball touches." },
    { name: `Theme focus: ${theme}`, minutes: 20, description: "Coaching points based on the theme." },
    { name: "Game-like scenario", minutes: 20, description: "Constraints tied to the theme focus." },
  ];

  return baseSession({
    sport,
    ageBand,
    durationMin,
    objectiveTags: ["theme"],
    activities,
  });
}

function pickTemplate(themeKey) {
  // very simple matching
  if (themeKey.includes("pass")) return "passing";
  if (themeKey.includes("shape")) return "passing";
  if (themeKey.includes("finish")) return "finishing";
  if (themeKey.includes("press")) return "pressing";
  if (themeKey.includes("transition")) return "pressing";
  return "fallback";
}

function generateSessionFromTheme({ sport, ageBand, durationMin, theme }) {
  const themeKey = normalizeTheme(theme);
  const t = pickTemplate(themeKey);

  if (t === "passing") return templatePassingShape({ sport, ageBand, durationMin });
  if (t === "finishing") return templateFinishing({ sport, ageBand, durationMin });
  if (t === "pressing") return templatePressingTransition({ sport, ageBand, durationMin });

  return templateFallback({ sport, ageBand, durationMin, theme: themeKey || "general" });
}

function generatePack({ sport, ageBand, durationMin, theme, sessionsCount }) {
  const packId = require("crypto").randomUUID();
  const createdAt = new Date().toISOString();

  const sessions = [];
  for (let i = 0; i < sessionsCount; i++) {
    // Slight variation hook for later (today deterministic)
    sessions.push(generateSessionFromTheme({ sport, ageBand, durationMin, theme }));
  }

  return {
    packId,
    createdAt,
    sport,
    ageBand,
    durationMin,
    theme,
    sessionsCount,
    sessions,
  };
}

module.exports = { generatePack, normalizeTheme, minutesSum };
