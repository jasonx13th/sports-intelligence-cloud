"use strict";

const { requireFields, validationError } = require("../../platform/validation/validate");

const LIMITS = {
  idMax: 64,
  nameMax: 80,
  descriptionMax: 280,
  tagsMax: 12,
  tagItemMax: 40,
};

function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body || {}).filter((k) => !allowed.includes(k));
  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      unknown,
    });
  }
}

function requireString(body, field, { max, optional = false } = {}) {
  const v = body?.[field];

  if (optional && (v === undefined || v === null || v === "")) return null;

  if (typeof v !== "string" || !v.trim()) {
    throw validationError("invalid_field", `${field} must be a non-empty string`, {
      field,
    });
  }

  if (max && v.length > max) {
    throw validationError("invalid_field", `${field} is too long`, {
      field,
      max,
    });
  }

  return v;
}

function requireStringArray(body, field, { maxItems, itemMax, optional = false } = {}) {
  const arr = body?.[field];

  if (optional && (arr === undefined || arr === null)) return [];

  if (!Array.isArray(arr)) {
    throw validationError("invalid_field", `${field} must be an array`, { field });
  }

  if (maxItems !== undefined && arr.length > maxItems) {
    throw validationError("invalid_field", `${field} has too many items`, {
      field,
      maxItems,
    });
  }

  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (typeof v !== "string" || !v.trim()) {
      throw validationError("invalid_field", `${field}[${i}] must be a string`, {
        field,
        index: i,
      });
    }

    if (itemMax && v.length > itemMax) {
      throw validationError("invalid_field", `${field}[${i}] is too long`, {
        field,
        index: i,
        itemMax,
      });
    }
  }

  return arr;
}

function validateCreateTemplate(body) {
  const allowed = ["sourceSessionId", "name", "description", "tags"];
  rejectUnknownFields(body, allowed);

  requireFields(body, ["sourceSessionId", "name"]);

  const sourceSessionId = requireString(body, "sourceSessionId", {
    max: LIMITS.idMax,
  });
  const name = requireString(body, "name", {
    max: LIMITS.nameMax,
  });
  const description = requireString(body, "description", {
    max: LIMITS.descriptionMax,
    optional: true,
  });
  const tags = requireStringArray(body, "tags", {
    optional: true,
    maxItems: LIMITS.tagsMax,
    itemMax: LIMITS.tagItemMax,
  });

  return {
    sourceSessionId,
    name,
    ...(description ? { description } : {}),
    ...(tags.length ? { tags } : {}),
  };
}

function validateGenerateFromTemplate(body) {
  const safeBody = body || {};
  rejectUnknownFields(safeBody, []);
  return {};
}

module.exports = {
  validateCreateTemplate,
  validateGenerateFromTemplate,
};
