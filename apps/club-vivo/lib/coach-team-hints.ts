export const COACH_TEAM_HINTS_COOKIE = "club-vivo-coach-team-hints";
const MAX_COACH_TEAMS = 12;

export type CoachTeamType = "travel" | "ost";

export type CoachTeamSetup = {
  id: string;
  teamName: string;
  ageBand: string;
  teamType: CoachTeamType;
  playerCount: number;
};

export const COACH_TEAM_AGE_BAND_OPTIONS = [
  "u5",
  "u6",
  "u7",
  "u8",
  "u9",
  "u10",
  "u11",
  "u12",
  "u13",
  "u14",
  "u15",
  "u16",
  "u17",
  "u18",
  "u19",
  "u20",
  "u21",
  "mixed_age",
  "adult"
] as const;

const DEFAULT_COACH_TEAMS: CoachTeamSetup[] = [
  {
    id: "team-ksc-travel-u14",
    teamName: "KSC Travel U14",
    ageBand: "u14",
    teamType: "travel",
    playerCount: 18
  },
  {
    id: "team-ksc-travel-u12",
    teamName: "KSC Travel U12",
    ageBand: "u12",
    teamType: "travel",
    playerCount: 16
  },
  {
    id: "team-ksc-ost-u10",
    teamName: "KSC OST U10",
    ageBand: "u10",
    teamType: "ost",
    playerCount: 14
  }
];

function normalizeTeamName(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 60).trim() : undefined;
}

function normalizeAgeBand(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, "").trim().toLowerCase();
  return normalized ? normalized.slice(0, 12) : undefined;
}

function normalizeTeamType(value: string | undefined): CoachTeamType | undefined {
  return value === "travel" || value === "ost" ? value : undefined;
}

function normalizePlayerCount(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }

  return Math.min(parsed, 60);
}

function normalizeCoachTeam(candidate: Partial<CoachTeamSetup>): CoachTeamSetup | undefined {
  const teamName = normalizeTeamName(candidate.teamName);
  const ageBand = normalizeAgeBand(candidate.ageBand);
  const teamType = normalizeTeamType(candidate.teamType);
  const playerCount = normalizePlayerCount(candidate.playerCount);

  if (
    typeof candidate.id !== "string" ||
    !candidate.id.trim() ||
    !teamName ||
    !ageBand ||
    !teamType ||
    !playerCount
  ) {
    return undefined;
  }

  return {
    id: candidate.id.trim(),
    teamName,
    ageBand,
    teamType,
    playerCount
  };
}

export function parseCoachTeamHints(rawValue: string | undefined): CoachTeamSetup[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) =>
        item && typeof item === "object"
          ? normalizeCoachTeam(item as Partial<CoachTeamSetup>)
          : undefined
      )
      .filter((team): team is CoachTeamSetup => Boolean(team))
      .slice(0, MAX_COACH_TEAMS);
  } catch {
    return [];
  }
}

export function getCoachTeams(rawValue: string | undefined) {
  const parsed = parseCoachTeamHints(rawValue);
  return parsed.length > 0 ? parsed : DEFAULT_COACH_TEAMS;
}

export function serializeCoachTeamHints(teams: CoachTeamSetup[]) {
  return JSON.stringify(
    teams
      .map((team) => normalizeCoachTeam(team))
      .filter((team): team is CoachTeamSetup => Boolean(team))
      .slice(0, MAX_COACH_TEAMS)
  );
}

export function formatCoachTeamAgeBand(ageBand: string) {
  const normalizedAgeBand = normalizeAgeBand(ageBand);

  if (!normalizedAgeBand) {
    return ageBand;
  }

  if (normalizedAgeBand === "mixed_age") {
    return "Mixed age";
  }

  if (normalizedAgeBand === "adult") {
    return "Adult";
  }

  if (/^u\d{1,2}$/.test(normalizedAgeBand)) {
    return normalizedAgeBand.toUpperCase();
  }

  return ageBand;
}
