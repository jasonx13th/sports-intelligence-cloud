export type DrillDiagramSpecVersion = "drill-diagram-spec/v1";

// Coach Lite v1 stays soccer-first even though the draft spec notes future reuse.
export type DrillDiagramSport = "soccer";

export type DrillDiagramType =
  | "setup"
  | "sequence"
  | "progression"
  | "regression"
  | "condition";

export type DrillDiagramCanvasUnit = "px";

export type DrillDiagramCanvasBackground = "pitch" | "court" | "plain";

export interface DrillDiagramCanvas {
  width?: number;
  height?: number;
  unit?: DrillDiagramCanvasUnit;
  background?: DrillDiagramCanvasBackground;
}

export type DrillDiagramFieldSurfaceType = "pitch" | "court" | "pool" | "generic";

export type DrillDiagramFieldView = "full" | "half" | "third" | "custom";

export type DrillDiagramFieldOrientation = "vertical" | "horizontal";

export interface DrillDiagramZoneBase {
  zoneId: string;
  x: number;
  y: number;
  label?: string;
  dashed?: boolean;
}

export interface DrillDiagramRectangleZone extends DrillDiagramZoneBase {
  shape: "rectangle";
  width: number;
  height: number;
}

export interface DrillDiagramCircleZone extends DrillDiagramZoneBase {
  shape: "circle";
  radius: number;
}

export type DrillDiagramZone = DrillDiagramRectangleZone | DrillDiagramCircleZone;

export interface DrillDiagramField {
  surfaceType?: DrillDiagramFieldSurfaceType;
  view?: DrillDiagramFieldView;
  orientation?: DrillDiagramFieldOrientation;
  zones?: DrillDiagramZone[];
}

export type DrillDiagramObjectType =
  | "cone"
  | "ball"
  | "player"
  | "goal"
  | "mini_goal"
  | "pole"
  | "mannequin"
  | "marker"
  | "coach"
  | "gate"
  | "zone_anchor";

export interface DrillDiagramObjectBase {
  objectId: string;
  type: DrillDiagramObjectType;
  x: number;
  y: number;
  label?: string;
}

export interface DrillDiagramConeObject extends DrillDiagramObjectBase {
  type: "cone";
  color?: string;
}

export interface DrillDiagramBallObject extends DrillDiagramObjectBase {
  type: "ball";
}

export type DrillDiagramPlayerRole =
  | "attacker"
  | "defender"
  | "neutral"
  | "goalkeeper"
  | "coach"
  | "generic";

export type DrillDiagramPlayerTeam = "red" | "blue" | "yellow" | "black" | "neutral";

export type DrillDiagramFacing =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-right"
  | "up-left"
  | "down-right"
  | "down-left";

export interface DrillDiagramPlayerObject extends DrillDiagramObjectBase {
  type: "player";
  role?: DrillDiagramPlayerRole;
  team?: DrillDiagramPlayerTeam;
  hasBall?: boolean;
  facing?: DrillDiagramFacing;
}

export interface DrillDiagramGoalObject extends DrillDiagramObjectBase {
  type: "goal" | "mini_goal";
  width?: number;
  height?: number;
  rotation?: number;
}

export interface DrillDiagramGateObject extends DrillDiagramObjectBase {
  type: "gate";
  width?: number;
}

export interface DrillDiagramUtilityObject extends DrillDiagramObjectBase {
  type: "pole" | "mannequin" | "marker" | "coach" | "zone_anchor";
  color?: string;
  width?: number;
  height?: number;
  rotation?: number;
}

export type DrillDiagramObject =
  | DrillDiagramConeObject
  | DrillDiagramBallObject
  | DrillDiagramPlayerObject
  | DrillDiagramGoalObject
  | DrillDiagramGateObject
  | DrillDiagramUtilityObject;

export type DrillDiagramConnectionType =
  | "pass"
  | "movement"
  | "dribble"
  | "shot"
  | "rotation"
  | "press"
  | "support";

export type DrillDiagramConnectionStyle =
  | "solid-arrow"
  | "dashed-arrow"
  | "zigzag-arrow"
  | "curved-arrow"
  | "double-arrow";

export interface DrillDiagramConnection {
  connectionId: string;
  type: DrillDiagramConnectionType;
  fromRef: string;
  toRef: string;
  style?: DrillDiagramConnectionStyle;
  label?: string;
  sequenceOrder?: number;
  dashed?: boolean;
  curve?: number;
}

export type DrillDiagramAnnotationType = "text" | "badge" | "callout" | "number";

export interface DrillDiagramAnnotation {
  annotationId: string;
  type: DrillDiagramAnnotationType;
  x: number;
  y: number;
  text: string;
}

export interface DrillDiagramLegendItem {
  symbol: string;
  meaning: string;
}

export interface DrillDiagramLegend {
  show: boolean;
  items: DrillDiagramLegendItem[];
}

export type DrillDiagramTheme = "classic-coaching-board" | "clean-flat" | "minimal";

export type DrillDiagramIconStyle = "simple-flat" | "outline";

export interface DrillDiagramRenderHints {
  theme?: DrillDiagramTheme;
  showGridLines?: boolean;
  showFieldStripes?: boolean;
  preferLabels?: boolean;
  iconStyle?: DrillDiagramIconStyle;
  emphasis?: string[];
}

export interface DrillDiagramValidation {
  requiresObjects?: string[];
  maxSequenceSteps?: number;
  mustMatchActivityEquipment?: boolean;
  mustMatchPlayerCounts?: boolean;
}

export interface DrillDiagramSpecV1 {
  diagramId: string;
  specVersion: DrillDiagramSpecVersion;
  activityId: string;
  title: string;
  diagramType: DrillDiagramType;
  sport: DrillDiagramSport;
  canvas?: DrillDiagramCanvas;
  field?: DrillDiagramField;
  objects: DrillDiagramObject[];
  connections?: DrillDiagramConnection[];
  annotations?: DrillDiagramAnnotation[];
  legend?: DrillDiagramLegend;
  renderHints?: DrillDiagramRenderHints;
  validation?: DrillDiagramValidation;
}
