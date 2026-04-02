"use strict";

const { requireFields, validationError } = require("./validate");
const {
  SUPPORTED_AGE_BANDS,
  normalizeAgeBand,
  normalizeEquipmentName,
  requireEquipmentArray,
} = require("./session-validate");

const GOALS_REQUIRED_THEME_KEYWORDS = ["goal", "goals", "finish", "finishing"];

// Keep bounds tight; expand later with product evidence.
const LIMITS = {
  sportMax: 40,
  ageBandMax: 40,
  themeMax: 60,
  durationMinMin: 5,
  durationMinMax: 240,
  sessionsCountMin: 1,
  sessionsCountMax: 6,
};

function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body || {}).filter((k) => !allowed.includes(k));
  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      unknown,
    });
  }
}

function requireString(body, field, { max } = {}) {
  const v = body?.[field];
  if (typeof v !== "string" || !v.trim()) {
    throw validationError("invalid_field", `${field} must be a non-empty string`, { field });
  }
  if (max && v.length > max) {
    throw validationError("invalid_field", `${field} is too long`, { field, max });
  }
  return v.trim();
}

function requireSupportedAgeBand(body, field) {
  const raw = requireString(body, field, { max: LIMITS.ageBandMax });
  const ageBand = normalizeAgeBand(raw);

  if (!SUPPORTED_AGE_BANDS.includes(ageBand)) {
    throw validationError("invalid_field", `${field} is not supported`, {
      reason: "unsupported_age_band",
      field,
      value: raw,
    });
  }

  return ageBand;
}

function requireInt(body, field, { min, max } = {}) {
  const v = body?.[field];
  if (!Number.isInteger(v)) {
    throw validationError("invalid_field", `${field} must be an integer`, { field });
  }
  if (min !== undefined && v < min) {
    throw validationError("invalid_field", `${field} is too small`, { field, min });
  }
  if (max !== undefined && v > max) {
    throw validationError("invalid_field", `${field} is too large`, { field, max });
  }
  return v;
}

function getMissingEquipmentForTheme(theme, equipment) {
  if (!Array.isArray(equipment) || equipment.length === 0) return [];

  const themeKey = normalizeEquipmentName(theme);
  const provided = new Set(equipment.map(normalizeEquipmentName));
  const missing = new Set();

  if (GOALS_REQUIRED_THEME_KEYWORDS.some((keyword) => themeKey.includes(keyword)) && !provided.has("goals")) {
    missing.add("goals");
  }

  return [...missing];
}

function validateCreateSessionPack(body) {
  const allowed = ["sport", "ageBand", "durationMin", "theme", "sessionsCount", "equipment"];
  rejectUnknownFields(body, allowed);

  requireFields(body, ["sport", "ageBand", "durationMin", "theme"]);

  const sport = requireString(body, "sport", { max: LIMITS.sportMax });
  const ageBand = requireSupportedAgeBand(body, "ageBand");
  const durationMin = requireInt(body, "durationMin", {
    min: LIMITS.durationMinMin,
    max: LIMITS.durationMinMax,
  });
  const theme = requireString(body, "theme", { max: LIMITS.themeMax });
  const equipment = requireEquipmentArray(body, "equipment");

  const sessionsCountRaw = body?.sessionsCount;
  const sessionsCount =
    sessionsCountRaw === undefined || sessionsCountRaw === null
      ? 3
      : requireInt(body, "sessionsCount", {
          min: LIMITS.sessionsCountMin,
          max: LIMITS.sessionsCountMax,
        });

  const missingEquipment = getMissingEquipmentForTheme(theme, equipment);
  if (missingEquipment.length) {
    throw validationError(
      "invalid_field",
      "equipment is incompatible with one or more generated sessions",
      {
        reason: "incompatible_equipment",
        field: "equipment",
        missingEquipment,
      }
    );
  }

  return {
    sport,
    ageBand,
    durationMin,
    theme,
    sessionsCount,
    ...(equipment.length ? { equipment } : {}),
  };
}

module.exports = { validateCreateSessionPack, LIMITS, getMissingEquipmentForTheme };
