import type { ReactNode } from "react";

type ActivityOutputActivity = {
  name: string;
  minutes: number;
  description?: string;
};

type ActivityTiming = {
  rangeLabel?: string;
  durationLabel?: string;
};

type ActivitySection = {
  label: string;
  text: string;
};

const SECTION_LABELS = [
  "Setup",
  "Start",
  "How to start",
  "Run",
  "How to run it",
  "Rules",
  "Scoring",
  "Rules / scoring",
  "Cue",
  "Cues",
  "Coaching cues",
  "Watch",
  "What to watch for",
  "Progress",
  "Progression",
  "Regress",
  "Regression",
  "Safety",
  "Space adjustment",
  "Safety / space adjustment",
  "Numbers",
  "Coach notes",
  "Challenge"
];

function normalizeComparisonText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sentenceRepeatsObjective(sentence: string, objective: string, objectiveTags: string[]) {
  const match = sentence.match(/^today(?:'|\u2019)?s\s+(?:focus|objective)\s*:\s*(.+)$/i);

  if (!match) {
    return false;
  }

  const sentenceObjective = normalizeComparisonText(match[1]);
  const coachObjective = normalizeComparisonText(objective);
  const tagObjectives = objectiveTags.map(normalizeComparisonText).filter(Boolean);

  if (!sentenceObjective) {
    return true;
  }

  if (
    coachObjective &&
    (coachObjective.includes(sentenceObjective) || sentenceObjective.includes(coachObjective))
  ) {
    return true;
  }

  return tagObjectives.some(
    (tag) => tag.includes(sentenceObjective) || sentenceObjective.includes(tag)
  );
}

function splitSentences(description: string, objective: string, objectiveTags: string[]) {
  const sentenceMatches = description.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);

  return (sentenceMatches || [description])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !sentenceRepeatsObjective(sentence, objective, objectiveTags));
}

function displaySectionLabel(label: string) {
  const normalized = normalizeComparisonText(label);

  if (normalized === "run") return "How to run it";
  if (normalized === "start") return "How to start";
  if (normalized === "rules" || normalized === "scoring") return "Rules / scoring";
  if (normalized === "cue" || normalized === "cues") return "Coaching cues";
  if (normalized === "watch") return "What to watch for";
  if (normalized === "progress") return "Progression";
  if (normalized === "regress") return "Regression";
  if (normalized === "safety" || normalized === "space adjustment") {
    return "Safety / space adjustment";
  }

  return label;
}

function sectionPattern() {
  const labels = SECTION_LABELS.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(?:^|\\s)(${labels.join("|")}):\\s*`, "gi");
}

function parseLabeledSections(description: string) {
  const matches = [...description.matchAll(sectionPattern())];

  if (matches.length === 0) {
    return [];
  }

  return matches
    .map((match, index) => {
      const start = (match.index || 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index || description.length : description.length;
      const text = description.slice(start, end).trim();

      return {
        label: displaySectionLabel(match[1]),
        text
      };
    })
    .filter((section) => section.text);
}

function buildActivitySections(
  description: string | undefined,
  objective: string,
  objectiveTags: string[]
): ActivitySection[] {
  const normalizedDescription = String(description || "").replace(/\s+/g, " ").trim();

  if (!normalizedDescription) {
    return [];
  }

  const labeledSections = parseLabeledSections(normalizedDescription);

  if (labeledSections.length > 0) {
    return labeledSections.filter(
      (section) => !sentenceRepeatsObjective(`${section.label}: ${section.text}`, objective, objectiveTags)
    );
  }

  return splitSentences(normalizedDescription, objective, objectiveTags).map((text) => ({
    label: "How to run it",
    text
  }));
}

function mergeDuplicateSections(sections: ActivitySection[]) {
  const merged: ActivitySection[] = [];

  for (const section of sections) {
    const previous = merged[merged.length - 1];

    if (previous?.label === section.label) {
      previous.text = `${previous.text} ${section.text}`;
    } else {
      merged.push({ ...section });
    }
  }

  return merged;
}

export function ActivityOutput({
  activity,
  activityIndex,
  objective = "",
  objectiveTags = [],
  timing,
  aside,
  compact = false
}: {
  activity: ActivityOutputActivity;
  activityIndex: number;
  objective?: string;
  objectiveTags?: string[];
  timing?: ActivityTiming;
  aside?: ReactNode;
  compact?: boolean;
}) {
  const sections = mergeDuplicateSections(
    buildActivitySections(activity.description, objective, objectiveTags)
  );
  const durationLabel = timing?.durationLabel || `${activity.minutes} minutes`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className={aside ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]" : "grid gap-4"}>
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
                {activityIndex + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Activity {activityIndex + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{activity.name}</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              {timing?.rangeLabel ? (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  {timing.rangeLabel}
                </span>
              ) : null}
              <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {durationLabel}
              </span>
            </div>
          </div>

          {sections.length > 0 ? (
            <div className={`mt-4 grid ${compact ? "gap-2" : "gap-3"}`}>
              {sections.map((section, sectionIndex) => (
                <section
                  key={`${section.label}-${sectionIndex}`}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {section.label}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{section.text}</p>
                </section>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-500">
              No description provided.
            </p>
          )}
        </div>

        {aside}
      </div>
    </section>
  );
}
