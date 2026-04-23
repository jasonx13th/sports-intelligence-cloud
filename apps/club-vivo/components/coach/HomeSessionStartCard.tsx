"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState } from "react";

import type { QuickSessionActionState } from "../../app/(protected)/sessions/quick-session-actions";

type HomeSessionStartCardProps = {
  createQuickSessionAction: (
    state: QuickSessionActionState,
    formData: FormData
  ) => Promise<QuickSessionActionState>;
  initialPrompt?: string;
};

function CreateSessionButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Creating..." : "Create session"}
    </button>
  );
}

export function HomeSessionStartCard({
  createQuickSessionAction,
  initialPrompt = ""
}: HomeSessionStartCardProps) {
  const [notes, setNotes] = useState(initialPrompt);
  const [state, formAction] = useActionState(createQuickSessionAction, {});

  return (
    <section className="club-vivo-shell rounded-[2rem] border p-6 backdrop-blur sm:p-8">
      <form action={formAction} className="grid gap-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Quick session</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Drop in one prompt and create sessions immediately. Use Session Builder when you want
            the more detailed setup path.
          </p>
        </div>

        <label className="grid gap-2 text-sm text-slate-700">
          <span className="font-medium">Brainstorm</span>
          <textarea
            name="prompt"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={6}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
            placeholder="Today we need a sharp possession session, 14 players, tight space, and a strong finishing block at the end."
            required
          />
          <span className="text-xs leading-5 text-slate-500">
            Include the coaching focus and, if needed, a duration like <code>45 minutes</code>.
            The prompt maps into the existing shared generation path, then opens the dedicated
            quick-session review flow.
          </span>
        </label>

        {state.error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="flex justify-start">
          <CreateSessionButton />
        </div>
      </form>
    </section>
  );
}
