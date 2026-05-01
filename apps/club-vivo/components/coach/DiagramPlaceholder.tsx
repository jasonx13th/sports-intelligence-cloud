"use client";

import { useEffect, useState } from "react";

function DiagramCanvas({ size = "compact" }: { size?: "compact" | "large" }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white",
        size === "large" ? "min-h-72" : "min-h-44"
      ].join(" ")}
    >
      <div className="absolute inset-4 rounded-lg border border-slate-100" />
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] border-l border-slate-100" />
      <div className="absolute left-6 top-1/2 h-2 w-2 rounded-full bg-blue-500" />
      <div className="absolute left-1/3 top-1/3 h-2 w-2 rounded-full bg-blue-500" />
      <div className="absolute right-8 top-1/3 h-2 w-2 rounded-full bg-red-500" />
      <div className="absolute bottom-8 left-1/4 h-2 w-2 rounded-full bg-yellow-400" />
      <div className="absolute bottom-8 right-1/3 h-2 w-2 rounded-full bg-yellow-400" />
      <div className="absolute left-[30%] top-[42%] h-px w-24 rotate-[-12deg] bg-slate-400" />
      <div className="absolute left-[52%] top-[32%] h-px w-16 rotate-[24deg] border-t border-dotted border-slate-400" />
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
        <div className="rounded-full border border-slate-200 bg-white/95 px-4 py-2 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Diagram coming next
          </p>
        </div>
      </div>
    </div>
  );
}

export function DiagramPlaceholder() {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    if (!isZoomOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsZoomOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setIsZoomOpen(true)}
        className="group block w-full rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-teal-600"
        aria-label="Open larger diagram preview"
      >
        <div className="transition group-hover:border-teal-300 group-hover:bg-teal-50/20">
          <DiagramCanvas />
        </div>
      </button>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Click to enlarge this future diagram preview.
      </p>

      {isZoomOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6"
          role="presentation"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Larger diagram preview"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h5 className="text-base font-semibold text-slate-900">Diagram coming next</h5>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                aria-label="Close larger diagram preview"
              >
                &times;
              </button>
            </div>

            <DiagramCanvas size="large" />
            <p className="mt-4 text-xs leading-5 text-slate-600">
              Full diagrams will use the Club Vivo diagram standard in a later version. Read arrows
              for movement, blue as the team being coached, red as opposition, and yellow as cones or
              equipment.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
