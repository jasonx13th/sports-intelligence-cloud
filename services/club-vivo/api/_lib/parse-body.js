function parseJsonBody(event) {
  if (!event?.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    const err = new Error("Request body must be valid JSON");
    err.statusCode = 400;
    err.code = "invalid_json";
    throw err;
  }
}

module.exports = { parseJsonBody };