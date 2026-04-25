"use client";

import { useEffect, useState, useTransition } from "react";

type SaveEquipmentResult = {
  items: string[];
  error?: string;
  message?: string;
};

type SaveEquipmentAction = (items: string[]) => Promise<SaveEquipmentResult>;

export function EquipmentEssentialsManager({
  initialItems,
  saveEquipmentAction
}: {
  initialItems: string[];
  saveEquipmentAction: SaveEquipmentAction;
}) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setMessage(undefined), 2200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function handleAddStart() {
    setIsAdding(true);
    setEditingItem(null);
    setDraft("");
    setError(undefined);
    setMessage(undefined);
  }

  function handleCancel() {
    setIsAdding(false);
    setEditingItem(null);
    setDraft("");
    setEditDraft("");
    setError(undefined);
  }

  function handleEditStart(item: string) {
    setEditingItem(item);
    setEditDraft(item);
    setIsAdding(false);
    setDraft("");
    setError(undefined);
    setMessage(undefined);
  }

  function handleEditCancel() {
    setEditingItem(null);
    setEditDraft("");
    setError(undefined);
  }

  function submitDraft() {
    const normalizedDraft = draft.replace(/\s+/g, " ").trim();

    if (!normalizedDraft) {
      setError("Add one equipment item before saving.");
      return;
    }

    const alreadyExists = items.some(
      (item) => item.toLowerCase() === normalizedDraft.toLowerCase()
    );

    if (alreadyExists) {
      setError("That equipment item is already in your essentials list.");
      return;
    }

    const nextItems = [...items, normalizedDraft];

    startTransition(async () => {
      const result = await saveEquipmentAction(nextItems);

      if (result.error) {
        setError(result.error);
        return;
      }

      setItems(result.items);
      setDraft("");
      setIsAdding(false);
      setError(undefined);
      setMessage(result.message);
    });
  }

  function submitEdit() {
    if (!editingItem) {
      return;
    }

    const normalizedDraft = editDraft.replace(/\s+/g, " ").trim();

    if (!normalizedDraft) {
      setError("Add one equipment item before saving.");
      return;
    }

    const alreadyExists = items.some(
      (item) => item !== editingItem && item.toLowerCase() === normalizedDraft.toLowerCase()
    );

    if (alreadyExists) {
      setError("That equipment item is already in your essentials list.");
      return;
    }

    const nextItems = items.map((item) => (item === editingItem ? normalizedDraft : item));

    startTransition(async () => {
      const result = await saveEquipmentAction(nextItems);

      if (result.error) {
        setError(result.error);
        return;
      }

      setItems(result.items);
      setEditingItem(null);
      setEditDraft("");
      setError(undefined);
      setMessage(result.message);
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Essentials in this slice stay in this browser for now, so coaches can shape useful
          session-building context without claiming backend persistence yet.
        </p>

        <button
          type="button"
          onClick={handleAddStart}
          className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800"
        >
          Add equipment
        </button>
      </div>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {isAdding ? (
        <section className="club-vivo-shell rounded-3xl border p-5 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add equipment</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add extra essentials that matter for how you plan and prompt sessions.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="grid gap-2 text-sm text-slate-700">
              <span className="font-medium">Equipment item</span>
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Speed hurdles"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submitDraft}
              disabled={isPending}
              className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save equipment"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <section className="club-vivo-shell rounded-[2rem] border p-6 backdrop-blur">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Start from the standard kit most coaches reach for, then add or rename the extras your
          team uses most often.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) =>
            editingItem === item ? (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4"
              >
                <label className="grid gap-2 text-sm text-slate-700">
                  <span className="font-medium">Edit equipment</span>
                  <input
                    type="text"
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
                  />
                </label>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitEdit}
                    disabled={isPending}
                    className="inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => handleEditStart(item)}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                {item}
              </button>
            )
          )}
        </div>
      </section>
    </div>
  );
}
