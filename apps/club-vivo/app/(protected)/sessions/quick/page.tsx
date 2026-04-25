import { CoachPageHeader } from "../../../../components/coach/CoachPageHeader";
import { HomeSessionStartCard } from "../../../../components/coach/HomeSessionStartCard";
import { getCurrentUser } from "../../../../lib/get-current-user";
import { createQuickSessionAction } from "../quick-session-actions";

function parseSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function QuickSessionPage({
  searchParams
}: {
  searchParams?: Promise<{ prompt?: string | string[] }>;
}) {
  await getCurrentUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialPrompt = parseSearchParam(resolvedSearchParams?.prompt)?.trim() || "";

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Quick session"
        title="Quick session"
        description="Use one prompt to generate a fast session draft, then review it before saving or revising the quick prompt."
      />

      <HomeSessionStartCard
        createQuickSessionAction={createQuickSessionAction}
        initialPrompt={initialPrompt}
      />
    </div>
  );
}
