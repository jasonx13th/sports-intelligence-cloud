"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type ExportActionState = {
  error?: string;
};

type ExportAction = (
  state: ExportActionState,
  formData: FormData
) => Promise<ExportActionState>;

function ExportButtonLabel() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex items-center rounded-full border border-transparent bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      aria-label="Export this saved session as a PDF"
    >
      {pending ? "Preparing PDF..." : "Export coach PDF"}
    </button>
  );
}

export function SessionExportButton({
  sessionId,
  exportAction
}: {
  sessionId: string;
  exportAction: ExportAction;
}) {
  const [state, formAction] = useActionState(exportAction, {});

  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white/80 p-3">
      <form action={formAction}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <ExportButtonLabel />
      </form>

      {state.error ? (
        <p className="max-w-xs rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : (
        <p className="max-w-xs text-sm leading-6 text-slate-600">
          Download the field-plan handout for this saved session.
        </p>
      )}
    </div>
  );
}
