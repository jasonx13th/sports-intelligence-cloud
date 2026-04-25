"use strict";

const { requireFields, validationError } = require("../../platform/validation/validate");

const STATUS_VALUES = ["active", "archived"];
const PROGRAM_TYPE_VALUES = ["travel", "ost"];
const PLAYER_COUNT_LIMITS = {
  min: 1,
  max: 60,
};

function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body || {}).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      unknown,
    });
  }
}

function requireTrimmedString(body, field, { max }) {
  const value = body?.[field];

  if (typeof value !== "string" || !value.trim()) {
    throw validationError("invalid_field", `${field} must be a non-empty string`, {
      field,
    });
  }

  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw validationError("invalid_field", `${field} is too long`, {
      field,
      max,
    });
  }

  return trimmed;
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

  if (trimmed.length > max) {
    throw validationError("invalid_field", `${field} is too long`, {
      field,
      max,
    });
  }

  return trimmed;
}

function optionalEnum(body, field, allowed, fallback, { normalize } = {}) {
  const value = body?.[field];
  if (value === undefined || value === null || value === "") return fallback;

  const normalizedValue = normalize ? normalize(value) : value;
  if (typeof normalizedValue !== "string" || !allowed.includes(normalizedValue)) {
    throw validationError("invalid_field", `${field} is invalid`, {
      field,
      allowed,
    });
  }

  return normalizedValue;
}

function optionalInteger(body, field, { min, max } = {}) {
  const value = body?.[field];
  if (value === undefined || value === null || value === "") return undefined;

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

function validateTeamMutation(body) {
  const safeBody = body || {};
  const allowed = [
    "name",
    "sport",
    "ageBand",
    "level",
    "notes",
    "status",
    "programType",
    "playerCount",
  ];

  rejectUnknownFields(safeBody, allowed);
  requireFields(safeBody, ["name", "sport", "ageBand"]);

  const name = requireTrimmedString(safeBody, "name", { max: 120 });
  const sport = requireTrimmedString(safeBody, "sport", { max: 64 });
  const ageBand = requireTrimmedString(safeBody, "ageBand", { max: 32 });
  const level = optionalTrimmedString(safeBody, "level", { max: 32 });
  const notes = optionalTrimmedString(safeBody, "notes", { max: 1000 });
  const status = optionalEnum(safeBody, "status", STATUS_VALUES, "active");
  const programType = optionalEnum(safeBody, "programType", PROGRAM_TYPE_VALUES, undefined, {
    normalize: (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  });
  const playerCount = optionalInteger(safeBody, "playerCount", PLAYER_COUNT_LIMITS);

  return {
    name,
    sport,
    ageBand,
    ...(level !== undefined ? { level } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(programType !== undefined ? { programType } : {}),
    ...(playerCount !== undefined ? { playerCount } : {}),
    status,
  };
}

function validateCreateTeam(body) {
  return validateTeamMutation(body);
}

function validateUpdateTeam(body) {
  return validateTeamMutation(body);
}

module.exports = {
  validateCreateTeam,
  validateUpdateTeam,
};
