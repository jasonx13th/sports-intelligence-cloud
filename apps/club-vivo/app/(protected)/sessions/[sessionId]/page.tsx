import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CoachPageHeader } from "../../../../components/coach/CoachPageHeader";
import {
  QUICK_SESSION_TITLE_HINTS_COOKIE,
  normalizeQuickSessionTitle,
  parseQuickSessionTitleHints,
  withQuickSessionTitleHint
} from "../../../../lib/quick-session-title-hints";
import {
  buildQuickSessionFocusSummary,
  buildQuickSessionTitle
} from "../../../../lib/quick-session-intent";
import {
  SESSION_BUILDER_CONTEXT_HINTS_COOKIE,
  buildBuilderSessionDetailTitle,
  formatEnvironmentLabel,
  parseSessionBuilderContextHints
} from "../../../../lib/session-builder-context-hints";
import {
  buildBuilderSessionLabel,
  buildBuilderSessionShapeSummary
} from "../../../../lib/builder-session-label";
import { getCurrentUserIdentity } from "../../../../lib/get-current-user-identity";
import { SESSION_ORIGIN_HINTS_COOKIE, getSessionOriginLabel, parseSessionOriginHints } from "../../../../lib/session-origin-hints";
import {
  getSession,
  getSessionPdf,
  SessionBuilderApiError,
  submitSessionFeedback,
  type SessionDetail,
  type SessionFeedbackFlowMode,
  type SessionFeedbackImageAnalysisAccuracy
} from "../../../../lib/session-builder-api";
import {
  SessionFeedbackPanel,
  type FeedbackPanelState
} from "./session-feedback-panel";
import { SessionExportButton } from "./session-export-button";
import { QuickSessionTitleEditor } from "./quick-session-title-editor";

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
  "high"
]);

const FLOW_MODE_VALUES = new Set<SessionFeedbackFlowMode>([
  "session_builder",
  "environment_profile",
  "setup_to_drill"
]);

const INITIAL_FEEDBACK_PANEL_STATE: FeedbackPanelState = {
  status: "idle",
  values: {
    sessionQuality: "",
    drillUsefulness: "",
    imageAnalysisAccuracy: "not_used",
    missingFeatures: "",
    flowMode: ""
  }
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
  let session: SessionDetail;

  try {
    session = await getSession(sessionId);
  } catch (error) {
    if (error instanceof SessionBuilderApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const cookieStore = await cookies();
  const sessionOrigins = parseSessionOriginHints(
    cookieStore.get(SESSION_ORIGIN_HINTS_COOKIE)?.value
  );
  const origin = sessionOrigins[sessionId];
  const isQuickSession = origin === "quick_session";
  const isBuilderSession = origin === "full_session" || origin === "quick_drill";
  const quickSessionTitles = parseQuickSessionTitleHints(
    cookieStore.get(QUICK_SESSION_TITLE_HINTS_COOKIE)?.value
  );
  const builderContexts = parseSessionBuilderContextHints(
    cookieStore.get(SESSION_BUILDER_CONTEXT_HINTS_COOKIE)?.value
  );
  const quickSessionTitle = quickSessionTitles[sessionId];
  const derivedQuickSessionTitle = isQuickSession
    ? buildQuickSessionTitle({
        session
      })
    : null;
  const displayQuickSessionTitle = quickSessionTitle || derivedQuickSessionTitle || "Quick Session";
  const quickSessionFocusSummary = isQuickSession
    ? buildQuickSessionFocusSummary(session)
    : null;
  const builderContext = builderContexts[sessionId];
  const coachIdentity = await getCurrentUserIdentity();
  const createdByLabel =
    isQuickSession || isBuilderSession
      ? coachIdentity || "Signed-in coach"
      : session.createdBy ?? "Unavailable";
  const builderModeLabel = origin ? getSessionOriginLabel(origin) : "Session";
  const builderDetailTitle = isBuilderSession
    ? buildBuilderSessionDetailTitle({
        buildModeLabel: builderModeLabel,
        objective: builderContext?.objective,
        sessionLabel: builderContext?.sessionLabel,
        teamName: builderContext?.teamName,
        ageBand: session.ageBand
      })
    : null;
  const builderSessionLabel = isBuilderSession
    ? buildBuilderSessionLabel({
        objective: builderContext?.objective,
        objectiveTags: session.objectiveTags,
        activities: session.activities
      })
    : null;
  const builderSessionShapeSummary = isBuilderSession
    ? buildBuilderSessionShapeSummary(session.activities)
    : null;
  const pageTitle = isQuickSession
    ? displayQuickSessionTitle
    : isBuilderSession
      ? builderDetailTitle || builderModeLabel
      : `${session.sport} / ${session.ageBand}`;
  const pageBadge = isQuickSession || isBuilderSession ? builderModeLabel : "Session Detail";

  async function exportSessionPdfAction(
    _previousState: {
      error?: string;
    },
    formData: FormData
  ) {
    "use server";

    const requestedSessionId = String(formData.get("sessionId") || "").trim();

    if (!requestedSessionId || requestedSessionId !== sessionId) {
      return {
        error: "Export could not start for this session. Refresh and try again."
      };
    }

    try {
      const exportResult = await getSessionPdf(sessionId);
      redirect(exportResult.url);
    } catch (error) {
      if (error instanceof SessionBuilderApiError) {
        if (error.status === 404) {
          return {
            error: "PDF export is not available for this saved session right now."
          };
        }

        return {
          error: `PDF export failed with status ${error.status}. Try again shortly.`
        };
      }

      return {
        error: "PDF export is unavailable right now. Try again shortly."
      };
    }
  }

  async function saveQuickSessionTitleAction(
    _previousState: {
      error?: string;
      message?: string;
      savedTitle?: string;
    },
    formData: FormData
  ) {
    "use server";

      const nextTitle = normalizeQuickSessionTitle(String(formData.get("title") || ""));

    if (!nextTitle) {
      return {
        error: "Add a short quick-session title before saving.",
        savedTitle: displayQuickSessionTitle
      };
    }

    const responseCookieStore = await cookies();
    responseCookieStore.set(
      QUICK_SESSION_TITLE_HINTS_COOKIE,
      withQuickSessionTitleHint(
        responseCookieStore.get(QUICK_SESSION_TITLE_HINTS_COOKIE)?.value,
        sessionId,
        nextTitle
      ),
      {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax"
      }
    );

    return {
        message: "Saved",
        savedTitle: nextTitle
    };
  }

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
      flowMode: flowMode || ""
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
        values
      };
    }

    try {
      await submitSessionFeedback(sessionId, {
        sessionQuality,
        drillUsefulness,
        imageAnalysisAccuracy,
        missingFeatures: missingFeaturesValue,
        ...(flowMode ? { flowMode } : {})
      });

      return {
        status: "success",
        message: "Feedback submitted. Thank you for the pilot feedback.",
        values
      };
    } catch (error) {
      if (error instanceof SessionBuilderApiError) {
        if (error.status === 409) {
          return {
            status: "already-submitted",
            message: "Feedback has already been submitted for this session.",
            values
          };
        }

        if (error.status === 400) {
          return {
            status: "error",
            message: "Review the feedback fields and try again.",
            values
          };
        }

        return {
          status: "error",
          message: `Request failed with status ${error.status}.`,
          values
        };
      }

      return {
        status: "error",
        message: "Feedback could not be submitted right now. Try again shortly.",
        values
      };
    }
  }

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge={pageBadge}
        title={pageTitle}
        actions={
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <SessionExportButton sessionId={sessionId} exportAction={exportSessionPdfAction} />
            <Link
              href="/sessions"
              className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Back to sessions
            </Link>
          </div>
        }
      />

      <section className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur">
        {isBuilderSession ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created By</h2>
                <p className="mt-2 break-all text-sm text-slate-800">{createdByLabel}</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created At</h2>
                <p className="mt-2 text-sm text-slate-800">{formatCreatedAt(session.createdAt)}</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Environment</h2>
                <p className="mt-2 text-sm text-slate-800">
                  {formatEnvironmentLabel(builderContext?.environment)}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session Focus</h2>
                <p className="mt-2 text-sm text-slate-800">
                  {builderSessionLabel || "No saved builder focus available."}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team Context</h2>
                <p className="mt-2 text-sm text-slate-800">
                  {builderContext?.teamName || "No saved team context"}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</h2>
                <p className="mt-2 text-sm text-slate-800">{session.durationMin} minutes</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">SIC engine</h2>
                <p className="mt-2 text-sm text-slate-800">v{session.schemaVersion}</p>
              </article>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Coach Focus</h2>
                <p className="mt-4 text-sm leading-6 text-slate-700">
                  {builderContext?.objective || "No saved objective context for this session."}
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white/70 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Session Shape</h2>
                <p className="mt-4 text-sm leading-6 text-slate-700">
                  {builderSessionShapeSummary || "No saved session shape available."}
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white/70 p-5 lg:col-span-2">
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

              <article className="rounded-3xl border border-slate-200 bg-white/70 p-5 lg:col-span-2">
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
            </div>
          </>
        ) : (
          <>
            <div className={`grid gap-4 ${isQuickSession ? "sm:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created By</h2>
                <p className="mt-2 break-all text-sm text-slate-800">{createdByLabel}</p>

                {isQuickSession ? (
                  <QuickSessionTitleEditor
                    initialTitle={displayQuickSessionTitle}
                    saveTitleAction={saveQuickSessionTitleAction}
                  />
                ) : null}
              </article>

              {isQuickSession ? (
                <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</h2>
                  <p className="mt-2 text-sm text-slate-800">{session.durationMin} minutes</p>
                </article>
              ) : null}

              {isQuickSession ? (
                <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session Focus</h2>
                  <p className="mt-2 text-sm text-slate-800">
                    {quickSessionFocusSummary || displayQuickSessionTitle}
                  </p>
                </article>
              ) : null}

              {!isQuickSession ? (
                <article className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created At</h2>
                  <p className="mt-2 text-sm text-slate-800">{formatCreatedAt(session.createdAt)}</p>
                </article>
              ) : null}
            </div>

            {!isQuickSession ? (
              <>
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
              </>
            ) : (
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
            )}
          </>
        )}

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
    </div>
  );
}
