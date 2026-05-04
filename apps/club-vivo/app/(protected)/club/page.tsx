import Link from "next/link";
import { redirect } from "next/navigation";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { getCurrentUser } from "../../../lib/get-current-user";
import { isAdminLikeRole } from "../../../lib/roles";

const PORTAL_CARDS = [
  {
    title: "Coach Workspace",
    copy: "Included in your club workspace for creating sessions, quick activities, teams, and saved coaching work.",
    href: "/home",
    status: "Open"
  },
  {
    title: "Coaches and admins",
    copy:
      "Future verified and supported clubs can invite, approve, and manage staff access.",
    status: "Coming soon"
  },
  {
    title: "Club methodology",
    copy: "Manage the coaching model Session Builder should follow.",
    href: "/methodology",
    status: "Open"
  },
  {
    title: "Teams",
    copy: "Manage club teams and age groups.",
    href: "/teams",
    status: "Open"
  },
  {
    title: "Equipment",
    copy: "Manage shared equipment and training constraints.",
    href: "/equipment",
    status: "Open"
  },
  {
    title: "Saved sessions",
    copy: "Review saved coaching work across the club.",
    href: "/sessions",
    status: "Open"
  },
  {
    title: "Source settings",
    copy: "Choose how Club Vivo combines SIC knowledge and club methodology.",
    status: "Coming soon"
  },
  {
    title: "Verified setup / plans",
    copy: "Manage verified setup, support, and plan options when they are enabled.",
    status: "Later"
  }
];

export default async function ClubPortalPage() {
  const currentUser = await getCurrentUser();

  if (!isAdminLikeRole(currentUser.role)) {
    redirect("/home");
  }

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Club Portal"
        title="Club command center"
        description="Manage your club workspace, coaching tools, methodology, teams, equipment, and saved sessions from one place."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {PORTAL_CARDS.map((card) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {card.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{card.copy}</p>
            </>
          );

          if (card.href) {
            return (
              <Link
                key={card.title}
                href={card.href}
                prefetch={false}
                className="rounded-3xl border border-slate-200 bg-white/75 p-5 transition hover:border-teal-200 hover:bg-white"
              >
                {body}
              </Link>
            );
          }

          return (
            <article
              key={card.title}
              className="rounded-3xl border border-dashed border-slate-300 bg-white/55 p-5"
            >
              {body}
            </article>
          );
        })}
      </section>
    </div>
  );
}
