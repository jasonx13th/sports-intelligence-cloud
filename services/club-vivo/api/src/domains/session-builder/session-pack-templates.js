"use strict";

const { validateCreateSession } = require("./session-validate");
const { validationError } = require("../../platform/validation/validate");
const { validateSessionPackV2Draft } = require("./session-pack-validate");
const MAX_ACTIVITY_DESCRIPTION_LENGTH = 1200;

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
    normalizedSegment.startsWith("format:") ||
    normalizedSegment.startsWith("mode:")
  );
}

function extractPromptSignals(theme, options = {}) {
  const rawTheme = String(theme || "").trim();
  const segments = splitThemeSegments(rawTheme);
  const playerCountMatch = rawTheme.match(/\b(\d{1,2})\s+players?\b/i);
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
    String(options.coachNotes || "").trim() ||
    extractDelimitedValue(rawTheme, "Coach brainstorming and extra details for today") ||
    extractDelimitedValue(rawTheme, "notes");
  const activityFormat = extractDelimitedValue(rawTheme, "format");
  const inferredThemeMode = segments.some((segment) => isQuickSessionSegment(segment)) ? "quick" : null;
  const sessionMode =
    options.sessionMode ||
    (inferredThemeMode === "quick" && activityFormat === "quick_activity"
      ? "quick_activity"
      : inferredThemeMode === "quick" && activityFormat === "one_drill"
        ? "drill"
        : "full_session");

  return {
    primaryObjective: primaryObjective || rawTheme,
    teamContext: teamContext || null,
    environment: environment || null,
    coachNotes: coachNotes || null,
    activityFormat: activityFormat || null,
    playerCount:
      playerCountMatch?.[1] ? Number.parseInt(playerCountMatch[1], 10) : options.playerCount || null,
    equipment: Array.isArray(options.equipment) ? options.equipment : [],
    methodologyInfluence: options.methodologyInfluence || null,
    quickSession: inferredThemeMode === "quick",
    sessionMode,
  };
}

function buildPromptInfluenceSentences(promptSignals) {
  const objective = String(promptSignals?.primaryObjective || "").trim();
  const environment = String(promptSignals?.environment || "").trim();
  const coachNotes = String(promptSignals?.coachNotes || "").trim();
  const teamContext = String(promptSignals?.teamContext || "").trim();
  const playerCount =
    typeof promptSignals?.playerCount === "number" && Number.isInteger(promptSignals.playerCount)
      ? `${promptSignals.playerCount} players`
      : String(objective.match(/\b\d{1,2}\s+players?\b/i)?.[0] || "").trim();

  return {
    first: [
      environment ? `Set the area to fit the available ${environment}.` : "",
      "Setup: organize the space quickly, demo the first action, and start with high player involvement.",
    ].filter(Boolean),
    middle: [
      coachNotes ? `Coach notes: ${getCoachNotesSnippet(coachNotes)}.` : "",
      "Scoring: use gates or target players so the win condition is clear.",
      "Cue: scan before receiving, open the support angle, and make the first touch useful.",
    ].filter(Boolean),
    last: [
      playerCount ? `Keep numbers close to ${playerCount}.` : "",
      teamContext ? `Keep the final detail appropriate for ${teamContext}.` : "",
      objective ? `Connect the rules back to ${objective} without stopping the flow too often.` : "",
    ].filter(Boolean),
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

function inferFocusTagsFromText(value) {
  const normalized = ` ${normalizeTheme(value)} `;
  const tags = [];

  const add = (tag, patterns) => {
    if (patterns.some((pattern) => pattern.test(normalized)) && !tags.includes(tag)) {
      tags.push(tag);
    }
  };

  add("attacking", [/\battack(?:ing)?\b/, /\bcreate chances\b/, /\bgoing forward\b/]);
  add("defending", [/\bdefend(?:ing)?\b/, /\bdefensive\b/, /\bdeny\b/]);
  add("transition", [/\btransition(?:s)?\b/, /\bcounter(?: attack|attack|ing)?\b/, /\bregain\b/]);
  add("possession", [/\bpossession\b/, /\bkeep(?:ing)? the ball\b/, /\brondo\b/]);
  add("pressing", [/\bpress(?:ing)?\b/]);
  add("pressure", [/\bpressure\b/, /\bpressur(?:e|ing)\b/]);
  add("finishing", [/\bfinish(?:ing)?\b/, /\bshoot(?:ing)?\b/, /\bscore\b/, /\bgoals?\b/]);
  add("passing", [/\bpass(?:ing)?\b/, /\bcombination(?:s)?\b/, /\bsupport angles?\b/]);
  add("dribbling", [/\bdribbl(?:e|ing)\b/, /\bball mastery\b/, /\btake players on\b/]);
  add("1v1", [/\b1\s*v\s*1\b/, /\bone[\s-]?v[\s-]?one\b/]);

  const overloads = normalized.match(/\b\d+\s*v\s*\d+\b/g) || [];
  for (const overload of overloads.map((item) => item.replace(/\s+/g, ""))) {
    if (!tags.includes(overload)) {
      tags.push(overload);
    }
  }

  if (overloads.some((overload) => overload.replace(/\s+/g, "") !== "1v1") && !tags.includes("overloads")) {
    tags.push("overloads");
  }

  return tags.slice(0, 8);
}

function applyPromptFocusTagsToSession(session, promptSignals) {
  const sourceText = promptSignals?.primaryObjective || "";
  const promptTags = inferFocusTagsFromText(sourceText);

  if (promptTags.length < 1) {
    return session;
  }

  const existingTags =
    Array.isArray(session.objectiveTags) &&
    session.objectiveTags.length === 1 &&
    normalizeTheme(session.objectiveTags[0]) === "theme"
      ? []
      : session.objectiveTags;

  return {
    ...session,
    objectiveTags: mergeUniqueStrings(promptTags, existingTags).slice(0, 12),
  };
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

function fitActivityDurationsToDuration({ durationMin, activities }) {
  const total = minutesSum(activities);

  if (total <= durationMin || activities.length < 1) {
    return activities;
  }

  const minimumTotal = activities.length;
  if (durationMin < minimumTotal) {
    return activities.slice(0, durationMin).map((activity) => ({
      ...activity,
      minutes: 1,
    }));
  }

  const weighted = activities.map((activity, index) => {
    const rawMinutes = ((Number(activity.minutes) || 1) / total) * durationMin;
    return {
      activity,
      index,
      minutes: Math.max(1, Math.floor(rawMinutes)),
      remainder: rawMinutes - Math.floor(rawMinutes),
    };
  });

  let fittedTotal = weighted.reduce((sum, item) => sum + item.minutes, 0);
  const byRemainder = [...weighted].sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  while (fittedTotal < durationMin) {
    const item = byRemainder[(durationMin - fittedTotal - 1) % byRemainder.length];
    item.minutes += 1;
    fittedTotal += 1;
  }

  while (fittedTotal > durationMin) {
    const item = [...weighted]
      .sort((a, b) => b.minutes - a.minutes || a.index - b.index)
      .find((candidate) => candidate.minutes > 1);

    if (!item) break;

    item.minutes -= 1;
    fittedTotal -= 1;
  }

  return weighted
    .sort((a, b) => a.index - b.index)
    .map(({ activity, minutes }) => ({
      ...activity,
      minutes,
    }));
}

function splitDurationByWeights(durationMin, weights) {
  const weighted = weights.map((weight, index) => {
    const rawMinutes = durationMin * weight;
    return {
      index,
      minutes: Math.max(1, Math.floor(rawMinutes)),
      remainder: rawMinutes - Math.floor(rawMinutes),
    };
  });
  let total = weighted.reduce((sum, item) => sum + item.minutes, 0);

  while (total < durationMin) {
    const item = [...weighted].sort((a, b) => b.remainder - a.remainder || b.index - a.index)[0];
    item.minutes += 1;
    total += 1;
  }

  while (total > durationMin) {
    const item = [...weighted].sort((a, b) => b.minutes - a.minutes || b.index - a.index).find((candidate) => candidate.minutes > 1);
    if (!item) break;
    item.minutes -= 1;
    total -= 1;
  }

  return weighted.sort((a, b) => a.index - b.index).map((item) => item.minutes);
}

function compactText(value, fallback) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function hasGoalEquipment(equipment) {
  return (Array.isArray(equipment) ? equipment : []).some((item) => {
    const normalized = normalizeTheme(item);
    return (
      normalized.includes("goal") ||
      normalized.includes("pug goal") ||
      normalized.includes("pugg goal")
    );
  });
}

function describeEquipment(equipment) {
  const items = mergeUniqueStrings(equipment).slice(0, 5);
  return items.length ? items.join(", ") : "available equipment";
}

function getScoringTargets(equipment) {
  if (!hasGoalEquipment(equipment)) {
    return "cone goals, cone gates, target lines, end zones, scoring zones, passing gates, or possession points";
  }

  const normalized = (Array.isArray(equipment) ? equipment : []).map((item) => normalizeTheme(item));

  if (normalized.some((item) => item.includes("pugg") || item.includes("pug goal"))) {
    return "Pugg goals, small goals, target goals, or cone gates";
  }

  if (normalized.some((item) => item.includes("mini goal"))) {
    return "mini goals, target goals, or cone gates";
  }

  if (normalized.some((item) => item.includes("small goal") || item.includes("portable goal"))) {
    return "small goals, portable goals, target goals, or cone gates";
  }

  return "goals, target goals, or cone gates";
}

function getCoachNotesSnippet(value) {
  const normalized = compactText(value, "").replace(/\.+$/, "");

  if (normalized.length <= 240) {
    return normalized;
  }

  const sentenceEnd = normalized.slice(0, 240).search(/[.!?]\s[^.!?]*$/);

  if (sentenceEnd > 80) {
    return normalized.slice(0, sentenceEnd + 1).trim();
  }

  const wordSafe = normalized.slice(0, 240).replace(/\s+\S*$/, "").trim();
  return wordSafe || normalized.slice(0, 240).trim();
}

function getProgramStyle(promptSignals) {
  const methodologyStyleBias = promptSignals?.methodologyInfluence?.styleBias || "default";
  const context = normalizeTheme(
    [
      promptSignals?.teamContext,
      promptSignals?.coachNotes,
      promptSignals?.primaryObjective,
    ].filter(Boolean).join(" ")
  );

  if (
    methodologyStyleBias === "ost" ||
    context.includes("programtype:ost") ||
    context.includes("mixedage:true") ||
    context.includes("playful") ||
    context.includes("beginner-friendly")
  ) {
    return {
      setup: methodologyStyleBias === "ost"
        ? "Keep the setup simple, explain one rule at a time, and let the players learn through play"
        : "Keep the space simple and visible so mixed-skill players can understand it quickly",
      run: "use playful competition, short rounds, and inclusive restarts so everyone stays involved",
      cues: "eyes up, find space, try the brave touch, help a teammate",
      watch: "players waiting too long, rules becoming confusing, or stronger players taking over",
      progress: "add a bonus point, a safe defender, or a second gate once the group understands it",
      regress: "make the grid bigger, remove pressure, or let partners work together"
    };
  }

  if (
    methodologyStyleBias === "travel" ||
    context.includes("programtype:travel") ||
    context.includes("tactical") ||
    context.includes("decision-making") ||
    context.includes("game-realistic")
  ) {
    return {
      setup: "Build the session with clear spacing, scanning detail, and a progression the group can grow into",
      run: "coach the trigger, tempo, support angle, and transition after each repetition",
      cues: "scan early, receive side-on, play away from pressure, react on the next action",
      watch: "flat support angles, slow decisions, poor body shape, or players missing the press trigger",
      progress: "limit touches, add a recovering defender, or shorten the time to score",
      regress: "add a neutral, increase space, or freeze once to show the decision picture"
    };
  }

  return {
    setup: "Use a clear grid with channels, gates, target players, or scoring zones",
    run: "play short competitive rounds with quick restarts, clear rotations, and everyone active",
    cues: "scan early, open the support angle, make the first touch useful, react on transition",
    watch: "long lines, hidden players, unclear scoring, or the space getting too tight",
    progress: "add pressure, a time limit, a transition target, or a bonus point",
    regress: "widen the space, remove pressure, allow an extra touch, or add a support player"
  };
}

function capDescription(value) {
  const normalized = compactText(value, "");

  if (normalized.length <= MAX_ACTIVITY_DESCRIPTION_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_ACTIVITY_DESCRIPTION_LENGTH - 1).trim()}.`;
}

function buildCoachReadyDescription({ phase, baseDescription, promptSignals }) {
  const objective = compactText(promptSignals?.primaryObjective, "the session objective");
  const environment = compactText(promptSignals?.environment, "the available space");
  const coachNotes = getCoachNotesSnippet(promptSignals?.coachNotes);
  const playerCount = Number.isInteger(promptSignals?.playerCount)
    ? ` for about ${promptSignals.playerCount} players`
    : "";
  const equipmentText = describeEquipment(promptSignals?.equipment);
  const scoringTargets = getScoringTargets(promptSignals?.equipment);
  const style = getProgramStyle(promptSignals);
  const noteText = coachNotes ? `Coach notes: ${coachNotes}.` : "";
  const phaseRun =
    phase === "final"
      ? "Run: restart like a real game, keep score, and coach briefly on balls out."
      : phase === "arrival"
        ? "Run: start as players arrive, keep rounds short, and let late arrivals join."
        : phase === "progression"
          ? "Run: add pressure or direction so players solve it closer to game speed."
          : "Run: start each round, keep score, and rotate roles every 2-3 minutes.";
  const baseSnippet = compactText(baseDescription, "").slice(0, 135).replace(/\s+\S*$/, "").trim();

  return capDescription(
    [
      `Setup: use ${environment} with ${equipmentText}; ${style.setup}.`,
      playerCount ? `Numbers: organize it${playerCount}.` : "",
      noteText.trim(),
      `${phaseRun}${baseSnippet ? ` ${baseSnippet}.` : ""}`,
      `Scoring: use ${scoringTargets}; rotate after scores, turnovers, or short rounds.`,
      `Cues: ${style.cues}.`,
      `Watch: ${style.watch}.`,
      `Progress: ${style.progress}.`,
      `Regress: ${style.regress}.`,
      `Challenge: reward the action that best supports ${objective}.`,
    ].join(" ")
  );
}

function pickMainActivity(activities, preferredIndex, fallbackName, fallbackDescription) {
  const activity = activities[preferredIndex] || activities.find(Boolean) || {};
  return {
    name: compactText(activity.name, fallbackName),
    description: compactText(activity.description, fallbackDescription),
  };
}

function buildFinalGameName({ promptSignals, ageBand }) {
  const playerCount = Number.isInteger(promptSignals?.playerCount) ? promptSignals.playerCount : null;
  const normalizedAgeBand = normalizeTheme(ageBand);

  if (playerCount && playerCount >= 22) return "Water break + 11v11 final game";
  if (playerCount && playerCount >= 18) return "Water break + 9v9 final game";
  if (playerCount && playerCount >= 14) return "Water break + 7v7 final game";
  if (playerCount && playerCount >= 10) return "Water break + 5v5 final game";
  if (normalizedAgeBand === "adult" || normalizedAgeBand === "u18" || normalizedAgeBand === "u16") {
    return "Water break + 9v9 final game";
  }
  if (normalizedAgeBand === "u14" || normalizedAgeBand === "u12") {
    return "Water break + 7v7 final game";
  }
  return "Water break + small-sided final game";
}

function buildFinalGameDescription({ promptSignals, ageBand }) {
  const objective = compactText(promptSignals?.primaryObjective, "the session theme");
  const environment = compactText(promptSignals?.environment, "available space");
  const gameName = buildFinalGameName({ promptSignals, ageBand }).replace("Water break + ", "");

  const scoringTargetText = hasGoalEquipment(promptSignals?.equipment)
    ? getScoringTargets(promptSignals?.equipment)
    : "end zones, cone goals, cone gates, target lines, or possession points";

  return buildCoachReadyDescription({
    phase: "final",
    promptSignals,
    baseDescription: `After a brief water break, play a real ${gameName}. Keep direction, restarts, and scoring through ${scoringTargetText} so players apply ${objective} in the game.`,
  });
}

function normalizeFullSessionShape({ session, promptSignals }) {
  const minutes = splitDurationByWeights(session.durationMin, [0.2, 0.3, 0.3, 0.2]);
  const activities = Array.isArray(session.activities) ? session.activities : [];
  const first = pickMainActivity(
    activities,
    0,
    "Arrival game warm-up",
    "Set a simple arrival game with every player active, clear boundaries, and fast restarts. Use a scoring rule that gets players moving and ready for the main theme."
  );
  const second = pickMainActivity(
    activities,
    1,
    "Main activity",
    "Build the main activity in a clear area. Explain the scoring rule, let players repeat the key action, and coach spacing, timing, and decisions."
  );
  const third = pickMainActivity(
    activities,
    2,
    "Conditioned game progression",
    "Progress into a more game-like challenge. Add pressure, direction, or scoring constraints so players use the main idea while making real decisions."
  );

  return {
    ...session,
    activities: [
      {
        ...first,
        minutes: minutes[0],
        description: buildCoachReadyDescription({
          phase: "arrival",
          baseDescription: first.description,
          promptSignals,
        }),
      },
      {
        ...second,
        minutes: minutes[1],
        description: buildCoachReadyDescription({
          phase: "main",
          baseDescription: second.description,
          promptSignals,
        }),
      },
      {
        ...third,
        minutes: minutes[2],
        description: buildCoachReadyDescription({
          phase: "progression",
          baseDescription: third.description,
          promptSignals,
        }),
      },
      {
        name: buildFinalGameName({ promptSignals, ageBand: session.ageBand }),
        minutes: minutes[3],
        description: buildFinalGameDescription({ promptSignals, ageBand: session.ageBand }),
      },
    ],
  };
}

function normalizeQuickActivityShape({ session, promptSignals }) {
  const activities = Array.isArray(session.activities) ? session.activities : [];
  const main = pickMainActivity(
    activities,
    1,
    compactText(promptSignals?.primaryObjective, "Quick activity"),
    "Set one grid with clear gates or target players. Play short rounds, keep score, rotate quickly, and coach scanning, first touch, support angle, and the next action."
  );
  const playerCount = Number.isInteger(promptSignals?.playerCount)
    ? ` for about ${promptSignals.playerCount} players`
    : "";

  return {
    ...session,
    activities: [
      {
        ...main,
        name: compactText(main.name, "Quick activity"),
        minutes: session.durationMin,
        description: buildCoachReadyDescription({
          phase: "main",
          promptSignals,
          baseDescription: `Use a playful game-like rule${playerCount}. If the idea is tag-based, connect it to soccer by having the chaser trigger a ball action, gate score, or transition moment.`,
        }),
      },
    ],
  };
}

function normalizeDrillShape({ session, promptSignals }) {
  const activities = Array.isArray(session.activities) ? session.activities : [];
  const main = pickMainActivity(
    activities,
    1,
    compactText(promptSignals?.primaryObjective, "Main drill"),
    "Run one clear activity with a simple setup, frequent repetitions, a scoring rule, and one or two direct coaching cues."
  );
  const playerCount = Number.isInteger(promptSignals?.playerCount)
    ? ` for about ${promptSignals.playerCount} players`
    : "";

  return {
    ...session,
    activities: [
      {
        ...main,
        name: compactText(main.name, "Main activity"),
        minutes: session.durationMin,
        description: buildCoachReadyDescription({
          phase: "main",
          promptSignals,
          baseDescription: `Run short competitive rounds${playerCount}, keep score, and repeat the key action often enough for a later diagram-ready setup.`,
        }),
      },
    ],
  };
}

function baseSession({ sport, ageBand, durationMin, objectiveTags, equipment, activities }) {
  const session = {
    sport,
    ageBand,
    durationMin,
    objectiveTags: objectiveTags || [],
    ...(Array.isArray(equipment) && equipment.length ? { equipment } : {}),
    activities: fitActivityDurationsToDuration({ durationMin, activities }),
  };

  // Fail closed: validate generator output with the same validator used for user input.
  return validateCreateSession(session);
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
  if (!promptSignals?.quickSession) {
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
    { name: "Dynamic warmup + ball mastery", minutes: 10, description: "Set a small grid, pair movement with touches, and cue players to check shoulders before receiving." },
    { name: "Rondo (numbers up)", minutes: 15, description: "Score by splitting defenders or completing a target number of passes. Cue angles, scanning, and first touch away from pressure." },
    { name: "Passing pattern to targets", minutes: 20, description: "Build from unopposed pattern to passive pressure, then active pressure. Reward timing, support angle, and clean final pass." },
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
      description: "Use a tight grid with quick turns and close control. Cue players to look up before changing direction.",
    },
    {
      name: "Tight-space rondo waves",
      minutes: 15,
      description: "Score by escaping pressure into the next support angle. Cue short passing, scanning, and quick body shape.",
    },
    {
      name: "Build-up under pressure lanes",
      minutes: 20,
      description: "Play through narrow lanes with quick rotations. Progress by limiting touches or shrinking the escape lane.",
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
    { name: "Warmup: finishing technique", minutes: 10, description: "Set two short shooting lines and rehearse inside foot, laces, and both feet. Cue balanced body shape before contact." },
    { name: "1v1 to goal", minutes: 15, description: "Attack a goal quickly and score within a short time window. Coach the choice between early shot and one touch to separate." },
    { name: "Combination play to finish", minutes: 20, description: "Use a wall pass or overlap into finish. Award extra points for first-time finishes or rebounds followed in." },
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
    { name: "Warmup: reaction & acceleration", minutes: 10, description: "Use short races and stop-start reactions. Cue first three steps, quick braking, and immediate recovery shape." },
    { name: "3v3+2 transition game", minutes: 20, description: "Score quickly after a regain or keep the ball for a point. Cue first pass forward, support underneath, and recovery runs." },
    { name: "Pressing cues in small-sided game", minutes: 20, description: "Press on bad touch, back pass, or sideline trap. Progress by adding a countdown after each trigger." },
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
      description: "Use short accelerations, recoveries, and reaction cues in reduced space. Emphasize first step and balance.",
    },
    {
      name: "2v2+1 pressure-cover rotations",
      minutes: 20,
      description: "Score by forcing a turnover or escaping pressure. Cue first defender pressure and second defender cover.",
    },
    {
      name: "Reduced-space pressing game",
      minutes: 20,
      description: "Use fast restarts and a compact field. Progress by shrinking recovery time after each regain.",
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
    { name: "Ball mastery arrival game", minutes: 10, description: "Set a simple grid, give each player a ball where possible, and add an easy scoring target to get the group moving." },
    { name: `${titleCase(theme)} channels game`, minutes: 20, description: "Create channels or gates that reward the key soccer action. Play short rounds, keep score through target players or end zones, and coach scanning, support angles, and first touch." },
    { name: "Conditioned final game", minutes: 20, description: "Use a game-like format with one constraint, such as bonus points for a quick transition or a successful pass through a gate. Progress by changing space, numbers, or touch limits." },
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

function templateQuickOneDrill({ sport, ageBand, durationMin, theme, equipment, promptSignals }) {
  const objective = normalizeTheme(promptSignals?.primaryObjective || theme) || "quick challenge";
  const objectiveTags = inferFocusTagsFromText(objective);
  const displayObjective = titleCase(objective).slice(0, 52) || "Quick Challenge";
  const playerCount =
    typeof promptSignals?.playerCount === "number" && Number.isInteger(promptSignals.playerCount)
      ? `${promptSignals.playerCount} players`
      : "the group";
  const description = buildCoachReadyDescription({
    phase: "main",
    promptSignals,
    baseDescription: `Run a game-like challenge for ${playerCount}. Use scoring for the focus action, quick positive restarts, and rotations so every player gets repeated decisions.`,
  });

  return baseSession({
    sport,
    ageBand,
    durationMin,
    objectiveTags: objectiveTags.length ? objectiveTags : ["theme"],
    equipment,
    activities: [
      {
        name: `${displayObjective} Game`,
        minutes: durationMin,
        description,
      },
    ],
  });
}

function pickTemplate(themeKey) {
  // very simple matching
  if (themeKey.includes("pass")) return "passing";
  if (themeKey.includes("shape")) return "passing";
  if (themeKey.includes("possession")) return "passing";
  if (themeKey.includes("finish")) return "finishing";
  if (themeKey.includes("shoot")) return "finishing";
  if (themeKey.includes("score")) return "finishing";
  if (themeKey.includes("press")) return "pressing";
  if (themeKey.includes("pressure")) return "pressing";
  if (themeKey.includes("transition")) return "pressing";
  if (themeKey.includes("defend")) return "pressing";
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
  sessionMode,
  coachNotes,
  equipment,
  methodologyInfluence,
  resolvedPlayerCount,
}) {
  const promptSignals = extractPromptSignals(theme, {
    sessionMode,
    coachNotes,
    playerCount: resolvedPlayerCount,
    equipment,
    methodologyInfluence,
  });
  const themeKey = normalizeTheme(promptSignals.primaryObjective || theme);
  const t = pickSportPackTemplate({
    sportPackId,
    themeKey: !hasGoalEquipment(equipment) && pickTemplate(themeKey) === "finishing"
      ? "attacking gates"
      : themeKey,
  });

  const session =
    (promptSignals.sessionMode === "quick_activity" || promptSignals.sessionMode === "drill") &&
    (promptSignals.activityFormat === "quick_activity" || promptSignals.activityFormat === "one_drill")
      ? templateQuickOneDrill({ sport, ageBand, durationMin, theme, equipment, promptSignals })
      : t === "passing"
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

  const sessionWithPromptTags = applyPromptFocusTagsToSession(session, promptSignals);

  const shapedSession =
    promptSignals.sessionMode === "quick_activity"
      ? normalizeQuickActivityShape({ session: sessionWithPromptTags, promptSignals })
      : promptSignals.sessionMode === "drill"
      ? normalizeDrillShape({ session: sessionWithPromptTags, promptSignals })
      : normalizeFullSessionShape({ session: sessionWithPromptTags, promptSignals });

  const validatedSession = validateCreateSession(shapedSession);

  if (minutesSum(validatedSession.activities) !== durationMin) {
    throw validationError("invalid_field", "Generated session duration total must equal durationMin", {
      reason: "invalid_generated_duration_total",
      durationMin,
      totalMinutes: minutesSum(validatedSession.activities),
    });
  }

  return validatedSession;
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
  sessionMode,
  coachNotes,
  sessionsCount,
  equipment,
  confirmedProfile,
  methodologyInfluence,
  resolvedPlayerCount,
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
      sessionMode,
      coachNotes,
      equipment: mergedEquipment,
      methodologyInfluence,
      resolvedPlayerCount,
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
