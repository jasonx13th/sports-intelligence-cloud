function validationError(code, message, details = {}) {
  const err = new Error(message);
  err.statusCode = 400;
  err.code = code;
  err.details = details;
  return err;
}

function requireFields(body, fields) {
  const missing = [];

  for (const field of fields) {
    const value = body?.[field];

    if (value === undefined || value === null || value === "") {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw validationError(
      "missing_fields",
      `Missing required fields: ${missing.join(", ")}`,
      { missing }
    );
  }
}

module.exports = { requireFields, validationError };