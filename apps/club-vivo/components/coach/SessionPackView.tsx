import { DrillDiagramView } from "./DrillDiagramView";

import type {
  SessionPackActivity,
  SessionPackEquipment,
  SessionPackOrganization,
  SessionPackSpace,
  SessionPackV2
} from "../../lib/types/session-pack";

type SessionPackViewProps = {
  pack: SessionPackV2;
  className?: string;
};

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function renderStructuredFallback(value: unknown) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-700">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function renderEquipment(equipment: SessionPackEquipment) {
  if (Array.isArray(equipment)) {
    if (equipment.length === 0) {
      return <p className="text-sm text-slate-500">No equipment listed.</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {equipment.map((item) => (
          <span
            key={item}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  return renderStructuredFallback(equipment);
}

function formatSpace(space: SessionPackSpace | undefined) {
  if (!space) {
    return "Not specified";
  }

  const parts = [
    space.surfaceType,
    space.areaType,
    space.sizeLabel,
    typeof space.width === "number" && typeof space.length === "number"
      ? `${space.width} x ${space.length}${space.units ? ` ${space.units}` : ""}`
      : undefined
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Not specified";
}

function renderStringList(items: string[] | undefined, emptyLabel: string) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="grid gap-2 text-sm leading-6 text-slate-700">
      {items.map((item) => (
        <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          {item}
        </li>
      ))}
    </ul>
  );
}

function renderOrganization(organization: SessionPackOrganization | undefined) {
  if (!organization) {
    return <p className="text-sm text-slate-500">No organization notes.</p>;
  }

  if (typeof organization === "string") {
    return <p className="text-sm leading-6 text-slate-700">{organization}</p>;
  }

  return renderStructuredFallback(organization);
}

function renderActivity(activity: SessionPackActivity) {
  return (
    <article
      key={activity.activityId}
      className="rounded-3xl border border-slate-200 bg-white/75 p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {activity.phase ?? "activity"}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{activity.name}</h3>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
          {activity.minutes} min
        </div>
      </div>

      {activity.objective ? (
        <p className="mt-4 text-sm leading-6 text-slate-700">{activity.objective}</p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Setup</h4>
          <p className="mt-3 text-sm leading-6 text-slate-700">{activity.setup}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Instructions
          </h4>
          <p className="mt-3 text-sm leading-6 text-slate-700">{activity.instructions}</p>
        </section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Coaching Points
          </h4>
          <div className="mt-3">
            {renderStringList(activity.coachingPoints, "No coaching points listed.")}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Organization
          </h4>
          <div className="mt-3">{renderOrganization(activity.organization)}</div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Activity Equipment
          </h4>
          <div className="mt-3">{renderEquipment(activity.equipment)}</div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Space</h4>
          <p className="mt-3 text-sm leading-6 text-slate-700">{formatSpace(activity.space)}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Constraints
          </h4>
          <div className="mt-3">
            {renderStringList(activity.constraints, "No constraints listed.")}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Progressions
          </h4>
          <div className="mt-3">
            {renderStringList(activity.progressions, "No progressions listed.")}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Regressions
          </h4>
          <div className="mt-3">
            {renderStringList(activity.regressions, "No regressions listed.")}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Common Mistakes
          </h4>
          <div className="mt-3">
            {renderStringList(activity.commonMistakes, "No common mistakes listed.")}
          </div>
        </section>
      </div>

      {activity.diagrams && activity.diagrams.length > 0 ? (
        <section className="mt-5">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Drill Diagrams
          </h4>
          <div className="mt-3 grid gap-4">
            {activity.diagrams.map((diagram) => (
              <DrillDiagramView
                key={diagram.diagramId}
                diagram={diagram.spec}
                className="bg-slate-50/70"
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

export function SessionPackView({ pack, className }: SessionPackViewProps) {
  return (
    <section className={joinClassNames("grid gap-6", className)}>
      <article className="rounded-[2rem] border border-slate-200 bg-white/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="club-vivo-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              {pack.specVersion}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {pack.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{pack.objective}</p>
          </div>

          <div className="grid gap-2 text-sm text-slate-600 sm:text-right">
            <p>
              <span className="font-medium text-slate-900">{pack.sport}</span> · {pack.ageGroup}
            </p>
            <p>{pack.durationMinutes} minutes</p>
            <p>{pack.level ?? "Level not specified"}</p>
            <p>{pack.intensity ?? "Intensity not specified"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Session Equipment
            </h3>
            <div className="mt-3">{renderEquipment(pack.equipment)}</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Space</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">{formatSpace(pack.space)}</p>
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Assumptions
            </h3>
            <div className="mt-3">
              {renderStringList(pack.assumptions, "No assumptions listed.")}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Safety Notes
            </h3>
            <div className="mt-3">
              {renderStringList(pack.safetyNotes, "No safety notes listed.")}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Success Criteria
            </h3>
            <div className="mt-3">
              {renderStringList(pack.successCriteria, "No success criteria listed.")}
            </div>
          </section>
        </div>

        {pack.cooldown ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Cooldown
            </h3>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
              <p>{pack.cooldown.minutes ? `${pack.cooldown.minutes} minutes` : "Minutes not specified"}</p>
              {pack.cooldown.instructions ? <p>{pack.cooldown.instructions}</p> : null}
              {pack.cooldown.notes ? <p>{pack.cooldown.notes}</p> : null}
            </div>
          </section>
        ) : null}
      </article>

      <div className="grid gap-5">
        {pack.activities.map((activity) => renderActivity(activity))}
      </div>
    </section>
  );
}
