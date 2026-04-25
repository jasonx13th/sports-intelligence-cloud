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
      <legend className="sr-only">Build mode</legend>

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
          <span className="text-sm font-semibold text-slate-900">Full Session</span>
          <span className="text-xs leading-5 text-slate-600">
            Build a full practice plan with the current shared generation flow.
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
          <span className="text-sm font-semibold text-slate-900">Quick Drill</span>
          <span className="text-xs leading-5 text-slate-600">
            Use a lighter drill-first planning frame while staying on the same generation path.
          </span>
        </label>
      </div>
    </fieldset>
  );
}
