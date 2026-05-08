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
      play: "Ball starts with the central blue player. Coach call triggers one run, one chase, and a carry through a gate.",
      score: "Finish through the marked gate, collect the ball, and rotate back in."
    };
  }

  if (role === "progression") {
    return {
      setup: "Start from a related directional game shape with recovery space and a counter target.",
      play: "A turnover or loose touch starts the harder decision: support run, pressure arrives, then counter.",
      score: "Score on the counter target. Reset from the coach or next group after the finish."
    };
  }

  return {
    setup: "Two teams start in a compact game area with ball, gates, and support lanes visible.",
    play: "First pass or bad touch starts the pressure and support movement toward the scoring target.",
    score: "Score through the target. Blue players reset shape while the coach restarts the next round."
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
      <circle cx={x} cy={y} r="4" fill="white" stroke="#0f172a" strokeWidth="1" />
      <circle cx={x} cy={y} r="1.1" fill="#0f172a" />
      <path
        d={`M${x - 2.4} ${y - 1.4} L${x - 3.4} ${y - 3} M${x + 2.4} ${y - 1.4} L${x + 3.4} ${y - 3} M${x - 2.4} ${y + 1.5} L${x - 3.5} ${y + 3} M${x + 2.4} ${y + 1.5} L${x + 3.5} ${y + 3}`}
        fill="none"
        stroke="#0f172a"
        strokeLinecap="round"
        strokeWidth="0.6"
      />
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
      strokeWidth="1.25"
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
  const markerGreen = `${markerId}-green`;
  const markerBlue = `${markerId}-blue`;
  const markerRed = `${markerId}-red`;
  const activationPlayers =
    phase.moment === "setup"
      ? {
          blue: [
            [38, 34],
            [56, 52],
            [38, 73],
          ],
          red: [
            [94, 35],
            [110, 58],
            [94, 77],
          ],
          ball: [56, 52],
        }
      : {
          blue: [
            [50, 28],
            [86, 40],
            [62, 76],
          ],
          red: [
            [91, 35],
            [118, 45],
            [98, 78],
          ],
          ball: [86, 40],
        };
  const mainPlayers =
    phase.moment === "setup"
      ? {
          blue: [
            [39, 31],
            [50, 53],
            [39, 76],
          ],
          red: [
            [111, 31],
            [121, 53],
            [111, 76],
          ],
          ball: [50, 53],
        }
      : phase.moment === "play"
        ? {
            blue: [
              [53, 31],
              [78, 48],
              [58, 78],
            ],
            red: [
              [92, 35],
              [106, 53],
              [104, 76],
            ],
            ball: [78, 48],
          }
        : {
            blue: [
              [76, 29],
              [112, 38],
              [78, 73],
            ],
            red: [
              [92, 45],
              [108, 61],
              [102, 82],
            ],
            ball: [112, 38],
          };
  const progressionPlayers =
    phase.moment === "setup"
      ? {
          blue: [
            [32, 30],
            [53, 56],
            [32, 80],
          ],
          red: [
            [106, 29],
            [123, 54],
            [106, 80],
          ],
          ball: [53, 56],
        }
      : phase.moment === "play"
        ? {
            blue: [
              [48, 34],
              [78, 50],
              [58, 82],
            ],
            red: [
              [88, 30],
              [108, 50],
              [96, 77],
            ],
            ball: [78, 50],
          }
        : {
            blue: [
              [82, 30],
              [118, 35],
              [88, 70],
            ],
            red: [
              [72, 48],
              [98, 58],
              [76, 84],
            ],
            ball: [118, 35],
          };

  return (
    <svg
      viewBox="0 0 160 105"
      role="img"
      aria-label={`${phase.label}: ${phase.note}`}
      className={["h-full w-full", isLarge ? "min-h-72" : "min-h-40"].join(" ")}
    >
      <defs>
        <marker id={markerGreen} markerWidth="6" markerHeight="6" refX="5.4" refY="3" orient="auto">
          <path d="M0,1 L5.5,3 L0,5 Z" fill="#0f766e" />
        </marker>
        <marker id={markerBlue} markerWidth="6" markerHeight="6" refX="5.4" refY="3" orient="auto">
          <path d="M0,1 L5.5,3 L0,5 Z" fill="#2563eb" />
        </marker>
        <marker id={markerRed} markerWidth="6" markerHeight="6" refX="5.4" refY="3" orient="auto">
          <path d="M0,1 L5.5,3 L0,5 Z" fill="#ef4444" />
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
          <Ball x={activationPlayers.ball[0]} y={activationPlayers.ball[1]} />
          {activationPlayers.blue.map(([x, y]) => (
            <Player key={`activation-blue-${x}-${y}`} x={x} y={y} team="blue" />
          ))}
          {activationPlayers.red.map(([x, y]) => (
            <Player key={`activation-red-${x}-${y}`} x={x} y={y} team="red" />
          ))}
          {phase.moment !== "setup" ? (
            <ActionArrow d="M43 34 C56 24, 72 24, 88 37" markerId={markerBlue} color="#2563eb" dashed />
          ) : null}
          {phase.moment === "play" || phase.moment === "score" ? (
            <>
              <ActionArrow d="M86 40 C101 34, 118 28, 135 24" markerId={markerGreen} />
              <ActionArrow d="M118 45 C124 40, 129 34, 133 29" markerId={markerRed} color="#ef4444" dashed />
            </>
          ) : null}
          <CueLabel x={24} y={18}>{phase.moment === "setup" ? "Start" : "Play"}</CueLabel>
          <CueLabel x={116} y={18}>Score</CueLabel>
        </>
      ) : null}

      {phase.role === "main" ? (
        <>
          <Ball x={mainPlayers.ball[0]} y={mainPlayers.ball[1]} />
          {mainPlayers.blue.map(([x, y]) => (
            <Player key={`main-blue-${x}-${y}`} x={x} y={y} team="blue" />
          ))}
          {mainPlayers.red.map(([x, y]) => (
            <Player key={`main-red-${x}-${y}`} x={x} y={y} team="red" />
          ))}
          {phase.moment !== "setup" ? (
            <ActionArrow d="M78 48 C88 45, 99 47, 108 53" markerId={markerGreen} />
          ) : null}
          {phase.moment === "play" || phase.moment === "score" ? (
            <>
              <ActionArrow d="M92 35 C80 38, 66 43, 54 50" markerId={markerRed} color="#ef4444" dashed />
              <ActionArrow d="M58 78 C75 84, 93 83, 108 76" markerId={markerBlue} color="#2563eb" dashed />
              <ActionArrow d="M112 38 C121 33, 129 27, 136 24" markerId={markerGreen} />
            </>
          ) : null}
          {phase.moment === "score" ? (
            <ActionArrow d="M112 38 C92 30, 75 31, 58 42" markerId={markerBlue} color="#2563eb" dashed />
          ) : null}
          <CueLabel x={67} y={40}>Play</CueLabel>
          {phase.moment === "play" ? <CueLabel x={72} y={90}>Press</CueLabel> : null}
          <CueLabel x={117} y={18}>{phase.moment === "score" ? "Reset" : "Score"}</CueLabel>
        </>
      ) : null}

      {phase.role === "progression" ? (
        <>
          <rect x="73" y="8" width="14" height="89" fill="#f1f5f9" stroke="#cbd5e1" strokeDasharray="3 3" />
          <Ball x={progressionPlayers.ball[0]} y={progressionPlayers.ball[1]} />
          {progressionPlayers.blue.map(([x, y]) => (
            <Player key={`progression-blue-${x}-${y}`} x={x} y={y} team="blue" />
          ))}
          {progressionPlayers.red.map(([x, y]) => (
            <Player key={`progression-red-${x}-${y}`} x={x} y={y} team="red" />
          ))}
          {phase.moment !== "setup" ? (
            <ActionArrow d="M88 30 C76 38, 67 45, 58 55" markerId={markerRed} color="#ef4444" dashed />
          ) : null}
          {phase.moment === "play" || phase.moment === "score" ? (
            <>
              <ActionArrow d="M78 50 C90 43, 101 38, 114 35" markerId={markerGreen} />
              <ActionArrow d="M114 35 C123 30, 131 26, 138 24" markerId={markerGreen} />
              <ActionArrow d="M58 82 C70 72, 83 64, 96 58" markerId={markerBlue} color="#2563eb" dashed />
            </>
          ) : null}
          {phase.moment === "score" ? (
            <ActionArrow d="M82 30 C94 39, 106 50, 118 63" markerId={markerBlue} color="#2563eb" dashed />
          ) : null}
          {phase.moment === "setup" ? <CueLabel x={58} y={34}>Start</CueLabel> : null}
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
          <path d="M2 5 H28" fill="none" stroke="#2563eb" strokeDasharray="3 3" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M27 2 L32 5 L27 8" fill="none" stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        Blue dashed arrow = support/recovery run
      </p>
      <p className="flex items-center gap-2">
        <svg viewBox="0 0 34 10" aria-hidden="true" className="h-3 w-10">
          <path d="M2 5 H28" fill="none" stroke="#ef4444" strokeDasharray="3 3" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M27 2 L32 5 L27 8" fill="none" stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        Red dashed arrow = pressure/chase
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
