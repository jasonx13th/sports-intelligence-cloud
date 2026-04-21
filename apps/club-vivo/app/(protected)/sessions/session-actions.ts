import { redirect } from "next/navigation";

import {
  createSession,
  type GeneratedSession,
  type SessionBuilderApiError
} from "../../../lib/session-builder-api";

export type SaveGeneratedSessionState = {
  error?: string;
};

function getSaveErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as SessionBuilderApiError).status === "number"
  ) {
    const apiError = error as SessionBuilderApiError;
    console.error("SessionBuilderApiError", {
      status: apiError.status,
      message: apiError.message,
      details: apiError.details
    });

    return apiError.message || fallback;
  }

  if (error instanceof Error && error.message) {
    console.error("Unhandled save error", {
      message: error.message,
      error
    });

    return error.message;
  }

  console.error("Unknown save error", { error });
  return fallback;
}

export async function saveGeneratedSessionAction(
  _previousState: SaveGeneratedSessionState,
  formData: FormData
): Promise<SaveGeneratedSessionState> {
  "use server";

  const rawCandidate = String(formData.get("candidate") || "");

  if (!rawCandidate) {
    return {
      error: "Select a generated session before saving."
    };
  }

  let candidate: GeneratedSession;

  try {
    candidate = JSON.parse(rawCandidate) as GeneratedSession;
  } catch {
    return {
      error: "Generated session data was invalid. Generate again and retry."
    };
  }

  let sessionId: string;

  try {
    const session = await createSession(candidate);
    sessionId = session.sessionId;
  } catch (error) {
    return {
      error: getSaveErrorMessage(error, "Saving failed. Generate again and retry.")
    };
  }

  redirect(`/sessions/${sessionId}`);
}
