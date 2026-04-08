"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createTemplatesInner } = require("./handler");

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

function makeTenantCtx() {
  return {
    tenantId: "tenant_authoritative",
    userId: "user-123",
    role: "coach",
    tier: "free",
  };
}

test("POST /templates creates template", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const loggerEvents = [];
  const expectedTemplate = {
    templateId: "template-123",
    name: "Pressing Template",
    description: "Reusable pressing session",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    objectiveTags: ["pressing"],
    tags: ["defending", "transition"],
    equipment: ["cones", "balls"],
    activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
    sourceSessionId: "session-123",
    usageCount: 0,
  };

  const inner = createTemplatesInner({
    createTemplateFromSessionFn: async (tenantCtx, input) => {
      assert.equal(tenantCtx.tenantId, "tenant_authoritative");
      assert.deepEqual(input, {
        sourceSessionId: "session-123",
        name: "Pressing Template",
        description: "Reusable pressing session",
        tags: ["defending", "transition"],
      });

      return { template: expectedTemplate };
    },
  });

  const response = await inner({
    event: {
      rawPath: "/templates",
      path: "/templates",
      routeKey: "POST /templates",
      requestContext: { http: { method: "POST", path: "/templates" } },
      body: JSON.stringify({
        sourceSessionId: "session-123",
        name: "Pressing Template",
        description: "Reusable pressing session",
        tags: ["defending", "transition"],
      }),
    },
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), { template: expectedTemplate });
  assert.equal(loggerEvents[0].eventType, "template_created");
});

test("GET /templates lists summaries", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const loggerEvents = [];
  const expectedList = {
    items: [
      {
        templateId: "template-123",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
        name: "Pressing Template",
        description: "Reusable pressing session",
        sport: "soccer",
        ageBand: "u14",
        durationMin: 60,
        objectiveTags: ["pressing"],
        tags: ["defending", "transition"],
        usageCount: 2,
        activityCount: 1,
      },
    ],
    nextToken: "token-123",
  };

  const inner = createTemplatesInner({
    getTemplateRepoFn: () => ({
      listTemplates: async (tenantCtx, query) => {
        assert.equal(tenantCtx.tenantId, "tenant_authoritative");
        assert.deepEqual(query, {
          limit: "10",
          nextToken: "token-in",
        });

        return expectedList;
      },
    }),
  });

  const response = await inner({
    event: {
      rawPath: "/templates",
      path: "/templates",
      routeKey: "GET /templates",
      requestContext: { http: { method: "GET", path: "/templates" } },
      queryStringParameters: {
        limit: "10",
        nextToken: "token-in",
      },
    },
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), expectedList);
  assert.equal(loggerEvents[0].eventType, "template_listed");
});

test("POST /templates/{templateId}/generate creates session", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const loggerEvents = [];
  const expectedSession = {
    sessionId: "session-999",
    createdAt: "2026-04-02T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    objectiveTags: ["pressing"],
    tags: ["defending", "transition"],
    sourceTemplateId: "template-123",
    equipment: ["cones", "balls"],
    activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
  };

  const inner = createTemplatesInner({
    generateSessionFromTemplateFn: async (tenantCtx, templateId, input) => {
      assert.equal(tenantCtx.tenantId, "tenant_authoritative");
      assert.equal(templateId, "template-123");
      assert.deepEqual(input, {});
      return { session: expectedSession };
    },
  });

  const response = await inner({
    event: {
      rawPath: "/templates/template-123/generate",
      path: "/templates/template-123/generate",
      routeKey: "POST /templates/{templateId}/generate",
      requestContext: {
        http: { method: "POST", path: "/templates/template-123/generate" },
      },
      pathParameters: { templateId: "template-123" },
      body: JSON.stringify({}),
    },
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(JSON.parse(response.body), { session: expectedSession });
  assert.equal(loggerEvents[0].eventType, "template_generated");
});

test("POST /templates rejects invalid sourceSessionId body", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTemplatesInner({
    createTemplateFromSessionFn: async () => {
      throw new Error("should not reach pipeline");
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: {
          rawPath: "/templates",
          path: "/templates",
          routeKey: "POST /templates",
          requestContext: { http: { method: "POST", path: "/templates" } },
          body: JSON.stringify({
            name: "Missing Source Session",
          }),
        },
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "platform.bad_request");
      assert.equal(err.httpStatus, 400);
      return true;
    }
  );
});

test("POST /templates/{templateId}/generate returns 404 when template not found", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createTemplatesInner({
    generateSessionFromTemplateFn: async () => {
      const err = new Error("Not found");
      err.code = "templates.not_found";
      err.statusCode = 404;
      throw err;
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: {
          rawPath: "/templates/template-404/generate",
          path: "/templates/template-404/generate",
          routeKey: "POST /templates/{templateId}/generate",
          requestContext: {
            http: { method: "POST", path: "/templates/template-404/generate" },
          },
          pathParameters: { templateId: "template-404" },
          body: JSON.stringify({}),
        },
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "templates.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );
});
