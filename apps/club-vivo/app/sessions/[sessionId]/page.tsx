import Link from "next/link";

import {
  getSession,
  SessionBuilderApiError,
  submitSessionFeedback,
  type SessionFeedbackFlowMode,
  type SessionFeedbackImageAnalysisAccuracy,
} from "../../../lib/session-builder-api";
import {
  SessionFeedbackPanel,
  type FeedbackPanelState,
} from "./session-feedback-panel";

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const IMAGE_ANALYSIS_ACCURACY_VALUES = new Set<SessionFeedbackImageAnalysisAccuracy>([
  "not_used",
  "low",
  "medium",
  "high",
]);

const FLOW_MODE_VALUES = new Set<SessionFeedbackFlowMode>([
  "session_builder",
  "environment_profile",
  "setup_to_drill",
]);

const INITIAL_FEEDBACK_PANEL_STATE: FeedbackPanelState = {
  status: "idle",
  values: {
    sessionQuality: "",
    drillUsefulness: "",
    imageAnalysisAccuracy: "not_used",
    missingFeatures: "",
    flowMode: "",
  },
};

function getTrimmedValue(formData: FormData, field: string) {
  return String(formData.get(field) || "").trim();
}

function parseImageAnalysisAccuracy(
  value: string
): SessionFeedbackImageAnalysisAccuracy | undefined {
  return IMAGE_ANALYSIS_ACCURACY_VALUES.has(value as SessionFeedbackImageAnalysisAccuracy)
    ? (value as SessionFeedbackImageAnalysisAccuracy)
    : undefined;
}

function parseFlowMode(value: string): SessionFeedbackFlowMode | undefined {
  return FLOW_MODE_VALUES.has(value as SessionFeedbackFlowMode)
    ? (value as SessionFeedbackFlowMode)
    : undefined;
}

export default async function SessionDetailPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  async function submitFeedbackAction(
    _previousState: FeedbackPanelState,
    formData: FormData
  ): Promise<FeedbackPanelState> {
    "use server";

    const sessionQualityValue = getTrimmedValue(formData, "sessionQuality");
    const drillUsefulnessValue = getTrimmedValue(formData, "drillUsefulness");
    const imageAnalysisAccuracyValue = getTrimmedValue(formData, "imageAnalysisAccuracy");
    const missingFeaturesValue = getTrimmedValue(formData, "missingFeatures");
    const flowModeValue = getTrimmedValue(formData, "flowMode");
    const imageAnalysisAccuracy = parseImageAnalysisAccuracy(imageAnalysisAccuracyValue);
    const flowMode = parseFlowMode(flowModeValue);

    const values: FeedbackPanelState["values"] = {
      sessionQuality: sessionQualityValue,
      drillUsefulness: drillUsefulnessValue,
      imageAnalysisAccuracy:
        imageAnalysisAccuracy || INITIAL_FEEDBACK_PANEL_STATE.values.imageAnalysisAccuracy,
      missingFeatures: missingFeaturesValue,
      flowMode: flowMode || "",
    };

    const sessionQuality = Number.parseInt(sessionQualityValue, 10);
    const drillUsefulness = Number.parseInt(drillUsefulnessValue, 10);

    if (
      !Number.isInteger(sessionQuality) ||
      sessionQuality < 1 ||
      sessionQuality > 5 ||
      !Number.isInteger(drillUsefulness) ||
      drillUsefulness < 1 ||
      drillUsefulness > 5 ||
      !imageAnalysisAccuracy ||
      !missingFeaturesValue ||
      missingFeaturesValue.length > 280 ||
      (flowModeValue !== "" && !flowMode)
    ) {
      return {
        status: "error",
        message: "Review the feedback fields and try again.",
        values,
      };
    }

    try {
      await submitSessionFeedback(sessionId, {
        sessionQuality,
        drillUsefulness,
        imageAnalysisAccuracy,
        missingFeatures: missingFeaturesValue,
        ...(flowMode ? { flowMode } : {}),
      });

      return {
        status: "success",
        message: "Feedback submitted. Thank you for the pilot feedback.",
        values,
      };
    } catch (error) {
      if (error instanceof SessionBuilderApiError) {
        if (error.status === 409) {
          return {
            status: "already-submitted",
            message: "Feedback has already been submitted for this session.",
            values,
          };
        }

        if (error.status === 400) {
          return {
            status: "error",
            message: "Review the feedback fields and try again.",
            values,
          };
        }

        return {
          status: "error",
          message: `Request failed with status ${error.status}.`,
          values,
        };
      }

      return {
        status: "error",
        message: "Feedback could not be submitted right now. Try again shortly.",
        values,
      };
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="club-vivo-shell w-full max-w-5xl rounded-[2rem] border p-8 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="club-vivo-badge mb-6 inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
              Session Detail
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {session.sport} · {session.ageBand}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              This page shows the current Week 12 session detail returned by{" "}
              <code>GET /sessions/{`{sessionId}`}</code>.
            </p>
          </div>

          <Link
            href="/sessions"
            className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Back to sessions
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sport</h2>
            <p className="mt-2 text-sm text-slate-800">{session.sport}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age Band</h2>
            <p className="mt-2 text-sm text-slate-800">{session.ageBand}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</h2>
            <p className="mt-2 text-sm text-slate-800">{session.durationMin} minutes</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created At</h2>
            <p className="mt-2 text-sm text-slate-800">{formatCreatedAt(session.createdAt)}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created By</h2>
            <p className="mt-2 break-all text-sm text-slate-800">
              {session.createdBy ?? "Unavailable"}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schema Version</h2>
            <p className="mt-2 text-sm text-slate-800">{session.schemaVersion}</p>
          </article>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Objective Tags</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {session.objectiveTags.length > 0 ? (
                session.objectiveTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No objective tags</span>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Equipment</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {session.equipment.length > 0 ? (
                session.equipment.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No equipment listed</span>
              )}
            </div>
          </article>
        </div>

        <article className="mt-8 rounded-3xl border border-slate-200 bg-white/70 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Activities</h2>

          <div className="mt-4 grid gap-4">
            {session.activities.map((activity, index) => (
              <section
                key={`${activity.name}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-base font-semibold text-slate-900">{activity.name}</h3>
                  <p className="text-sm text-slate-600">{activity.minutes} minutes</p>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {activity.description?.trim() || "No description provided."}
                </p>
              </section>
            ))}
          </div>
        </article>

        <SessionFeedbackPanel
          initialState={INITIAL_FEEDBACK_PANEL_STATE}
          submitAction={submitFeedbackAction}
        />
      </section>
    </main>
  );
}
