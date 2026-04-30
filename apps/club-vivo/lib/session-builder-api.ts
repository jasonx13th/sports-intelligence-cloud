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
  sessionMode?: "full_session" | "drill" | "quick_activity";
  coachNotes?: string;
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
  boundaryType:
    | "small-grid"
    | "half-field"
    | "full-field"
    | "indoor-court"
    | "mixed"
    | "unknown";
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
  playerOrganization:
    | "individual"
    | "pairs"
    | "small-groups"
    | "two-lines"
    | "two-teams"
    | "unknown";
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

export type SessionFeedbackImageAnalysisAccuracy =
  | "not_used"
  | "low"
  | "medium"
  | "high";

export type SessionFeedbackFlowMode =
  | "session_builder"
  | "environment_profile"
  | "setup_to_drill";

export type SubmitSessionFeedbackInput = {
  sessionQuality: number;
  drillUsefulness: number;
  imageAnalysisAccuracy: SessionFeedbackImageAnalysisAccuracy;
  favoriteActivity?: string;
  missingFeatures: string;
  flowMode?: SessionFeedbackFlowMode;
};

export type SessionFeedback = {
  sessionId: string;
  submittedAt: string;
  submittedBy: string | null;
  sessionQuality: number;
  drillUsefulness: number;
  imageAnalysisAccuracy: SessionFeedbackImageAnalysisAccuracy;
  favoriteActivity?: string;
  missingFeatures: string;
  flowMode?: SessionFeedbackFlowMode;
  schemaVersion: number;
};

export class SessionBuilderApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "SessionBuilderApiError";
    this.status = status;
    this.details = details;
  }
}

function hasUnknownNewGenerationFields(details: unknown) {
  const text =
    typeof details === "string"
      ? details
      : (() => {
          try {
            return JSON.stringify(details);
          } catch {
            return "";
          }
        })();

  return text.includes("sessionMode") || text.includes("coachNotes");
}

function toLegacyGenerateSessionPackInput(input: GenerateSessionPackInput) {
  const { sessionMode: _sessionMode, coachNotes: _coachNotes, ...legacyInput } = input;
  return legacyInput;
}

function shapeLegacySessionToSingleActivity(
  session: GeneratedSession,
  durationMin: number,
  fallbackName: string
): GeneratedSession {
  const sourceActivity = session.activities[1] || session.activities[0];
  const activity = sourceActivity || {
    name: fallbackName,
    description:
      "Set one clear grid with a simple scoring rule, quick rotations, and a few practical coaching cues."
  };

  return {
    ...session,
    durationMin,
    activities: [
      {
        ...activity,
        name: activity.name?.trim() || fallbackName,
        minutes: durationMin
      }
    ]
  };
}

function shapeLegacyPackForRequestedMode(
  pack: SessionPack,
  input: GenerateSessionPackInput
): SessionPack {
  if (input.sessionMode !== "quick_activity" && input.sessionMode !== "drill") {
    return pack;
  }

  const durationMin = input.durationMin;
  const fallbackName = input.sessionMode === "quick_activity" ? "Quick activity" : "Main activity";

  return {
    ...pack,
    durationMin,
    sessions: pack.sessions.map((session) =>
      shapeLegacySessionToSingleActivity(session, durationMin, fallbackName)
    )
  };
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
      ...(init?.headers || {}),
    },
    cache: "no-store",
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
    let errorMessage = `Session Builder API request failed (${response.status})`;
    let errorDetails: unknown = body;

    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      errorMessage = (body as { error: string }).error;
    } else if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as { message?: unknown }).message === "string"
    ) {
      errorMessage = (body as { message: string }).message;
    }

    throw new SessionBuilderApiError(errorMessage, response.status, errorDetails);
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
  let result: {
    pack: SessionPack;
  };

  try {
    result = await requestJson<{
      pack: SessionPack;
    }>("/session-packs", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    // Temporary compatibility bridge: deployed /session-packs may not yet accept
    // sessionMode or coachNotes, so retry once with the legacy request shape.
    if (
      error instanceof SessionBuilderApiError &&
      error.status === 400 &&
      (input.sessionMode || input.coachNotes) &&
      hasUnknownNewGenerationFields(error.details)
    ) {
      result = await requestJson<{
        pack: SessionPack;
      }>("/session-packs", {
        method: "POST",
        body: JSON.stringify(toLegacyGenerateSessionPackInput(input)),
      });
      // Temporary compatibility bridge until deployed /session-packs accepts
      // sessionMode behavior: legacy drill-style responses can return three
      // activities, but Quick Activity and Session Builder Drill now expect one.
      result = {
        pack: shapeLegacyPackForRequestedMode(result.pack, input)
      };
    } else {
      throw error;
    }
  }

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
      sourceImage: input.sourceImage,
    }),
  });

  return result.analysis;
}

export async function createSession(session: GeneratedSession) {
  const result = await requestJson<{
    session: SessionDetail;
  }>("/sessions", {
    method: "POST",
    body: JSON.stringify(session),
  });

  return result.session;
}

export async function getSessionPdf(sessionId: string) {
  return requestJson<SessionPdfResult>(
    `/sessions/${encodeURIComponent(sessionId)}/pdf`
  );
}

export async function submitSessionFeedback(
  sessionId: string,
  input: SubmitSessionFeedbackInput
) {
  const result = await requestJson<{
    feedback: SessionFeedback;
  }>(`/sessions/${encodeURIComponent(sessionId)}/feedback`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.feedback;
}
