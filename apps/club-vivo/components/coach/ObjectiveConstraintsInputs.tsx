"use client";

import { useState, useTransition } from "react";

type ObjectiveConstraintsInputsProps = {
  constraints: string;
  onConstraintsChange: (value: string) => void;
  equipment: string;
  onEquipmentChange: (value: string) => void;
  equipmentOptions: string[];
  onSaveEquipmentOption: (
    value: string
  ) => Promise<{ items: string[]; error?: string; message?: string }>;
};

function normalizeCustomEquipment(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 48).trim();
}

function getEquipmentDescription(value: string) {
  switch (value.toLowerCase()) {
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
  constraints,
  onConstraintsChange,
  equipment,
  onEquipmentChange,
  equipmentOptions,
  onSaveEquipmentOption
}: ObjectiveConstraintsInputsProps) {
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [equipmentDraft, setEquipmentDraft] = useState("");
  const [equipmentMessage, setEquipmentMessage] = useState<string>();
  const [equipmentError, setEquipmentError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const selectedItems = equipment
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const selectedSet = new Set(selectedItems);

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

  function handleAddEquipment() {
    const normalizedDraft = normalizeCustomEquipment(equipmentDraft);

    if (!normalizedDraft) {
      setEquipmentError("Add one equipment item before saving.");
      return;
    }

    if (selectedItems.some((item) => item.toLowerCase() === normalizedDraft.toLowerCase())) {
      setEquipmentError("That equipment item is already in this session.");
      return;
    }

    setEquipmentError(undefined);
    setEquipmentMessage(undefined);

    startTransition(async () => {
      const result = await onSaveEquipmentOption(normalizedDraft);

      if (result.error) {
        setEquipmentError(result.error);
        return;
      }

      updateEquipment([...selectedItems, normalizedDraft]);
      setEquipmentDraft("");
      setIsAddingEquipment(false);
      setEquipmentMessage("Added to this session and Essentials in this browser.");
    });
  }

  return (
    <>
      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Equipment</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Choose what this session will use. New items also update Essentials in this browser.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddingEquipment(true);
              setEquipmentError(undefined);
            }}
            className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Add equipment
          </button>
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

        {isAddingEquipment ? (
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Add equipment for this session</span>
              <input
                type="text"
                value={equipmentDraft}
                onChange={(event) => setEquipmentDraft(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                placeholder="Speed hurdles"
              />
            </label>

            <button
              type="button"
              onClick={handleAddEquipment}
              disabled={isPending}
              className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEquipmentDraft("");
                setIsAddingEquipment(false);
                setEquipmentError(undefined);
              }}
              className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        ) : null}

        {equipmentError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {equipmentError}
          </p>
        ) : null}

        {equipmentMessage ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {equipmentMessage}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {equipmentOptions.map((option) => {
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

        <p className="text-xs leading-5 text-slate-500">
          Session equipment stays session-specific, while new items also update your browser-local
          Essentials list for this coach workspace.
        </p>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
        <label className="grid gap-2 text-sm text-slate-700">
          <span className="font-medium">Brainstorming</span>
          <textarea
            name="constraints"
            value={constraints}
            onChange={(event) => onConstraintsChange(event.target.value)}
            rows={6}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
            placeholder="Session ideas, coaching notes, weather or space limits, and extra details for today"
          />
          <span className="text-xs leading-5 text-slate-500">
            Use this for session ideas, coaching notes, weather or space constraints, and any extra
            details that matter today.
          </span>
        </label>
      </section>
    </>
  );
}
