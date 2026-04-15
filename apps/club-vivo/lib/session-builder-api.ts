import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE } from "./auth";
import { buildApiUrl } from "./api";

export type SessionListItem = {
  sessionId: string;
  createdAt: string;
  sport: string;
  ageBand: string;
  durationMin: number;
  objectiveTags: string[];
  activityCount: number;
};

export type SessionActivity = {
  name: string;
  minutes: number;
  description?: string;
};

export type SessionDetail = {
  sessionId: string;
  createdAt: string;
  createdBy: string | null;
  sport: string;
  ageBand: string;
  durationMin: number;
  objectiveTags: string[];
  equipment: string[];
  activities: SessionActivity[];
  schemaVersion: number;
};

export type GenerateSessionPackInput = {
  sport: string;
  sportPackId?: "fut-soccer";
  ageBand: string;
  durationMin: number;
  theme: string;
  sessionsCount?: number;
  equipment?: string[];
};

export type GeneratedSession = {
  sport: string;
  ageBand: string;
  durationMin: number;
  objectiveTags: string[];
  equipment: string[];
  activities: SessionActivity[];
};

export type SessionPack = {
  packId: string;
  createdAt: string;
  sport: string;
  ageBand: string;
  durationMin: number;
  theme: string;
  sessionsCount: number;
  equipment: string[];
  sessions: GeneratedSession[];
};

export type SessionPdfResult = {
  url: string;
  expiresInSeconds: number;
};

export class SessionBuilderApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SessionBuilderApiError";
    this.status = status;
  }
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
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/logout");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new SessionBuilderApiError("Expected JSON response", response.status);
  }

  const body = (await response.json()) as T;

  if (!response.ok) {
    throw new SessionBuilderApiError("Session Builder API request failed", response.status);
  }

  return body;
}

export async function getSessions(nextToken?: string) {
  const params = new URLSearchParams();
  if (nextToken) {
    params.set("nextToken", nextToken);
  }

  const path = params.size > 0 ? `/sessions?${params.toString()}` : "/sessions";
  return requestJson<{
    items: SessionListItem[];
    nextToken?: string;
  }>(path);
}

export async function getSession(sessionId: string) {
  const result = await requestJson<{
    session: SessionDetail;
  }>(`/sessions/${encodeURIComponent(sessionId)}`);

  return result.session;
}

export async function generateSessionPack(input: GenerateSessionPackInput) {
  const result = await requestJson<{
    pack: SessionPack;
  }>("/session-packs", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return result.pack;
}

export async function createSession(session: GeneratedSession) {
  const result = await requestJson<{
    session: SessionDetail;
  }>("/sessions", {
    method: "POST",
    body: JSON.stringify(session)
  });

  return result.session;
}

export async function getSessionPdf(sessionId: string) {
  return requestJson<SessionPdfResult>(`/sessions/${encodeURIComponent(sessionId)}/pdf`);
}
