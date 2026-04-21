import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";

const PROFILE_SECTIONS = [
  {
    title: "Teams",
    description:
      "Team setup will carry program type, age context, duration defaults, and methodology direction."
  },
  {
    title: "Environment",
    description:
      "Environment defaults belong here later so coaches do not have to restate common space context every time."
  },
  {
    title: "Equipment",
    description:
      "Equipment defaults belong here later so repeat session creation can start from practical reality."
  }
];

export default function ProfilePage() {
  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Profile"
        title="Setup and defaults"
        description={
          <>
            Week 21 keeps this area lightweight. It is a forward-looking setup hub for teams,
            environment, and equipment without claiming that durable profile persistence already
            exists.
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {PROFILE_SECTIONS.map((section) => (
          <article
            key={section.title}
            className="club-vivo-shell rounded-3xl border p-5 backdrop-blur"
          >
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{section.description}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
              Placeholder only in this slice
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
