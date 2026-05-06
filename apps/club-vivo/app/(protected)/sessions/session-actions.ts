import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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
import { getCurrentUser } from "../../../lib/get-current-user";
import { getWorkspaceCookieName } from "../../../lib/workspace-local-cookies";

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
    const currentUser = await getCurrentUser();
    const cookieStore = await cookies();
    const sessionOriginHintsCookieName = getWorkspaceCookieName(
      SESSION_ORIGIN_HINTS_COOKIE,
      currentUser
    );
    const quickSessionTitleHintsCookieName = getWorkspaceCookieName(
      QUICK_SESSION_TITLE_HINTS_COOKIE,
      currentUser
    );
    const sessionBuilderContextHintsCookieName = getWorkspaceCookieName(
      SESSION_BUILDER_CONTEXT_HINTS_COOKIE,
      currentUser
    );

    cookieStore.set(
      sessionOriginHintsCookieName,
      withSessionOriginHint(
        cookieStore.get(sessionOriginHintsCookieName)?.value,
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
        quickSessionTitleHintsCookieName,
        withQuickSessionTitleHint(
          cookieStore.get(quickSessionTitleHintsCookieName)?.value,
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
        sessionBuilderContextHintsCookieName,
        withSessionBuilderContextHint(
          cookieStore.get(sessionBuilderContextHintsCookieName)?.value,
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

  revalidatePath("/home");
  revalidatePath("/sessions");

  redirect(`/sessions/${sessionId}`);
}
