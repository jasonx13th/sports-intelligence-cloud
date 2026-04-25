import Link from "next/link";
import type { ReactNode } from "react";

import { CoachPrimaryNav } from "./CoachPrimaryNav";

export function CoachAppShell({
  children,
  coachIdentity
}: {
  children: ReactNode;
  coachIdentity: string | null;
}) {
  return (
    <div className="min-h-screen px-6 py-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="club-vivo-shell rounded-[2rem] border px-6 py-6 backdrop-blur sm:px-7">
          <div className="flex flex-col gap-4">
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

              <div className="flex flex-col items-start gap-1 text-sm lg:items-end">
                <p className="max-w-56 truncate font-medium text-slate-700" title={coachIdentity || undefined}>
                  {coachIdentity || "Signed-in coach"}
                </p>
                <Link
                  href="/logout"
                  className="font-medium text-slate-500 transition hover:text-slate-700 hover:underline"
                >
                  Log out
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-4">
              <CoachPrimaryNav />
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl pb-2">{children}</div>
      </div>
    </div>
  );
}
