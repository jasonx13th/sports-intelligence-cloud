import { inspect } from "node:util";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SessionPackView } from "../../../../components/coach/SessionPackView";
import { buildApiUrl } from "../../../../lib/api";
import { ACCESS_COOKIE } from "../../../../lib/auth";
import { SessionBuilderApiError } from "../../../../lib/session-builder-api";
import type {
  GeneratedSession,
  SessionPack as PublicSessionPack
} from "../../../../lib/session-builder-api";
import type { SessionPackActivity, SessionPackV2 } from "../../../../lib/types/session-pack";
import { MOCK_COACH_LITE_SESSION_PACK } from "./mock-session-pack";

const PREVIEW_INPUT = {
  sport: "soccer",
  ageBand: "u12",
  durationMin: 60,
  theme: "pressing",
  sessionsCount: 1
};

class PreviewSessionBuilderApiError extends SessionBuilderApiError {
  detail?: string;
  responseBody?: unknown;

  constructor(status: number, detail?: string, responseBody?: unknown) {
    super(detail || "Session Builder API request failed", status);
    this.name = "PreviewSessionBuilderApiError";
    this.detail = detail;
    this.responseBody = responseBody;
  }
}

type PreviewApiErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  correlationId?: unknown;
  requestId?: unknown;
};

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displayAgeGroup(ageBand: string) {
  const normalized = ageBand.trim().toLowerCase();
  return normalized.startsWith("u") ? normalized.toUpperCase() : titleCase(normalized);
}

function inferPhase(name: string, index: number, totalActivities: number): SessionPackActivity["phase"] {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("cooldown")) return "cooldown";
  if (index === 0 || normalized.includes("warmup") || normalized.includes("warm-up")) return "warm-up";
  if (totalActivities <= 2) return "main";
  if (index === totalActivities - 1) return "game";
  if (index === 1) return "technical";
  return "main";
}

function deriveCoachingPoints(description: string | undefined) {
  const points =
    description
      ?.split(/[.;]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 3) ?? [];

  return points.length > 0
    ? points
    : ["Coach Lite preview derived from the current public Session Builder activity description."];
}

function buildObjective(pack: PublicSessionPack, session: GeneratedSession) {
  return session.objectiveTags.length > 0
    ? `Focus on ${session.objectiveTags.join(", ")}.`
    : `Focus on ${pack.theme}.`;
}

function adaptPackToCoachLitePreview(pack: PublicSessionPack): SessionPackV2 {
  const session = pack.sessions[0];

  if (!session) {
    throw new Error("No generated sessions were returned for the preview.");
  }

  if (pack.sport !== "soccer") {
    throw new Error(`Coach Lite preview supports soccer only. Received sport: ${pack.sport}`);
  }

  const sessionEquipment = Array.isArray((session as { equipment?: unknown }).equipment)
    ? ((session as { equipment?: string[] }).equipment ?? [])
    : [];
  const packEquipment = Array.isArray((pack as { equipment?: unknown }).equipment)
    ? ((pack as { equipment?: string[] }).equipment ?? [])
    : [];
  const sharedEquipment = sessionEquipment.length > 0 ? sessionEquipment : packEquipment;

  return {
    sessionPackId: pack.packId,
    specVersion: "session-pack.v2",
    title: `${displayAgeGroup(pack.ageBand)} ${titleCase(pack.theme)} Session`,
    sport: "soccer",
    ageGroup: displayAgeGroup(pack.ageBand),
    durationMinutes: session.durationMin,
    equipment: sharedEquipment,
    space: {},
    objective: buildObjective(pack, session),
    activities: session.activities.map((activity, index) => ({
      activityId: `preview-act-${index + 1}`,
      name: activity.name,
      phase: inferPhase(activity.name, index, session.activities.length),
      minutes: activity.minutes,
      objective:
        activity.description?.trim() ||
        `Support the ${pack.theme} theme inside the current public Session Builder preview.`,
      setup: "Setup details are not included in the current public Session Builder pack yet.",
      instructions:
        activity.description?.trim() ||
        "Instructions are not included in the current public Session Builder pack yet.",
      coachingPoints: deriveCoachingPoints(activity.description),
      equipment: sharedEquipment
    })),
    assumptions: [
      "Adapted from the current public Session Builder v1 pack for preview only.",
      "Fields not present in the v1 public response are intentionally omitted."
    ]
  };
}

function isRedirectLike(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function extractPreviewApiErrorDetail(value: unknown): string | undefined {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => extractPreviewApiErrorDetail(item))
      .filter((item): item is string => Boolean(item));

    if (normalized.length > 0) {
      return normalized.join(" | ");
    }

    return inspect(value, { depth: null, breakLength: Infinity });
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  if ("error" in value) {
    const nestedError = (value as { error?: unknown }).error;

    if (nestedError && typeof nestedError === "object") {
      const nestedDetails = extractPreviewApiErrorDetail(
        (nestedError as { details?: unknown }).details
      );
      if (nestedDetails) {
        return nestedDetails;
      }

      const nestedMessage = extractPreviewApiErrorDetail(
        (nestedError as { message?: unknown }).message
      );
      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }

  if ("details" in value) {
    const details = (value as { details?: unknown }).details;
    const detail = extractPreviewApiErrorDetail(details);
    if (detail) {
      return detail;
    }
  }

  if ("message" in value) {
    const message = extractPreviewApiErrorDetail((value as { message?: unknown }).message);
    if (message) {
      return message;
    }
  }

  if ("error" in value) {
    const error = extractPreviewApiErrorDetail((value as { error?: unknown }).error);
    if (error) {
      return error;
    }
  }

  if ("errors" in value) {
    const errors = extractPreviewApiErrorDetail((value as { errors?: unknown }).errors);
    if (errors) {
      return errors;
    }
  }

  return inspect(value, { depth: null, breakLength: Infinity });
}

function getPreviewApiDebugPayload(status: number, responseBody: unknown) {
  const envelope =
    responseBody && typeof responseBody === "object"
      ? (responseBody as PreviewApiErrorEnvelope)
      : undefined;

  return {
    status,
    request: PREVIEW_INPUT,
    code: envelope?.error?.code,
    message: envelope?.error?.message,
    details: envelope?.error?.details,
    correlationId: envelope?.correlationId,
    requestId: envelope?.requestId,
    responseBody
  };
}

async function generatePreviewPack() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const response = await fetch(buildApiUrl("/session-packs"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(PREVIEW_INPUT),
    cache: "no-store"
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/logout");
  }

  const contentType = response.headers.get("content-type") || "";
  let body: unknown = null;

  if (contentType.includes("application/json")) {
    body = (await response.json()) as { pack?: PublicSessionPack };
  } else if (response.status !== 204) {
    body = await response.text();
  }

  if (!response.ok) {
    const detail = extractPreviewApiErrorDetail(body);
    throw new PreviewSessionBuilderApiError(response.status, detail, body);
  }

  if (!contentType.includes("application/json")) {
    throw new PreviewSessionBuilderApiError(response.status, "Expected JSON response");
  }

  const pack = (body as { pack?: PublicSessionPack }).pack;

  if (!pack) {
    throw new PreviewSessionBuilderApiError(response.status, "Preview generation did not return a pack.");
  }

  return pack;
}

function getPreviewErrorMessage(error: unknown) {
  if (error instanceof PreviewSessionBuilderApiError) {
    const baseMessage = `Real preview generation failed with status ${error.status}.`;
    if (process.env.NODE_ENV !== "production" && error.detail) {
      return `${baseMessage} ${error.detail} Showing the local fallback mock instead.`;
    }

    return `${baseMessage} Showing the local fallback mock instead.`;
  }

  if (error instanceof SessionBuilderApiError) {
    return `Real preview generation failed with status ${error.status}. Showing the local fallback mock instead.`;
  }

  if (error instanceof Error && error.message) {
    return `${error.message} Showing the local fallback mock instead.`;
  }

  return "Real preview generation failed. Showing the local fallback mock instead.";
}

async function getPreviewState() {
  try {
    const publicPack = await generatePreviewPack();

    return {
      pack: adaptPackToCoachLitePreview(publicPack),
      source: "generated" as const,
      message:
        "This preview is rendering real generated content adapted from the current public Session Builder pack."
    };
  } catch (error) {
    if (isRedirectLike(error)) {
      throw error;
    }

    if (error instanceof PreviewSessionBuilderApiError) {
      const debugPayload = getPreviewApiDebugPayload(error.status, error.responseBody);

      console.error(
        `[CoachLitePreview] Session pack preview request failed\n${inspect(debugPayload, {
          depth: null,
          colors: false,
          compact: false
        })}`
      );
    } else {
      console.error("[CoachLitePreview] Session pack preview request failed", error);
    }

    return {
      pack: MOCK_COACH_LITE_SESSION_PACK,
      source: "mock" as const,
      message: getPreviewErrorMessage(error)
    };
  }
}

export default async function CoachLitePreviewPage() {
  const preview = await getPreviewState();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-7xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
              Local Preview
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Coach Lite Session Pack Preview
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              This standalone page stays inside the existing Session Builder path. It adapts only
              the first generated v1 candidate for Coach Lite preview rendering and falls back to
              the typed mock if preview generation is unavailable.
            </p>
          </div>

          <Link
            href="/sessions"
            className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Back to sessions
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">
            {preview.source === "generated" ? "Real Generated Preview" : "Mock Fallback Preview"}
          </span>
          <span className="ml-2">{preview.message}</span>
        </div>

        <div className="mt-8">
          <SessionPackView pack={preview.pack} />
        </div>
      </section>
    </main>
  );
}
