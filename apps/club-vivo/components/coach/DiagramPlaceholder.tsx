"use client";

import { useEffect, useId, useState } from "react";

type DiagramActivity = {
  name: string;
  minutes: number;
  description?: string;
};

type DiagramKind =
  | "activation_chase_or_reaction"
  | "transition_to_attack"
  | "chase_gates"
  | "pressure_cover_gates"
  | "recover_delay_win"
  | "generic_small_sided"
  | "final_game_format";

type DiagramPhase = {
  label: string;
  note: string;
  role: "activation" | "main" | "progression";
  moment: "setup" | "play" | "score";
};

function normalizeText(value: string | undefined) {
  return String(value || "").toLowerCase();
}

function inferDiagramKind(activity: DiagramActivity | undefined, activityIndex: number, totalActivities = 1): DiagramKind {
  const text = normalizeText(`${activity?.name || ""} ${activity?.description || ""}`);
  const isFinalActivity =
    (totalActivities > 1 && activityIndex === totalActivities - 1) ||
    /final game|tournament|competitive close|competitive final|gate battle/i.test(text);

  if (isFinalActivity) {
    return "final_game_format";
  }

  if (
    /recover|regain|win it back|winning the ball|transition|counter|outlet|first pass|escape pressure after regain|own box/.test(
      text
    )
  ) {
    return /delay|recover|win it back/.test(text) ? "recover_delay_win" : "transition_to_attack";
  }

  if (/3v3|pressure|cover|defending gates|defender/.test(text) && /gate/.test(text)) {
    return "pressure_cover_gates";
  }

  if (/duck|goose|chase|escape|reaction/.test(text) && /gate/.test(text)) {
    return activityIndex === 0 ? "activation_chase_or_reaction" : "chase_gates";
  }

  if (activityIndex === 0) {
    return "activation_chase_or_reaction";
  }

  if (activityIndex === 2) {
    return "recover_delay_win";
  }

  return "generic_small_sided";
}

function inferStoryRole(kind: DiagramKind, activityIndex: number): DiagramPhase["role"] {
  if (activityIndex === 0) {
    return "activation";
  }

  if (activityIndex >= 2 || kind === "recover_delay_win") {
    return "progression";
  }

  return "main";
}

function buildStoryNotes(role: DiagramPhase["role"]): Record<DiagramPhase["moment"], string> {
  if (role === "activation") {
    return {
      setup: "Players start loose inside a small grid with the ball central and gates visible.",
      play: "Coach call starts the reaction. Players move quickly, carry the ball, and choose a gate.",
      score: "Finish through the marked gate, collect the ball, and rotate back in."
    };
  }

  if (role === "progression") {
    return {
      setup: "Start from a related directional game shape with recovery space and a counter target.",
      play: "A turnover or loose touch starts the harder decision: recover, play the first pass, and counter.",
      score: "Score on the counter target, then reset from the coach or next group."
    };
  }

  return {
    setup: "Two teams start in a compact game area with ball, gates, and support lanes visible.",
    play: "First pass or bad touch starts the pressure and support movement toward the scoring target.",
    score: "Score through the target, then restart quickly for the next round."
  };
}

function buildDiagramPhases(kind: DiagramKind, activityIndex: number): DiagramPhase[] {
  const role = inferStoryRole(kind, activityIndex);
  const notes = buildStoryNotes(role);

  if (role === "activation") {
    return [
      { label: "Setup", note: notes.setup, role, moment: "setup" },
      { label: "Action", note: notes.play, role, moment: "play" },
    ];
  }

  return [
    { label: "Setup", note: notes.setup, role, moment: "setup" },
    { label: "How to play", note: notes.play, role, moment: "play" },
    { label: "How to score / reset", note: notes.score, role, moment: "score" },
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

function Ball({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="3.2" fill="white" stroke="#0f172a" strokeWidth="1" />
      <path d={`M${x - 2} ${y} H${x + 2} M${x} ${y - 2} V${y + 2}`} stroke="#0f172a" strokeWidth="0.6" />
    </g>
  );
}

function CueLabel({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} className="fill-slate-700 text-[8px] font-bold">
      {children}
    </text>
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
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray={dashed ? "3 3" : undefined}
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
          <path d="M0,1 L7,4 L0,7 Z" fill="#0f766e" />
        </marker>
      </defs>

      <rect x="6" y="6" width="148" height="93" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <line x1="80" y1="6" x2="80" y2="99" stroke="#e2e8f0" strokeDasharray="3 3" />
      <circle cx="80" cy="52.5" r="13" fill="none" stroke="#e2e8f0" />

      <Gate x={20} y={24} />
      <Gate x={20} y={82} />
      <Gate x={140} y={24} />
      <Gate x={140} y={82} />

      {phase.role === "activation" ? (
        <>
          <Ball x={56} y={52} />
          <Player x={38} y={34} team="blue" />
          <Player x={56} y={52} team="blue" />
          <Player x={38} y={73} team="blue" />
          <Player x={94} y={35} team="red" />
          <Player x={110} y={58} team="red" />
          <Player x={94} y={77} team="red" />
          {phase.moment !== "setup" ? (
            <ActionArrow d="M40 34 C57 24, 78 25, 97 35" markerId={markerId} dashed />
          ) : null}
          {phase.moment === "play" || phase.moment === "score" ? (
            <>
              <ActionArrow d="M58 52 C80 43, 104 37, 134 24" markerId={markerId} />
              <ActionArrow d="M110 58 C119 47, 124 37, 132 29" markerId={markerId} color="#ef4444" dashed />
            </>
          ) : null}
          <CueLabel x={24} y={18}>{phase.moment === "setup" ? "Start" : "Play"}</CueLabel>
          <CueLabel x={116} y={18}>Score</CueLabel>
        </>
      ) : null}

      {phase.role === "main" ? (
        <>
          <Ball x={57} y={53} />
          <Player x={39} y={31} team="blue" />
          <Player x={50} y={53} team="blue" />
          <Player x={39} y={76} team="blue" />
          <Player x={111} y={31} team="red" />
          <Player x={121} y={53} team="red" />
          <Player x={111} y={76} team="red" />
          {phase.moment !== "setup" ? (
            <ActionArrow d="M58 53 C74 45, 91 45, 108 53" markerId={markerId} />
          ) : null}
          {phase.moment === "play" || phase.moment === "score" ? (
            <>
              <ActionArrow d="M111 31 C92 35, 73 42, 53 51" markerId={markerId} color="#ef4444" dashed />
              <ActionArrow d="M39 76 C62 83, 86 83, 111 76" markerId={markerId} dashed />
              <ActionArrow d="M108 53 C118 44, 126 33, 136 24" markerId={markerId} />
            </>
          ) : null}
          {phase.moment === "score" ? (
            <ActionArrow d="M136 24 C119 17, 90 17, 62 28" markerId={markerId} color="#64748b" dashed />
          ) : null}
          <CueLabel x={67} y={40}>Play</CueLabel>
          {phase.moment === "play" ? <CueLabel x={72} y={90}>Press</CueLabel> : null}
          <CueLabel x={117} y={18}>{phase.moment === "score" ? "Reset" : "Score"}</CueLabel>
        </>
      ) : null}

      {phase.role === "progression" ? (
        <>
          <rect x="73" y="8" width="14" height="89" fill="#f1f5f9" stroke="#cbd5e1" strokeDasharray="3 3" />
          <Ball x={53} y={56} />
          <Player x={32} y={30} team="blue" />
          <Player x={53} y={56} team="blue" />
          <Player x={32} y={80} team="blue" />
          <Player x={106} y={29} team="red" />
          <Player x={123} y={54} team="red" />
          <Player x={106} y={80} team="red" />
          {phase.moment !== "setup" ? (
            <ActionArrow d="M106 29 C88 38, 70 49, 55 56" markerId={markerId} color="#ef4444" dashed />
          ) : null}
          {phase.moment === "play" || phase.moment === "score" ? (
            <>
              <ActionArrow d="M55 56 C70 50, 85 44, 99 36" markerId={markerId} />
              <ActionArrow d="M99 36 C112 30, 124 26, 136 24" markerId={markerId} />
              <ActionArrow d="M32 80 C54 70, 75 63, 94 55" markerId={markerId} dashed />
            </>
          ) : null}
          {phase.moment === "score" ? (
            <ActionArrow d="M136 24 C116 88, 65 92, 32 80" markerId={markerId} color="#64748b" dashed />
          ) : null}
          <CueLabel x={58} y={34}>Recover</CueLabel>
          {phase.moment !== "setup" ? <CueLabel x={100} y={18}>Counter</CueLabel> : null}
          <CueLabel x={118} y={75}>{phase.moment === "score" ? "Reset" : "Score"}</CueLabel>
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

function DiagramLegend() {
  return (
    <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-500 sm:grid-cols-2">
      <p className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
        Blue = coached team
      </p>
      <p className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        Red = opposition
      </p>
      <p className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 ring-1 ring-yellow-600" />
        Yellow = cones/goals/equipment
      </p>
      <p className="flex items-center gap-2">
        <span className="inline-flex items-center gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 ring-1 ring-yellow-600" />
          <span className="h-px w-3 bg-yellow-700" />
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 ring-1 ring-yellow-600" />
        </span>
        Yellow o--o = cone gate
      </p>
      <p className="flex items-center gap-2">
        <svg viewBox="0 0 34 10" aria-hidden="true" className="h-3 w-10">
          <path d="M2 5 H28" fill="none" stroke="#0f766e" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M27 2 L32 5 L27 8" fill="none" stroke="#0f766e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        Solid arrow = player/ball action
      </p>
      <p className="flex items-center gap-2">
        <svg viewBox="0 0 34 10" aria-hidden="true" className="h-3 w-10">
          <path d="M2 5 H28" fill="none" stroke="#ef4444" strokeDasharray="3 3" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M27 2 L32 5 L27 8" fill="none" stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        Dashed arrow = pressure/recovery cue
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
    <div className="grid gap-3">
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsZoomOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsZoomOpen(true);
          }
        }}
        className="block w-full rounded-xl text-left outline-none transition hover:bg-teal-50/20 focus-visible:ring-2 focus-visible:ring-teal-600"
        aria-label={`Open larger activity diagram for ${activity?.name || "this activity"}`}
      >
        <ActivityDiagramCanvas
          activity={activity}
          activityIndex={activityIndex}
          totalActivities={totalActivities}
        />
      </div>
      <DiagramLegend />

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
            <DiagramLegend />
          </div>
        </div>
      ) : null}
    </div>
  );
}
