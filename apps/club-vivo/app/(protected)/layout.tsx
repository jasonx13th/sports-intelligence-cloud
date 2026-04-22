import type { ReactNode } from "react";

import { CoachAppShell } from "../../components/coach/CoachAppShell";
import { getCurrentUserIdentity } from "../../lib/get-current-user-identity";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const coachIdentity = await getCurrentUserIdentity();

  return <CoachAppShell coachIdentity={coachIdentity}>{children}</CoachAppShell>;
}
