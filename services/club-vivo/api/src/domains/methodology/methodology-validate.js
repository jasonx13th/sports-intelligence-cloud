"use strict";

const { requireFields, validationError } = require("../../platform/validation/validate");

const SCOPE_VALUES = ["shared", "travel", "ost"];
const STATUS_VALUES = ["draft", "published"];
const TENANT_LIKE_FIELDS = ["tenant_id", "tenantId", "x-tenant-id"];
const LIMITS = {
  titleMax: 160,
  contentMax: 50000,
};

function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body || {}).filter(
    (key) => TENANT_LIKE_FIELDS.includes(key) || !allowed.includes(key)
  );

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

function requireEnum(body, field, allowed) {
  const value = requireTrimmedString(body, field, { max: 32 });

  if (!allowed.includes(value)) {
    throw validationError("invalid_field", `${field} is invalid`, {
      field,
      allowed,
    });
  }

  return value;
}

function optionalEnum(body, field, allowed, fallback) {
  const value = body?.[field];

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string" || !value.trim()) {
    throw validationError("invalid_field", `${field} is invalid`, {
      field,
      allowed,
    });
  }

  const trimmed = value.trim();
  if (!allowed.includes(trimmed)) {
    throw validationError("invalid_field", `${field} is invalid`, {
      field,
      allowed,
    });
  }

  return trimmed;
}

function validateCreateMethodology(body) {
  const safeBody = body || {};
  const allowed = ["scope", "title", "content", "status"];

  rejectUnknownFields(safeBody, allowed);
  requireFields(safeBody, ["scope", "title", "content"]);

  const scope = requireEnum(safeBody, "scope", SCOPE_VALUES);
  const title = requireTrimmedString(safeBody, "title", {
    max: LIMITS.titleMax,
  });
  const content = requireTrimmedString(safeBody, "content", {
    max: LIMITS.contentMax,
  });
  const status = optionalEnum(safeBody, "status", STATUS_VALUES, "draft");

  return {
    scope,
    title,
    content,
    status,
  };
}

function validateMethodologyScope(scope) {
  if (typeof scope !== "string" || !scope.trim()) {
    throw validationError("invalid_field", "scope is invalid", {
      field: "scope",
      allowed: SCOPE_VALUES,
    });
  }

  const trimmed = scope.trim();
  if (!SCOPE_VALUES.includes(trimmed)) {
    throw validationError("invalid_field", "scope is invalid", {
      field: "scope",
      allowed: SCOPE_VALUES,
    });
  }

  return trimmed;
}

function validateSaveMethodology(body) {
  const safeBody = body || {};
  const allowed = ["title", "content"];

  rejectUnknownFields(safeBody, allowed);
  requireFields(safeBody, ["title", "content"]);

  return {
    title: requireTrimmedString(safeBody, "title", { max: LIMITS.titleMax }),
    content: requireTrimmedString(safeBody, "content", { max: LIMITS.contentMax }),
  };
}

function validatePublishMethodology(body) {
  const safeBody = body || {};
  rejectUnknownFields(safeBody, []);
  return {};
}

module.exports = {
  validateCreateMethodology,
  validateMethodologyScope,
  validateSaveMethodology,
  validatePublishMethodology,
  LIMITS,
  SCOPE_VALUES,
  STATUS_VALUES,
};
