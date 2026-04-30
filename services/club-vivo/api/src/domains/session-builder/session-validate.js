"use strict";

const { requireFields, validationError } = require("../../platform/validation/validate");

const SUPPORTED_AGE_BANDS = ["u6", "u8", "u10", "u12", "u14", "u16", "u18", "adult"];
const GOALS_REQUIRED_KEYWORDS = ["goal", "goals", "finish", "finishing"];

const LIMITS = {
  sportMax: 40,
  ageBandMax: 40,
  objectiveTagsMax: 12,
  tagMax: 40,
  equipmentMax: 12,
  equipmentItemMax: 40,
  activitiesMax: 30,
  activityNameMax: 80,
  activityDescMax: 700,
  idMax: 64,
  durationMinMin: 5,
  durationMinMax: 240,
  activityMinutesMin: 1,
  activityMinutesMax: 240,
};

function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body || {}).filter((k) => !allowed.includes(k));
  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      unknown,
    });
  }
}

function requireString(body, field, { max, optional = false } = {}) {
  const v = body?.[field];
  if (optional && (v === undefined || v === null || v === "")) return null;

  if (typeof v !== "string" || !v.trim()) {
    throw validationError("invalid_field", `${field} must be a non-empty string`, {
      field,
    });
  }
  if (max && v.length > max) {
    throw validationError("invalid_field", `${field} is too long`, {
      field,
      max,
    });
  }
  return v;
}

function normalizeAgeBand(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
  const numberWords = {
    six: 6,
    eight: 8,
    ten: 10,
    twelve: 12,
    fourteen: 14,
    sixteen: 16,
    eighteen: 18,
  };
  const underWordMatch = normalized.match(/\bunder\s+(six|eight|ten|twelve|fourteen|sixteen|eighteen)\b/);

  if (underWordMatch?.[1]) {
    return `u${numberWords[underWordMatch[1]]}`;
  }

  const match =
    normalized.match(/\bu\s*([0-9]{1,2})\b/) ||
    normalized.match(/\bunder\s*([0-9]{1,2})\b/) ||
    normalized.match(/\b([0-9]{1,2})\s*u\b/);

  if (match?.[1]) {
    return `u${Number.parseInt(match[1], 10)}`;
  }

  return normalized;
}

function normalizeEquipmentName(value) {
  return String(value || "").trim().toLowerCase();
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
    throw validationError("invalid_field", `${field} must be an integer`, {
      field,
    });
  }
  if (min !== undefined && v < min) {
    throw validationError("invalid_field", `${field} is too small`, { field, min });
  }
  if (max !== undefined && v > max) {
    throw validationError("invalid_field", `${field} is too large`, { field, max });
  }
  return v;
}

function requireStringArray(body, field, { maxItems, itemMax, optional = false } = {}) {
  const arr = body?.[field];
  if (optional && (arr === undefined || arr === null)) return [];

  if (!Array.isArray(arr)) {
    throw validationError("invalid_field", `${field} must be an array`, { field });
  }
  if (maxItems !== undefined && arr.length > maxItems) {
    throw validationError("invalid_field", `${field} has too many items`, {
      field,
      maxItems,
    });
  }

  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (typeof v !== "string" || !v.trim()) {
      throw validationError("invalid_field", `${field}[${i}] must be a string`, {
        field,
        index: i,
      });
    }
    if (itemMax && v.length > itemMax) {
      throw validationError("invalid_field", `${field}[${i}] is too long`, {
        field,
        index: i,
        itemMax,
      });
    }
  }

  return arr;
}

function requireEquipmentArray(body, field = "equipment") {
  const arr = requireStringArray(body, field, {
    optional: true,
    maxItems: LIMITS.equipmentMax,
    itemMax: LIMITS.equipmentItemMax,
  });

  return [...new Set(arr.map(normalizeEquipmentName))];
}

function getMissingEquipmentForActivities(activities, equipment) {
  if (!Array.isArray(equipment) || equipment.length === 0) return [];

  const provided = new Set(equipment.map(normalizeEquipmentName));
  const hasGoalEquipment =
    provided.has("goals") || provided.has("mini goals") || provided.has("pug goals");
  const missing = new Set();

  for (const activity of activities || []) {
    const activityName = normalizeEquipmentName(activity?.name);

    if (GOALS_REQUIRED_KEYWORDS.some((keyword) => activityName.includes(keyword)) && !hasGoalEquipment) {
      missing.add("goals");
    }
  }

  return [...missing];
}

function validateCreateSession(body) {
  const allowed = [
    "sport",
    "ageBand",
    "durationMin",
    "objectiveTags",
    "equipment",
    "activities",
    "clubId",
    "teamId",
    "seasonId",
    "tags",
    "sourceTemplateId",
  ];
  rejectUnknownFields(body, allowed);

  requireFields(body, ["sport", "ageBand", "durationMin", "activities"]);

  const sport = requireString(body, "sport", { max: LIMITS.sportMax });
  const ageBand = requireSupportedAgeBand(body, "ageBand");
  const durationMin = requireInt(body, "durationMin", {
    min: LIMITS.durationMinMin,
    max: LIMITS.durationMinMax,
  });

  const objectiveTags = requireStringArray(body, "objectiveTags", {
    optional: true,
    maxItems: LIMITS.objectiveTagsMax,
    itemMax: LIMITS.tagMax,
  });

  const tags = requireStringArray(body, "tags", {
    optional: true,
    maxItems: LIMITS.objectiveTagsMax,
    itemMax: LIMITS.tagMax,
  });

  const equipment = requireEquipmentArray(body, "equipment");

  const clubId = requireString(body, "clubId", { max: LIMITS.idMax, optional: true });
  const teamId = requireString(body, "teamId", { max: LIMITS.idMax, optional: true });
  const seasonId = requireString(body, "seasonId", { max: LIMITS.idMax, optional: true });
  const sourceTemplateId = requireString(body, "sourceTemplateId", {
    max: LIMITS.idMax,
    optional: true,
  });

  const activities = body.activities;
  if (!Array.isArray(activities) || activities.length < 1) {
    throw validationError("invalid_field", "activities must be a non-empty array", {
      field: "activities",
    });
  }
  if (activities.length > LIMITS.activitiesMax) {
    throw validationError("invalid_field", "activities has too many items", {
      field: "activities",
      maxItems: LIMITS.activitiesMax,
    });
  }

  let totalMinutes = 0;

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    if (!a || typeof a !== "object") {
      throw validationError("invalid_field", `activities[${i}] must be an object`, {
        field: "activities",
        index: i,
      });
    }

    const allowedActivity = ["name", "minutes", "description"];
    const unknownActivity = Object.keys(a).filter((k) => !allowedActivity.includes(k));
    if (unknownActivity.length) {
      throw validationError("unknown_fields", "Unknown fields are not allowed", {
        field: `activities[${i}]`,
        unknown: unknownActivity,
      });
    }

    if (typeof a.name !== "string" || !a.name.trim() || a.name.length > LIMITS.activityNameMax) {
      throw validationError("invalid_field", `activities[${i}].name is invalid`, {
        field: "name",
        index: i,
        max: LIMITS.activityNameMax,
      });
    }

    if (
      !Number.isInteger(a.minutes) ||
      a.minutes < LIMITS.activityMinutesMin ||
      a.minutes > LIMITS.activityMinutesMax
    ) {
      throw validationError("invalid_field", `activities[${i}].minutes is invalid`, {
        field: "minutes",
        index: i,
      });
    }

    if (a.description !== undefined && a.description !== null) {
      if (typeof a.description !== "string" || a.description.length > LIMITS.activityDescMax) {
        throw validationError("invalid_field", `activities[${i}].description is invalid`, {
          field: "description",
          index: i,
          max: LIMITS.activityDescMax,
        });
      }
    }

    totalMinutes += a.minutes;
  }

  if (totalMinutes > durationMin) {
    throw validationError("invalid_field", "Sum of activities[].minutes must be <= durationMin", {
      reason: "invalid_duration_total",
      totalMinutes,
      durationMin,
    });
  }

  const missingEquipment = getMissingEquipmentForActivities(activities, equipment);
  if (missingEquipment.length) {
    throw validationError("invalid_field", "equipment is incompatible with one or more activities", {
      reason: "incompatible_equipment",
      field: "equipment",
      missingEquipment,
    });
  }

  return {
    sport,
    ageBand,
    durationMin,
    objectiveTags,
    ...(equipment.length ? { equipment } : {}),
    activities,
    ...(clubId ? { clubId } : {}),
    ...(teamId ? { teamId } : {}),
    ...(seasonId ? { seasonId } : {}),
    ...(tags.length ? { tags } : {}),
    ...(sourceTemplateId ? { sourceTemplateId } : {}),
  };
}

module.exports = {
  SUPPORTED_AGE_BANDS,
  normalizeAgeBand,
  normalizeEquipmentName,
  requireEquipmentArray,
  validateCreateSession,
};
