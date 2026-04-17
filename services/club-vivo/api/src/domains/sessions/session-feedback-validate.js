"use strict";

const { requireFields, validationError } = require("../../platform/validation/validate");

const IMAGE_ANALYSIS_ACCURACY_VALUES = ["not_used", "low", "medium", "high"];
const FLOW_MODE_VALUES = ["session_builder", "environment_profile", "setup_to_drill"];
const MISSING_FEATURES_MAX = 280;

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

function requireTrimmedString(body, field, { max }) {
  const value = body?.[field];

  if (typeof value !== "string") {
    throw validationError("invalid_field", `${field} must be a string`, {
      field,
    });
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw validationError("invalid_field", `${field} must not be empty`, {
      field,
    });
  }

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
    "sessionQuality",
    "drillUsefulness",
    "imageAnalysisAccuracy",
    "missingFeatures",
    "flowMode",
  ];

  rejectUnknownFields(safeBody, allowed);
  requireFields(safeBody, [
    "sessionQuality",
    "drillUsefulness",
    "imageAnalysisAccuracy",
    "missingFeatures",
  ]);

  const sessionQuality = requireInteger(safeBody, "sessionQuality", { min: 1, max: 5 });
  const drillUsefulness = requireInteger(safeBody, "drillUsefulness", { min: 1, max: 5 });
  const imageAnalysisAccuracy = requireEnum(
    safeBody,
    "imageAnalysisAccuracy",
    IMAGE_ANALYSIS_ACCURACY_VALUES
  );
  const missingFeatures = requireTrimmedString(safeBody, "missingFeatures", {
    max: MISSING_FEATURES_MAX,
  });
  const flowMode =
    safeBody?.flowMode === undefined
      ? undefined
      : requireEnum(safeBody, "flowMode", FLOW_MODE_VALUES);

  return {
    sessionQuality,
    drillUsefulness,
    imageAnalysisAccuracy,
    missingFeatures,
    ...(flowMode !== undefined ? { flowMode } : {}),
  };
}

module.exports = {
  validateSessionFeedback,
};
