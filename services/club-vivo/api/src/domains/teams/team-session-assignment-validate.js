"use strict";

const { validationError } = require("../../platform/validation/validate");

function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body || {}).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      unknown,
    });
  }
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

function validateAssignSession(body) {
  const safeBody = body || {};
  rejectUnknownFields(safeBody, ["notes"]);

  const notes = optionalTrimmedString(safeBody, "notes", { max: 1000 });
  return notes === undefined ? {} : { notes };
}

module.exports = {
  validateAssignSession,
};

