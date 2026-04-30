type WorkspaceTeamOption = {
  id: string;
  label: string;
  sport: string;
  ageBand?: string;
  programType?: "travel" | "ost";
  playerCount?: number;
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
  return (
    <div className="grid gap-2 text-sm text-slate-700">
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
        Pick the team you are planning for so the builder starts from the right group.
      </span>
    </div>
  );
}
