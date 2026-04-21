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

const QUICK_SESSION_DEFAULTS = {
  sport: "soccer",
  ageBand: "u14",
  durationMin: "60",
  equipment: ""
} as const;
const QUICK_SESSION_THEME_MAX_LENGTH = 60;

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

function deriveQuickSessionTheme(prompt: string) {
  const normalizedPrompt = prompt.replace(/\s+/g, " ").trim();

  if (!normalizedPrompt) {
    return "Quick session request";
  }

  if (normalizedPrompt.length <= QUICK_SESSION_THEME_MAX_LENGTH) {
    return normalizedPrompt;
  }

  const truncatedPrompt = normalizedPrompt
    .slice(0, QUICK_SESSION_THEME_MAX_LENGTH - 3)
    .trimEnd();

  return truncatedPrompt ? `${truncatedPrompt}...` : "Quick session request";
}

function extractQuickSessionDuration(prompt: string) {
  const match = prompt.match(/\b(\d{1,3})\s*(?:-| )?(?:minute|minutes|min|mins)\b/i);
  const duration = match ? Number.parseInt(match[1] || "", 10) : Number.NaN;

  if (!Number.isInteger(duration) || duration < 1) {
    return Number.parseInt(QUICK_SESSION_DEFAULTS.durationMin, 10);
  }

  return duration;
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
  const quickSessionTheme = deriveQuickSessionTheme(prompt);
  const quickSessionDuration = extractQuickSessionDuration(prompt);

  if (!prompt) {
    return {
      error: "Add a quick prompt before creating a session."
    };
  }

  try {
    const pack = await generateSessionPack({
      sport: QUICK_SESSION_DEFAULTS.sport,
      ageBand: QUICK_SESSION_DEFAULTS.ageBand,
      durationMin: quickSessionDuration,
      theme: quickSessionTheme
    });

    const cookieStore = await cookies();
    cookieStore.set(
      QUICK_SESSION_COOKIE,
      serializeQuickSessionPayload({
        pack,
        values: {
          ...QUICK_SESSION_DEFAULTS,
          durationMin: String(quickSessionDuration),
          theme: quickSessionTheme
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
