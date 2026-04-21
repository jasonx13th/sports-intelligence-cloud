"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const PRIMARY_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/sessions/new", label: "Session Builder" },
  { href: "/profile", label: "Profile" },
  { href: "/equipment", label: "Equipment" },
  { href: "/sessions", label: "Sessions" }
];

function isActive(pathname: string, href: string) {
  if (href === "/sessions/new") {
    return pathname === href || pathname.startsWith("/sessions/new/");
  }

  if (href === "/sessions") {
    return (
      pathname === href ||
      (pathname.startsWith("/sessions/") &&
        pathname !== "/sessions/new" &&
        !pathname.startsWith("/sessions/new/") &&
        pathname !== "/sessions/coach-lite-preview" &&
        !pathname.startsWith("/sessions/coach-lite-preview/"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CoachPrimaryNav() {
  const pathname = usePathname();

  return (
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
  );
}
