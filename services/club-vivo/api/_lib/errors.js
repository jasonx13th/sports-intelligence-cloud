"use strict";

/**
 * SIC Platform Error Contract
 * - Deterministic mapping to HTTP status (4XX vs 5XX)
 * - retryable flag is explicit (clients must NOT retry unless retryable=true)
 * - message is safe-for-client (no internal details)
 */

class AppError extends Error {
  /**
   * @param {object} params
   * @param {string} params.code - stable error code (string)
   * @param {number} params.httpStatus - mapped HTTP status
   * @param {string} params.message - safe client message
   * @param {boolean} [params.retryable=false] - client may retry if true AND operation is safe
   * @param {object} [params.details] - safe details for clients (optional)
   * @param {Error} [params.cause] - original error (optional, not returned to clients)
   */
  constructor({ code, httpStatus, message, retryable = false, details, cause } = {}) {
    super(message || "Error");
    this.name = this.constructor.name;

    if (!code || typeof code !== "string") throw new Error("AppError requires string code");
    if (!httpStatus || typeof httpStatus !== "number") throw new Error("AppError requires numeric httpStatus");

    this.code = code;
    this.httpStatus = httpStatus;
    this.retryable = Boolean(retryable);
    this.details = details;

    // Preserve original cause for internal logs only
    if (cause) this.cause = cause;
  }
}

// ---- 4XX (never retry) ----
class BadRequestError extends AppError {
  constructor({ code = "platform.bad_request", message = "Bad request", details, cause } = {}) {
    super({ code, httpStatus: 400, message, retryable: false, details, cause });
  }
}

class UnauthorizedError extends AppError {
  constructor({ code = "platform.unauthorized", message = "Unauthorized", details, cause } = {}) {
    super({ code, httpStatus: 401, message, retryable: false, details, cause });
  }
}

class ForbiddenError extends AppError {
  constructor({ code = "platform.forbidden", message = "Forbidden", details, cause } = {}) {
    super({ code, httpStatus: 403, message, retryable: false, details, cause });
  }
}

class NotFoundError extends AppError {
  constructor({ code = "platform.not_found", message = "Not found", details, cause } = {}) {
    super({ code, httpStatus: 404, message, retryable: false, details, cause });
  }
}

class ConflictError extends AppError {
  constructor({ code = "platform.conflict", message = "Conflict", details, cause } = {}) {
    super({ code, httpStatus: 409, message, retryable: false, details, cause });
  }
}

class TooManyRequestsError extends AppError {
  constructor({ code = "platform.throttled", message = "Too many requests", details, cause } = {}) {
    super({ code, httpStatus: 429, message, retryable: false, details, cause });
  }
}

// ---- 5XX (retryable must be explicit) ----
class ServiceUnavailableError extends AppError {
  constructor({ code = "platform.unavailable", message = "Service unavailable", details, cause } = {}) {
    super({ code, httpStatus: 503, message, retryable: true, details, cause });
  }
}

class InternalError extends AppError {
  constructor({ code = "platform.internal", message = "Internal server error", details, cause, retryable = false } = {}) {
    super({ code, httpStatus: 500, message, retryable: Boolean(retryable), details, cause });
  }
}

/**
 * Convert any error to the platform error response envelope.
 * NOTE: This returns ONLY safe fields to the client.
 */
function toErrorResponse(err, correlationId) {
  const safeCorrelationId = correlationId || "unknown";

  if (err instanceof AppError) {
    const body = {
      error: {
        code: err.code,
        message: err.message,
        retryable: err.retryable,
      },
      correlationId: safeCorrelationId,
    };
    if (err.details !== undefined) body.error.details = err.details;
    return { httpStatus: err.httpStatus, body };
  }

  // Unknown error -> internal
  const body = {
    error: {
      code: "platform.internal",
      message: "Internal server error",
      retryable: false,
    },
    correlationId: safeCorrelationId,
  };
  return { httpStatus: 500, body };
}

module.exports = {
  AppError,

  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,

  ServiceUnavailableError,
  InternalError,

  toErrorResponse,
};
