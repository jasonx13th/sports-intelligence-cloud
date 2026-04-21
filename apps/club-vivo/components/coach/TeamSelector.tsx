type WorkspaceTeamOption = {
  id: string;
  label: string;
  sport: string;
  ageBand?: string;
  programType?: "travel" | "ost";
  methodologyLabel?: string;
  defaultDurationMin?: number;
};

type TeamSelectorProps = {
  teams: WorkspaceTeamOption[];
  value: string;
  onChange: (teamId: string) => void;
};

export type { WorkspaceTeamOption };

export function TeamSelector({ teams, value, onChange }: TeamSelectorProps) {
  const selectedTeam = teams.find((team) => team.id === value);

  return (
    <div className="grid gap-2 text-sm text-slate-700">
      <span className="font-medium">Team</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-700"
        disabled={teams.length === 0}
      >
        {teams.length > 0 ? (
          teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.label}
            </option>
          ))
        ) : (
          <option value="">No team context available yet</option>
        )}
      </select>

      <span className="text-xs leading-5 text-slate-500">
        Team context is a lightweight Week 21 workspace aid for now. It helps frame defaults
        without changing the shared generation contract.
      </span>

      {selectedTeam ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTeam.programType ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {selectedTeam.programType === "travel" ? "Travel" : "OST"}
            </span>
          ) : null}

          {selectedTeam.ageBand ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {selectedTeam.ageBand}
            </span>
          ) : null}

          {selectedTeam.methodologyLabel ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {selectedTeam.methodologyLabel}
            </span>
          ) : null}

          {selectedTeam.defaultDurationMin ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {selectedTeam.defaultDurationMin} min default
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
