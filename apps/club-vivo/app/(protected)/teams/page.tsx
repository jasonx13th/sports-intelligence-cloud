import { cookies } from "next/headers";

import { CoachPageHeader } from "../../../components/coach/CoachPageHeader";
import { TeamsSetupManager } from "../../../components/coach/TeamsSetupManager";
import {
  COACH_TEAM_HINTS_COOKIE,
  type CoachTeamSetup,
  getCoachTeams,
  serializeCoachTeamHints
} from "../../../lib/coach-team-hints";

export default async function TeamsPage() {
  const cookieStore = await cookies();
  const initialTeams = getCoachTeams(cookieStore.get(COACH_TEAM_HINTS_COOKIE)?.value);

  async function saveCoachTeamsAction(teams: CoachTeamSetup[]) {
    "use server";

    const serializedTeams = serializeCoachTeamHints(teams);
    const nextTeams = getCoachTeams(serializedTeams);

    const responseCookieStore = await cookies();
    responseCookieStore.set(COACH_TEAM_HINTS_COOKIE, serializedTeams, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax"
    });

    return {
      teams: nextTeams,
      message: "Teams saved in this browser."
    };
  }

  return (
    <div className="grid gap-6">
      <CoachPageHeader
        badge="Teams"
        title="Build your team"
        description="Set up the teams you coach so the workspace starts from a practical planning context."
      />

      <TeamsSetupManager initialTeams={initialTeams} saveTeamsAction={saveCoachTeamsAction} />
    </div>
  );
}
