"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createExportsDomainInner } = require("./handler");
const { ForbiddenError, InternalError } = require("../_lib/errors");

function makeTenantCtx({ tenantId = "tenant_authoritative", role = "admin" } = {}) {
  return {
    tenantId,
    userId: "user-123",
    role,
    tier: "org",
  };
}

function makeLogger(events) {
  return {
    info: (eventType, message, extra = {}) => events.push({ level: "INFO", eventType, message, ...extra }),
    warn: (eventType, message, extra = {}) => events.push({ level: "WARN", eventType, message, ...extra }),
    error: (eventType, message, err, extra = {}) =>
      events.push({ level: "ERROR", eventType, message, error: err, ...extra }),
  };
}

test("admin success returns 201 and writes S3 objects under tenant_id from tenantCtx", async () => {
  process.env.DOMAIN_EXPORT_BUCKET = "export-bucket";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const putCalls = [];

  const inner = createExportsDomainInner({
    getSessionRepositoryFn: () => ({
      listSessions: async () => ({
        items: [
          {
            sessionId: "sess-1",
            clubId: "club-1",
            teamId: "team-1",
            createdAt: "2026-03-29T00:00:00Z",
          },
        ],
        nextToken: undefined,
      }),
    }),
    getClubRepositoryFn: () => ({
      getClub: async () => ({
        club: { clubId: "tenant_authoritative", name: "Club A", createdAt: "2026-03-29T00:00:00Z" },
      }),
    }),
    getTeamRepositoryFn: () => ({
      listTeams: async () => ({
        items: [{ teamId: "team-1", name: "Team A", createdAt: "2026-03-29T00:00:00Z" }],
        nextToken: undefined,
      }),
    }),
    getMembershipRepositoryFn: () => ({
      listMemberships: async () => ({
        items: [{ userSub: "user-1", role: "admin", createdAt: "2026-03-29T00:00:00Z" }],
        nextToken: undefined,
      }),
    }),
    createS3ClientFn: () => ({
      send: async (command) => {
        putCalls.push(command.input);
        return {};
      },
    }),
  });

  const loggerEvents = [];

  const response = await inner({
    event: {
      headers: { "x-tenant-id": "tenant_spoofed" },
      queryStringParameters: { tenant_id: "tenant_spoofed" },
      body: JSON.stringify({ tenant_id: "tenant_spoofed", tenantId: "tenant_spoofed" }),
    },
    tenantCtx: makeTenantCtx(),
    logger: makeLogger(loggerEvents),
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.headers["content-type"], "application/json");

  const parsed = JSON.parse(response.body);

  assert.equal(parsed.message, "Domain export created");
  assert.ok(parsed.manifest.export_run_id);
  assert.equal(parsed.manifest.tenant_id, "tenant_authoritative");
  assert.equal(parsed.manifest.schema_counts.session, 1);
  assert.equal(parsed.manifest.schema_counts.club, 1);
  assert.equal(parsed.manifest.schema_counts.team, 1);
  assert.equal(parsed.manifest.schema_counts.membership, 1);
  assert.equal(putCalls.length, 5);

  putCalls.forEach((call) => {
    assert.equal(call.Bucket, "export-bucket");
    assert.ok(call.Key.includes("tenant_id=tenant_authoritative"));
  });

  assert.ok(parsed.manifest.object_keys.session.includes("tenant_id=tenant_authoritative"));
  assert.ok(parsed.manifest.object_keys.manifest.includes("tenant_id=tenant_authoritative"));
});

test("non-admin returns 403", async () => {
  process.env.DOMAIN_EXPORT_BUCKET = "export-bucket";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createExportsDomainInner({
    getSessionRepositoryFn: () => ({ listSessions: async () => ({ items: [], nextToken: undefined }) }),
    getClubRepositoryFn: () => ({ getClub: async () => ({ club: null }) }),
    getTeamRepositoryFn: () => ({ listTeams: async () => ({ items: [], nextToken: undefined }) }),
    getMembershipRepositoryFn: () => ({ listMemberships: async () => ({ items: [], nextToken: undefined }) }),
    createS3ClientFn: () => ({ send: async () => ({}) }),
  });

  await assert.rejects(
    async () => {
      await inner({
        event: {},
        tenantCtx: makeTenantCtx({ role: "coach" }),
        logger: makeLogger([]),
      });
    },
    (err) => {
      assert.equal(err instanceof ForbiddenError, true);
      assert.equal(err.code, "exports_domain.admin_required");
      assert.equal(err.httpStatus, 403);
      return true;
    }
  );
});

test("spoofed tenant_id in request does not affect S3 key selection", async () => {
  process.env.DOMAIN_EXPORT_BUCKET = "export-bucket";
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const putCalls = [];

  const inner = createExportsDomainInner({
    getSessionRepositoryFn: () => ({ listSessions: async () => ({ items: [], nextToken: undefined }) }),
    getClubRepositoryFn: () => ({ getClub: async () => ({ club: null }) }),
    getTeamRepositoryFn: () => ({ listTeams: async () => ({ items: [], nextToken: undefined }) }),
    getMembershipRepositoryFn: () => ({ listMemberships: async () => ({ items: [], nextToken: undefined }) }),
    createS3ClientFn: () => ({
      send: async (command) => {
        putCalls.push(command.input);
        return {};
      },
    }),
  });

  await inner({
    event: {
      headers: { "x-tenant-id": "spoofed-tenant" },
      queryStringParameters: { tenant_id: "spoofed-tenant" },
      body: JSON.stringify({ tenant_id: "spoofed-tenant" }),
    },
    tenantCtx: makeTenantCtx(),
    logger: makeLogger([]),
  });

  assert.ok(putCalls.every((call) => call.Key.includes("tenant_id=tenant_authoritative")));
});

test("missing DOMAIN_EXPORT_BUCKET returns deterministic InternalError", async () => {
  delete process.env.DOMAIN_EXPORT_BUCKET;
  process.env.SIC_DOMAIN_TABLE = "domain-table";

  const inner = createExportsDomainInner({
    getSessionRepositoryFn: () => ({ listSessions: async () => ({ items: [], nextToken: undefined }) }),
    getClubRepositoryFn: () => ({ getClub: async () => ({ club: null }) }),
    getTeamRepositoryFn: () => ({ listTeams: async () => ({ items: [], nextToken: undefined }) }),
    getMembershipRepositoryFn: () => ({ listMemberships: async () => ({ items: [], nextToken: undefined }) }),
    createS3ClientFn: () => ({ send: async () => ({}) }),
  });

  await assert.rejects(
    async () => {
      await inner({ event: {}, tenantCtx: makeTenantCtx(), logger: makeLogger([]) });
    },
    (err) => {
      assert.equal(err instanceof InternalError, true);
      assert.equal(err.code, "platform.misconfig.missing_env");
      assert.deepEqual(err.details, { missing: ["DOMAIN_EXPORT_BUCKET"] });
      assert.equal(err.httpStatus, 500);
      return true;
    }
  );
});
