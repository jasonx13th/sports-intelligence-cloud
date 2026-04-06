// services/club-vivo/api/src/platform/logging/logger.js

function isoNow() {
  return new Date().toISOString();
}

const CORRELATION_ID_RE = /^[A-Za-z0-9._-]{8,128}$/;

function getHeader(headers, name) {
  if (!headers) return undefined;
  const target = String(name).toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() === target) return v;
  }
  return undefined;
}

/**
 * Extract and validate correlation id per platform contract.
 * @param {object} headers - event.headers (may be undefined)
 * @param {string} fallbackRequestId
 * @returns {{correlationId: string, correlationSource: 'client'|'fallback', correlationInvalid: boolean, suppliedLength?: number}}
 */
function resolveCorrelation(headers, fallbackRequestId) {
  const supplied = getHeader(headers, "x-correlation-id");
  if (typeof supplied === "string") {
    const trimmed = supplied.trim();
    if (CORRELATION_ID_RE.test(trimmed)) {
      return { correlationId: trimmed, correlationSource: "client", correlationInvalid: false };
    }
    // invalid: do NOT return the value; only safe metadata
    return {
      correlationId: fallbackRequestId,
      correlationSource: "fallback",
      correlationInvalid: true,
      suppliedLength: trimmed.length,
    };
  }
  return { correlationId: fallbackRequestId, correlationSource: "fallback", correlationInvalid: false };
}

/**
 * Normalize an Error into a safe structured shape.
 * Does NOT include stack traces by default (can be added later behind env flag).
 * @param {any} err
 * @returns {{name: string, code?: string, retryable?: boolean}}
 */
function normalizeError(err) {
  if (!err || typeof err !== "object") {
    return { name: "UnknownError" };
  }

  const name = typeof err.name === "string" ? err.name : "Error";
  const code = typeof err.code === "string" ? err.code : undefined;
  const retryable = typeof err.retryable === "boolean" ? err.retryable : undefined;

  return { name, ...(code ? { code } : {}), ...(retryable !== undefined ? { retryable } : {}) };
}

/**
 * @param {object} baseContext - stable fields (service/env/requestId/correlationId/etc)
 */
function createLogger(baseContext) {
  const ctx = { ...baseContext };

  function emit(level, eventType, message, extra) {
    const record = {
      timestamp: isoNow(),
      level,
      ...ctx,
      eventType,
      message,
      ...(extra && typeof extra === "object" ? extra : {}),
    };

    // CloudWatch best practice: one JSON object per line
    console.log(JSON.stringify(record));
  }

  const logger = {
    debug: (eventType, message, extra) => emit("DEBUG", eventType, message, extra),
    info: (eventType, message, extra) => emit("INFO", eventType, message, extra),
    warn: (eventType, message, extra) => emit("WARN", eventType, message, extra),

    /**
     * Log an error with normalized structured error fields.
     * @param {string} eventType
     * @param {string} message
     * @param {any} err
     * @param {object} [extra]
     */
    error: (eventType, message, err, extra) => {
      const errorObj = normalizeError(err);
      emit("ERROR", eventType, message, { ...(extra || {}), error: errorObj });
    },

    /**
     * Creates a child logger with additional bound context.
     * @param {object} extraContext
     */
    child: (extraContext) => createLogger({ ...ctx, ...(extraContext || {}) }),
  };

  return logger;
}

module.exports = { createLogger, resolveCorrelation, normalizeError };
