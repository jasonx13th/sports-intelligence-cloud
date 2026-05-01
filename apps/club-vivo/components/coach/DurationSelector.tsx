import type { SessionBuilderMode } from "./ModeSelector";

type DurationSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  minimumDuration: number;
  mode: SessionBuilderMode;
};

export function DurationSelector({
  value,
  onChange,
  minimumDuration,
  mode
}: DurationSelectorProps) {
  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="font-medium">Time (minutes)</span>
      <input
        name="durationMin"
        type="number"
        min={String(minimumDuration)}
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
        required
      />
      <span className="text-xs leading-5 text-slate-500">
        {mode === "quick_drill"
          ? "Drill starts at 20 minutes in the UI, with a frontend minimum of 10. You can still adjust it."
          : "Full Session starts at 60 minutes in the UI, with a frontend minimum of 30. You can still adjust it."}
      </span>
    </label>
  );
}
