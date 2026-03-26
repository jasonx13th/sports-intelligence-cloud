"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createSessionsInner } = require("./handler");

function makeLogger(events) {
  return {
    info: (eventType, message, extra = {}) =>
      events.push({ level: "INFO", eventType, message, ...extra }),
    warn: (eventType, message, extra = {}) =>
      events.push({ level: "WARN", eventType, message, ...extra }),
    error: (eventType, message, err, extra = {}) =>
      events.push({
        level: "ERROR",
        eventType,
        message,
        error: { name: err?.name, message: err?.message },
        ...extra,
      }),
  };
}

/**
 * NOTE: Do NOT default `sessionId` in parameter destructuring, because passing
 * `{ sessionId: undefined }` triggers the default and you *won't* be able to
 * simulate a missing sessionId.
 */
function makeEvent(opts = {}) {
  const {
    rawPath = "/sessions/session-123/pdf",
    method = "GET",
    headers = { "x-tenant-id": "spoofed" },
    queryStringParameters = { tenant_id: "spoofed" },
    routeKey,
  } = opts;

  // Only default sessionId when the caller did not provide the property at all.
  const hasSessionIdProp = Object.prototype.hasOwnProperty.call(opts, "sessionId");
  const sessionId = hasSessionIdProp ? opts.sessionId : "session-123";

  const effectiveRouteKey =
    routeKey ??
    `${method} ${
      rawPath.startsWith("/sessions/") && rawPath.endsWith("/pdf")
        ? "/sessions/{sessionId}/pdf"
        : rawPath
    }`;

  return {
    rawPath,
    path: rawPath,
    routeKey: effectiveRouteKey,
    requestContext: {
      http: {
        method,
        path: rawPath,
      },
    },
    // Treat null/""/undefined as “missing” by omitting pathParameters entirely
    pathParameters: sessionId ? { sessionId } : undefined,
    headers,
    queryStringParameters,
  };
}

function makeTenantCtx() {
  return {
    tenantId: "tenant_authoritative",
    userId: "user-123",
    role: "coach",
    tier: "free",
  };
}

test("GET /sessions/{sessionId}/pdf returns 400 when sessionId is missing", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";
  process.env.PDF_BUCKET_NAME = "pdf-bucket";

  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      getSessionById: async () => {
        throw new Error("repo should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/sessions/session-123/pdf",
          sessionId: null, // IMPORTANT: prevents the destructuring default
          routeKey: "GET /sessions/{sessionId}/pdf",
        }),
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "platform.bad_request");
      assert.equal(err.httpStatus, 400);
      assert.deepEqual(err.details, { missing: ["sessionId"] });
      return true;
    }
  );
});

test("GET /sessions/{sessionId}/pdf returns 404 when session is not found", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";
  process.env.PDF_BUCKET_NAME = "pdf-bucket";

  const calls = [];
  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      getSessionById: async (tenantCtx, sessionId) => {
        calls.push({ tenantCtx, sessionId });
        return null;
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({ routeKey: "GET /sessions/{sessionId}/pdf" }),
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "sessions.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );

  assert.deepEqual(calls, [
    { tenantCtx: makeTenantCtx(), sessionId: "session-123" },
  ]);
});

test("GET /sessions/{sessionId}/pdf returns url and ttl and derives key from tenant context only", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";
  process.env.PDF_BUCKET_NAME = "pdf-bucket";
  process.env.PDF_URL_TTL_SECONDS = "300";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx();
  const session = {
    sessionId: "session-123",
    createdAt: "2026-03-25T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 75,
    objectiveTags: ["pressing"],
    activities: [{ title: "Warm-up" }],
  };

  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      getSessionById: async (actualTenantCtx, sessionId) => {
        calls.push({ actualTenantCtx, sessionId });
        return session;
      },
    }),
    createSessionPdfBufferFn: ({ tenantId, session: actualSession }) => {
      calls.push({ pdfTenantId: tenantId, actualSession });
      return Buffer.from("%PDF-1.4\nfake\n", "utf8");
    },
    getSessionPdfStorageFn: () => ({
      putSessionPdf: async (args) => {
        calls.push({ putArgs: args });
      },
      presignSessionPdfGet: async (args) => {
        calls.push({ presignArgs: args });
        return {
          url: "https://example.com/presigned.pdf",
          expiresInSeconds: 300,
        };
      },
    }),
  });

  const response = await inner({
    event: makeEvent({
      headers: { "x-tenant-id": "tenant_from_header" },
      queryStringParameters: { tenant_id: "tenant_from_query" },
      routeKey: "GET /sessions/{sessionId}/pdf",
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    url: "https://example.com/presigned.pdf",
    expiresInSeconds: 300,
  });

  assert.deepEqual(calls, [
    { actualTenantCtx: tenantCtx, sessionId: "session-123" },
    { pdfTenantId: "tenant_authoritative", actualSession: session },
    {
      putArgs: {
        tenantId: "tenant_authoritative",
        sessionId: "session-123",
        pdfBuffer: Buffer.from("%PDF-1.4\nfake\n", "utf8"),
      },
    },
    {
      presignArgs: {
        tenantId: "tenant_authoritative",
        sessionId: "session-123",
      },
    },
  ]);

  assert.equal(loggerEvents[0].eventType, "session_pdf_exported");
});

test("GET /sessions/{sessionId}/pdf logs pdf_export_failed and rethrows the original error", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";
  process.env.PDF_BUCKET_NAME = "pdf-bucket";

  const loggerEvents = [];
  const tenantCtx = makeTenantCtx();
  const session = {
    sessionId: "session-123",
    createdAt: "2026-03-25T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 75,
    objectiveTags: ["pressing"],
    activities: [{ title: "Warm-up" }],
  };
  const originalError = new Error("s3 put failed");

  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      getSessionById: async () => session,
    }),
    createSessionPdfBufferFn: () => Buffer.from("%PDF-1.4\nfake\n", "utf8"),
    getSessionPdfStorageFn: () => ({
      putSessionPdf: async () => {
        throw originalError;
      },
      presignSessionPdfGet: async () => {
        throw new Error("presign should not be called");
      },
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          routeKey: "GET /sessions/{sessionId}/pdf",
          rawPath: "/sessions/session-123/pdf",
        }),
        tenantCtx,
        logger: makeLogger(loggerEvents),
      }),
    (err) => {
      assert.equal(err, originalError);
      return true;
    }
  );

  const errorEvent = loggerEvents.find((entry) => entry.eventType === "pdf_export_failed");
  assert.ok(errorEvent);
  assert.equal(errorEvent.level, "ERROR");
  assert.equal(errorEvent.http.method, "GET");
  assert.equal(errorEvent.resource.entityId, "session-123");
  assert.equal(errorEvent.route, "GET /sessions/{sessionId}/pdf");
});
