"use strict";

const { validateCreateSession } = require("./session-validate");
const { validationError } = require("./validate");
const { validateSessionPackV2Draft } = require("./session-pack-validate");

// Deterministic templates first. No Bedrock here.
function normalizeTheme(theme) {
  return String(theme || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displayAgeGroup(ageBand) {
  const normalized = String(ageBand || "").trim().toLowerCase();
  if (normalized.startsWith("u")) {
    return normalized.toUpperCase();
  }

  return titleCase(normalized);
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

function baseSession({ sport, ageBand, durationMin, objectiveTags, equipment, activities }) {
  const session = {
    sport,
    ageBand,
    durationMin,
    objectiveTags: objectiveTags || [],
    ...(Array.isArray(equipment) && equipment.length ? { equipment } : {}),
    activities: padWithCoolDown({ durationMin, activities }),
  };

  // Fail closed: validate generator output with the same validator used for user input.
  const validated = validateCreateSession(session);

  if (minutesSum(validated.activities) !== durationMin) {
    throw validationError("invalid_field", "Generated session duration total must equal durationMin", {
      reason: "invalid_generated_duration_total",
      durationMin,
      totalMinutes: minutesSum(validated.activities),
    });
  }

  return validated;
}

function templatePassingShape({ sport, ageBand, durationMin, equipment }) {
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
    equipment,
    activities,
  });
}

function templateFinishing({ sport, ageBand, durationMin, equipment }) {
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
    equipment,
    activities,
  });
}

function templatePressingTransition({ sport, ageBand, durationMin, equipment }) {
  const activities = [
    { name: "Warmup: reaction & acceleration", minutes: 10, description: "Short bursts + quick stops/starts." },
    { name: "3v3+2 transition game", minutes: 20, description: "Win it -> immediate counter / regain shape." },
    { name: "Pressing cues in small-sided game", minutes: 20, description: "Triggers: bad touch, back pass, sideline." },
  ];

  return baseSession({
    sport,
    ageBand,
    durationMin,
    objectiveTags: ["pressing", "transition"],
    equipment,
    activities,
  });
}

function templateFallback({ sport, ageBand, durationMin, theme, equipment }) {
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
    equipment,
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

function generateSessionFromTheme({ sport, ageBand, durationMin, theme, equipment }) {
  const themeKey = normalizeTheme(theme);
  const t = pickTemplate(themeKey);

  if (t === "passing") return templatePassingShape({ sport, ageBand, durationMin, equipment });
  if (t === "finishing") return templateFinishing({ sport, ageBand, durationMin, equipment });
  if (t === "pressing") return templatePressingTransition({ sport, ageBand, durationMin, equipment });

  return templateFallback({ sport, ageBand, durationMin, theme: themeKey || "general", equipment });
}

function inferActivityPhase(activityName, index, activitiesLength) {
  const normalizedName = normalizeTheme(activityName);

  if (normalizedName.includes("cooldown")) return "cooldown";
  if (index === 0 || normalizedName.includes("warmup") || normalizedName.includes("warm-up")) return "warm-up";
  if (activitiesLength <= 2) return "main";
  if (index === activitiesLength - 1) return "game";
  if (index === 1) return "technical";
  return "main";
}

function descriptionToCoachingPoints(description) {
  if (!description) {
    return ["keep the activity organized and age-appropriate"];
  }

  return String(description)
    .split(/[\.;]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function buildCoachLiteActivity(session, activity, index) {
  const coachingPoints = descriptionToCoachingPoints(activity.description);

  return {
    activityId: `act_${String(index + 1).padStart(3, "0")}`,
    name: activity.name,
    phase: inferActivityPhase(activity.name, index, session.activities.length),
    minutes: activity.minutes,
    objective: activity.description || `Support the ${session.objectiveTags?.join(" and ") || "session"} focus.`,
    setup: `Set up the area for ${activity.name}. Use the listed equipment and space for a soccer-first v1 session.`,
    instructions: activity.description || `Run ${activity.name} with clear coaching detail and safe organization.`,
    coachingPoints,
    equipment: Array.isArray(session.equipment) && session.equipment.length ? session.equipment : [],
  };
}

function buildCoachLiteDraftFromPack(pack) {
  const session = Array.isArray(pack?.sessions) ? pack.sessions[0] : null;

  if (!session) {
    throw validationError("invalid_field", "Generated pack is invalid", {
      reason: "missing_generated_session_for_draft",
    });
  }

  const draft = {
    sessionPackId: pack.packId,
    specVersion: "session-pack.v2",
    title: `${displayAgeGroup(pack.ageBand)} ${titleCase(pack.theme)} Session`,
    sport: pack.sport,
    ageGroup: displayAgeGroup(pack.ageBand),
    durationMinutes: pack.durationMin,
    equipment: Array.isArray(pack.equipment) ? pack.equipment : [],
    space: {
      areaType: "standard-area",
    },
    objective:
      session.objectiveTags?.length > 0
        ? `Focus on ${session.objectiveTags.join(", ")}.`
        : `Focus on ${pack.theme}.`,
    activities: session.activities.map((activity, index) => buildCoachLiteActivity(session, activity, index)),
    assumptions: [
      "derived from the existing deterministic Session Builder pack",
      "space defaults kept minimal for internal Coach Lite validation",
    ],
  };

  return validateSessionPackV2Draft(draft);
}

function generatePack({ sport, ageBand, durationMin, theme, sessionsCount, equipment }) {
  const packId = require("crypto").randomUUID();
  const createdAt = new Date().toISOString();

  const sessions = [];
  for (let i = 0; i < sessionsCount; i++) {
    // Slight variation hook for later (today deterministic)
    sessions.push(generateSessionFromTheme({ sport, ageBand, durationMin, theme, equipment }));
  }

  return {
    packId,
    createdAt,
    sport,
    ageBand,
    durationMin,
    theme,
    sessionsCount,
    ...(Array.isArray(equipment) && equipment.length ? { equipment } : {}),
    sessions,
  };
}

module.exports = {
  generatePack,
  buildCoachLiteDraftFromPack,
  normalizeTheme,
  minutesSum,
};
