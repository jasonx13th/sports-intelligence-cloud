"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";

type QuickSessionTitleEditorState = {
  error?: string;
  message?: string;
  savedTitle?: string;
};

type SaveQuickSessionTitleAction = (
  state: QuickSessionTitleEditorState,
  formData: FormData
) => Promise<QuickSessionTitleEditorState>;

function normalizeInlineTitle(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized ? normalized.slice(0, 80).trim() : "";
}

export function QuickSessionTitleEditor({
  initialTitle,
  saveTitleAction
}: {
  initialTitle?: string;
  saveTitleAction: SaveQuickSessionTitleAction;
}) {
  const [title, setTitle] = useState(initialTitle || "");
  const [flashMessage, setFlashMessage] = useState<string>();
  const [state, formAction] = useActionState(saveTitleAction, {
    savedTitle: initialTitle
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (typeof state.savedTitle === "string") {
      setTitle(state.savedTitle);
    }
  }, [state.savedTitle]);

  useEffect(() => {
    if (!state.message || state.error) {
      return;
    }

    setFlashMessage(state.message);

    const timeout = window.setTimeout(() => {
      setFlashMessage(undefined);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [state.error, state.message]);

  const savedTitle = state.savedTitle || "";
  const normalizedDraftTitle = normalizeInlineTitle(title);
  const normalizedSavedTitle = normalizeInlineTitle(savedTitle);
  const isDirty = normalizedDraftTitle !== normalizedSavedTitle;

  function submitIfNeeded() {
    if (!isDirty) {
      return;
    }

    if (!normalizedDraftTitle) {
      setTitle(savedTitle);
      return;
    }

    formRef.current?.requestSubmit();
  }

  return (
    <article className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
      <form ref={formRef} action={formAction} className="grid gap-3">
        <label className="grid gap-2 text-sm text-slate-700">
          <span className="font-medium">Activity title</span>
          <input
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => submitIfNeeded()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitIfNeeded();
                return;
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setTitle(savedTitle);
                setFlashMessage(undefined);
              }
            }}
            maxLength={80}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
            placeholder="Add a title for this quick activity"
          />
        </label>

        {state.error && !isDirty ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        {flashMessage ? (
          <p className="text-sm font-medium text-emerald-700">
            {flashMessage}
          </p>
        ) : null}

        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </article>
  );
}
