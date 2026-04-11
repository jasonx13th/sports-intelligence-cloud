"use strict";

const { validationError } = require("../../platform/validation/validate");

function validateWeeklyPlanningQuery(query) {
  const safeQuery = query || {};
  const unknown = Object.keys(safeQuery);

  if (unknown.length) {
    throw validationError("unknown_fields", "Unknown fields are not allowed", {
      unknown,
    });
  }

  return {};
}

module.exports = {
  validateWeeklyPlanningQuery,
};
