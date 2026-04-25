"use strict";

const { MethodologyRepository } = require("./methodology-repository");

let methodologyRepository;
function getMethodologyRepository() {
  if (!methodologyRepository) {
    methodologyRepository = new MethodologyRepository({
      tableName: process.env.SIC_DOMAIN_TABLE,
    });
  }

  return methodologyRepository;
}

function notFound(scope) {
  const err = new Error("Not found");
  err.code = "methodology.not_found";
  err.statusCode = 404;
  err.details = { entityType: "METHODOLOGY", scope };
  return err;
}

async function getMethodology(tenantCtx, scope, deps = {}) {
  const repo = deps.methodologyRepository || getMethodologyRepository();
  const result = await repo.getMethodologyByScope(tenantCtx, scope);

  if (!result) {
    throw notFound(scope);
  }

  return result;
}

async function saveMethodology(tenantCtx, scope, input, deps = {}) {
  const repo = deps.methodologyRepository || getMethodologyRepository();
  const now = deps.now || new Date().toISOString();
  const existing = await repo.getMethodologyByScope(tenantCtx, scope);
  const current = existing?.methodology;

  return repo.putMethodology(tenantCtx, {
    scope,
    title: input.title,
    content: input.content,
    status: "draft",
    createdAt: current?.createdAt || now,
    updatedAt: now,
    createdBy: current?.createdBy ?? tenantCtx?.userId ?? null,
    updatedBy: tenantCtx?.userId ?? null,
  });
}

async function publishMethodology(tenantCtx, scope, deps = {}) {
  const repo = deps.methodologyRepository || getMethodologyRepository();
  const now = deps.now || new Date().toISOString();
  const existing = await repo.getMethodologyByScope(tenantCtx, scope);

  if (!existing) {
    throw notFound(scope);
  }

  return repo.putMethodology(tenantCtx, {
    ...existing.methodology,
    status: "published",
    updatedAt: now,
    updatedBy: tenantCtx?.userId ?? null,
  });
}

module.exports = {
  getMethodology,
  saveMethodology,
  publishMethodology,
};
