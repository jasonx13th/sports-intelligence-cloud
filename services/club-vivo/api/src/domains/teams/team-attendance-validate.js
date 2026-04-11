"use strict";

const { requireFields, validationError } = require("../../platform/validation/validate");

const STATUS_VALUES = ["planned", "completed", "cancelled"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value) {
  if (!DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function rejectUnknownFields(values, allowed) {
  const unknown = Object.keys(values || {}).filter((key) => !allowed.includes(key));
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

function requireDateString(values, field) {
  const value = values?.[field];
  if (typeof value !== "string" || !isValidDateString(value)) {
    throw validationError("invalid_field", `${field} must be a YYYY-MM-DD date`, {
      field,
    });
  }
  return value;
}

function optionalDateString(values, field) {
  const value = values?.[field];
  if (value === undefined || value === null || value === "") return undefined;
  return requireDateString(values, field);
}

function requireStatus(body) {
  const status = body?.status;
  if (typeof status !== "string" || !STATUS_VALUES.includes(status)) {
    throw validationError("invalid_field", "status is invalid", {
      field: "status",
      allowed: STATUS_VALUES,
    });
  }
  return status;
}

function optionalLimit(query) {
  const raw = query?.limit;
  if (raw === undefined || raw === null || raw === "") return undefined;

  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw validationError("invalid_field", "limit is invalid", {
      field: "limit",
    });
  }

  const limit = Number(raw);
  if (limit < 1 || limit > 50) {
    throw validationError("invalid_field", "limit is invalid", {
      field: "limit",
      min: 1,
      max: 50,
    });
  }

  return limit;
}

function validateCreateAttendance(body) {
  const safeBody = body || {};
  rejectUnknownFields(safeBody, ["sessionId", "sessionDate", "status", "notes"]);
  requireFields(safeBody, ["sessionId", "sessionDate", "status"]);

  const sessionId = requireTrimmedString(safeBody, "sessionId", { max: 128 });
  const sessionDate = requireDateString(safeBody, "sessionDate");
  const status = requireStatus(safeBody);
  const notes = optionalTrimmedString(safeBody, "notes", { max: 1000 });

  return {
    sessionId,
    sessionDate,
    status,
    ...(notes !== undefined ? { notes } : {}),
  };
}

function validateListAttendanceQuery(query) {
  const safeQuery = query || {};
  rejectUnknownFields(safeQuery, ["startDate", "endDate", "limit", "nextToken"]);

  const startDate = optionalDateString(safeQuery, "startDate");
  const endDate = optionalDateString(safeQuery, "endDate");
  const limit = optionalLimit(safeQuery);
  const nextToken = safeQuery.nextToken;

  if (nextToken !== undefined && (typeof nextToken !== "string" || !nextToken)) {
    throw validationError("invalid_field", "nextToken is invalid", {
      field: "nextToken",
    });
  }

  if (startDate && endDate && startDate > endDate) {
    throw validationError("invalid_field", "startDate must be less than or equal to endDate", {
      field: "startDate",
    });
  }

  return {
    ...(startDate !== undefined ? { startDate } : {}),
    ...(endDate !== undefined ? { endDate } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(nextToken !== undefined ? { nextToken } : {}),
  };
}

module.exports = {
  validateCreateAttendance,
  validateListAttendanceQuery,
};
