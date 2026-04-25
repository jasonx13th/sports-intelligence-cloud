import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  generateSessionPack,
  SessionBuilderApiError
} from "../../../lib/session-builder-api";
import {
  QUICK_SESSION_COOKIE,
  serializeQuickSessionPayload
} from "../../../lib/quick-session-payload";
import {
  buildQuickSessionIntent,
  QUICK_SESSION_DEFAULT_DURATION_MIN
} from "../../../lib/quick-session-intent";

const QUICK_SESSION_DEFAULTS = {
  sport: "soccer",
  ageBand: "u14",
  durationMin: String(QUICK_SESSION_DEFAULT_DURATION_MIN),
  equipment: ""
} as const;

export type QuickSessionActionState = {
  error?: string;
};

function readErrorDetail(details: unknown): string | undefined {
  if (!details) {
    return undefined;
  }

  if (typeof details === "string") {
    return details.trim() || undefined;
  }

  if (Array.isArray(details)) {
    for (const item of details) {
      const message = readErrorDetail(item);
      if (message) {
        return message;
      }
    }

    return undefined;
  }

  if (typeof details === "object") {
    const detailObject = details as Record<string, unknown>;

    for (const key of ["message", "error", "detail", "reason"]) {
      const message = readErrorDetail(detailObject[key]);
      if (message) {
        return message;
      }
    }

    for (const key of ["details", "errors", "issues", "validationErrors"]) {
      const message = readErrorDetail(detailObject[key]);
      if (message) {
        return message;
      }
    }
  }

  return undefined;
}

function formatDevErrorDetails(details: unknown) {
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

function getQuickSessionErrorMessage(error: unknown) {
  if (error instanceof SessionBuilderApiError) {
    const detailMessage = readErrorDetail(error.details);
    const apiMessage =
      error.message && error.message !== `Session Builder API request failed (${error.status})`
        ? error.message
        : undefined;

    if (process.env.NODE_ENV !== "production") {
      const detailObject =
        error.details && typeof error.details === "object"
          ? (error.details as Record<string, unknown>)
          : undefined;
      const nestedError =
        detailObject?.error && typeof detailObject.error === "object"
          ? (detailObject.error as Record<string, unknown>)
          : undefined;

      console.error("Quick session generation failed", {
        status: error.status,
        message: error.message,
        code: detailObject?.code,
        detailsMessage: detailObject?.message,
        nestedErrorMessage: nestedError?.message,
        nestedErrorDetails: formatDevErrorDetails(nestedError?.details),
        details: formatDevErrorDetails(error.details)
      });
    }

    return detailMessage || apiMessage || `Quick session generation failed (${error.status}).`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Quick session generation failed. Try a more specific prompt or switch to Session Builder.";
}

export async function createQuickSessionAction(
  _previousState: QuickSessionActionState,
  formData: FormData
): Promise<QuickSessionActionState> {
  "use server";

  const prompt = String(formData.get("prompt") || "").trim();
  const quickSessionIntent = buildQuickSessionIntent(prompt);

  if (!prompt) {
    return {
      error: "Add a quick prompt before creating a session."
    };
  }

  try {
    const pack = await generateSessionPack({
      sport: QUICK_SESSION_DEFAULTS.sport,
      ageBand: QUICK_SESSION_DEFAULTS.ageBand,
      durationMin: quickSessionIntent.durationMin,
      theme: quickSessionIntent.theme,
      ...(quickSessionIntent.equipment.length ? { equipment: quickSessionIntent.equipment } : {})
    });

    const cookieStore = await cookies();
    cookieStore.set(
      QUICK_SESSION_COOKIE,
      serializeQuickSessionPayload({
        pack,
        values: {
          ...QUICK_SESSION_DEFAULTS,
          durationMin: String(quickSessionIntent.durationMin),
          theme: quickSessionIntent.theme,
          equipment: quickSessionIntent.equipment.join(", ")
        },
        notes: prompt
      }),
      {
        httpOnly: true,
        maxAge: 120,
        path: "/sessions",
        sameSite: "lax"
      }
    );
  } catch (error) {
    return {
      error: getQuickSessionErrorMessage(error)
    };
  }

  redirect("/sessions/quick-review");
}
