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

function parseImageAnalysisText({ mode, text, analysisId, sourceImageId, sourceImageMimeType }) {
  const parsed = parseModelJson(text);

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
