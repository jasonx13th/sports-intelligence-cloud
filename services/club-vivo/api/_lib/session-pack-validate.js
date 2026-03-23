"use strict";

const { requireFields, validationError } = require("./validate");

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

function validateCreateSessionPack(body) {
  const allowed = ["sport", "ageBand", "durationMin", "theme", "sessionsCount"];
  rejectUnknownFields(body, allowed);

  requireFields(body, ["sport", "ageBand", "durationMin", "theme"]);

  const sport = requireString(body, "sport", { max: LIMITS.sportMax });
  const ageBand = requireString(body, "ageBand", { max: LIMITS.ageBandMax });
  const durationMin = requireInt(body, "durationMin", {
    min: LIMITS.durationMinMin,
    max: LIMITS.durationMinMax,
  });
  const theme = requireString(body, "theme", { max: LIMITS.themeMax });

  const sessionsCountRaw = body?.sessionsCount;
  const sessionsCount =
    sessionsCountRaw === undefined || sessionsCountRaw === null
      ? 3
      : requireInt(body, "sessionsCount", {
          min: LIMITS.sessionsCountMin,
          max: LIMITS.sessionsCountMax,
        });

  return {
    sport,
    ageBand,
    durationMin,
    theme,
    sessionsCount,
  };
}

module.exports = { validateCreateSessionPack, LIMITS };