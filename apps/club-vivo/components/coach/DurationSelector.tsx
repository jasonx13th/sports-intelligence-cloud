type DurationSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  suggestedDurationMin?: number;
};

export function DurationSelector({
  value,
  onChange,
  suggestedDurationMin
}: DurationSelectorProps) {
  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="font-medium">Duration (minutes)</span>
      <input
        name="durationMin"
        type="number"
        min="5"
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
        required
      />
      <span className="text-xs leading-5 text-slate-500">
        {suggestedDurationMin
          ? `Current team context suggests ${suggestedDurationMin} minutes, but you can adjust it for today.`
          : "Set the total session time you want the shared generation flow to hit."}
      </span>
    </label>
  );
}
