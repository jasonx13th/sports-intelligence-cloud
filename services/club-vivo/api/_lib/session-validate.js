"use strict";

const { requireFields, validationError } = require("./validate");

const LIMITS = {
  sportMax: 40,
  ageBandMax: 40,
  objectiveTagsMax: 12,
  tagMax: 40,
  activitiesMax: 30,
  activityNameMax: 80,
  activityDescMax: 280,
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

function validateCreateSession(body) {
  const allowed = [
    "sport",
    "ageBand",
    "durationMin",
    "objectiveTags",
    "activities",
    "clubId",
    "teamId",
    "seasonId",
  ];
  rejectUnknownFields(body, allowed);

  requireFields(body, ["sport", "ageBand", "durationMin", "activities"]);

  const sport = requireString(body, "sport", { max: LIMITS.sportMax });
  const ageBand = requireString(body, "ageBand", { max: LIMITS.ageBandMax });
  const durationMin = requireInt(body, "durationMin", {
    min: LIMITS.durationMinMin,
    max: LIMITS.durationMinMax,
  });

  const objectiveTags = requireStringArray(body, "objectiveTags", {
    optional: true,
    maxItems: LIMITS.objectiveTagsMax,
    itemMax: LIMITS.tagMax,
  });

  const clubId = requireString(body, "clubId", { max: LIMITS.idMax, optional: true });
  const teamId = requireString(body, "teamId", { max: LIMITS.idMax, optional: true });
  const seasonId = requireString(body, "seasonId", { max: LIMITS.idMax, optional: true });

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

    if (!Number.isInteger(a.minutes) || a.minutes < LIMITS.activityMinutesMin || a.minutes > LIMITS.activityMinutesMax) {
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
    throw validationError(
      "invalid_field",
      "Sum of activities[].minutes must be <= durationMin",
      { totalMinutes, durationMin }
    );
  }

  // Return a sanitized version so handlers can trust it
  return {
    sport,
    ageBand,
    durationMin,
    objectiveTags,
    activities,
    ...(clubId ? { clubId } : {}),
    ...(teamId ? { teamId } : {}),
    ...(seasonId ? { seasonId } : {}),
  };
}

module.exports = { validateCreateSession, LIMITS };