"use strict";

const { validateCreateSession } = require("./session-validate");
const { validationError } = require("../../platform/validation/validate");
const { validateSessionPackV2Draft } = require("./session-pack-validate");
const MAX_ACTIVITY_DESCRIPTION_LENGTH = 280;

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

function appendSentence(baseText, sentence) {
  const normalizedBaseText = String(baseText || "").trim();
  const normalizedSentence = String(sentence || "").trim();

  if (!normalizedSentence) {
    return normalizedBaseText;
  }

  if (!normalizedBaseText) {
    return normalizedSentence;
  }

  if (normalizedBaseText.endsWith(".")) {
    return `${normalizedBaseText} ${normalizedSentence}`;
  }

  return `${normalizedBaseText}. ${normalizedSentence}`;
}

function appendSentenceCapped(baseText, sentence, maxLength = MAX_ACTIVITY_DESCRIPTION_LENGTH) {
  const nextText = appendSentence(baseText, sentence);

  if (nextText.length > maxLength) {
    return String(baseText || "").trim();
  }

  return nextText;
}

function extractDelimitedValue(theme, label) {
  const normalizedTheme = String(theme || "").trim();
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pipePattern = new RegExp(`${escapedLabel}\\s*:\\s*([^|]+)`, "i");
  const sentencePattern = new RegExp(`${escapedLabel}\\s*:\\s*(.+?)(?:\\.|$)`, "i");
  const pipeMatch = normalizedTheme.match(pipePattern);

  if (pipeMatch?.[1]) {
    return pipeMatch[1].trim();
  }

  const sentenceMatch = normalizedTheme.match(sentencePattern);
  return sentenceMatch?.[1]?.trim() || null;
}

function splitThemeSegments(theme) {
  return String(theme || "")
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function isQuickSessionSegment(segment) {
  const normalizedSegment = normalizeTheme(segment);

  return normalizedSegment === "quick" || normalizedSegment === "mode: quick";
}

function isControlThemeSegment(segment) {
  const normalizedSegment = normalizeTheme(segment);

  return (
    isQuickSessionSegment(normalizedSegment) ||
    normalizedSegment.startsWith("notes:") ||
    normalizedSegment.startsWith("env:") ||
    normalizedSegment.startsWith("environment context:") ||
    normalizedSegment.startsWith("team context:") ||
    normalizedSegment.startsWith("coach brainstorming and extra details for today:") ||
    normalizedSegment.startsWith("primary session objective:") ||
    normalizedSegment.startsWith("mode:")
  );
}

function extractPromptSignals(theme) {
  const rawTheme = String(theme || "").trim();
  const segments = splitThemeSegments(rawTheme);
  const primaryObjective =
    extractDelimitedValue(rawTheme, "Primary session objective") ||
    segments.find((segment) => !isControlThemeSegment(segment)) ||
    segments[0] ||
    rawTheme;
  const teamContext = extractDelimitedValue(rawTheme, "Team context");
  const environment =
    extractDelimitedValue(rawTheme, "Environment context") ||
    extractDelimitedValue(rawTheme, "env");
  const coachNotes =
    extractDelimitedValue(rawTheme, "Coach brainstorming and extra details for today") ||
    extractDelimitedValue(rawTheme, "notes");

  return {
    primaryObjective: primaryObjective || rawTheme,
    teamContext: teamContext || null,
    environment: environment || null,
    coachNotes: coachNotes || null,
    sessionMode: segments.some((segment) => isQuickSessionSegment(segment)) ? "quick" : null,
  };
}

function buildPromptInfluenceSentences(promptSignals) {
  const objective = String(promptSignals?.primaryObjective || "").trim();
  const environment = String(promptSignals?.environment || "").trim();
  const coachNotes = String(promptSignals?.coachNotes || "").trim();
  const teamContext = String(promptSignals?.teamContext || "").trim();

  return {
    first: [
      objective ? `Today's focus: ${objective}.` : "",
      environment ? `Set the area to fit the available ${environment}.` : "",
    ].filter(Boolean),
    middle: [coachNotes ? `Coach note: ${coachNotes}.` : ""].filter(Boolean),
    last: [teamContext ? `Keep the final detail appropriate for ${teamContext}.` : ""].filter(Boolean),
  };
}

function findNonCooldownIndexes(activities) {
  return (activities || []).reduce((accumulator, activity, index) => {
    if (
      activity?.name !== "Cooldown" &&
      normalizeTheme(activity?.name) !== "low-intensity technical reps"
    ) {
      accumulator.push(index);
    }

    return accumulator;
  }, []);
}

function applySentenceGroupsToActivities(session, sentenceGroups) {
  const activities = Array.isArray(session.activities) ? session.activities.slice() : [];

  if (activities.length < 1) {
    return session;
  }

  const nonCooldownIndexes = findNonCooldownIndexes(activities);

  if (nonCooldownIndexes.length < 1) {
    return session;
  }

  const firstIndex = nonCooldownIndexes[0];
  const middleIndex = nonCooldownIndexes[Math.min(1, nonCooldownIndexes.length - 1)];
  const lastIndex = nonCooldownIndexes[nonCooldownIndexes.length - 1];

  for (const sentence of sentenceGroups.first || []) {
    activities[firstIndex] = {
      ...activities[firstIndex],
      description: appendSentenceCapped(activities[firstIndex].description, sentence),
    };
  }

  for (const sentence of sentenceGroups.middle || []) {
    activities[middleIndex] = {
      ...activities[middleIndex],
      description: appendSentenceCapped(activities[middleIndex].description, sentence),
    };
  }

  for (const sentence of sentenceGroups.last || []) {
    activities[lastIndex] = {
      ...activities[lastIndex],
      description: appendSentenceCapped(activities[lastIndex].description, sentence),
    };
  }

  return {
    ...session,
    activities,
  };
}

function mergeUniqueStrings(...groups) {
  const seen = new Set();
  const result = [];

  for (const group of groups) {
    for (const item of Array.isArray(group) ? group : []) {
      const normalized = normalizeTheme(item);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
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

function applyMethodologyInfluenceToSession(session, methodologyInfluence) {
  const styleBias = methodologyInfluence?.styleBias || "default";

  if (styleBias === "default") {
    return session;
  }

  const styleBiasSentences =
    styleBias === "travel"
      ? {
          first: ["Build the session with clear spacing, scanning detail, and a progression the group can grow into."],
          middle: ["Add decision-making detail and raise the pressure as the players settle in."],
          last: ["Finish with a competitive progression that rewards tempo, decisions, and execution under pressure."],
        }
      : {
          first: ["Keep the setup simple, explain one rule at a time, and let the players learn through play."],
          middle: ["Use clear restarts, simple scoring, and plenty of touches so everyone can follow the activity."],
          last: ["Finish with a fun game block that keeps the group moving, smiling, and competing."],
        };

  return applySentenceGroupsToActivities(session, styleBiasSentences);
}

function applyPromptInfluenceToSession(session, promptSignals) {
  return applySentenceGroupsToActivities(session, buildPromptInfluenceSentences(promptSignals));
}

function applySessionModeInfluenceToSession(session, promptSignals) {
  if (promptSignals?.sessionMode !== "quick") {
    return session;
  }

  return applySentenceGroupsToActivities(session, {
    first: ["Keep the setup easy to run and let the players get into the activity quickly."],
    middle: ["Use playful competition and simple rules so the session stays fun and game-like."],
    last: ["Finish with a free-flowing game that lets the players solve problems and enjoy the session."],
  });
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

function templateFutSoccerPassing({ sport, ageBand, durationMin, equipment }) {
  const activities = [
    {
      name: "Reduced-space ball mastery warmup",
      minutes: 10,
      description: "Fast feet, close control, and quick turns in a tight area.",
    },
    {
      name: "Tight-space rondo waves",
      minutes: 15,
      description: "Short passing, scanning, and quick support angles under immediate pressure.",
    },
    {
      name: "Build-up under pressure lanes",
      minutes: 20,
      description: "Play out through narrow lanes with quick rotations and limited equipment.",
    },
  ];

  return baseSession({
    sport,
    ageBand,
    durationMin,
    objectiveTags: ["passing", "build-up-under-pressure", "reduced-space"],
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

function templateFutSoccerPressing({ sport, ageBand, durationMin, equipment }) {
  const activities = [
    {
      name: "Quick-feet pressure warmup",
      minutes: 10,
      description: "Short accelerations, recoveries, and quick reactions in reduced space.",
    },
    {
      name: "2v2+1 pressure-cover rotations",
      minutes: 20,
      description: "Press together, cover quickly, and rotate fast after each regain or escape.",
    },
    {
      name: "Reduced-space pressing game",
      minutes: 20,
      description: "Immediate pressure-and-cover cues in a tight game with fast restarts.",
    },
  ];

  return baseSession({
    sport,
    ageBand,
    durationMin,
    objectiveTags: ["pressing", "pressure-cover", "reduced-space"],
    equipment,
    activities,
  });
}

function templateFallback({ sport, ageBand, durationMin, theme, equipment }) {
  const activities = [
    { name: "Ball mastery arrival game", minutes: 10, description: "Dynamic movement, plenty of touches, and an easy scoring target to get the group moving." },
    { name: `Theme challenge: ${theme}`, minutes: 20, description: "Coach the main theme with clear rules, obvious scoring, and repeatable success moments." },
    { name: "Play-to-goal game", minutes: 20, description: "Use game-like constraints tied to the main theme so the players can solve the problem in play." },
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

function pickSportPackTemplate({ sportPackId, themeKey }) {
  const baseTemplate = pickTemplate(themeKey);

  if (sportPackId === "fut-soccer") {
    if (baseTemplate === "passing") return "fut-soccer-passing";
    if (baseTemplate === "pressing") return "fut-soccer-pressing";
  }

  return baseTemplate;
}

function generateSessionFromTheme({
  sport,
  sportPackId,
  ageBand,
  durationMin,
  theme,
  equipment,
  methodologyInfluence,
}) {
  const promptSignals = extractPromptSignals(theme);
  const themeKey = normalizeTheme(promptSignals.primaryObjective || theme);
  const t = pickSportPackTemplate({ sportPackId, themeKey });

  const session =
    t === "passing"
      ? templatePassingShape({ sport, ageBand, durationMin, equipment })
      : t === "fut-soccer-passing"
        ? templateFutSoccerPassing({ sport, ageBand, durationMin, equipment })
        : t === "finishing"
          ? templateFinishing({ sport, ageBand, durationMin, equipment })
          : t === "pressing"
            ? templatePressingTransition({ sport, ageBand, durationMin, equipment })
            : t === "fut-soccer-pressing"
              ? templateFutSoccerPressing({ sport, ageBand, durationMin, equipment })
              : templateFallback({
                  sport,
                  ageBand,
                  durationMin,
                  theme: normalizeTheme(promptSignals.primaryObjective) || "general",
                  equipment,
                });

  return applyMethodologyInfluenceToSession(
    applySessionModeInfluenceToSession(
      applyPromptInfluenceToSession(session, promptSignals),
      promptSignals
    ),
    methodologyInfluence
  );
}

function applyEnvironmentProfileToSession(session, confirmedProfile) {
  return {
    ...session,
    equipment: mergeUniqueStrings(session.equipment, confirmedProfile?.visibleEquipment),
  };
}

function buildSetupSeedDescription(confirmedProfile, fallbackDescription) {
  const parts = [
    confirmedProfile.summary,
    `Layout: ${confirmedProfile.layoutType}.`,
    `Organization: ${confirmedProfile.playerOrganization}.`,
  ];

  if (Array.isArray(confirmedProfile.focusTags) && confirmedProfile.focusTags.length > 0) {
    parts.push(`Focus: ${confirmedProfile.focusTags.join(", ")}.`);
  }

  if (Array.isArray(confirmedProfile.constraints) && confirmedProfile.constraints.length > 0) {
    parts.push(`Constraints: ${confirmedProfile.constraints.join(", ")}.`);
  }

  return parts.filter(Boolean).join(" ") || fallbackDescription;
}

function applySetupProfileToSession(session, confirmedProfile) {
  const activities = Array.isArray(session.activities) ? session.activities.slice() : [];
  if (activities.length > 0) {
    activities[0] = {
      ...activities[0],
      name: titleCase(confirmedProfile.focusTags?.join(" ") || confirmedProfile.summary || activities[0].name),
      description: buildSetupSeedDescription(confirmedProfile, activities[0].description),
    };
  }

  return {
    ...session,
    objectiveTags: mergeUniqueStrings(session.objectiveTags, confirmedProfile.focusTags),
    equipment: mergeUniqueStrings(session.equipment, confirmedProfile.visibleEquipment),
    activities,
  };
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
  const promptSignals = extractPromptSignals(pack?.theme);
  const displayTheme =
    titleCase(normalizeTheme(promptSignals.primaryObjective)) || titleCase(pack.theme);

  if (!session) {
    throw validationError("invalid_field", "Generated pack is invalid", {
      reason: "missing_generated_session_for_draft",
    });
  }

  const draft = {
    sessionPackId: pack.packId,
    specVersion: "session-pack.v2",
    title: `${displayAgeGroup(pack.ageBand)} ${displayTheme} Session`,
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
        : `Focus on ${promptSignals.primaryObjective || pack.theme}.`,
    activities: session.activities.map((activity, index) => buildCoachLiteActivity(session, activity, index)),
    assumptions: [
      "derived from the existing deterministic Session Builder pack",
      "space defaults kept minimal for internal Coach Lite validation",
    ],
  };

  return validateSessionPackV2Draft(draft);
}

function generatePack({
  sport,
  sportPackId,
  ageBand,
  durationMin,
  theme,
  sessionsCount,
  equipment,
  confirmedProfile,
  methodologyInfluence,
}) {
  const packId = require("crypto").randomUUID();
  const createdAt = new Date().toISOString();
  const mergedEquipment = mergeUniqueStrings(equipment, confirmedProfile?.visibleEquipment);

  const sessions = [];
  for (let i = 0; i < sessionsCount; i++) {
    // Slight variation hook for later (today deterministic)
    let session = generateSessionFromTheme({
      sport,
      sportPackId,
      ageBand,
      durationMin,
      theme,
      equipment: mergedEquipment,
      methodologyInfluence,
    });

    if (confirmedProfile?.mode === "environment_profile") {
      session = applyEnvironmentProfileToSession(session, confirmedProfile);
    }

    if (confirmedProfile?.mode === "setup_to_drill") {
      session = applySetupProfileToSession(session, confirmedProfile);
    }

    sessions.push(session);
  }

  return {
    packId,
    createdAt,
    sport,
    ageBand,
    durationMin,
    theme,
    sessionsCount,
    ...(mergedEquipment.length ? { equipment: mergedEquipment } : {}),
    sessions,
  };
}

module.exports = {
  generatePack,
  buildCoachLiteDraftFromPack,
  normalizeTheme,
  minutesSum,
};
