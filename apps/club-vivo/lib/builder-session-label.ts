type SessionActivity = {
  name: string;
};

type BuilderSessionLike = {
  objectiveTags: string[];
  activities: SessionActivity[];
};

function normalizeText(value: string | undefined, maxLength: number) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength).trim() : undefined;
}

function toDisplayPhrase(value: string | undefined, maxLength: number) {
  const normalized = normalizeText(value, maxLength);

  if (!normalized) {
    return undefined;
  }

  return normalized
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildTagFocus(objectiveTags: string[] | undefined) {
  const tags = Array.isArray(objectiveTags)
    ? objectiveTags
        .filter((tag) => typeof tag === "string" && tag.trim())
        .filter((tag) => tag.trim().toLowerCase() !== "theme")
        .slice(0, 2)
        .map((tag) => toDisplayPhrase(tag, 32))
        .filter((tag): tag is string => Boolean(tag))
    : [];

  if (tags.length < 1) {
    return undefined;
  }

  return tags.join(" ");
}

function getMeaningfulActivityName(activities: SessionActivity[] | undefined) {
  const meaningfulActivity = Array.isArray(activities)
    ? activities.find((activity) => {
        const normalized = String(activity?.name || "").trim().toLowerCase();
        return normalized && normalized !== "cooldown";
      })
    : undefined;

  return normalizeText(meaningfulActivity?.name, 56);
}

export function buildBuilderSessionLabel({
  objective,
  objectiveTags,
  activities
}: {
  objective?: string;
  objectiveTags?: string[];
  activities?: SessionActivity[];
}) {
  const normalizedObjective = normalizeText(objective, 72);
  const objectiveDisplay = toDisplayPhrase(normalizedObjective, 72);
  const tagFocus = buildTagFocus(objectiveTags);
  const activityName = getMeaningfulActivityName(activities);

  if (tagFocus && normalizedObjective) {
    const normalizedObjectiveKey = normalizedObjective.toLowerCase();
    const normalizedTagKey = tagFocus.toLowerCase();

    if (normalizedObjectiveKey.split(/\s+/).length <= 2 && normalizedTagKey.includes(normalizedObjectiveKey)) {
      return tagFocus;
    }
  }

  return objectiveDisplay || tagFocus || activityName || "Coach Session";
}

export function buildBuilderSessionShapeSummary(activities: SessionActivity[] | undefined) {
  const steps = Array.isArray(activities)
    ? activities
        .filter((activity) => {
          const normalized = String(activity?.name || "").trim().toLowerCase();
          return normalized && normalized !== "cooldown";
        })
        .slice(0, 3)
        .map((activity) => normalizeText(activity.name, 48))
        .filter((activity): activity is string => Boolean(activity))
    : [];

  if (steps.length < 1) {
    return "No saved session shape available.";
  }

  return steps.join(" -> ");
}

export function buildBuilderSessionLabelFromSession({
  objective,
  session
}: {
  objective?: string;
  session: BuilderSessionLike;
}) {
  return buildBuilderSessionLabel({
    objective,
    objectiveTags: session.objectiveTags,
    activities: session.activities
  });
}
