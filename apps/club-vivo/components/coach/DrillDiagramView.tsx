import type {
  DrillDiagramAnnotation,
  DrillDiagramCircleZone,
  DrillDiagramConnection,
  DrillDiagramConnectionStyle,
  DrillDiagramField,
  DrillDiagramObject,
  DrillDiagramRectangleZone,
  DrillDiagramSpecV1,
  DrillDiagramZone
} from "../../lib/types/drill-diagram-spec";

type DrillDiagramViewProps = {
  diagram: DrillDiagramSpecV1;
  className?: string;
};

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 800;

type Point = {
  x: number;
  y: number;
};

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getCanvasSize(diagram: DrillDiagramSpecV1) {
  return {
    width: diagram.canvas?.width ?? DEFAULT_CANVAS_WIDTH,
    height: diagram.canvas?.height ?? DEFAULT_CANVAS_HEIGHT
  };
}

function getBackgroundColor(diagram: DrillDiagramSpecV1) {
  const background = diagram.canvas?.background;
  const surfaceType = diagram.field?.surfaceType;

  if (background === "court" || surfaceType === "court") {
    return "#f3e3bf";
  }

  if (background === "plain") {
    return "#ffffff";
  }

  return "#d7f0d2";
}

function getFieldInset(diagram: DrillDiagramSpecV1) {
  const { width, height } = getCanvasSize(diagram);

  return {
    x: width * 0.04,
    y: height * 0.04,
    width: width * 0.92,
    height: height * 0.92
  };
}

function getFieldBorderRadius(diagram: DrillDiagramSpecV1) {
  const surfaceType = diagram.field?.surfaceType;
  return surfaceType === "court" ? 24 : 8;
}

function getObjectColor(object: DrillDiagramObject) {
  if (object.type === "cone") {
    return object.color ?? "#f97316";
  }

  if (object.type === "player") {
    switch (object.team) {
      case "red":
        return "#dc2626";
      case "blue":
        return "#2563eb";
      case "yellow":
        return "#ca8a04";
      case "black":
        return "#0f172a";
      default:
        return "#475569";
    }
  }

  if (object.type === "ball") {
    return "#111827";
  }

  if (object.type === "goal" || object.type === "mini_goal") {
    return "#475569";
  }

  return "#0f766e";
}

function renderPitchStripes(diagram: DrillDiagramSpecV1) {
  if (!diagram.renderHints?.showFieldStripes) {
    return null;
  }

  const inset = getFieldInset(diagram);
  const stripeWidth = inset.width / 6;

  return Array.from({ length: 6 }, (_, index) => (
    <rect
      key={`stripe-${index}`}
      x={inset.x + index * stripeWidth}
      y={inset.y}
      width={stripeWidth}
      height={inset.height}
      fill={index % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.02)"}
    />
  ));
}

function renderZone(zone: DrillDiagramZone) {
  if (zone.shape === "rectangle") {
    return renderRectangleZone(zone);
  }

  return renderCircleZone(zone);
}

function renderRectangleZone(zone: DrillDiagramRectangleZone) {
  return (
    <g key={zone.zoneId}>
      <rect
        x={zone.x}
        y={zone.y}
        width={zone.width}
        height={zone.height}
        rx={10}
        fill="rgba(15, 118, 110, 0.08)"
        stroke="#0f766e"
        strokeWidth={2}
        strokeDasharray={zone.dashed ? "8 8" : undefined}
      />
      {zone.label ? (
        <text
          x={zone.x + zone.width / 2}
          y={zone.y - 12}
          textAnchor="middle"
          fontSize={20}
          fontWeight={600}
          fill="#0f172a"
        >
          {zone.label}
        </text>
      ) : null}
    </g>
  );
}

function renderCircleZone(zone: DrillDiagramCircleZone) {
  return (
    <g key={zone.zoneId}>
      <circle
        cx={zone.x}
        cy={zone.y}
        r={zone.radius}
        fill="rgba(15, 118, 110, 0.08)"
        stroke="#0f766e"
        strokeWidth={2}
        strokeDasharray={zone.dashed ? "8 8" : undefined}
      />
      {zone.label ? (
        <text
          x={zone.x}
          y={zone.y - zone.radius - 12}
          textAnchor="middle"
          fontSize={20}
          fontWeight={600}
          fill="#0f172a"
        >
          {zone.label}
        </text>
      ) : null}
    </g>
  );
}

function renderObject(object: DrillDiagramObject) {
  const color = getObjectColor(object);

  switch (object.type) {
    case "cone":
      return (
        <g key={object.objectId}>
          <path
            d={`M ${object.x} ${object.y - 16} L ${object.x - 14} ${object.y + 12} L ${object.x + 14} ${object.y + 12} Z`}
            fill={color}
            stroke="#7c2d12"
            strokeWidth={2}
          />
          {object.label ? renderObjectLabel(object.x, object.y + 28, object.label) : null}
        </g>
      );
    case "ball":
      return (
        <g key={object.objectId}>
          <circle cx={object.x} cy={object.y} r={10} fill="#ffffff" stroke={color} strokeWidth={3} />
          {object.label ? renderObjectLabel(object.x, object.y + 26, object.label) : null}
        </g>
      );
    case "player":
      return (
        <g key={object.objectId}>
          <circle cx={object.x} cy={object.y} r={18} fill={color} stroke="#ffffff" strokeWidth={3} />
          {object.hasBall ? (
            <circle
              cx={object.x + 18}
              cy={object.y - 18}
              r={6}
              fill="#ffffff"
              stroke="#111827"
              strokeWidth={2}
            />
          ) : null}
          {object.label ? (
            <text
              x={object.x}
              y={object.y + 6}
              textAnchor="middle"
              fontSize={14}
              fontWeight={700}
              fill="#ffffff"
            >
              {object.label}
            </text>
          ) : null}
        </g>
      );
    case "goal":
    case "mini_goal":
      return (
        <g key={object.objectId}>
          <rect
            x={object.x - (object.width ?? 96) / 2}
            y={object.y - (object.height ?? 28) / 2}
            width={object.width ?? 96}
            height={object.height ?? 28}
            fill="rgba(255,255,255,0.75)"
            stroke={color}
            strokeWidth={3}
          />
          {object.label ? renderObjectLabel(object.x, object.y + (object.height ?? 28), object.label) : null}
        </g>
      );
    case "gate":
      return (
        <g key={object.objectId}>
          <line
            x1={object.x - (object.width ?? 60) / 2}
            y1={object.y - 14}
            x2={object.x - (object.width ?? 60) / 2}
            y2={object.y + 14}
            stroke={color}
            strokeWidth={4}
          />
          <line
            x1={object.x + (object.width ?? 60) / 2}
            y1={object.y - 14}
            x2={object.x + (object.width ?? 60) / 2}
            y2={object.y + 14}
            stroke={color}
            strokeWidth={4}
          />
          {object.label ? renderObjectLabel(object.x, object.y + 28, object.label) : null}
        </g>
      );
    default:
      return (
        <g key={object.objectId}>
          <rect
            x={object.x - 12}
            y={object.y - 12}
            width={24}
            height={24}
            rx={6}
            fill={color}
            stroke="#ffffff"
            strokeWidth={2}
          />
          {object.label ? renderObjectLabel(object.x, object.y + 28, object.label) : null}
        </g>
      );
  }
}

function renderObjectLabel(x: number, y: number, label: string) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={16} fontWeight={600} fill="#0f172a">
      {label}
    </text>
  );
}

function getZoneCenter(zone: DrillDiagramZone): Point {
  if (zone.shape === "rectangle") {
    return {
      x: zone.x + zone.width / 2,
      y: zone.y + zone.height / 2
    };
  }

  return { x: zone.x, y: zone.y };
}

function getReferencePoint(
  ref: string,
  objects: DrillDiagramObject[],
  zones: DrillDiagramZone[] | undefined
): Point | null {
  const object = objects.find((candidate) => candidate.objectId === ref);
  if (object) {
    return { x: object.x, y: object.y };
  }

  const zone = zones?.find((candidate) => candidate.zoneId === ref);
  if (zone) {
    return getZoneCenter(zone);
  }

  return null;
}

function getConnectionStroke(style: DrillDiagramConnectionStyle | undefined) {
  switch (style) {
    case "dashed-arrow":
      return { dashArray: "10 8", strokeLinecap: "round" as const };
    case "zigzag-arrow":
      return { dashArray: undefined, strokeLinecap: "round" as const };
    case "double-arrow":
      return { dashArray: "2 6", strokeLinecap: "round" as const };
    default:
      return { dashArray: undefined, strokeLinecap: "round" as const };
  }
}

function buildCurvedPath(from: Point, to: Point, curve: number | undefined) {
  const offset = curve ?? 40;
  const controlX = (from.x + to.x) / 2;
  const controlY = (from.y + to.y) / 2 - offset;

  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

function buildZigZagPath(from: Point, to: Point) {
  const stepCount = 5;
  const points: Point[] = [];

  for (let index = 0; index <= stepCount; index += 1) {
    const ratio = index / stepCount;
    const x = from.x + (to.x - from.x) * ratio;
    const y = from.y + (to.y - from.y) * ratio;
    const offset = index === 0 || index === stepCount ? 0 : index % 2 === 0 ? -10 : 10;
    points.push({ x, y: y + offset });
  }

  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function renderConnection(
  connection: DrillDiagramConnection,
  field: DrillDiagramField | undefined,
  objects: DrillDiagramObject[]
) {
  const from = getReferencePoint(connection.fromRef, objects, field?.zones);
  const to = getReferencePoint(connection.toRef, objects, field?.zones);

  if (!from || !to) {
    return null;
  }

  const strokeColor = connection.type === "pass" ? "#2563eb" : "#0f172a";
  const { dashArray, strokeLinecap } = getConnectionStroke(connection.style);
  const labelX = (from.x + to.x) / 2;
  const labelY = (from.y + to.y) / 2 - 10;

  let shape: React.ReactNode;

  if (connection.style === "curved-arrow") {
    shape = (
      <path
        d={buildCurvedPath(from, to, connection.curve)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={4}
        strokeDasharray={dashArray}
        strokeLinecap={strokeLinecap}
        markerEnd="url(#diagram-arrowhead)"
      />
    );
  } else if (connection.style === "zigzag-arrow") {
    shape = (
      <polyline
        points={buildZigZagPath(from, to)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={4}
        strokeLinecap={strokeLinecap}
        strokeLinejoin="round"
        markerEnd="url(#diagram-arrowhead)"
      />
    );
  } else {
    shape = (
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={strokeColor}
        strokeWidth={4}
        strokeDasharray={dashArray}
        strokeLinecap={strokeLinecap}
        markerEnd="url(#diagram-arrowhead)"
      />
    );
  }

  return (
    <g key={connection.connectionId}>
      {shape}
      {connection.label ? (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fontSize={16}
          fontWeight={700}
          fill={strokeColor}
        >
          {connection.label}
        </text>
      ) : null}
    </g>
  );
}

function renderAnnotation(annotation: DrillDiagramAnnotation) {
  if (annotation.type === "badge" || annotation.type === "number") {
    return (
      <g key={annotation.annotationId}>
        <circle cx={annotation.x} cy={annotation.y} r={16} fill="#f8fafc" stroke="#334155" strokeWidth={2} />
        <text
          x={annotation.x}
          y={annotation.y + 5}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fill="#0f172a"
        >
          {annotation.text}
        </text>
      </g>
    );
  }

  return (
    <g key={annotation.annotationId}>
      <text x={annotation.x} y={annotation.y} fontSize={18} fontWeight={500} fill="#0f172a">
        {annotation.text}
      </text>
    </g>
  );
}

function renderLegend(diagram: DrillDiagramSpecV1) {
  if (!diagram.legend?.show || diagram.legend.items.length === 0) {
    return null;
  }

  const { width } = getCanvasSize(diagram);
  const x = width - 250;
  const y = 40;

  return (
    <g>
      <rect x={x} y={y} width={210} height={diagram.legend.items.length * 26 + 20} rx={12} fill="rgba(255,255,255,0.88)" stroke="#cbd5e1" />
      {diagram.legend.items.map((item, index) => (
        <g key={`${item.symbol}-${item.meaning}`}>
          <rect x={x + 14} y={y + 12 + index * 26 - 8} width={12} height={12} rx={3} fill="#0f766e" />
          <text x={x + 36} y={y + 16 + index * 26} fontSize={14} fill="#334155">
            {item.meaning}
          </text>
        </g>
      ))}
    </g>
  );
}

export function DrillDiagramView({ diagram, className }: DrillDiagramViewProps) {
  const { width, height } = getCanvasSize(diagram);
  const backgroundColor = getBackgroundColor(diagram);
  const inset = getFieldInset(diagram);
  const title = diagram.title || "Drill diagram";

  return (
    <figure className={joinClassNames("rounded-3xl border border-slate-200 bg-white/80 p-4", className)}>
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{diagram.diagramType}</p>
        </div>
        <p className="text-xs text-slate-500">{diagram.specVersion}</p>
      </figcaption>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
        className="h-auto w-full rounded-2xl border border-slate-200 bg-slate-50"
      >
        <defs>
          <marker
            id="diagram-arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f172a" />
          </marker>
        </defs>

        <rect x={0} y={0} width={width} height={height} fill="#f8fafc" />
        <rect
          x={inset.x}
          y={inset.y}
          width={inset.width}
          height={inset.height}
          rx={getFieldBorderRadius(diagram)}
          fill={backgroundColor}
          stroke="#94a3b8"
          strokeWidth={3}
        />

        {renderPitchStripes(diagram)}
        {diagram.field?.zones?.map((zone) => renderZone(zone))}
        {diagram.connections?.map((connection) =>
          renderConnection(connection, diagram.field, diagram.objects)
        )}
        {diagram.objects.map((object) => renderObject(object))}
        {diagram.annotations?.map((annotation) => renderAnnotation(annotation))}
        {renderLegend(diagram)}
      </svg>
    </figure>
  );
}
