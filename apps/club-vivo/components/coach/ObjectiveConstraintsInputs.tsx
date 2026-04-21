type ObjectiveConstraintsInputsProps = {
  objective: string;
  onObjectiveChange: (value: string) => void;
  constraints: string;
  onConstraintsChange: (value: string) => void;
  equipment: string;
  onEquipmentChange: (value: string) => void;
};

export function ObjectiveConstraintsInputs({
  objective,
  onObjectiveChange,
  constraints,
  onConstraintsChange,
  equipment,
  onEquipmentChange
}: ObjectiveConstraintsInputsProps) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm text-slate-700">
        <span className="font-medium">Objective</span>
        <input
          name="theme"
          value={objective}
          onChange={(event) => onObjectiveChange(event.target.value)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
          placeholder="Pressing in midfield, first touch under pressure, finishing from cutbacks"
          required
        />
        <span className="text-xs leading-5 text-slate-500">
          Objective still submits through the existing <code>theme</code> field to keep backend
          contracts unchanged.
        </span>
      </label>

      <label className="grid gap-2 text-sm text-slate-700">
        <span className="font-medium">Today's constraints</span>
        <textarea
          value={constraints}
          onChange={(event) => onConstraintsChange(event.target.value)}
          rows={3}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
          placeholder="Shared field, limited balls, wet surface, mixed attendance"
        />
        <span className="text-xs leading-5 text-slate-500">
          This stays as frontend-only workspace context in the first slice. It does not add a new
          backend generation field yet.
        </span>
      </label>

      <label className="grid gap-2 text-sm text-slate-700">
        <span className="font-medium">Equipment</span>
        <input
          name="equipment"
          value={equipment}
          onChange={(event) => onEquipmentChange(event.target.value)}
          placeholder="cones, balls"
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
        />
      </label>
    </div>
  );
}
