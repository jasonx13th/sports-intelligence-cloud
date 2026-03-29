"use strict";

const { randomUUID } = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { withPlatform } = require("../_lib/with-platform");
const { InternalError, ForbiddenError } = require("../_lib/errors");
const { SessionRepository } = require("../_lib/session-repository");
const { ClubRepository } = require("../_lib/club-repository");
const { TeamRepository } = require("../_lib/team-repository");
const { MembershipRepository } = require("../_lib/membership-repository");

function assertEnv() {
  const missing = [];
  if (!process.env.DOMAIN_EXPORT_BUCKET) missing.push("DOMAIN_EXPORT_BUCKET");
  if (!process.env.SIC_DOMAIN_TABLE) missing.push("SIC_DOMAIN_TABLE");
  if (missing.length) {
    throw new InternalError({
      code: "platform.misconfig.missing_env",
      message: "Internal server error",
      details: { missing },
      retryable: false,
    });
  }
}

function requireAdminRole(tenantCtx) {
  if (tenantCtx?.role !== "admin") {
    throw new ForbiddenError({
      code: "exports_domain.admin_required",
      message: "Forbidden",
      details: { requiredRole: "admin" },
    });
  }
}

let sessionRepository;
let clubRepository;
let teamRepository;
let membershipRepository;

function getSessionRepository() {
  if (!sessionRepository) {
    sessionRepository = new SessionRepository({ tableName: process.env.SIC_DOMAIN_TABLE });
  }
  return sessionRepository;
}

function getClubRepository() {
  if (!clubRepository) {
    clubRepository = new ClubRepository({ tableName: process.env.SIC_DOMAIN_TABLE });
  }
  return clubRepository;
}

function getTeamRepository() {
  if (!teamRepository) {
    teamRepository = new TeamRepository({ tableName: process.env.SIC_DOMAIN_TABLE });
  }
  return teamRepository;
}

function getMembershipRepository() {
  if (!membershipRepository) {
    membershipRepository = new MembershipRepository({ tableName: process.env.SIC_DOMAIN_TABLE });
  }
  return membershipRepository;
}

function createS3Client() {
  return new S3Client({});
}

function formatDateUTC(date) {
  return date.toISOString().slice(0, 10);
}

function buildExportRecord({ schemaName, payload, tenantId, exportRunId, exportedAt, entityId }) {
  return {
    schema_name: schemaName,
    schema_version: "1.0",
    exported_at: exportedAt,
    export_run_id: exportRunId,
    tenant_id: tenantId,
    entity_id: entityId,
    operation: "upsert",
    source_system: "sic",
    payload,
  };
}

function makeExportKey(schemaName, tenantId, exportDate, runId) {
  return `exports/domain/${schemaName}/v=1/tenant_id=${tenantId}/export_date=${exportDate}/run_id=${runId}/part-00000.ndjson`;
}

function makeManifestKey(tenantId, exportDate, runId) {
  return `exports/domain/manifest/v=1/tenant_id=${tenantId}/export_date=${exportDate}/run_id=${runId}/manifest.json`;
}

function toNdjson(records) {
  if (!Array.isArray(records) || records.length === 0) return "";
  return records.map((record) => JSON.stringify(record)).join("\n") + "\n";
}

async function listAllPages(listFn, tenantCtx) {
  const items = [];
  let nextToken;

  do {
    const page = await listFn(tenantCtx, { limit: 50, nextToken });
    items.push(...(page.items || []));
    nextToken = page.nextToken;
  } while (nextToken);

  return items;
}

async function putObject({ s3Client, bucket, key, body, contentType }) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

function json(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    isBase64Encoded: false,
  };
}

function createExportsDomainInner({
  getSessionRepositoryFn = getSessionRepository,
  getClubRepositoryFn = getClubRepository,
  getTeamRepositoryFn = getTeamRepository,
  getMembershipRepositoryFn = getMembershipRepository,
  createS3ClientFn = createS3Client,
} = {}) {
  return async function inner({ event, tenantCtx, logger }) {
    assertEnv();
    requireAdminRole(tenantCtx);

    const bucket = process.env.DOMAIN_EXPORT_BUCKET;
    const exportRunId = randomUUID();
    const exportedAt = new Date().toISOString();
    const exportDate = formatDateUTC(new Date(exportedAt));
    const tenantId = tenantCtx.tenantId;

    const s3Client = createS3ClientFn();
    const sessionRepo = getSessionRepositoryFn();
    const clubRepo = getClubRepositoryFn();
    const teamRepo = getTeamRepositoryFn();
    const membershipRepo = getMembershipRepositoryFn();

    const [sessions, teams, memberships, clubResp] = await Promise.all([
      listAllPages(sessionRepo.listSessions.bind(sessionRepo), tenantCtx),
      listAllPages(teamRepo.listTeams.bind(teamRepo), tenantCtx),
      listAllPages(membershipRepo.listMemberships.bind(membershipRepo), tenantCtx),
      clubRepo.getClub(tenantCtx),
    ]);

    const clubItems = clubResp?.club ? [clubResp.club] : [];

    const exportsBySchema = [
      {
        schemaName: "session",
        items: sessions,
        entityIdFn: (item) => item?.sessionId,
      },
      {
        schemaName: "club",
        items: clubItems,
        entityIdFn: (item) => item?.clubId,
      },
      {
        schemaName: "team",
        items: teams,
        entityIdFn: (item) => item?.teamId,
      },
      {
        schemaName: "membership",
        items: memberships,
        entityIdFn: (item) => item?.userSub,
      },
    ];

    const objectKeys = {};
    const counts = {};

    for (const schemaExport of exportsBySchema) {
      const { schemaName, items, entityIdFn } = schemaExport;
      const records = (items || []).map((item) => {
        const entityId = entityIdFn(item);
        return buildExportRecord({
          schemaName,
          payload: item,
          tenantId,
          exportRunId,
          exportedAt,
          entityId,
        });
      });

      const key = makeExportKey(schemaName, tenantId, exportDate, exportRunId);
      const body = toNdjson(records);

      await putObject({
        s3Client,
        bucket,
        key,
        body,
        contentType: "application/x-ndjson",
      });

      counts[schemaName] = records.length;
      objectKeys[schemaName] = key;
    }

    const manifest = {
      export_run_id: exportRunId,
      exported_at: exportedAt,
      tenant_id: tenantId,
      export_date: exportDate,
      schema_counts: counts,
      object_keys: objectKeys,
      source_system: "sic",
    };

    const manifestKey = makeManifestKey(tenantId, exportDate, exportRunId);
    await putObject({
      s3Client,
      bucket,
      key: manifestKey,
      body: JSON.stringify(manifest),
      contentType: "application/json",
    });

    objectKeys.manifest = manifestKey;

    logger.info("domain_export_completed", "domain export completed", {
      tenantId,
      exportRunId,
      schemaCounts: counts,
      manifestKey,
    });

    return json(201, {
      message: "Domain export created",
      manifest,
    });
  };
}

const inner = createExportsDomainInner();

module.exports = {
  handler: withPlatform(inner),
  createExportsDomainInner,
};
