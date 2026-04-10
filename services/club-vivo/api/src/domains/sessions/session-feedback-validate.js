"use strict";

const { requireFields, validationError } = require("../../platform/validation/validate");

const RUN_STATUS_VALUES = ["ran_as_planned", "ran_with_changes", "not_run"];
const DIFFICULTY_VALUES = ["too_easy", "about_right", "too_hard"];
const NOTES_MAX = 1000;

function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body || {}).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      unknown,
    });
  }
}

function requireInteger(body, field, { min, max } = {}) {
  const value = body?.[field];

  if (!Number.isInteger(value)) {
    throw validationError("invalid_field", `${field} must be an integer`, {
      field,
    });
  }

  if (min !== undefined && value < min) {
    throw validationError("invalid_field", `${field} is too small`, {
      field,
      min,
    });
  }

  if (max !== undefined && value > max) {
    throw validationError("invalid_field", `${field} is too large`, {
      field,
      max,
    });
  }

  return value;
}

function requireEnum(body, field, allowed) {
  const value = body?.[field];

  if (typeof value !== "string" || !allowed.includes(value)) {
    throw validationError("invalid_field", `${field} is invalid`, {
      field,
      allowed,
    });
  }

  return value;
}

function optionalBoolean(body, field) {
  const value = body?.[field];
  if (value === undefined) return undefined;

  if (typeof value !== "boolean") {
    throw validationError("invalid_field", `${field} must be a boolean`, {
      field,
    });
  }

  return value;
}

function optionalTrimmedString(body, field, { max }) {
  const value = body?.[field];
  if (value === undefined || value === null || value === "") return undefined;

  if (typeof value !== "string") {
    throw validationError("invalid_field", `${field} must be a string`, {
      field,
    });
  }

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (max && trimmed.length > max) {
    throw validationError("invalid_field", `${field} is too long`, {
      field,
      max,
    });
  }

  return trimmed;
}

function validateSessionFeedback(body) {
  const safeBody = body || {};
  const allowed = [
    "rating",
    "runStatus",
    "objectiveMet",
    "difficulty",
    "wouldReuse",
    "notes",
    "changesNextTime",
  ];

  rejectUnknownFields(safeBody, allowed);
  requireFields(safeBody, ["rating", "runStatus"]);

  const rating = requireInteger(safeBody, "rating", { min: 1, max: 5 });
  const runStatus = requireEnum(safeBody, "runStatus", RUN_STATUS_VALUES);
  const objectiveMet = optionalBoolean(safeBody, "objectiveMet");
  const difficulty = safeBody?.difficulty === undefined
    ? undefined
    : requireEnum(safeBody, "difficulty", DIFFICULTY_VALUES);
  const wouldReuse = optionalBoolean(safeBody, "wouldReuse");
  const notes = optionalTrimmedString(safeBody, "notes", { max: NOTES_MAX });
  const changesNextTime = optionalTrimmedString(safeBody, "changesNextTime", { max: NOTES_MAX });

  if (runStatus === "not_run") {
    const inconsistent = [];
    if (objectiveMet !== undefined) inconsistent.push("objectiveMet");
    if (difficulty !== undefined) inconsistent.push("difficulty");

    if (inconsistent.length) {
      throw validationError("invalid_field", "runStatus is inconsistent with one or more fields", {
        field: "runStatus",
        reason: "inconsistent_feedback_fields",
        inconsistent,
      });
    }
  }

  return {
    rating,
    runStatus,
    ...(objectiveMet !== undefined ? { objectiveMet } : {}),
    ...(difficulty !== undefined ? { difficulty } : {}),
    ...(wouldReuse !== undefined ? { wouldReuse } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(changesNextTime !== undefined ? { changesNextTime } : {}),
  };
}

module.exports = {
  validateSessionFeedback,
};
