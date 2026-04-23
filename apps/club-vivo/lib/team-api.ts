import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE } from "./auth";
import { buildApiUrl } from "./api";

export type TeamProgramType = "travel" | "ost";

export type TeamRecord = {
  teamId: string;
  tenantId: string;
  name: string;
  sport: string;
  ageBand: string;
  level?: string;
  notes?: string;
  status: string;
  programType?: TeamProgramType;
  playerCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type TeamMutationInput = {
  name: string;
  sport: string;
  ageBand: string;
  level?: string;
  notes?: string;
  status?: string;
  programType?: TeamProgramType;
  playerCount?: number;
};

type ErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class TeamApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "TeamApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isTeamRecord(value: unknown): value is TeamRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.teamId === "string" &&
    typeof candidate.tenantId === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.sport === "string" &&
    typeof candidate.ageBand === "string" &&
    typeof candidate.status === "string" &&
    (candidate.programType === undefined ||
      candidate.programType === "travel" ||
      candidate.programType === "ost") &&
    (candidate.playerCount === undefined || Number.isInteger(candidate.playerCount)) &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

async function getAccessToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  return accessToken;
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken();
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/logout");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new TeamApiError("Expected JSON response", response.status);
  }

  const body = (await response.json()) as T | ErrorEnvelope;

  if (!response.ok) {
    const errorBody = body as ErrorEnvelope;
    throw new TeamApiError(
      errorBody.error?.message || `Team API request failed (${response.status})`,
      response.status,
      errorBody.error?.code,
      errorBody.error?.details
    );
  }

  return body as T;
}

export async function listTeams() {
  const result = await requestJson<{
    items: TeamRecord[];
  }>("/teams");

  if (!Array.isArray(result.items) || result.items.some((item) => !isTeamRecord(item))) {
    throw new TeamApiError("Invalid team list response", 500);
  }

  return result.items;
}

export async function getTeam(teamId: string) {
  const result = await requestJson<{
    team: TeamRecord;
  }>(`/teams/${encodeURIComponent(teamId)}`);

  if (!isTeamRecord(result.team)) {
    throw new TeamApiError("Invalid team response", 500);
  }

  return result.team;
}

export async function createTeam(input: TeamMutationInput) {
  const result = await requestJson<{
    team: TeamRecord;
  }>("/teams", {
    method: "POST",
    body: JSON.stringify(input)
  });

  if (!isTeamRecord(result.team)) {
    throw new TeamApiError("Invalid team response", 500);
  }

  return result.team;
}

export async function updateTeam(teamId: string, input: TeamMutationInput) {
  const result = await requestJson<{
    team: TeamRecord;
  }>(`/teams/${encodeURIComponent(teamId)}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });

  if (!isTeamRecord(result.team)) {
    throw new TeamApiError("Invalid team response", 500);
  }

  return result.team;
}
