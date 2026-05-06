"use client";

import { useEffect, useId, useState } from "react";

type DiagramActivity = {
  name: string;
  minutes: number;
  description?: string;
};

type DiagramKind =
  | "chase_gates"
  | "pressure_cover_gates"
  | "recover_delay_win"
  | "generic_small_sided"
  | "final_game_format";

type DiagramPhase = {
  label: string;
  note: string;
  action: "chase" | "pressure" | "recover" | "generic";
};

function normalizeText(value: string | undefined) {
  return String(value || "").toLowerCase();
}

function inferDiagramKind(activity: DiagramActivity | undefined, activityIndex: number, totalActivities = 1): DiagramKind {
  const text = normalizeText(`${activity?.name || ""} ${activity?.description || ""}`);
  const isFinalActivity =
    activityIndex === totalActivities - 1 ||
    /final game|tournament|competitive close|competitive final|gate battle/i.test(text);

  if (isFinalActivity) {
    return "final_game_format";
  }

  if (/duck|goose|chase|escape|reaction/.test(text) && /gate/.test(text)) {
    return "chase_gates";
  }

  if (/3v3|pressure|cover|defending gates|defender/.test(text) && /gate/.test(text)) {
    return "pressure_cover_gates";
  }

  if (/recover|delay|win it back|counter|transition|opposite gate/.test(text)) {
    return "recover_delay_win";
  }

  return "generic_small_sided";
}

function buildDiagramPhases(kind: DiagramKind, activityIndex: number): DiagramPhase[] {
  if (kind === "chase_gates") {
    return [
      {
        label: "Setup view",
        note: "Players start active in the area. The trigger creates a chase to a gate.",
        action: "chase"
      }
    ];
  }

  if (kind === "pressure_cover_gates") {
    return [
      {
        label: "Setup view",
        note: "Set two teams in a small area with gates as the scoring targets.",
        action: "generic"
      },
      {
        label: "Trigger view",
        note: "The first defender presses while teammates cover gates and passing lanes.",
        action: "pressure"
      }
    ];
  }

  if (kind === "recover_delay_win") {
    return [
      {
        label: "Setup view",
        note: "Start from the same small-sided shape so the progression feels connected.",
        action: "generic"
      },
      {
        label: "Recover / score",
        note: "After the first action, defenders recover and counter through a gate.",
        action: "recover"
      }
    ];
  }

  return [
    {
      label: activityIndex === 0 ? "Setup view" : "Setup view",
      note: "Use a clear field shape, short rotations, and visible scoring targets.",
      action: "generic"
    },
    ...(activityIndex === 1 || activityIndex === 2
      ? [
          {
            label: activityIndex === 1 ? "Trigger view" : "Recover / score",
            note: "Show the main action, pressure, and where players can score.",
            action: activityIndex === 1 ? ("pressure" as const) : ("recover" as const)
          }
        ]
      : [])
  ];
}

function Player({
  x,
  y,
  team,
  label
}: {
  x: number;
  y: number;
  team: "blue" | "red";
  label?: string;
}) {
  const fill = team === "blue" ? "#2563eb" : "#ef4444";

  return (
    <g>
      <circle cx={x} cy={y} r="4.5" fill={fill} stroke="white" strokeWidth="1.5" />
      {label ? (
        <text x={x} y={y - 7} textAnchor="middle" className="fill-slate-600 text-[7px] font-semibold">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Gate({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <circle cx="-6" cy="0" r="2.6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
      <circle cx="6" cy="0" r="2.6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.5" />
      <line x1="-4" y1="0" x2="4" y2="0" stroke="#ca8a04" strokeWidth="1.2" strokeDasharray="2 2" />
    </g>
  );
}

function ActionArrow({
  d,
  markerId,
  color = "#0f766e",
  dashed = false
}: {
  d: string;
  markerId: string;
  color?: string;
  dashed?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray={dashed ? "4 4" : undefined}
      markerEnd={`url(#${markerId})`}
    />
  );
}

function DiagramSvg({
  phase,
  markerId,
  size
}: {
  phase: DiagramPhase;
  markerId: string;
  size: "compact" | "large";
}) {
  const isLarge = size === "large";

  return (
    <svg
      viewBox="0 0 160 105"
      role="img"
      aria-label={`${phase.label}: ${phase.note}`}
      className={["h-full w-full", isLarge ? "min-h-72" : "min-h-40"].join(" ")}
    >
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#0f766e" />
        </marker>
      </defs>

      <rect x="6" y="6" width="148" height="93" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <line x1="80" y1="6" x2="80" y2="99" stroke="#e2e8f0" strokeDasharray="3 3" />
      <circle cx="80" cy="52.5" r="13" fill="none" stroke="#e2e8f0" />

      <Gate x={20} y={24} />
      <Gate x={20} y={82} />
      <Gate x={140} y={24} />
      <Gate x={140} y={82} />

      {phase.action === "chase" ? (
        <>
          <Player x={54} y={43} team="blue" label="Goose" />
          <Player x={67} y={53} team="red" label="Chase" />
          <Player x={45} y={65} team="blue" />
          <Player x={86} y={38} team="blue" />
          <Player x={92} y={66} team="red" />
          <ActionArrow d="M55 42 C72 30, 105 24, 134 24" markerId={markerId} />
          <ActionArrow d="M67 52 C80 43, 102 39, 123 31" markerId={markerId} color="#ef4444" dashed />
          <text x="118" y="18" className="fill-teal-700 text-[8px] font-bold">
            Score
          </text>
        </>
      ) : null}

      {phase.action === "pressure" ? (
        <>
          <Player x={48} y={33} team="blue" label="B1" />
          <Player x={48} y={53} team="blue" label="B2" />
          <Player x={48} y={73} team="blue" label="B3" />
          <Player x={104} y={33} team="red" label="R1" />
          <Player x={104} y={53} team="red" label="R2" />
          <Player x={104} y={73} team="red" label="R3" />
          <ActionArrow d="M104 53 C88 52, 70 51, 55 52" markerId={markerId} color="#ef4444" />
          <ActionArrow d="M48 33 C65 30, 83 29, 99 33" markerId={markerId} dashed />
          <ActionArrow d="M48 73 C65 77, 83 78, 99 73" markerId={markerId} dashed />
          <text x="64" y="47" className="fill-teal-700 text-[8px] font-bold">
            Press
          </text>
          <text x="71" y="86" className="fill-slate-600 text-[8px] font-semibold">
            Cover gates
          </text>
        </>
      ) : null}

      {phase.action === "recover" ? (
        <>
          <Player x={45} y={35} team="blue" label="D1" />
          <Player x={58} y={55} team="blue" label="D2" />
          <Player x={45} y={75} team="blue" label="D3" />
          <Player x={110} y={33} team="red" />
          <Player x={114} y={55} team="red" />
          <Player x={110} y={77} team="red" />
          <ActionArrow d="M45 35 C62 42, 72 49, 83 55" markerId={markerId} />
          <ActionArrow d="M58 55 C75 60, 97 68, 134 82" markerId={markerId} />
          <ActionArrow d="M45 75 C60 69, 76 64, 94 58" markerId={markerId} color="#ef4444" dashed />
          <text x="63" y="31" className="fill-teal-700 text-[8px] font-bold">
            Recover
          </text>
          <text x="118" y="74" className="fill-teal-700 text-[8px] font-bold">
            Counter
          </text>
        </>
      ) : null}

      {phase.action === "generic" ? (
        <>
          <Player x={46} y={34} team="blue" />
          <Player x={46} y={54} team="blue" />
          <Player x={46} y={74} team="blue" />
          <Player x={112} y={34} team="red" />
          <Player x={112} y={54} team="red" />
          <Player x={112} y={74} team="red" />
          <ActionArrow d="M50 54 C68 45, 91 45, 108 54" markerId={markerId} />
          <ActionArrow d="M80 53 C96 43, 116 32, 134 24" markerId={markerId} dashed />
          <text x="68" y="42" className="fill-teal-700 text-[8px] font-bold">
            Play
          </text>
          <text x="117" y="18" className="fill-teal-700 text-[8px] font-bold">
            Score
          </text>
        </>
      ) : null}
    </svg>
  );
}

function PhaseCard({
  phase,
  markerId,
  size
}: {
  phase: DiagramPhase;
  markerId: string;
  size: "compact" | "large";
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-3 py-2">
        <h6 className="text-xs font-semibold uppercase tracking-wide text-teal-800">{phase.label}</h6>
      </div>
      <div className={size === "large" ? "min-h-72" : "min-h-40"}>
        <DiagramSvg phase={phase} markerId={markerId} size={size} />
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-xs leading-5 text-slate-600">
        {phase.note}
      </p>
    </section>
  );
}

function FinalGameFormatCard({ activity }: { activity?: DiagramActivity }) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
        Final game format
      </p>
      <h5 className="mt-2 text-sm font-semibold text-slate-900">
        {activity?.name || "Competitive close"}
      </h5>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        Use the activity text to set teams, scoring, restarts, and the final constraint. Keep this
        block game-like and competitive.
      </p>
    </div>
  );
}

function ActivityDiagramCanvas({
  activity,
  activityIndex,
  totalActivities = 1,
  size = "compact"
}: {
  activity?: DiagramActivity;
  activityIndex: number;
  totalActivities?: number;
  size?: "compact" | "large";
}) {
  const id = useId().replace(/:/g, "");
  const kind = inferDiagramKind(activity, activityIndex, totalActivities);

  if (kind === "final_game_format") {
    return <FinalGameFormatCard activity={activity} />;
  }

  const phases = buildDiagramPhases(kind, activityIndex);

  return (
    <div className={["grid gap-3", phases.length > 1 ? "" : ""].join(" ")}>
      {phases.map((phase, index) => (
        <PhaseCard
          key={`${phase.label}-${index}`}
          phase={phase}
          markerId={`club-vivo-diagram-arrow-${id}-${index}`}
          size={size}
        />
      ))}
    </div>
  );
}

export function DiagramPlaceholder({
  activity,
  activityIndex = 0,
  totalActivities = 1
}: {
  activity?: DiagramActivity;
  activityIndex?: number;
  totalActivities?: number;
}) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const kind = inferDiagramKind(activity, activityIndex, totalActivities);
  const isFinalCard = kind === "final_game_format";
  const title = isFinalCard ? "Competitive close" : "Activity diagram";

  useEffect(() => {
    if (!isZoomOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsZoomOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen]);

  if (isFinalCard) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <FinalGameFormatCard activity={activity} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setIsZoomOpen(true)}
        className="group block w-full rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-teal-600"
        aria-label={`Open larger activity diagram for ${activity?.name || "this activity"}`}
      >
        <div className="transition group-hover:border-teal-300 group-hover:bg-teal-50/20">
          <ActivityDiagramCanvas
            activity={activity}
            activityIndex={activityIndex}
            totalActivities={totalActivities}
          />
        </div>
      </button>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Blue shows the coached team, red shows opposition, yellow shows gates or cones.
      </p>

      {isZoomOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6"
          role="presentation"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Larger activity diagram for ${activity?.name || "this activity"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                  {title}
                </p>
                <h5 className="mt-1 text-base font-semibold text-slate-900">
                  {activity?.name || `Activity ${activityIndex + 1}`}
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                aria-label="Close larger activity diagram"
              >
                &times;
              </button>
            </div>

            <ActivityDiagramCanvas
              activity={activity}
              activityIndex={activityIndex}
              totalActivities={totalActivities}
              size="large"
            />
            <p className="mt-4 text-xs leading-5 text-slate-600">
              Deterministic v1 diagram. Use it as a field setup guide, then follow the activity
              text for exact rules, scoring, progressions, and safety adjustments.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
