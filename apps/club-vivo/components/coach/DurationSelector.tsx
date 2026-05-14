type DurationSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  minimumDuration: number;
  maximumDuration: number;
};

export function DurationSelector({
  value,
  onChange,
  minimumDuration,
  maximumDuration
}: DurationSelectorProps) {
  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="font-medium">Time (minutes)</span>
      <input
        name="durationMin"
        type="number"
        min={String(minimumDuration)}
        max={String(maximumDuration)}
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
        required
      />
      <span className="text-xs leading-5 text-slate-500">
        Choose how long you have today. Full sessions run from 45 to 120 minutes. Drills run from
        15 to 25 minutes.
      </span>
    </label>
  );
}
