"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createTemplateFromSession,
  generateSessionFromTemplate,
} = require("./template-pipeline");

function makeTenantCtx() {
  return {
    tenantId: "tenant_authoritative",
    userId: "user-123",
    role: "coach",
    tier: "free",
  };
}

test("createTemplateFromSession loads source session tenant-safely and creates template", async () => {
  const tenantCtx = makeTenantCtx();
  const calls = [];

  const sourceSession = {
    sessionId: "session-123",
    createdAt: "2026-04-01T00:00:00.000Z",
    sport: "soccer",
    ageBand: "u14",
    durationMin: 60,
    objectiveTags: ["pressing"],
    equipment: ["cones", "balls"],
    activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
  };

  const createdTemplate = {
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

  const result = await createTemplateFromSession(
    tenantCtx,
    {
      sourceSessionId: "session-123",
      name: "Pressing Template",
      description: "Reusable pressing session",
      tags: ["defending", "transition"],
    },
    {
      sessionRepository: {
        getSessionById: async (actualTenantCtx, sessionId) => {
          calls.push({ step: "getSessionById", actualTenantCtx, sessionId });
          return sourceSession;
        },
      },
      templateRepository: {
        createTemplate: async (actualTenantCtx, templateInput) => {
          calls.push({ step: "createTemplate", actualTenantCtx, templateInput });
          return { template: createdTemplate };
        },
      },
    }
  );

  assert.deepEqual(result, { template: createdTemplate });

  assert.deepEqual(calls, [
    {
      step: "getSessionById",
      actualTenantCtx: tenantCtx,
      sessionId: "session-123",
    },
    {
      step: "createTemplate",
      actualTenantCtx: tenantCtx,
      templateInput: {
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
      },
    },
  ]);
});

test("createTemplateFromSession fails when source session not found", async () => {
  const tenantCtx = makeTenantCtx();

  await assert.rejects(
    () =>
      createTemplateFromSession(
        tenantCtx,
        {
          sourceSessionId: "session-404",
          name: "Missing Session Template",
        },
        {
          sessionRepository: {
            getSessionById: async () => null,
          },
          templateRepository: {
            createTemplate: async () => {
              throw new Error("should not create template");
            },
          },
        }
      ),
    (err) => {
      assert.equal(err.code, "sessions.not_found");
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});

test("generateSessionFromTemplate loads template, persists session, stamps sourceTemplateId, and marks template generated", async () => {
  const tenantCtx = makeTenantCtx();
  const calls = [];

  const template = {
    templateId: "template-123",
    createdAt: "2026-04-01T00:00:00.000Z",
    name: "Pressing Template",
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

  const persistedSession = {
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

  const result = await generateSessionFromTemplate(
    tenantCtx,
    "template-123",
    {},
    {
      templateRepository: {
        getTemplateById: async (actualTenantCtx, templateId) => {
          calls.push({ step: "getTemplateById", actualTenantCtx, templateId });
          return template;
        },
        markTemplateGenerated: async (actualTenantCtx, templateId) => {
          calls.push({ step: "markTemplateGenerated", actualTenantCtx, templateId });
          return {
            ...template,
            usageCount: 1,
            lastGeneratedAt: "2026-04-02T00:00:00.000Z",
          };
        },
      },
      sessionRepository: {
        createSession: async () => {
          throw new Error("repo should not be called directly");
        },
      },
      persistSessionFn: async ({ tenantCtx: actualTenantCtx, normalizedInput, sessionRepository }) => {
        calls.push({
          step: "persistSession",
          actualTenantCtx,
          normalizedInput,
          hasCreateSession: typeof sessionRepository.createSession === "function",
        });

        return {
          normalizedInput,
          persistedSession,
        };
      },
    }
  );

  assert.deepEqual(result, { session: persistedSession });

  assert.deepEqual(calls, [
    {
      step: "getTemplateById",
      actualTenantCtx: tenantCtx,
      templateId: "template-123",
    },
    {
      step: "persistSession",
      actualTenantCtx: tenantCtx,
      normalizedInput: {
        sport: "soccer",
        ageBand: "u14",
        durationMin: 60,
        objectiveTags: ["pressing"],
        tags: ["defending", "transition"],
        sourceTemplateId: "template-123",
        equipment: ["cones", "balls"],
        activities: [{ name: "Warm-up", minutes: 10, description: "Prep" }],
      },
      hasCreateSession: true,
    },
    {
      step: "markTemplateGenerated",
      actualTenantCtx: tenantCtx,
      templateId: "template-123",
    },
  ]);
});

test("generateSessionFromTemplate fails when template not found", async () => {
  const tenantCtx = makeTenantCtx();

  await assert.rejects(
    () =>
      generateSessionFromTemplate(
        tenantCtx,
        "template-404",
        {},
        {
          templateRepository: {
            getTemplateById: async () => null,
            markTemplateGenerated: async () => {
              throw new Error("should not mark template generated");
            },
          },
          sessionRepository: {
            createSession: async () => {
              throw new Error("should not persist session");
            },
          },
          persistSessionFn: async () => {
            throw new Error("should not persist session");
          },
        }
      ),
    (err) => {
      assert.equal(err.code, "templates.not_found");
      assert.equal(err.statusCode, 404);
      return true;
    }
  );
});
