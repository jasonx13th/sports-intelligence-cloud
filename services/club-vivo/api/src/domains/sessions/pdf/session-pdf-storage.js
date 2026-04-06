"use strict";

const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

function normalizeTenantPrefix(tenantId) {
  return String(tenantId || "").startsWith("tenant_") ? String(tenantId) : `tenant_${tenantId}`;
}

function buildSessionPdfKey({ tenantId, sessionId }) {
  return `${normalizeTenantPrefix(tenantId)}/sessions/${sessionId}.pdf`;
}

function getPdfUrlTtlSeconds() {
  return Number(process.env.PDF_URL_TTL_SECONDS || 300);
}

function createSessionPdfStorage({
  bucketName,
  s3Client = new S3Client({}),
  getSignedUrlFn = getSignedUrl,
} = {}) {
  return {
    async putSessionPdf({ tenantId, sessionId, pdfBuffer }) {
      const key = buildSessionPdfKey({ tenantId, sessionId });
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        })
      );
      return { key };
    },

    async presignSessionPdfGet({ tenantId, sessionId }) {
      const key = buildSessionPdfKey({ tenantId, sessionId });
      const expiresInSeconds = getPdfUrlTtlSeconds();
      const url = await getSignedUrlFn(
        s3Client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        }),
        { expiresIn: expiresInSeconds }
      );
      return { url, expiresInSeconds, key };
    },
  };
}

module.exports = {
  normalizeTenantPrefix,
  buildSessionPdfKey,
  getPdfUrlTtlSeconds,
  createSessionPdfStorage,
};
