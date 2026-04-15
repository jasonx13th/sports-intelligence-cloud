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

function normalizeParsedProfile(mode, parsed) {
  if (mode !== "environment_profile" || !parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return parsed;
  }

  return {
    ...parsed,
    ...(Object.prototype.hasOwnProperty.call(parsed, "surfaceType")
      ? { surfaceType: normalizeSurfaceType(parsed.surfaceType) }
      : {}),
  };
}

function parseImageAnalysisText({ mode, text, analysisId, sourceImageId, sourceImageMimeType }) {
  const parsed = normalizeParsedProfile(mode, parseModelJson(text));

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
