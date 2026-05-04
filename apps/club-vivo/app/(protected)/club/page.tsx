import Link from "next/link";
import { redirect } from "next/navigation";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { getCurrentUser } from "../../../lib/get-current-user";
import { isAdminLikeRole } from "../../../lib/roles";

const PORTAL_CARDS = [
  {
    title: "Coach Workspace",
    copy: "Create sessions, quick activities, teams, and saved coaching work.",
    href: "/home",
    status: "Open"
  },
  {
    title: "Coaches and admins",
    copy:
      "Invite, approve, and manage staff access. Future club invites will let approved coaches join the right club workspace.",
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
    title: "Billing",
    copy: "Manage plan and subscription when billing is enabled.",
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
        description="Manage your club setup, coach access, methodology, teams, equipment, and saved sessions from one place."
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
