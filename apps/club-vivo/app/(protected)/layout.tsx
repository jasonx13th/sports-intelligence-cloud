import type { ReactNode } from "react";

import { CoachAppShell } from "../../components/coach/CoachAppShell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <CoachAppShell>{children}</CoachAppShell>;
}
