"use strict";

const { validationError } = require("../../platform/validation/validate");

const IMAGE_ANALYSIS_MODES = ["environment_profile", "setup_to_drill"];
const SOURCE_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ANALYSIS_STATUSES = ["draft", "confirmed"];
const SURFACE_TYPES = ["grass", "turf", "indoor", "hardcourt", "unknown"];
const SPACE_SIZES = ["small", "medium", "large", "full", "unknown"];
const BOUNDARY_TYPES = ["small-grid", "half-field", "full-field", "indoor-court", "mixed", "unknown"];
const ANALYSIS_CONFIDENCE_VALUES = ["low", "medium", "high"];
const LAYOUT_TYPES = ["box", "lane", "channel", "grid", "half-pitch", "unknown"];
const PLAYER_ORGANIZATION_VALUES = ["individual", "pairs", "small-groups", "two-lines", "two-teams", "unknown"];

function rejectUnknownFields(body, allowed, field) {
  const unknown = Object.keys(body || {}).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      ...(field ? { field } : {}),
      unknown,
    });
  }
}

function requireObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validationError("invalid_field", `${field} must be an object`, { field });
  }

  return value;
}

function requireString(value, field, { max } = {}) {
  if (typeof value !== "string" || !value.trim()) {
    throw validationError("invalid_field", `${field} must be a non-empty string`, { field });
  }

  const trimmed = value.trim();
  if (max && trimmed.length > max) {
    throw validationError("invalid_field", `${field} is too long`, { field, max });
  }

  return trimmed;
}

function requireEnum(value, field, allowed) {
  const normalized = requireString(value, field);
  if (!allowed.includes(normalized)) {
    throw validationError("invalid_field", `${field} is not supported`, {
      field,
      value: normalized,
      allowed,
    });
  }

  return normalized;
}

function requireStringArray(value, field) {
  if (!Array.isArray(value)) {
    throw validationError("invalid_field", `${field} must be an array`, { field });
  }

  return value.map((item, index) => requireString(item, `${field}[${index}]`, { max: 120 }));
}

function optionalStringArray(value, field) {
  if (value === undefined || value === null) {
    return [];
  }

  return requireStringArray(value, field);
}

function assertNoTenantFields(body, field) {
  const forbidden = ["tenant_id", "tenantId", "x-tenant-id"];
  const present = forbidden.filter((key) => Object.prototype.hasOwnProperty.call(body || {}, key));
  if (present.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      ...(field ? { field } : {}),
      unknown: present,
    });
  }
}

function validateSourceImage(raw) {
  const sourceImage = requireObject(raw, "sourceImage");
  rejectUnknownFields(sourceImage, ["filename", "mimeType", "bytesBase64"], "sourceImage");
  assertNoTenantFields(sourceImage, "sourceImage");

  const mimeType = requireEnum(sourceImage.mimeType, "sourceImage.mimeType", SOURCE_IMAGE_MIME_TYPES);
  const bytesBase64 = requireString(sourceImage.bytesBase64, "sourceImage.bytesBase64");
  const filename =
    sourceImage.filename === undefined ? undefined : requireString(sourceImage.filename, "sourceImage.filename", { max: 200 });

  return {
    mimeType,
    bytesBase64,
    ...(filename ? { filename } : {}),
  };
}

function validateImageAnalysisRequest(body) {
  rejectUnknownFields(body, ["requestType", "mode", "sourceImage"]);
  assertNoTenantFields(body);

  const requestType = requireEnum(body?.requestType, "requestType", ["image-analysis"]);
  const mode = requireEnum(body?.mode, "mode", IMAGE_ANALYSIS_MODES);
  const sourceImage = validateSourceImage(body?.sourceImage);

  return {
    requestType,
    mode,
    sourceImage,
  };
}

function validateEnvironmentProfile(raw, { expectedStatus, fieldPrefix = "confirmedProfile" } = {}) {
  const profile = requireObject(raw, fieldPrefix);
  rejectUnknownFields(
    profile,
    [
      "mode",
      "schemaVersion",
      "analysisId",
      "status",
      "sourceImageId",
      "sourceImageMimeType",
      "summary",
      "surfaceType",
      "spaceSize",
      "boundaryType",
      "visibleEquipment",
      "constraints",
      "safetyNotes",
      "assumptions",
      "analysisConfidence",
    ],
    fieldPrefix
  );
  assertNoTenantFields(profile, fieldPrefix);

  const status = requireEnum(profile.status, `${fieldPrefix}.status`, ANALYSIS_STATUSES);
  if (expectedStatus && status !== expectedStatus) {
    throw validationError("invalid_field", "confirmedProfile.status is not supported", {
      field: `${fieldPrefix}.status`,
      value: status,
      expectedStatus,
    });
  }

  return {
    mode: requireEnum(profile.mode, `${fieldPrefix}.mode`, ["environment_profile"]),
    schemaVersion: 1,
    analysisId: requireString(profile.analysisId, `${fieldPrefix}.analysisId`, { max: 120 }),
    status,
    sourceImageId: requireString(profile.sourceImageId, `${fieldPrefix}.sourceImageId`, { max: 120 }),
    sourceImageMimeType: requireEnum(profile.sourceImageMimeType, `${fieldPrefix}.sourceImageMimeType`, SOURCE_IMAGE_MIME_TYPES),
    summary: requireString(profile.summary, `${fieldPrefix}.summary`, { max: 280 }),
    surfaceType: requireEnum(profile.surfaceType, `${fieldPrefix}.surfaceType`, SURFACE_TYPES),
    spaceSize: requireEnum(profile.spaceSize, `${fieldPrefix}.spaceSize`, SPACE_SIZES),
    boundaryType: requireEnum(profile.boundaryType, `${fieldPrefix}.boundaryType`, BOUNDARY_TYPES),
    visibleEquipment: optionalStringArray(profile.visibleEquipment, `${fieldPrefix}.visibleEquipment`),
    constraints: optionalStringArray(profile.constraints, `${fieldPrefix}.constraints`),
    safetyNotes: optionalStringArray(profile.safetyNotes, `${fieldPrefix}.safetyNotes`),
    assumptions: optionalStringArray(profile.assumptions, `${fieldPrefix}.assumptions`),
    analysisConfidence: requireEnum(
      profile.analysisConfidence,
      `${fieldPrefix}.analysisConfidence`,
      ANALYSIS_CONFIDENCE_VALUES
    ),
  };
}

function validateSetupProfile(raw, { expectedStatus, fieldPrefix = "confirmedProfile" } = {}) {
  const profile = requireObject(raw, fieldPrefix);
  rejectUnknownFields(
    profile,
    [
      "mode",
      "schemaVersion",
      "analysisId",
      "status",
      "sourceImageId",
      "sourceImageMimeType",
      "summary",
      "layoutType",
      "spaceSize",
      "playerOrganization",
      "visibleEquipment",
      "focusTags",
      "constraints",
      "assumptions",
      "analysisConfidence",
    ],
    fieldPrefix
  );
  assertNoTenantFields(profile, fieldPrefix);

  const status = requireEnum(profile.status, `${fieldPrefix}.status`, ANALYSIS_STATUSES);
  if (expectedStatus && status !== expectedStatus) {
    throw validationError("invalid_field", "confirmedProfile.status is not supported", {
      field: `${fieldPrefix}.status`,
      value: status,
      expectedStatus,
    });
  }

  return {
    mode: requireEnum(profile.mode, `${fieldPrefix}.mode`, ["setup_to_drill"]),
    schemaVersion: 1,
    analysisId: requireString(profile.analysisId, `${fieldPrefix}.analysisId`, { max: 120 }),
    status,
    sourceImageId: requireString(profile.sourceImageId, `${fieldPrefix}.sourceImageId`, { max: 120 }),
    sourceImageMimeType: requireEnum(profile.sourceImageMimeType, `${fieldPrefix}.sourceImageMimeType`, SOURCE_IMAGE_MIME_TYPES),
    summary: requireString(profile.summary, `${fieldPrefix}.summary`, { max: 280 }),
    layoutType: requireEnum(profile.layoutType, `${fieldPrefix}.layoutType`, LAYOUT_TYPES),
    spaceSize: requireEnum(profile.spaceSize, `${fieldPrefix}.spaceSize`, SPACE_SIZES),
    playerOrganization: requireEnum(
      profile.playerOrganization,
      `${fieldPrefix}.playerOrganization`,
      PLAYER_ORGANIZATION_VALUES
    ),
    visibleEquipment: optionalStringArray(profile.visibleEquipment, `${fieldPrefix}.visibleEquipment`),
    focusTags: optionalStringArray(profile.focusTags, `${fieldPrefix}.focusTags`),
    constraints: optionalStringArray(profile.constraints, `${fieldPrefix}.constraints`),
    assumptions: optionalStringArray(profile.assumptions, `${fieldPrefix}.assumptions`),
    analysisConfidence: requireEnum(
      profile.analysisConfidence,
      `${fieldPrefix}.analysisConfidence`,
      ANALYSIS_CONFIDENCE_VALUES
    ),
  };
}

function validateConfirmedProfile(raw) {
  if (raw === undefined || raw === null) {
    return undefined;
  }

  const profile = requireObject(raw, "confirmedProfile");
  const mode = requireEnum(profile.mode, "confirmedProfile.mode", IMAGE_ANALYSIS_MODES);

  if (mode === "environment_profile") {
    return validateEnvironmentProfile(raw, { expectedStatus: "confirmed" });
  }

  return validateSetupProfile(raw, { expectedStatus: "confirmed" });
}

module.exports = {
  IMAGE_ANALYSIS_MODES,
  SOURCE_IMAGE_MIME_TYPES,
  ANALYSIS_STATUSES,
  SURFACE_TYPES,
  SPACE_SIZES,
  BOUNDARY_TYPES,
  ANALYSIS_CONFIDENCE_VALUES,
  LAYOUT_TYPES,
  PLAYER_ORGANIZATION_VALUES,
  validateImageAnalysisRequest,
  validateEnvironmentProfile,
  validateSetupProfile,
  validateConfirmedProfile,
  assertNoTenantFields,
};
