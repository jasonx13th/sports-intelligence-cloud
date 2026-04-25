import type { SessionPack } from "./session-builder-api";

export const QUICK_SESSION_COOKIE = "club-vivo-quick-session";

export type QuickSessionPayload = {
  pack: SessionPack;
  values: {
    sport: string;
    ageBand: string;
    durationMin: string;
    theme: string;
    equipment: string;
  };
  notes?: string;
};

export function serializeQuickSessionPayload(payload: QuickSessionPayload) {
  return JSON.stringify(payload);
}

export function parseQuickSessionPayload(
  rawValue: string | undefined
): QuickSessionPayload | undefined {
  if (!rawValue) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<QuickSessionPayload>;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.pack ||
      typeof parsed.pack !== "object" ||
      !parsed.values ||
      typeof parsed.values !== "object" ||
      typeof parsed.values.sport !== "string" ||
      typeof parsed.values.ageBand !== "string" ||
      typeof parsed.values.durationMin !== "string" ||
      typeof parsed.values.theme !== "string" ||
      typeof parsed.values.equipment !== "string" ||
      ("notes" in parsed && parsed.notes !== undefined && typeof parsed.notes !== "string")
    ) {
      return undefined;
    }

    return parsed as QuickSessionPayload;
  } catch {
    return undefined;
  }
}
