"use strict";

const { requireFields, validationError } = require("../../platform/validation/validate");
const {
  SUPPORTED_AGE_BANDS,
  normalizeAgeBand,
  requireEquipmentArray,
} = require("./session-validate");
const {
  DRILL_DIAGRAM_SPEC_VERSION,
  DRILL_DIAGRAM_TYPES,
  validateDiagramSpecV1,
} = require("./diagram-spec-validate");
const { validateConfirmedProfile } = require("./image-intake-validate");

const SUPPORTED_SPORT_PACK_IDS = ["fut-soccer"];
const SUPPORTED_SESSION_MODES = ["full_session", "drill", "quick_activity"];

// Keep bounds tight; expand later with product evidence.
const LIMITS = {
  sportMax: 40,
  ageBandMax: 40,
  themeMax: 60,
  coachNotesMax: 1000,
  durationMinMin: 5,
  durationMinMax: 240,
  sessionsCountMin: 1,
  sessionsCountMax: 6,
};
const SESSION_PACK_V2_SPEC_VERSION = "session-pack.v2";
const SESSION_PACK_V2_PHASES = ["warm-up", "technical", "main", "game", "cooldown"];
const SESSION_PACK_V2_INTENSITIES = ["low", "medium", "high"];

function rejectUnknownFields(body, allowed, field) {
  const unknown = Object.keys(body || {}).filter((k) => !allowed.includes(k));
  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      ...(field ? { field } : {}),
      unknown,
    });
  }
}

function requireString(body, field, { max } = {}) {
  const v = body?.[field];
  if (typeof v !== "string" || !v.trim()) {
    throw validationError("invalid_field", `${field} must be a non-empty string`, { field });
  }
  if (max && v.length > max) {
    throw validationError("invalid_field", `${field} is too long`, { field, max });
  }
  return v.trim();
}

function requireSupportedAgeBand(body, field) {
  const raw = requireString(body, field, { max: LIMITS.ageBandMax });
  const ageBand = normalizeAgeBand(raw);

  if (!SUPPORTED_AGE_BANDS.includes(ageBand)) {
    throw validationError("invalid_field", `${field} is not supported`, {
      reason: "unsupported_age_band",
      field,
      value: raw,
    });
  }

  return ageBand;
}

function requireInt(body, field, { min, max } = {}) {
  const v = body?.[field];
  if (!Number.isInteger(v)) {
    throw validationError("invalid_field", `${field} must be an integer`, { field });
  }
  if (min !== undefined && v < min) {
    throw validationError("invalid_field", `${field} is too small`, { field, min });
  }
  if (max !== undefined && v > max) {
    throw validationError("invalid_field", `${field} is too large`, { field, max });
  }
  return v;
}

function requireObject(body, field) {
  const v = body?.[field];
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    throw validationError("invalid_field", `${field} must be an object`, { field });
  }

  return v;
}

function optionalString(body, field, { max } = {}) {
  const v = body?.[field];
  if (v === undefined || v === null || v === "") {
    return undefined;
  }

  if (typeof v !== "string" || !v.trim()) {
    throw validationError("invalid_field", `${field} must be a string`, { field });
  }

  if (max && v.length > max) {
    throw validationError("invalid_field", `${field} is too long`, { field, max });
  }

  return v.trim();
}

function optionalStringArray(body, field) {
  const arr = body?.[field];
  if (arr === undefined || arr === null) {
    return undefined;
  }

  if (!Array.isArray(arr)) {
    throw validationError("invalid_field", `${field} must be an array`, { field });
  }

  return arr.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw validationError("invalid_field", `${field}[${index}] must be a string`, {
        field,
        index,
      });
    }

    return item.trim();
  });
}

function optionalEnum(body, field, allowed, reason) {
  const v = body?.[field];
  if (v === undefined || v === null || v === "") {
    return undefined;
  }

  const value = requireString(body, field);
  if (!allowed.includes(value)) {
    throw validationError("invalid_field", `${field} is not supported`, {
      reason,
      field,
      value,
      allowed,
    });
  }

  return value;
}

function requireEquipmentValue(body, field) {
  const value = body?.[field];

  if (value === undefined || value === null) {
    throw validationError("missing_fields", `Missing required fields: ${field}`, {
      missing: [field],
    });
  }

  if (Array.isArray(value)) {
    return requireEquipmentArray(body, field);
  }

  if (typeof value === "object") {
    return value;
  }

  throw validationError("invalid_field", `${field} must be an array or object`, { field });
}

function validateSpace(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw validationError("invalid_field", `${field} must be an object`, { field });
  }

  rejectUnknownFields(value, ["surfaceType", "areaType", "sizeLabel", "width", "length", "units"], field);

  return {
    ...(value.surfaceType !== undefined ? { surfaceType: requireString(value, "surfaceType") } : {}),
    ...(value.areaType !== undefined ? { areaType: requireString(value, "areaType") } : {}),
    ...(value.sizeLabel !== undefined ? { sizeLabel: requireString(value, "sizeLabel") } : {}),
    ...(value.width !== undefined ? { width: requireInt(value, "width", { min: 1 }) } : {}),
    ...(value.length !== undefined ? { length: requireInt(value, "length", { min: 1 }) } : {}),
    ...(value.units !== undefined ? { units: requireString(value, "units") } : {}),
  };
}

function validateDiagramWrapper(diagram, activityId, activityIndex, diagramIndex) {
  const field = `activities[${activityIndex}].diagrams[${diagramIndex}]`;
  if (!diagram || typeof diagram !== "object" || Array.isArray(diagram)) {
    throw validationError("invalid_field", `${field} must be an object`, { field });
  }

  rejectUnknownFields(diagram, ["diagramId", "specVersion", "diagramType", "title", "spec"], field);

  const diagramId = requireString(diagram, "diagramId");
  const specVersion = requireString(diagram, "specVersion");
  const diagramType = requireString(diagram, "diagramType");
  const title = requireString(diagram, "title");

  if (specVersion !== DRILL_DIAGRAM_SPEC_VERSION) {
    throw validationError("invalid_field", "specVersion is not supported", {
      reason: "invalid_spec_version",
      field: "specVersion",
      value: specVersion,
      expected: DRILL_DIAGRAM_SPEC_VERSION,
    });
  }

  if (!DRILL_DIAGRAM_TYPES.includes(diagramType)) {
    throw validationError("invalid_field", "diagramType is not supported", {
      reason: "unsupported_diagram_type",
      field: "diagramType",
      value: diagramType,
      allowed: DRILL_DIAGRAM_TYPES,
    });
  }

  const spec = validateDiagramSpecV1(diagram.spec, { allowedSports: ["soccer"] });

  if (spec.activityId !== activityId) {
    throw validationError("invalid_field", "diagram activityId must match activity", {
      reason: "diagram_activity_mismatch",
      field: "activityId",
      value: spec.activityId,
      expected: activityId,
    });
  }

  if (spec.diagramId !== diagramId) {
    throw validationError("invalid_field", "diagramId must match spec.diagramId", {
      reason: "diagram_id_mismatch",
      field: "diagramId",
      value: diagramId,
      expected: spec.diagramId,
    });
  }

  if (spec.diagramType !== diagramType) {
    throw validationError("invalid_field", "diagramType must match spec.diagramType", {
      reason: "diagram_type_mismatch",
      field: "diagramType",
      value: diagramType,
      expected: spec.diagramType,
    });
  }

  return { diagramId, specVersion, diagramType, title, spec };
}

function getMissingEquipmentForTheme(_theme, _equipment) {
  // Equipment is generation context, not a hard request blocker. If the coach
  // selected cones/balls for a finishing idea, the generator should adapt to
  // gates, target lines, end zones, or possession points instead of rejecting.
  return [];
}

function validateCreateSessionPack(body) {
  const allowed = [
    "sport",
    "sportPackId",
    "ageBand",
    "durationMin",
    "theme",
    "sessionMode",
    "coachNotes",
    "sessionsCount",
    "equipment",
    "confirmedProfile",
  ];
  rejectUnknownFields(body, allowed);

  requireFields(body, ["sport", "ageBand", "durationMin", "theme"]);

  const sport = requireString(body, "sport", { max: LIMITS.sportMax });
  const sportPackId = optionalString(body, "sportPackId", { max: LIMITS.sportMax });
  const ageBand = requireSupportedAgeBand(body, "ageBand");
  const durationMin = requireInt(body, "durationMin", {
    min: LIMITS.durationMinMin,
    max: LIMITS.durationMinMax,
  });
  const theme = requireString(body, "theme", { max: LIMITS.themeMax });
  const sessionMode = optionalEnum(body, "sessionMode", SUPPORTED_SESSION_MODES, "unsupported_session_mode");
  const coachNotes = optionalString(body, "coachNotes", { max: LIMITS.coachNotesMax });
  const equipment = requireEquipmentArray(body, "equipment");

  const sessionsCountRaw = body?.sessionsCount;
  const sessionsCount =
    sessionsCountRaw === undefined || sessionsCountRaw === null
      ? 3
      : requireInt(body, "sessionsCount", {
          min: LIMITS.sessionsCountMin,
          max: LIMITS.sessionsCountMax,
        });

  const missingEquipment = getMissingEquipmentForTheme(theme, equipment);
  if (missingEquipment.length) {
    throw validationError(
      "invalid_field",
      "equipment is incompatible with one or more generated sessions",
      {
        reason: "incompatible_equipment",
        field: "equipment",
        missingEquipment,
      }
    );
  }

  if (sportPackId !== undefined && !SUPPORTED_SPORT_PACK_IDS.includes(sportPackId)) {
    throw validationError("invalid_field", "sportPackId is not supported", {
      reason: "unsupported_sport_pack",
      field: "sportPackId",
      value: sportPackId,
      allowed: SUPPORTED_SPORT_PACK_IDS,
    });
  }

  if (sportPackId === "fut-soccer" && sport !== "soccer") {
    throw validationError("invalid_field", "sportPackId is not supported for the provided sport", {
      reason: "sport_pack_sport_mismatch",
      field: "sportPackId",
      sport,
      sportPackId,
      allowedSport: "soccer",
    });
  }

  return {
    sport,
    ...(sportPackId !== undefined ? { sportPackId } : {}),
    ageBand,
    durationMin,
    theme,
    ...(sessionMode !== undefined ? { sessionMode } : {}),
    ...(coachNotes !== undefined ? { coachNotes } : {}),
    sessionsCount,
    ...(equipment.length ? { equipment } : {}),
    ...(body?.confirmedProfile ? { confirmedProfile: validateConfirmedProfile(body.confirmedProfile) } : {}),
  };
}

function validateActivity(activity, index) {
  const field = `activities[${index}]`;
  if (!activity || typeof activity !== "object" || Array.isArray(activity)) {
    throw validationError("invalid_field", `${field} must be an object`, { field });
  }

  rejectUnknownFields(
    activity,
    [
      "activityId",
      "name",
      "phase",
      "minutes",
      "objective",
      "setup",
      "instructions",
      "organization",
      "coachingPoints",
      "progressions",
      "regressions",
      "commonMistakes",
      "equipment",
      "space",
      "constraints",
      "diagrams",
    ],
    field
  );

  const activityId = requireString(activity, "activityId");
  const name = requireString(activity, "name");
  const phase = optionalEnum(activity, "phase", SESSION_PACK_V2_PHASES, "unsupported_activity_phase");
  const minutes = requireInt(activity, "minutes", { min: 1, max: LIMITS.durationMinMax });
  const objective = optionalString(activity, "objective");
  const setup = requireString(activity, "setup");
  const instructions = requireString(activity, "instructions");
  const coachingPoints = optionalStringArray(activity, "coachingPoints") || [];
  const equipment = requireEquipmentValue(activity, "equipment");

  if (coachingPoints.length < 1) {
    throw validationError("invalid_field", "coachingPoints must be a non-empty array", {
      field: "coachingPoints",
    });
  }

  const organization =
    activity.organization === undefined || activity.organization === null
      ? undefined
      : typeof activity.organization === "string"
        ? requireString(activity, "organization")
        : requireObject(activity, "organization");

  return {
    activityId,
    name,
    ...(phase !== undefined ? { phase } : {}),
    minutes,
    ...(objective !== undefined ? { objective } : {}),
    setup,
    instructions,
    ...(organization !== undefined ? { organization } : {}),
    coachingPoints,
    ...(optionalStringArray(activity, "progressions") !== undefined
      ? { progressions: optionalStringArray(activity, "progressions") }
      : {}),
    ...(optionalStringArray(activity, "regressions") !== undefined
      ? { regressions: optionalStringArray(activity, "regressions") }
      : {}),
    ...(optionalStringArray(activity, "commonMistakes") !== undefined
      ? { commonMistakes: optionalStringArray(activity, "commonMistakes") }
      : {}),
    equipment,
    ...(activity.space !== undefined ? { space: validateSpace(activity.space, "space") } : {}),
    ...(optionalStringArray(activity, "constraints") !== undefined
      ? { constraints: optionalStringArray(activity, "constraints") }
      : {}),
    ...(activity.diagrams !== undefined
      ? {
          diagrams: Array.isArray(activity.diagrams)
            ? activity.diagrams.map((diagram, diagramIndex) =>
                validateDiagramWrapper(diagram, activityId, index, diagramIndex)
              )
            : (() => {
                throw validationError("invalid_field", "diagrams must be an array", {
                  field: "diagrams",
                });
              })(),
        }
      : {}),
  };
}

function validateSessionPackV2Draft(pack) {
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
    throw validationError("invalid_field", "pack must be an object", { field: "pack" });
  }

  rejectUnknownFields(pack, [
    "sessionPackId",
    "specVersion",
    "title",
    "sport",
    "ageGroup",
    "level",
    "durationMinutes",
    "equipment",
    "space",
    "intensity",
    "objective",
    "activities",
    "cooldown",
    "safetyNotes",
    "successCriteria",
    "assumptions",
    "metadata",
    "export",
  ]);

  const sessionPackId = requireString(pack, "sessionPackId");
  const specVersion = requireString(pack, "specVersion");
  const title = requireString(pack, "title");
  const sport = requireString(pack, "sport");
  const ageGroup = requireString(pack, "ageGroup", { max: LIMITS.ageBandMax });
  const level = optionalString(pack, "level");
  const durationMinutes = requireInt(pack, "durationMinutes", {
    min: LIMITS.durationMinMin,
    max: LIMITS.durationMinMax,
  });
  const equipment = requireEquipmentValue(pack, "equipment");
  const space = validateSpace(requireObject(pack, "space"), "space");
  const intensity = optionalEnum(pack, "intensity", SESSION_PACK_V2_INTENSITIES, "unsupported_intensity");
  const objective = requireString(pack, "objective");

  if (specVersion !== SESSION_PACK_V2_SPEC_VERSION) {
    throw validationError("invalid_field", "specVersion is not supported", {
      reason: "invalid_session_pack_spec_version",
      field: "specVersion",
      value: specVersion,
      expected: SESSION_PACK_V2_SPEC_VERSION,
    });
  }

  if (sport !== "soccer") {
    throw validationError("invalid_field", "sport is not supported", {
      reason: "unsupported_sport",
      field: "sport",
      value: sport,
      allowed: ["soccer"],
    });
  }

  if (!Array.isArray(pack.activities) || pack.activities.length < 1) {
    throw validationError("invalid_field", "activities must be a non-empty array", {
      field: "activities",
    });
  }

  const activities = pack.activities.map((activity, index) => validateActivity(activity, index));
  const cooldown =
    pack.cooldown === undefined
      ? undefined
      : (() => {
          const value = requireObject(pack, "cooldown");
          rejectUnknownFields(value, ["minutes", "instructions", "notes"], "cooldown");

          return {
            ...(value.minutes !== undefined ? { minutes: requireInt(value, "minutes", { min: 1, max: 60 }) } : {}),
            ...(value.instructions !== undefined ? { instructions: requireString(value, "instructions") } : {}),
            ...(value.notes !== undefined ? { notes: requireString(value, "notes") } : {}),
          };
        })();

  const activitiesTotal = activities.reduce((sum, activity) => sum + activity.minutes, 0);
  const cooldownMinutes = cooldown?.minutes || 0;

  if (activitiesTotal + cooldownMinutes !== durationMinutes) {
    throw validationError("invalid_field", "Sum of activities and cooldown must equal durationMinutes", {
      reason: "invalid_duration_total",
      totalMinutes: activitiesTotal + cooldownMinutes,
      durationMinutes,
    });
  }

  return {
    sessionPackId,
    specVersion,
    title,
    sport,
    ageGroup,
    ...(level !== undefined ? { level } : {}),
    durationMinutes,
    equipment,
    space,
    ...(intensity !== undefined ? { intensity } : {}),
    objective,
    activities,
    ...(cooldown !== undefined ? { cooldown } : {}),
    ...(optionalStringArray(pack, "safetyNotes") !== undefined
      ? { safetyNotes: optionalStringArray(pack, "safetyNotes") }
      : {}),
    ...(optionalStringArray(pack, "successCriteria") !== undefined
      ? { successCriteria: optionalStringArray(pack, "successCriteria") }
      : {}),
    ...(optionalStringArray(pack, "assumptions") !== undefined
      ? { assumptions: optionalStringArray(pack, "assumptions") }
      : {}),
    ...(pack.metadata !== undefined ? { metadata: requireObject(pack, "metadata") } : {}),
    ...(pack.export !== undefined ? { export: requireObject(pack, "export") } : {}),
  };
}

module.exports = {
  validateCreateSessionPack,
  validateSessionPackV2Draft,
  LIMITS,
  getMissingEquipmentForTheme,
  SUPPORTED_SPORT_PACK_IDS,
};
