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
  confirmedProfile?: ConfirmedImageAnalysisProfile;
};

export type ImageAnalysisMode = "environment_profile" | "setup_to_drill";
export type SourceImageMimeType = "image/jpeg" | "image/png" | "image/webp";
export type AnalysisStatus = "draft" | "confirmed";
export type AnalysisConfidence = "low" | "medium" | "high";
export type SpaceSize = "small" | "medium" | "large" | "full" | "unknown";

export type EnvironmentProfile = {
  mode: "environment_profile";
  schemaVersion: 1;
  analysisId: string;
  status: AnalysisStatus;
  sourceImageId: string;
  sourceImageMimeType: SourceImageMimeType;
  summary: string;
  surfaceType: "grass" | "turf" | "indoor" | "hardcourt" | "unknown";
  spaceSize: SpaceSize;
  boundaryType: "small-grid" | "half-field" | "full-field" | "indoor-court" | "mixed" | "unknown";
  visibleEquipment: string[];
  constraints: string[];
  safetyNotes: string[];
  assumptions: string[];
  analysisConfidence: AnalysisConfidence;
};

export type SetupProfile = {
  mode: "setup_to_drill";
  schemaVersion: 1;
  analysisId: string;
  status: AnalysisStatus;
  sourceImageId: string;
  sourceImageMimeType: SourceImageMimeType;
  summary: string;
  layoutType: "box" | "lane" | "channel" | "grid" | "half-pitch" | "unknown";
  spaceSize: SpaceSize;
  playerOrganization: "individual" | "pairs" | "small-groups" | "two-lines" | "two-teams" | "unknown";
  visibleEquipment: string[];
  focusTags: string[];
  constraints: string[];
  assumptions: string[];
  analysisConfidence: AnalysisConfidence;
};

export type ImageAnalysisProfile = EnvironmentProfile | SetupProfile;
export type ConfirmedImageAnalysisProfile =
  | (Omit<EnvironmentProfile, "status"> & { status: "confirmed" })
  | (Omit<SetupProfile, "status"> & { status: "confirmed" });

export type AnalyzeSessionImageInput = {
  mode: ImageAnalysisMode;
  sourceImage: {
    filename?: string;
    mimeType: SourceImageMimeType;
    bytesBase64: string;
  };
};

export type ImageAnalysisResult = {
  analysisId: string;
  profile: ImageAnalysisProfile;
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

export async function analyzeSessionImage(input: AnalyzeSessionImageInput) {
  const result = await requestJson<{
    analysis: ImageAnalysisResult;
  }>("/session-packs", {
    method: "POST",
    body: JSON.stringify({
      requestType: "image-analysis",
      mode: input.mode,
      sourceImage: input.sourceImage
    })
  });

  return result.analysis;
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
