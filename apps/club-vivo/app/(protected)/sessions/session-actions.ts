import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSession,
  type GeneratedSession,
  type SessionBuilderApiError
} from "../../../lib/session-builder-api";
import {
  SESSION_ORIGIN_HINTS_COOKIE,
  parseSessionOriginHint,
  withSessionOriginHint
} from "../../../lib/session-origin-hints";
import {
  SESSION_BUILDER_CONTEXT_HINTS_COOKIE,
  withSessionBuilderContextHint
} from "../../../lib/session-builder-context-hints";
import { buildBuilderSessionLabelFromSession } from "../../../lib/builder-session-label";
import {
  QUICK_SESSION_TITLE_HINTS_COOKIE,
  withQuickSessionTitleHint
} from "../../../lib/quick-session-title-hints";

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
  const origin = parseSessionOriginHint(String(formData.get("origin") || "").trim());
  const objective = String(formData.get("objective") || "").trim();
  const teamName = String(formData.get("teamName") || "").trim();
  const environment = String(formData.get("environment") || "").trim();
  const quickSessionTitle = String(formData.get("quickSessionTitle") || "").trim();
  const sessionLabel = buildBuilderSessionLabelFromSession({
    objective,
    session: candidate
  });

  try {
    const session = await createSession(candidate);
    sessionId = session.sessionId;
  } catch (error) {
    return {
      error: getSaveErrorMessage(error, "Saving failed. Generate again and retry.")
    };
  }

  if (origin) {
    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_ORIGIN_HINTS_COOKIE,
      withSessionOriginHint(
        cookieStore.get(SESSION_ORIGIN_HINTS_COOKIE)?.value,
        sessionId,
        origin
      ),
      {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax"
      }
    );

    if (origin === "quick_session" && quickSessionTitle) {
      cookieStore.set(
        QUICK_SESSION_TITLE_HINTS_COOKIE,
        withQuickSessionTitleHint(
          cookieStore.get(QUICK_SESSION_TITLE_HINTS_COOKIE)?.value,
          sessionId,
          quickSessionTitle
        ),
        {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          sameSite: "lax"
        }
      );
    }

    if (origin === "full_session" || origin === "quick_drill") {
      cookieStore.set(
        SESSION_BUILDER_CONTEXT_HINTS_COOKIE,
        withSessionBuilderContextHint(
          cookieStore.get(SESSION_BUILDER_CONTEXT_HINTS_COOKIE)?.value,
          sessionId,
          {
            objective,
            teamName,
            environment,
            sessionLabel
          }
        ),
        {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          sameSite: "lax"
        }
      );
    }
  }

  redirect(`/sessions/${sessionId}`);
}
