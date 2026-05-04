import type { ReactNode } from "react";

import { CoachAppShell } from "../../components/coach/CoachAppShell";
import { getCurrentUser } from "../../lib/get-current-user";
import { getCurrentUserIdentity } from "../../lib/get-current-user-identity";
import { isAdminLikeRole } from "../../lib/roles";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();
  const coachIdentity = await getCurrentUserIdentity();

  return (
    <CoachAppShell coachIdentity={coachIdentity} showClubPortal={isAdminLikeRole(currentUser.role)}>
      {children}
    </CoachAppShell>
  );
}
