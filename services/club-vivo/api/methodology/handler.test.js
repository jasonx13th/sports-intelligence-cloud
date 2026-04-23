"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createMethodologyInner } = require("./handler");

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

function makeEvent({
  rawPath = "/methodology/shared",
  method = "GET",
  body,
  headers = {},
  queryStringParameters = {},
  routeKey,
  pathParameters,
} = {}) {
  return {
    rawPath,
    path: rawPath,
    routeKey: routeKey ?? `${method} ${rawPath}`,
    requestContext: {
      http: {
        method,
        path: rawPath,
      },
    },
    pathParameters:
      pathParameters !== undefined
        ? pathParameters
        : rawPath.startsWith("/methodology/")
          ? { scope: rawPath.split("/")[2] }
          : undefined,
    headers,
    queryStringParameters,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

function makeTenantCtx({
  tenantId = "tenant_authoritative",
  userId = "user-123",
  role = "admin",
} = {}) {
  return { tenantId, userId, role };
}

test("GET /methodology/{scope} returns the tenant-scoped methodology record", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx({ role: "coach" });
  const inner = createMethodologyInner({
    getMethodologyFn: async (actualTenantCtx, scope) => {
      calls.push({ actualTenantCtx, scope });
      return {
        methodology: {
          scope,
          title: "Shared Possession Model",
          content: "Methodology content",
          status: "draft",
          createdAt: "2026-04-22T12:00:00.000Z",
          updatedAt: "2026-04-22T12:00:00.000Z",
          createdBy: "user-123",
          updatedBy: "user-123",
        },
      };
    },
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/methodology/shared",
      method: "GET",
      routeKey: "GET /methodology/{scope}",
      headers: {},
      queryStringParameters: {},
      pathParameters: { scope: "shared" },
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    methodology: {
      scope: "shared",
      title: "Shared Possession Model",
      content: "Methodology content",
      status: "draft",
      createdAt: "2026-04-22T12:00:00.000Z",
      updatedAt: "2026-04-22T12:00:00.000Z",
      createdBy: "user-123",
      updatedBy: "user-123",
    },
  });
  assert.deepEqual(calls, [{ actualTenantCtx: tenantCtx, scope: "shared" }]);
  assert.equal(loggerEvents[0].eventType, "methodology_fetched");
});

test("GET /methodology/{scope} returns 400 for unsupported scope values", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  let serviceCalled = false;
  const inner = createMethodologyInner({
    getMethodologyFn: async () => {
      serviceCalled = true;
      throw new Error("service should not be called");
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/methodology/academy",
          method: "GET",
          routeKey: "GET /methodology/{scope}",
          pathParameters: { scope: "academy" },
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "platform.bad_request");
      assert.equal(err.httpStatus, 400);
      assert.equal(serviceCalled, false);
      return true;
    }
  );
});

test("PUT /methodology/{scope} returns 403 for non-admin users", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  let serviceCalled = false;
  const inner = createMethodologyInner({
    saveMethodologyFn: async () => {
      serviceCalled = true;
      throw new Error("service should not be called");
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/methodology/shared",
          method: "PUT",
          routeKey: "PUT /methodology/{scope}",
          pathParameters: { scope: "shared" },
          body: {
            title: "Shared Model",
            content: "Methodology content",
          },
        }),
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "methodology.admin_required");
      assert.equal(err.httpStatus, 403);
      assert.equal(serviceCalled, false);
      return true;
    }
  );
});

test("PUT /methodology/{scope} saves a draft methodology using the path-owned scope", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx();
  const inner = createMethodologyInner({
    saveMethodologyFn: async (actualTenantCtx, scope, input) => {
      calls.push({ actualTenantCtx, scope, input });
      return {
        methodology: {
          scope,
          title: input.title,
          content: input.content,
          status: "draft",
          createdAt: "2026-04-22T12:00:00.000Z",
          updatedAt: "2026-04-22T12:00:00.000Z",
          createdBy: actualTenantCtx.userId,
          updatedBy: actualTenantCtx.userId,
        },
      };
    },
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/methodology/travel",
      method: "PUT",
      routeKey: "PUT /methodology/{scope}",
      pathParameters: { scope: "travel" },
      headers: {},
      queryStringParameters: {},
      body: {
        title: " Travel Game Model ",
        content: "  Travel methodology content.  ",
      },
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    methodology: {
      scope: "travel",
      title: "Travel Game Model",
      content: "Travel methodology content.",
      status: "draft",
      createdAt: "2026-04-22T12:00:00.000Z",
      updatedAt: "2026-04-22T12:00:00.000Z",
      createdBy: "user-123",
      updatedBy: "user-123",
    },
  });
  assert.deepEqual(calls, [
    {
      actualTenantCtx: tenantCtx,
      scope: "travel",
      input: {
        title: "Travel Game Model",
        content: "Travel methodology content.",
      },
    },
  ]);
  assert.equal(loggerEvents[0].eventType, "methodology_saved");
});

test("PUT /methodology/{scope} returns 400 when the body includes unknown fields", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createMethodologyInner({
    saveMethodologyFn: async () => {
      throw new Error("service should not be called");
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/methodology/shared",
          method: "PUT",
          routeKey: "PUT /methodology/{scope}",
          pathParameters: { scope: "shared" },
          body: {
            scope: "travel",
            title: "Shared Model",
            content: "Methodology content",
          },
        }),
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

test("POST /methodology/{scope}/publish returns 404 when the scoped methodology does not exist", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createMethodologyInner({
    publishMethodologyFn: async () => {
      const err = new Error("Not found");
      err.code = "methodology.not_found";
      err.statusCode = 404;
      err.details = { entityType: "METHODOLOGY", scope: "ost" };
      throw err;
    },
  });

  await assert.rejects(
    () =>
      inner({
        event: makeEvent({
          rawPath: "/methodology/ost/publish",
          method: "POST",
          routeKey: "POST /methodology/{scope}/publish",
          pathParameters: { scope: "ost" },
          body: {},
        }),
        tenantCtx: makeTenantCtx(),
        logger: makeLogger([]),
      }),
    (err) => {
      assert.equal(err.code, "methodology.not_found");
      assert.equal(err.httpStatus, 404);
      return true;
    }
  );
});

test("POST /methodology/{scope}/publish marks an existing methodology as published", async () => {
  process.env.TENANT_ENTITLEMENTS_TABLE = "entitlements-table";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const calls = [];
  const loggerEvents = [];
  const tenantCtx = makeTenantCtx();
  const inner = createMethodologyInner({
    publishMethodologyFn: async (actualTenantCtx, scope) => {
      calls.push({ actualTenantCtx, scope });
      return {
        methodology: {
          scope,
          title: "Shared Model",
          content: "Methodology content",
          status: "published",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-22T14:00:00.000Z",
          createdBy: "user-123",
          updatedBy: "user-123",
        },
      };
    },
  });

  const response = await inner({
    event: makeEvent({
      rawPath: "/methodology/shared/publish",
      method: "POST",
      routeKey: "POST /methodology/{scope}/publish",
      pathParameters: { scope: "shared" },
      headers: {},
      queryStringParameters: {},
      body: {},
    }),
    tenantCtx,
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    methodology: {
      scope: "shared",
      title: "Shared Model",
      content: "Methodology content",
      status: "published",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-22T14:00:00.000Z",
      createdBy: "user-123",
      updatedBy: "user-123",
    },
  });
  assert.deepEqual(calls, [{ actualTenantCtx: tenantCtx, scope: "shared" }]);
  assert.equal(loggerEvents[0].eventType, "methodology_published");
});
