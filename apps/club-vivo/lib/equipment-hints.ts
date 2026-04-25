export const EQUIPMENT_HINTS_COOKIE = "club-vivo-equipment-hints";
const MAX_EQUIPMENT_ITEMS = 32;
const MAX_EQUIPMENT_NAME_LENGTH = 48;

export const DEFAULT_EQUIPMENT_ITEMS = [
  "Balls",
  "Tall cones",
  "Flat cones",
  "Mini disc cones",
  "Agility ladder",
  "Agility poles",
  "Pugg goals",
  "Pinnies"
] as const;

function normalizeEquipmentName(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, MAX_EQUIPMENT_NAME_LENGTH).trim();
}

function dedupeEquipment(items: string[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function parseEquipmentHints(rawValue: string | undefined) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return dedupeEquipment(
      parsed
        .map((item) => normalizeEquipmentName(typeof item === "string" ? item : undefined))
        .filter((item): item is string => Boolean(item))
        .slice(0, MAX_EQUIPMENT_ITEMS)
    );
  } catch {
    return [];
  }
}

export function getEquipmentItems(rawValue: string | undefined) {
  const parsed = parseEquipmentHints(rawValue);

  return parsed.length > 0 ? parsed : [...DEFAULT_EQUIPMENT_ITEMS];
}

export function serializeEquipmentHints(items: string[]) {
  return JSON.stringify(
    dedupeEquipment(
      items
        .map((item) => normalizeEquipmentName(item))
        .filter((item): item is string => Boolean(item))
        .slice(0, MAX_EQUIPMENT_ITEMS)
    )
  );
}
