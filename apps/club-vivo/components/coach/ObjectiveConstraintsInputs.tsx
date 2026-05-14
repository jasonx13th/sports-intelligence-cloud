"use client";

type ObjectiveConstraintsInputsProps = {
  equipment: string;
  onEquipmentChange: (value: string) => void;
  equipmentOptions: string[];
};

function getEquipmentDescription(value: string) {
  switch (value.toLowerCase()) {
    case "essentials / builder choice":
      return "Let the builder use your saved equipment profile and suggest the best setup.";
    case "balls":
      return "Keep the session built around ball work and repetitions.";
    case "tall cones":
      return "Mark channels, gates, and longer movement patterns.";
    case "flat cones":
      return "Lay out grids, stations, and clean field lines.";
    case "mini disc cones":
      return "Add quick markers for tighter detail work.";
    case "agility ladder":
      return "Include footwork detail in the session set-up.";
    case "agility poles":
      return "Shape movement cues, turns, and scanning lines.";
    case "pugg goals":
      return "Plan for small-goal finishing or directional play.";
    case "pinnies":
      return "Split teams or create overloads and transitions.";
    default:
      return "Use this item when it matters for today's session set-up.";
  }
}

export function ObjectiveConstraintsInputs({
  equipment,
  onEquipmentChange,
  equipmentOptions
}: ObjectiveConstraintsInputsProps) {
  const selectedItems = equipment
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const selectedSet = new Set(selectedItems);
  const visibleEquipmentOptions = [
    "Essentials / Builder choice",
    ...equipmentOptions.filter(
      (option) => option.toLowerCase() !== "essentials / builder choice"
    )
  ];

  function updateEquipment(nextItems: string[]) {
    onEquipmentChange(nextItems.join(", "));
  }

  function toggleEquipment(value: string) {
    if (selectedSet.has(value)) {
      updateEquipment(selectedItems.filter((item) => item !== value));
      return;
    }

    updateEquipment([...selectedItems, value]);
  }

  function removeEquipment(value: string) {
    updateEquipment(selectedItems.filter((item) => item !== value));
  }

  return (
    <>
      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Equipment</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Choose Essentials / Builder choice, or select specific equipment for this session.
            </p>
          </div>
        </div>

        <input type="hidden" name="equipment" value={equipment} />

        {selectedItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => removeEquipment(item)}
                className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900 transition hover:border-teal-300 hover:bg-teal-100"
              >
                <span>{item}</span>
                <span aria-hidden="true">x</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No equipment selected for this session yet.</p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {visibleEquipmentOptions.map((option) => {
            const selected = selectedSet.has(option);

            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleEquipment(option)}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  selected
                    ? "border-teal-700 bg-teal-50 text-teal-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                ].join(" ")}
                aria-pressed={selected}
              >
                <span className="block text-sm font-medium">{option}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {getEquipmentDescription(option)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

    </>
  );
}
