// services/club-vivo/api/_lib/logger.js

function isoNow() {
  return new Date().toISOString();
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
    error: (eventType, message, extra) => emit("ERROR", eventType, message, extra),

    /**
     * Creates a child logger with additional bound context.
     * @param {object} extraContext
     */
    child: (extraContext) => createLogger({ ...ctx, ...(extraContext || {}) }),
  };

  return logger;
}

module.exports = { createLogger };