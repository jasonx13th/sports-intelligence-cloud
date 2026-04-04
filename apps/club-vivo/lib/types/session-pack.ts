import type { DrillDiagramSpecV1 } from "./drill-diagram-spec";

export type SessionPackSpecVersion = "session-pack.v2";

export type SessionPackSport = "soccer";

export type SessionPackIntensity = "low" | "medium" | "high";

export type SessionPackActivityPhase =
  | "warm-up"
  | "technical"
  | "main"
  | "game"
  | "cooldown";

export interface SessionPackStructuredEquipment {
  [key: string]: unknown;
}

export type SessionPackEquipment = string[] | SessionPackStructuredEquipment;

export type SessionPackSpaceUnits = string;

export interface SessionPackSpace {
  surfaceType?: string;
  areaType?: string;
  sizeLabel?: string;
  width?: number;
  length?: number;
  units?: SessionPackSpaceUnits;
}

export interface SessionPackStructuredOrganization {
  [key: string]: unknown;
}

export type SessionPackOrganization = string | SessionPackStructuredOrganization;

export type SessionPackDiagramType =
  | "setup"
  | "sequence"
  | "progression"
  | "regression"
  | "condition";

export type SessionPackDiagramSpecVersion = "drill-diagram-spec.v1";

export interface SessionPackActivityDiagram {
  diagramId: string;
  specVersion: SessionPackDiagramSpecVersion;
  diagramType: SessionPackDiagramType;
  title: string;
  spec: DrillDiagramSpecV1;
}

export interface SessionPackActivity {
  activityId: string;
  name: string;
  phase?: SessionPackActivityPhase;
  minutes: number;
  objective?: string;
  setup: string;
  instructions: string;
  organization?: SessionPackOrganization;
  coachingPoints: string[];
  progressions?: string[];
  regressions?: string[];
  commonMistakes?: string[];
  equipment: SessionPackEquipment;
  space?: SessionPackSpace;
  constraints?: string[];
  diagrams?: SessionPackActivityDiagram[];
}

export interface SessionPackCooldown {
  minutes?: number;
  instructions?: string;
  notes?: string;
}

export interface SessionPackMetadata {
  generatedAt?: string;
  generatedBy?: string;
  generationMode?: string;
  methodologyApplied?: boolean;
  tenantScoped?: boolean;
}

export interface SessionPackExport {
  pdfUrl?: string;
  ttlSeconds?: number;
  exportReady?: boolean;
}

export interface SessionPackV2 {
  sessionPackId: string;
  specVersion: SessionPackSpecVersion;
  title: string;
  sport: SessionPackSport;
  ageGroup: string;
  level?: string;
  durationMinutes: number;
  equipment: SessionPackEquipment;
  space: SessionPackSpace;
  intensity?: SessionPackIntensity;
  objective: string;
  activities: SessionPackActivity[];
  cooldown?: SessionPackCooldown;
  safetyNotes?: string[];
  successCriteria?: string[];
  assumptions?: string[];
  metadata?: SessionPackMetadata;
  export?: SessionPackExport;
}
