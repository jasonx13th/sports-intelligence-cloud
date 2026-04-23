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
      className="inline-flex rounded-full border border-transparent bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Preparing PDF..." : "Export PDF"}
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
    <div className="grid gap-2">
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
          Download a coach-ready PDF of this saved session.
        </p>
      )}
    </div>
  );
}
