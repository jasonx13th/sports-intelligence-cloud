function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type SessionBuilderMode = "full_session" | "quick_drill";

type ModeSelectorProps = {
  value: SessionBuilderMode;
  onChange: (mode: SessionBuilderMode) => void;
};

export type { SessionBuilderMode };

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium text-slate-700">Build mode</legend>

      <div className="grid gap-3 sm:grid-cols-2">
        <label
          className={joinClassNames(
            "grid cursor-pointer gap-2 rounded-3xl border px-4 py-4 transition",
            value === "full_session"
              ? "border-teal-700 bg-teal-50/70"
              : "border-slate-200 bg-white/70 hover:bg-white"
          )}
        >
          <input
            type="radio"
            name="workspaceMode"
            value="full_session"
            checked={value === "full_session"}
            onChange={() => onChange("full_session")}
            className="sr-only"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Full Session</span>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-teal-700">
              Current
            </span>
          </div>
          <span className="text-xs leading-5 text-slate-600">
            The primary Week 21 option. Use the current shared session-generation flow to build a
            full practice plan.
          </span>
        </label>

        <label
          className={joinClassNames(
            "grid cursor-pointer gap-2 rounded-3xl border px-4 py-4 transition",
            value === "quick_drill"
              ? "border-teal-700 bg-teal-50/70"
              : "border-slate-200 bg-white/70 hover:bg-white"
          )}
        >
          <input
            type="radio"
            name="workspaceMode"
            value="quick_drill"
            checked={value === "quick_drill"}
            onChange={() => onChange("quick_drill")}
            className="sr-only"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Quick Drill</span>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
              Direction
            </span>
          </div>
          <span className="text-xs leading-5 text-slate-600">
            A lighter planning view for where the product is headed. It still runs through the same
            shared generation path for now.
          </span>
        </label>
      </div>
    </fieldset>
  );
}
