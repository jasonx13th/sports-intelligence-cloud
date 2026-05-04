import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import {
  type MethodologyScope,
  MethodologyApiError,
  getMethodology,
  publishMethodology,
  saveMethodology
} from "../../../lib/methodology-api";
import { getCurrentUser } from "../../../lib/get-current-user";
import { MethodologyWorkspace } from "./methodology-workspace";

type LoadMethodologyResult = {
  methodology: Awaited<ReturnType<typeof getMethodology>> | null;
  error?: string;
};

type SaveMethodologyResult = {
  methodology?: Awaited<ReturnType<typeof saveMethodology>>;
  error?: string;
  message?: string;
};

type PublishMethodologyResult = {
  methodology?: Awaited<ReturnType<typeof publishMethodology>>;
  error?: string;
  message?: string;
};

function formatMethodologyError(error: unknown, fallbackMessage: string) {
  if (error instanceof MethodologyApiError) {
    if (error.code === "methodology.not_found") {
      return "No methodology record exists for this scope yet.";
    }

    if (error.code === "methodology.admin_required") {
      return "Admin access is required for that methodology action.";
    }

    if (error.code === "platform.bad_request") {
      return "That methodology request was invalid. Refresh and try again.";
    }

    return error.message || fallbackMessage;
  }

  return fallbackMessage;
}

export default async function MethodologyPage() {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser.role === "admin";

  async function loadMethodologyAction(scope: MethodologyScope): Promise<LoadMethodologyResult> {
    "use server";

    try {
      return {
        methodology: await getMethodology(scope)
      };
    } catch (error) {
      if (error instanceof MethodologyApiError && error.code === "methodology.not_found") {
        return { methodology: null };
      }

      return {
        methodology: null,
        error: formatMethodologyError(error, "We couldn't load that methodology scope.")
      };
    }
  }

  async function saveMethodologyAction(
    scope: MethodologyScope,
    input: { title: string; content: string }
  ): Promise<SaveMethodologyResult> {
    "use server";

    try {
      return {
        methodology: await saveMethodology(scope, input),
        message: "Draft saved."
      };
    } catch (error) {
      return {
        error: formatMethodologyError(error, "We couldn't save that methodology draft.")
      };
    }
  }

  async function publishMethodologyAction(
    scope: MethodologyScope
  ): Promise<PublishMethodologyResult> {
    "use server";

    try {
      return {
        methodology: await publishMethodology(scope),
        message: "Methodology published."
      };
    } catch (error) {
      return {
        error: formatMethodologyError(error, "We couldn't publish that methodology yet.")
      };
    }
  }

  const initialMethodology = await loadMethodologyAction("shared");

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Methodology"
        title="Club Methodology"
        description="This is the Club Vivo methodology and source summary area. Individual coaches can read the SIC brain summary and the personal or club source context currently shaping generation. Club admins and delegated admin coaches can maintain club methodology when that capability is available. Future source modes should support the SIC knowledge bank, club methodology only, or SIC plus club methodology. SIC bank knowledge can improve session generation, but it is not exposed to clubs or coaches as raw content."
      />

      <MethodologyWorkspace
        initialScope="shared"
        initialMethodology={initialMethodology.methodology}
        isAdmin={isAdmin}
        loadMethodologyAction={loadMethodologyAction}
        saveMethodologyAction={saveMethodologyAction}
        publishMethodologyAction={publishMethodologyAction}
      />
    </div>
  );
}
