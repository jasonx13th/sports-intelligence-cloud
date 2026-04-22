import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CoachPageHeader } from "../../../../components/coach/CoachPageHeader";
import { getCurrentUser } from "../../../../lib/get-current-user";
import { parseQuickSessionPayload, QUICK_SESSION_COOKIE } from "../../../../lib/quick-session-payload";
import { saveGeneratedSessionAction } from "../session-actions";
import { QuickSessionReview } from "./quick-session-review";

function buildQuickEditHref(notes?: string) {
  const params = new URLSearchParams();

  if (notes) {
    params.set("prompt", notes);
  }

  return `/sessions/quick${params.size > 0 ? `?${params.toString()}` : ""}`;
}

export default async function QuickReviewPage() {
  await getCurrentUser();

  const quickSessionPayload = parseQuickSessionPayload(
    (await cookies()).get(QUICK_SESSION_COOKIE)?.value
  );

  if (!quickSessionPayload) {
    redirect("/home");
  }

  const editHref = buildQuickEditHref(quickSessionPayload.notes);

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Quick session"
        title="Quick session review"
        description="Review the generated quick session here, save it, or revise the prompt and run it again."
      />

      <QuickSessionReview
        pack={quickSessionPayload.pack}
        editHref={editHref}
        saveAction={saveGeneratedSessionAction}
      />
    </div>
  );
}
