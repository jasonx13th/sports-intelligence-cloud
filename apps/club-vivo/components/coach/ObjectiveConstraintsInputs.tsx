type ObjectiveConstraintsInputsProps = {
  objective: string;
  onObjectiveChange: (value: string) => void;
  constraints: string;
  onConstraintsChange: (value: string) => void;
  equipment: string;
  onEquipmentChange: (value: string) => void;
};

const EQUIPMENT_OPTIONS = [
  {
    value: "Standard equipment",
    description: "Use the default coach setup for a normal field session."
  },
  {
    value: "Balls",
    description: "Session balls ready for technical and finishing work."
  },
  {
    value: "Cones",
    description: "Markers for grids, gates, channels, and stations."
  },
  {
    value: "Pinnies",
    description: "Bibs for teams, overloads, and transition work."
  },
  {
    value: "Mini goals",
    description: "Portable goals for small-sided play and finishing."
  },
  {
    value: "Agility poles",
    description: "Extra setup pieces for movement and spacing cues."
  }
] as const;

export function ObjectiveConstraintsInputs({
  objective,
  onObjectiveChange,
  constraints,
  onConstraintsChange,
  equipment,
  onEquipmentChange
}: ObjectiveConstraintsInputsProps) {
  const selectedItems = equipment
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const selectedSet = new Set(selectedItems);
  const knownValues = new Set<string>(EQUIPMENT_OPTIONS.map((option) => option.value));
  const customItems = selectedItems.filter((item) => !knownValues.has(item));

  function toggleEquipment(value: string) {
    const next = new Set(selectedSet);

    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }

    const orderedItems = [
      ...EQUIPMENT_OPTIONS.map((option) => option.value).filter((option) => next.has(option)),
      ...customItems
    ];

    onEquipmentChange(orderedItems.join(", "));
  }

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
          Keep the session goal short and specific so the generated plan is easier to use.
        </span>
      </label>

      <label className="grid gap-2 text-sm text-slate-700">
        <span className="font-medium">Brainstorming / details / constraints</span>
        <textarea
          value={constraints}
          onChange={(event) => onConstraintsChange(event.target.value)}
          rows={6}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
          placeholder="Attendance notes, field limits, ideas to explore, practical constraints for today"
        />
        <span className="text-xs leading-5 text-slate-500">
          Capture today&apos;s practical limits here while the shared backend contract stays
          unchanged.
        </span>
      </label>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Equipment</h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Choose Standard equipment or select the setup pieces you want to plan around. These
            placeholder choices will later connect to the Equipment list.
          </p>
        </div>

        <input type="hidden" name="equipment" value={equipment} />

        <div className="grid gap-3 md:grid-cols-2">
          {EQUIPMENT_OPTIONS.map((option) => {
            const selected = selectedSet.has(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleEquipment(option.value)}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  selected
                    ? "border-teal-700 bg-teal-50 text-teal-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                ].join(" ")}
                aria-pressed={selected}
              >
                <span className="block text-sm font-medium">{option.value}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
