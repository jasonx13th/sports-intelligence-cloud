"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const PRIMARY_ITEMS = [
  { href: "/sessions/new", label: "Generate" },
  { href: "/sessions", label: "Sessions" },
  { href: "/profile", label: "Profile" }
];

const SECONDARY_ITEMS = [{ href: "/dashboard", label: "Dashboard" }];

function isActive(pathname: string, href: string) {
  if (href === "/sessions") {
    return pathname === href || pathname.startsWith("/sessions/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CoachPrimaryNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <nav className="flex flex-wrap gap-2" aria-label="Primary">
        {PRIMARY_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={joinClassNames(
                "inline-flex rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-teal-700 text-white"
                  : "border border-slate-300 bg-white/70 text-slate-700 hover:bg-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav className="flex flex-wrap gap-2" aria-label="Secondary">
        {SECONDARY_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={joinClassNames(
                "inline-flex rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "border border-slate-300 bg-white text-slate-900"
                  : "border border-transparent bg-transparent text-slate-600 hover:bg-white/70"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
