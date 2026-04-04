"use strict";

const { validationError } = require("./validate");

const DRILL_DIAGRAM_SPEC_VERSION = "drill-diagram-spec.v1";
const DRILL_DIAGRAM_TYPES = ["setup", "sequence", "progression", "regression", "condition"];

const OBJECT_TYPES = [
  "cone",
  "ball",
  "player",
  "goal",
  "mini_goal",
  "pole",
  "mannequin",
  "marker",
  "coach",
  "gate",
  "zone_anchor",
];

const ZONE_SHAPES = ["rectangle", "circle"];
const CONNECTION_TYPES = ["pass", "movement", "dribble", "shot", "rotation", "press", "support"];

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

function requireString(body, field) {
  const value = body?.[field];

  if (typeof value !== "string" || !value.trim()) {
    throw validationError("invalid_field", `${field} must be a non-empty string`, { field });
  }

  return value.trim();
}

function requireNumber(body, field, { min } = {}) {
  const value = body?.[field];

  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw validationError("invalid_field", `${field} must be a number`, { field });
  }

  if (min !== undefined && value < min) {
    throw validationError("invalid_field", `${field} is too small`, { field, min });
  }

  return value;
}

function requireEnum(body, field, allowed, reason) {
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

function validateZone(zone, index) {
  const value = requireObject(zone, `field.zones[${index}]`);
  rejectUnknownFields(value, ["zoneId", "shape", "x", "y", "width", "height", "radius", "label", "dashed"]);

  const shape = requireEnum(value, "shape", ZONE_SHAPES, "unsupported_zone_shape");
  const normalized = {
    zoneId: requireString(value, "zoneId"),
    shape,
    x: requireNumber(value, "x"),
    y: requireNumber(value, "y"),
  };

  if (shape === "rectangle") {
    normalized.width = requireNumber(value, "width", { min: 1 });
    normalized.height = requireNumber(value, "height", { min: 1 });
  } else {
    normalized.radius = requireNumber(value, "radius", { min: 1 });
  }

  return normalized;
}

function validateField(fieldValue) {
  const value = requireObject(fieldValue, "field");
  rejectUnknownFields(value, ["surfaceType", "view", "orientation", "zones"], "field");

  return {
    ...(value.surfaceType !== undefined ? { surfaceType: requireString(value, "surfaceType") } : {}),
    ...(value.view !== undefined ? { view: requireString(value, "view") } : {}),
    ...(value.orientation !== undefined ? { orientation: requireString(value, "orientation") } : {}),
    ...(value.zones !== undefined
      ? {
          zones: Array.isArray(value.zones)
            ? value.zones.map((zone, index) => validateZone(zone, index))
            : (() => {
                throw validationError("invalid_field", "field.zones must be an array", {
                  field: "field.zones",
                });
              })(),
        }
      : {}),
  };
}

function validateObject(object, index) {
  const value = requireObject(object, `objects[${index}]`);
  rejectUnknownFields(
    value,
    ["objectId", "type", "x", "y", "label", "color", "role", "team", "hasBall", "facing", "width", "height", "rotation"],
    `objects[${index}]`
  );

  return {
    objectId: requireString(value, "objectId"),
    type: requireEnum(value, "type", OBJECT_TYPES, "unsupported_object_type"),
    x: requireNumber(value, "x"),
    y: requireNumber(value, "y"),
  };
}

function validateConnection(connection, index, refs) {
  const value = requireObject(connection, `connections[${index}]`);
  rejectUnknownFields(
    value,
    ["connectionId", "type", "fromRef", "toRef", "style", "label", "sequenceOrder", "dashed", "curve"],
    `connections[${index}]`
  );

  const normalized = {
    connectionId: requireString(value, "connectionId"),
    type: requireEnum(value, "type", CONNECTION_TYPES, "unsupported_connection_type"),
    fromRef: requireString(value, "fromRef"),
    toRef: requireString(value, "toRef"),
  };

  for (const field of ["fromRef", "toRef"]) {
    if (!refs.has(normalized[field])) {
      throw validationError("invalid_field", "Connection reference is invalid", {
        reason: "invalid_connection_ref",
        field,
        value: normalized[field],
        connectionId: normalized.connectionId,
      });
    }
  }

  return normalized;
}

function validateDiagramSpecV1(spec, options = {}) {
  const value = requireObject(spec, "spec");
  rejectUnknownFields(
    value,
    [
      "diagramId",
      "specVersion",
      "activityId",
      "title",
      "diagramType",
      "sport",
      "canvas",
      "field",
      "objects",
      "connections",
      "annotations",
      "legend",
      "renderHints",
      "validation",
    ],
    "spec"
  );

  const allowedSports = Array.isArray(options.allowedSports) && options.allowedSports.length
    ? options.allowedSports
    : ["soccer"];

  const normalized = {
    diagramId: requireString(value, "diagramId"),
    specVersion: requireString(value, "specVersion"),
    activityId: requireString(value, "activityId"),
    title: requireString(value, "title"),
    diagramType: requireEnum(value, "diagramType", DRILL_DIAGRAM_TYPES, "unsupported_diagram_type"),
    sport: requireString(value, "sport"),
  };

  if (normalized.specVersion !== DRILL_DIAGRAM_SPEC_VERSION) {
    throw validationError("invalid_field", "specVersion is not supported", {
      reason: "invalid_spec_version",
      field: "specVersion",
      value: normalized.specVersion,
      expected: DRILL_DIAGRAM_SPEC_VERSION,
    });
  }

  if (!allowedSports.includes(normalized.sport)) {
    throw validationError("invalid_field", "sport is not supported", {
      reason: "unsupported_sport",
      field: "sport",
      value: normalized.sport,
      allowed: allowedSports,
    });
  }

  if (!Array.isArray(value.objects) || value.objects.length < 1) {
    throw validationError("invalid_field", "objects must be a non-empty array", {
      field: "objects",
    });
  }

  const field = value.field !== undefined ? validateField(value.field) : undefined;
  const objects = value.objects.map((object, index) => validateObject(object, index));
  const refs = new Set(objects.map((object) => object.objectId));

  for (const zone of field?.zones || []) {
    refs.add(zone.zoneId);
  }

  return {
    ...normalized,
    ...(field !== undefined ? { field } : {}),
    objects,
    ...(value.connections !== undefined
      ? {
          connections: Array.isArray(value.connections)
            ? value.connections.map((connection, index) => validateConnection(connection, index, refs))
            : (() => {
                throw validationError("invalid_field", "connections must be an array", {
                  field: "connections",
                });
              })(),
        }
      : {}),
  };
}

module.exports = {
  DRILL_DIAGRAM_SPEC_VERSION,
  DRILL_DIAGRAM_TYPES,
  validateDiagramSpecV1,
};
