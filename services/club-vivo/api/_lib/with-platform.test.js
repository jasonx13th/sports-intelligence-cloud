"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { UnauthorizedError, ForbiddenError } = require("./errors");
const { createWithPlatform } = require("./with-platform");

function createCapturingLogger(store, bound = {}) {
  function push(level, eventType, message, extra = {}) {
    store.push({
      level,
      eventType,
      message,
      ...bound,
      ...extra,
    });
  }

  return {
    debug: (eventType, message, extra) => push("DEBUG", eventType, message, extra),
    info: (eventType, message, extra) => push("INFO", eventType, message, extra),
    warn: (eventType, message, extra) => push("WARN", eventType, message, extra),
    error: (eventType, message, err, extra = {}) =>
      push("ERROR", eventType, message, {
        ...extra,
        error: {
          name: err?.name,
          code: err?.code,
          retryable: err?.retryable,
        },
      }),
    child: (extraContext) => createCapturingLogger(store, { ...bound, ...(extraContext || {}) }),
  };
}

function makeEvent({
  path = "/sessions",
  method = "GET",
  headers,
  claims = { sub: "user-123", "cognito:groups": ["cv-coach"] },
} = {}) {
  return {
    rawPath: path,
    headers,
    requestContext: {
      requestId: "apigw-req-123",
      http: {
        method,
      },
      authorizer: {
        jwt: {
          claims,
        },
      },
    },
  };
}

test("withPlatform normalizes post-authorizer forbidden failures and returns correlation headers", async () => {
  const logs = [];
  let innerCalled = false;

  const withPlatform = createWithPlatform({
    loadBuildTenantContextFn: () => async () => {
      throw new ForbiddenError({
        code: "platform.entitlements.missing_role",
        message: "Forbidden",
        details: { attrName: "role" },
      });
    },
    createLoggerFn: (context) => createCapturingLogger(logs, context),
  });

  const handler = withPlatform(async () => {
    innerCalled = true;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  });

  const response = await handler(
    makeEvent({
      headers: { "x-correlation-id": "corr-12345" },
    }),
    { awsRequestId: "lambda-req-123" }
  );

  assert.equal(innerCalled, false);
  assert.equal(response.statusCode, 403);
  assert.equal(response.headers["x-correlation-id"], "corr-12345");
  assert.equal(response.headers["X-Correlation-Id"], "corr-12345");

  const body = JSON.parse(response.body);
  assert.equal(body.error.code, "platform.entitlements.missing_role");
  assert.equal(body.requestId, "lambda-req-123");
  assert.equal(body.correlationId, "corr-12345");

  const warnEvent = logs.find((entry) => entry.eventType === "auth_forbidden");
  assert.ok(warnEvent);
  assert.equal(warnEvent.level, "WARN");
  assert.equal(warnEvent.requestId, "lambda-req-123");
});

test("withPlatform logs 400-class validation failures as WARN", async () => {
  const logs = [];

  const withPlatform = createWithPlatform({
    loadBuildTenantContextFn: () => async () => ({
      tenantId: "tenant_authoritative",
      userId: "user-123",
      role: "coach",
      tier: "pro",
    }),
    createLoggerFn: (context) => createCapturingLogger(logs, context),
  });

  const handler = withPlatform(async () => {
    throw new UnauthorizedError({
      code: "platform.unauthorized",
      message: "Unauthorized",
    });
  });

  const response = await handler(
    makeEvent({
      headers: { "x-correlation-id": "warn-401-123" },
    }),
    { awsRequestId: "lambda-req-401" }
  );

  assert.equal(response.statusCode, 401);

  const warnEvent = logs.find((entry) => entry.eventType === "auth_unauthenticated");
  assert.ok(warnEvent);
  assert.equal(warnEvent.level, "WARN");
  assert.equal(warnEvent.tenantId, "tenant_authoritative");
});

test("withPlatform falls back to requestId when correlation header is invalid", async () => {
  const logs = [];

  const withPlatform = createWithPlatform({
    loadBuildTenantContextFn: () => async () => {
      throw new UnauthorizedError({
        code: "platform.unauthorized",
        message: "Unauthorized",
      });
    },
    createLoggerFn: (context) => createCapturingLogger(logs, context),
  });

  const handler = withPlatform(async () => {
    throw new Error("inner should not run");
  });

  const response = await handler(
    makeEvent({
      headers: { "x-correlation-id": "bad!" },
      claims: null,
    }),
    { awsRequestId: "lambda-req-456" }
  );

  assert.equal(response.statusCode, 401);
  assert.equal(response.headers["x-correlation-id"], "lambda-req-456");

  const invalidEvent = logs.find((entry) => entry.eventType === "correlation_invalid");
  assert.ok(invalidEvent);
  assert.equal(invalidEvent.level, "WARN");
  assert.equal(invalidEvent.suppliedLength, 4);
});

test("withPlatform logs unknown 5xx failures as ERROR", async () => {
  const logs = [];

  const withPlatform = createWithPlatform({
    loadBuildTenantContextFn: () => async () => ({
      tenantId: "tenant_authoritative",
      userId: "user-123",
      role: "coach",
      tier: "pro",
    }),
    createLoggerFn: (context) => createCapturingLogger(logs, context),
  });

  const handler = withPlatform(async () => {
    throw new Error("boom");
  });

  const response = await handler(
    makeEvent({
      headers: { "x-correlation-id": "error-500-1" },
    }),
    { awsRequestId: "lambda-req-500" }
  );

  assert.equal(response.statusCode, 500);

  const errorEvent = logs.find((entry) => entry.eventType === "handler_error");
  assert.ok(errorEvent);
  assert.equal(errorEvent.level, "ERROR");
  assert.equal(errorEvent.error.code, "platform.internal");
  assert.equal(errorEvent.tenantId, "tenant_authoritative");
});

test("withPlatform resolves tenant context before calling inner handler and preserves tenant-scoped log context", async () => {
  const logs = [];
  const eventsSeen = [];

  const withPlatform = createWithPlatform({
    loadBuildTenantContextFn: () => async (event) => {
      eventsSeen.push(event);
      return {
        tenantId: "tenant_authoritative",
        userId: "user-123",
        role: "coach",
        tier: "pro",
      };
    },
    createLoggerFn: (context) => createCapturingLogger(logs, context),
  });

  const handler = withPlatform(async ({ tenantCtx, logger }) => {
    logger.info("inner_ok", "inner executed");
    return {
      statusCode: 200,
      body: { ok: true, tenantId: tenantCtx.tenantId },
    };
  });

  const event = makeEvent({
    headers: { "x-correlation-id": "tenant-ok-123" },
  });

  const response = await handler(event, { awsRequestId: "lambda-req-789" });

  assert.equal(eventsSeen.length, 1);
  assert.equal(eventsSeen[0], event);
  assert.equal(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.equal(body.tenantId, "tenant_authoritative");

  const tenantResolved = logs.find((entry) => entry.eventType === "tenant_context_resolved");
  const innerOk = logs.find((entry) => entry.eventType === "inner_ok");
  assert.equal(tenantResolved.tenantId, "tenant_authoritative");
  assert.equal(innerOk.tenantId, "tenant_authoritative");
  assert.equal(innerOk.userId, "user-123");
});
