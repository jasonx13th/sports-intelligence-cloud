import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { getCurrentUser } from "../../../lib/get-current-user";

export default async function EquipmentPage() {
  await getCurrentUser();

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Equipment"
        title="Equipment list"
        description="This area will later hold reusable coach equipment items that support session building and image-assisted intake."
      />

      <section className="club-vivo-shell rounded-[2rem] border p-8 backdrop-blur">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8">
          <h2 className="text-lg font-semibold text-slate-900">Placeholder only</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Coaches will later manage reusable equipment items here and use them during session
            building and image-assisted intake. This Week 21 slice only reserves the route and
            keeps the UI wording aligned to that future list.
          </p>
        </div>
      </section>
    </div>
  );
}
