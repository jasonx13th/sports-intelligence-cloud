"use strict";

const {
  validateEnvironmentProfile,
  validateSetupProfile,
} = require("./image-intake-validate");
const { validationError } = require("../../platform/validation/validate");

function extractJsonObject(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    throw validationError("invalid_field", "Model output was empty", {
      reason: "empty_model_output",
    });
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start < 0 || end < start) {
    throw validationError("invalid_field", "Model output did not contain JSON", {
      reason: "missing_json_object",
    });
  }

  return candidate.slice(start, end + 1);
}

function parseModelJson(text) {
  const jsonPayload = extractJsonObject(text);

  try {
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw validationError("invalid_field", "Model output JSON was invalid", {
      reason: "invalid_model_json",
      message: error?.message,
    });
  }
}

function normalizeSurfaceType(value) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return value;
  }

  if (["grass", "turf", "indoor", "hardcourt", "unknown"].includes(normalized)) {
    return normalized;
  }

  if (normalized === "synthetic turf" || normalized === "artificial turf") {
    return "turf";
  }

  if (normalized === "indoor court") {
    return "indoor";
  }

  if (normalized === "hard court") {
    return "hardcourt";
  }

  return "unknown";
}

function normalizeSpaceSize(value) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return value;
  }

  if (["small", "medium", "large", "full", "unknown"].includes(normalized)) {
    return normalized;
  }

  return "unknown";
}

function normalizeBoundaryType(value) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return value;
  }

  if (["small-grid", "half-field", "full-field", "indoor-court", "mixed", "unknown"].includes(normalized)) {
    return normalized;
  }

  if (normalized === "small grid") {
    return "small-grid";
  }

  if (normalized === "half field") {
    return "half-field";
  }

  if (normalized === "full field") {
    return "full-field";
  }

  if (normalized === "indoor court") {
    return "indoor-court";
  }

  return "unknown";
}

function normalizeAnalysisConfidence(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const normalized = trimmed.toLowerCase();
  if (["low", "medium", "high"].includes(normalized)) {
    return normalized;
  }

  return trimmed;
}

function normalizeLayoutType(value) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return value;
  }

  if (["box", "lane", "channel", "grid", "half-pitch", "unknown"].includes(normalized)) {
    return normalized;
  }

  if (normalized === "half pitch") {
    return "half-pitch";
  }

  return "unknown";
}

function normalizeStringArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return [];
    }

    const trimmed = item.trim();
    if (!trimmed) {
      return [];
    }

    normalized.push(trimmed);
  }

  return normalized;
}

function normalizeParsedProfile(mode, parsed) {
  if (mode !== "environment_profile" || !parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return parsed;
  }

  return {
    ...parsed,
    ...(Object.prototype.hasOwnProperty.call(parsed, "surfaceType")
      ? { surfaceType: normalizeSurfaceType(parsed.surfaceType) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(parsed, "spaceSize")
      ? { spaceSize: normalizeSpaceSize(parsed.spaceSize) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(parsed, "boundaryType")
      ? { boundaryType: normalizeBoundaryType(parsed.boundaryType) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(parsed, "analysisConfidence")
      ? { analysisConfidence: normalizeAnalysisConfidence(parsed.analysisConfidence) }
      : {}),
    constraints: normalizeStringArray(parsed.constraints),
    safetyNotes: normalizeStringArray(parsed.safetyNotes),
    assumptions: normalizeStringArray(parsed.assumptions),
  };
}

function normalizeSetupProfile(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return parsed;
  }

  return {
    ...parsed,
    ...(Object.prototype.hasOwnProperty.call(parsed, "layoutType")
      ? { layoutType: normalizeLayoutType(parsed.layoutType) }
      : {}),
  };
}

function parseImageAnalysisText({ mode, text, analysisId, sourceImageId, sourceImageMimeType }) {
  const modelJson = parseModelJson(text);
  const parsed =
    mode === "environment_profile" ? normalizeParsedProfile(mode, modelJson) : normalizeSetupProfile(modelJson);

  const withEnvelope = {
    ...parsed,
    analysisId,
    sourceImageId,
    sourceImageMimeType,
    schemaVersion: 1,
    status: "draft",
    mode,
  };

  if (mode === "environment_profile") {
    return validateEnvironmentProfile(withEnvelope, { expectedStatus: "draft", fieldPrefix: "profile" });
  }

  return validateSetupProfile(withEnvelope, { expectedStatus: "draft", fieldPrefix: "profile" });
}

module.exports = {
  extractJsonObject,
  parseModelJson,
  parseImageAnalysisText,
};
