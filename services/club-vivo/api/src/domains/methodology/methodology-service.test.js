"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getMethodology,
  saveMethodology,
  publishMethodology,
} = require("./methodology-service");

function makeTenantContext() {
  return {
    tenantId: "tenant_authoritative",
    userId: "user-123",
  };
}

test("getMethodology returns 404 when the scoped methodology does not exist", async () => {
  const calls = [];

  await assert.rejects(
    () =>
      getMethodology(makeTenantContext(), "shared", {
        methodologyRepository: {
          getMethodologyByScope: async (tenantCtx, scope) => {
            calls.push({ tenantCtx, scope });
            return null;
          },
        },
      }),
    (err) => {
      assert.equal(err.code, "methodology.not_found");
      assert.equal(err.statusCode, 404);
      assert.deepEqual(err.details, { entityType: "METHODOLOGY", scope: "shared" });
      return true;
    }
  );

  assert.deepEqual(calls, [{ tenantCtx: makeTenantContext(), scope: "shared" }]);
});

test("saveMethodology creates a draft record when one does not exist", async () => {
  const calls = [];
  const result = await saveMethodology(
    makeTenantContext(),
    "travel",
    {
      title: "Travel Game Model",
      content: "Travel methodology content.",
    },
    {
      now: "2026-04-22T12:00:00.000Z",
      methodologyRepository: {
        getMethodologyByScope: async (tenantCtx, scope) => {
          calls.push({ step: "get", tenantCtx, scope });
          return null;
        },
        putMethodology: async (tenantCtx, methodology) => {
          calls.push({ step: "put", tenantCtx, methodology });
          return { methodology };
        },
      },
    }
  );

  assert.deepEqual(result, {
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
  assert.equal(calls[0].step, "get");
  assert.equal(calls[1].step, "put");
});

test("saveMethodology resets status to draft and preserves created metadata on update", async () => {
  const result = await saveMethodology(
    makeTenantContext(),
    "shared",
    {
      title: "Updated Shared Model",
      content: "Updated methodology content.",
    },
    {
      now: "2026-04-22T13:00:00.000Z",
      methodologyRepository: {
        getMethodologyByScope: async () => ({
          methodology: {
            scope: "shared",
            title: "Old",
            content: "Old content",
            status: "published",
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-21T11:00:00.000Z",
            createdBy: "user-999",
            updatedBy: "user-999",
          },
        }),
        putMethodology: async (_tenantCtx, methodology) => ({ methodology }),
      },
    }
  );

  assert.deepEqual(result, {
    methodology: {
      scope: "shared",
      title: "Updated Shared Model",
      content: "Updated methodology content.",
      status: "draft",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-22T13:00:00.000Z",
      createdBy: "user-999",
      updatedBy: "user-123",
    },
  });
});

test("publishMethodology returns 404 when the scoped methodology does not exist", async () => {
  await assert.rejects(
    () =>
      publishMethodology(makeTenantContext(), "ost", {
        methodologyRepository: {
          getMethodologyByScope: async () => null,
        },
      }),
    (err) => {
      assert.equal(err.code, "methodology.not_found");
      assert.equal(err.statusCode, 404);
      assert.deepEqual(err.details, { entityType: "METHODOLOGY", scope: "ost" });
      return true;
    }
  );
});

test("publishMethodology marks an existing record as published and updates audit fields", async () => {
  const result = await publishMethodology(makeTenantContext(), "shared", {
    now: "2026-04-22T14:00:00.000Z",
    methodologyRepository: {
      getMethodologyByScope: async () => ({
        methodology: {
          scope: "shared",
          title: "Shared Model",
          content: "Draft content",
          status: "draft",
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-21T11:00:00.000Z",
          createdBy: "user-123",
          updatedBy: "user-123",
        },
      }),
      putMethodology: async (_tenantCtx, methodology) => ({ methodology }),
    },
  });

  assert.deepEqual(result, {
    methodology: {
      scope: "shared",
      title: "Shared Model",
      content: "Draft content",
      status: "published",
      createdAt: "2026-04-21T10:00:00.000Z",
      updatedAt: "2026-04-22T14:00:00.000Z",
      createdBy: "user-123",
      updatedBy: "user-123",
    },
  });
});
