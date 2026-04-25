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
    headers = {},
    queryStringParameters = {},
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

function makeTenantCtx({ role = "coach", userId = "user-123" } = {}) {
  return {
    tenantId: "tenant_authoritative",
    userId,
    role,
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

test("POST /sessions keeps the public { session } response shape while using the persist stage", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const loggerEvents = [];
  const expectedSession = {
    sessionId: "session-123",
    createdAt: "2026-04-01T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    objectiveTags: ["pressing"],
    tags: ["defending", "transition"],
    sourceTemplateId: "template-123",
    activities: [{ name: "Warm-up", minutes: 60, description: "Prep" }],
    equipment: ["cones", "balls"],
  };

  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      createSession: async () => {
        throw new Error("repo should not be called directly");
      },
    }),
    persistSessionFn: async ({ tenantCtx, normalizedInput, sessionRepository }) => {
      assert.equal(tenantCtx.tenantId, "tenant_authoritative");
      assert.equal(typeof sessionRepository.createSession, "function");
      assert.deepEqual(normalizedInput.equipment, ["cones", "balls"]);
      assert.deepEqual(normalizedInput.tags, ["defending", "transition"]);
      assert.equal(normalizedInput.sourceTemplateId, "template-123");

      return {
        normalizedInput,
        persistedSession: expectedSession,
      };
    },
  });

  const response = await inner({
    event: {
      rawPath: "/sessions",
      path: "/sessions",
      routeKey: "POST /sessions",
      requestContext: { http: { method: "POST", path: "/sessions" } },
      body: JSON.stringify({
        sport: "soccer",
        ageBand: "u14",
        durationMin: 60,
        objectiveTags: ["pressing"],
        tags: ["defending", "transition"],
        sourceTemplateId: "template-123",
        activities: [{ name: "Warm-up", minutes: 60, description: "Prep" }],
        equipment: ["cones", "balls"],
      }),
    },
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), { session: expectedSession });
  assert.equal(loggerEvents[0].eventType, "session_created");
});

test("saved session routes reject client-supplied tenant scope before data access", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";
  process.env.PDF_BUCKET_NAME = "pdf-bucket";

  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      listSessions: async () => {
        throw new Error("repo should not list");
      },
      getSessionById: async () => {
        throw new Error("repo should not fetch");
      },
    }),
    persistSessionFn: async () => {
      throw new Error("persist should not run");
    },
  });

  const cases = [
    {
      name: "create",
      event: {
        rawPath: "/sessions",
        path: "/sessions",
        routeKey: "POST /sessions",
        requestContext: { http: { method: "POST", path: "/sessions" } },
        headers: { "x-tenant-id": "spoofed" },
        body: JSON.stringify({
          sport: "soccer",
          ageBand: "u14",
          durationMin: 60,
          activities: [{ name: "Warm-up", minutes: 10 }],
        }),
      },
      expectedUnknown: ["x-tenant-id"],
    },
    {
      name: "list",
      event: {
        rawPath: "/sessions",
        path: "/sessions",
        routeKey: "GET /sessions",
        requestContext: { http: { method: "GET", path: "/sessions" } },
        queryStringParameters: { tenantId: "spoofed" },
      },
      expectedUnknown: ["tenantId"],
    },
    {
      name: "detail",
      event: {
        rawPath: "/sessions/session-123",
        path: "/sessions/session-123",
        routeKey: "GET /sessions/{sessionId}",
        requestContext: { http: { method: "GET", path: "/sessions/session-123" } },
        pathParameters: { sessionId: "session-123" },
        headers: { tenant_id: "spoofed" },
      },
      expectedUnknown: ["tenant_id"],
    },
    {
      name: "export",
      event: makeEvent({
        routeKey: "GET /sessions/{sessionId}/pdf",
        queryStringParameters: { "x-tenant-id": "spoofed" },
      }),
      expectedUnknown: ["x-tenant-id"],
    },
  ];

  for (const current of cases) {
    await assert.rejects(
      () =>
        inner({
          event: current.event,
          tenantCtx: makeTenantCtx(),
          logger: makeLogger([]),
        }),
      (err) => {
        assert.equal(err.code, "platform.bad_request", current.name);
        assert.equal(err.httpStatus, 400, current.name);
        assert.deepEqual(err.details, { unknown: current.expectedUnknown }, current.name);
        return true;
      }
    );
  }
});

test("POST /sessions/{sessionId}/feedback keeps the public { feedback } response shape", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const loggerEvents = [];
  const expectedFeedback = {
    sessionId: "session-123",
    submittedAt: "2026-04-10T00:00:00.000Z",
    submittedBy: "user-123",
    sessionQuality: 4,
    drillUsefulness: 5,
    imageAnalysisAccuracy: "high",
    favoriteActivity: "Activity 2 because the scoring rule made players compete.",
    missingFeatures: "Wanted easier drill editing.",
    flowMode: "setup_to_drill",
    schemaVersion: 2,
  };

  const inner = createSessionsInner({
    validateSessionFeedbackFn: (body) => {
      assert.deepEqual(body, {
        sessionQuality: 4,
        drillUsefulness: 5,
        imageAnalysisAccuracy: "high",
        favoriteActivity: "Activity 2 because the scoring rule made players compete.",
        missingFeatures: "Wanted easier drill editing.",
        flowMode: "setup_to_drill",
      });

      return body;
    },
    submitSessionFeedbackFn: async (tenantCtx, sessionId, input, deps) => {
      assert.equal(tenantCtx.tenantId, "tenant_authoritative");
      assert.equal(sessionId, "session-123");
      assert.equal(typeof deps.sessionRepository.getSessionById, "function");
      assert.equal(typeof deps.sessionRepository.createSessionFeedback, "function");
      assert.equal(input.sessionQuality, 4);
      assert.equal(
        input.favoriteActivity,
        "Activity 2 because the scoring rule made players compete."
      );
      return { feedback: expectedFeedback };
    },
  });

  const response = await inner({
    event: {
      rawPath: "/sessions/session-123/feedback",
      path: "/sessions/session-123/feedback",
      routeKey: "POST /sessions/{sessionId}/feedback",
      requestContext: {
        http: { method: "POST", path: "/sessions/session-123/feedback" },
      },
      pathParameters: { sessionId: "session-123" },
      body: JSON.stringify({
        sessionQuality: 4,
        drillUsefulness: 5,
        imageAnalysisAccuracy: "high",
        favoriteActivity: "Activity 2 because the scoring rule made players compete.",
        missingFeatures: "Wanted easier drill editing.",
        flowMode: "setup_to_drill",
      }),
    },
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), { feedback: expectedFeedback });
  assert.equal(loggerEvents[0].eventType, "session_feedback_created");
  assert.deepEqual(loggerEvents[0].feedback, {
    flowMode: "setup_to_drill",
    imageAnalysisAccuracy: "high",
  });
});

test("POST /sessions/{sessionId}/feedback rejects client-supplied tenant scope in headers and query", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createSessionsInner({
    submitSessionFeedbackFn: async () => {
      throw new Error("should not reach feedback service");
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: {
          rawPath: "/sessions/session-123/feedback",
          path: "/sessions/session-123/feedback",
          routeKey: "POST /sessions/{sessionId}/feedback",
          requestContext: {
            http: { method: "POST", path: "/sessions/session-123/feedback" },
          },
          pathParameters: { sessionId: "session-123" },
          headers: { "x-tenant-id": "spoofed" },
          queryStringParameters: { tenantId: "spoofed" },
          body: JSON.stringify({
            sessionQuality: 4,
            drillUsefulness: 5,
            imageAnalysisAccuracy: "not_used",
            missingFeatures: "Wanted easier drill editing.",
          }),
        },
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "platform.bad_request");
      assert.equal(err.httpStatus, 400);
      assert.deepEqual(err.details, { unknown: ["x-tenant-id"] });
      return true;
    }
  );
});

test("POST /sessions/{sessionId}/feedback returns 404 when session is missing or inaccessible", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createSessionsInner({
    submitSessionFeedbackFn: async () => {
      const err = new Error("Not found");
      err.code = "sessions.not_found";
      err.statusCode = 404;
      err.details = { entityType: "SESSION" };
      throw err;
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: {
          rawPath: "/sessions/session-404/feedback",
          path: "/sessions/session-404/feedback",
          routeKey: "POST /sessions/{sessionId}/feedback",
          requestContext: {
            http: { method: "POST", path: "/sessions/session-404/feedback" },
          },
          pathParameters: { sessionId: "session-404" },
          body: JSON.stringify({
            sessionQuality: 3,
            drillUsefulness: 3,
            imageAnalysisAccuracy: "not_used",
            missingFeatures: "Wanted clearer setup prompts.",
          }),
        },
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "sessions.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );
});

test("POST /sessions/{sessionId}/feedback returns 409 on duplicate feedback", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createSessionsInner({
    submitSessionFeedbackFn: async () => {
      const err = new Error("Conflict");
      err.code = "sessions.feedback_exists";
      err.statusCode = 409;
      err.details = { entityType: "SESSION_FEEDBACK", sessionId: "session-123" };
      throw err;
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: {
          rawPath: "/sessions/session-123/feedback",
          path: "/sessions/session-123/feedback",
          routeKey: "POST /sessions/{sessionId}/feedback",
          requestContext: {
            http: { method: "POST", path: "/sessions/session-123/feedback" },
          },
          pathParameters: { sessionId: "session-123" },
          body: JSON.stringify({
            sessionQuality: 5,
            drillUsefulness: 4,
            imageAnalysisAccuracy: "medium",
            missingFeatures: "Wanted easier export controls.",
          }),
        },
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "sessions.feedback_exists");
      assert.equal(err.httpStatus, 409);
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

  assert.deepEqual(calls, [{ tenantCtx: makeTenantCtx(), sessionId: "session-123" }]);
});

test("GET /sessions/{sessionId} returns 404 when session is inaccessible", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      getSessionById: async () => null,
    }),
  });

  await assert.rejects(
    () =>
      inner({
        event: {
          rawPath: "/sessions/session-123",
          path: "/sessions/session-123",
          routeKey: "GET /sessions/{sessionId}",
          requestContext: { http: { method: "GET", path: "/sessions/session-123" } },
          pathParameters: { sessionId: "session-123" },
        },
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "sessions.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );
});

test("GET /sessions/{sessionId} returns session detail for an admin", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const session = {
    sessionId: "session-123",
    createdAt: "2026-03-25T00:00:00.000Z",
    createdBy: "other-user",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 75,
    objectiveTags: ["pressing"],
    activities: [{ title: "Warm-up" }],
  };
  const calls = [];
  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      getSessionById: async (tenantCtx, sessionId) => {
        calls.push({ tenantCtx, sessionId });
        return session;
      },
    }),
  });

  const response = await inner({
    event: {
      rawPath: "/sessions/session-123",
      path: "/sessions/session-123",
      routeKey: "GET /sessions/{sessionId}",
      requestContext: { http: { method: "GET", path: "/sessions/session-123" } },
      pathParameters: { sessionId: "session-123" },
    },
    tenantCtx: makeTenantCtx({ role: "admin" }),
    logger: makeLogger([]),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { session });
  assert.deepEqual(calls, [
    { tenantCtx: makeTenantCtx({ role: "admin" }), sessionId: "session-123" },
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
      writeSessionExportedEvent: async (actualTenantCtx, args) => {
        calls.push({ eventTenantCtx: actualTenantCtx, eventArgs: args });
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
    {
      eventTenantCtx: tenantCtx,
      eventArgs: {
        sessionId: "session-123",
        metadata: { exportFormat: "pdf" },
      },
    },
  ]);

  assert.equal(loggerEvents[0].eventType, "session_pdf_exported");
});

test("GET /sessions/{sessionId}/pdf lets an admin export a tenant session", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";
  process.env.PDF_BUCKET_NAME = "pdf-bucket";

  const loggerEvents = [];
  const tenantCtx = makeTenantCtx({ role: "admin" });
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
      getSessionById: async () => session,
      writeSessionExportedEvent: async (actualTenantCtx, args) => {
        assert.equal(actualTenantCtx, tenantCtx);
        assert.deepEqual(args, {
          sessionId: "session-123",
          metadata: { exportFormat: "pdf" },
        });
      },
    }),
    exportPersistedSessionFn: async ({
      tenantCtx: actualTenantCtx,
      persistedSession,
      sessionId,
      createSessionPdfBufferFn,
      sessionPdfStorage,
    }) => {
      assert.equal(actualTenantCtx, tenantCtx);
      assert.equal(persistedSession, session);
      assert.equal(sessionId, "session-123");
      assert.equal(typeof createSessionPdfBufferFn, "function");
      assert.equal(typeof sessionPdfStorage.putSessionPdf, "function");
      return {
        persistedSession,
        exportResult: {
          url: "https://example.com/pipeline.pdf",
          expiresInSeconds: 300,
        },
      };
    },
  });

  const response = await inner({
    event: makeEvent({ routeKey: "GET /sessions/{sessionId}/pdf" }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    url: "https://example.com/pipeline.pdf",
    expiresInSeconds: 300,
  });
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
  const eventWrites = [];

  const inner = createSessionsInner({
    getSessionRepoFn: () => ({
      getSessionById: async () => session,
      writeSessionExportedEvent: async (...args) => {
        eventWrites.push(args);
      },
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
  assert.equal(eventWrites.length, 0);
});
