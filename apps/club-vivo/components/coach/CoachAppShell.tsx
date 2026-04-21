import Link from "next/link";
import type { ReactNode } from "react";

import { CoachPrimaryNav } from "./CoachPrimaryNav";

export function CoachAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-6 py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="club-vivo-shell rounded-[2rem] border px-6 py-5 backdrop-blur">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="club-vivo-badge inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide uppercase">
                  SIC Coach Workspace
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  One shared coach-facing app for session creation, library reuse, and lightweight
                  setup direction.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/logout"
                  className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Logout
                </Link>
              </div>
            </div>

            <CoachPrimaryNav />
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
