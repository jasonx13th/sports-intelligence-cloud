"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeTenantPrefix,
  buildSessionPdfKey,
  getPdfUrlTtlSeconds,
  createSessionPdfStorage,
} = require("./session-pdf-storage");

test("normalizeTenantPrefix avoids double tenant_ prefix", () => {
  assert.equal(normalizeTenantPrefix("tenant_demo"), "tenant_demo");
  assert.equal(normalizeTenantPrefix("demo"), "tenant_demo");
});

test("buildSessionPdfKey derives a tenant-scoped key", () => {
  assert.equal(
    buildSessionPdfKey({ tenantId: "tenant_demo", sessionId: "session-123" }),
    "tenant_demo/sessions/session-123.pdf"
  );
});

test("putSessionPdf uses application/pdf content type", async () => {
  const commands = [];
  const storage = createSessionPdfStorage({
    bucketName: "pdf-bucket",
    s3Client: {
      send: async (command) => {
        commands.push(command);
        return {};
      },
    },
  });

  await storage.putSessionPdf({
    tenantId: "tenant_authoritative",
    sessionId: "session-123",
    pdfBuffer: Buffer.from("%PDF-1.4\nfake\n", "utf8"),
  });

  assert.equal(commands[0].input.Bucket, "pdf-bucket");
  assert.equal(commands[0].input.Key, "tenant_authoritative/sessions/session-123.pdf");
  assert.equal(commands[0].input.ContentType, "application/pdf");
});

test("presignSessionPdfGet defaults TTL to 300 seconds", async () => {
  delete process.env.PDF_URL_TTL_SECONDS;
  const storage = createSessionPdfStorage({
    bucketName: "pdf-bucket",
    getSignedUrlFn: async (_client, command, options) => {
      assert.equal(command.input.Key, "tenant_authoritative/sessions/session-123.pdf");
      assert.equal(options.expiresIn, 300);
      return "https://example.com/default.pdf";
    },
  });

  const result = await storage.presignSessionPdfGet({
    tenantId: "tenant_authoritative",
    sessionId: "session-123",
  });

  assert.deepEqual(result, {
    url: "https://example.com/default.pdf",
    expiresInSeconds: 300,
    key: "tenant_authoritative/sessions/session-123.pdf",
  });
  assert.equal(getPdfUrlTtlSeconds(), 300);
});

test("presignSessionPdfGet respects PDF_URL_TTL_SECONDS", async () => {
  process.env.PDF_URL_TTL_SECONDS = "120";
  const storage = createSessionPdfStorage({
    bucketName: "pdf-bucket",
    getSignedUrlFn: async (_client, _command, options) => {
      assert.equal(options.expiresIn, 120);
      return "https://example.com/custom.pdf";
    },
  });

  const result = await storage.presignSessionPdfGet({
    tenantId: "tenant_authoritative",
    sessionId: "session-123",
  });

  assert.equal(result.url, "https://example.com/custom.pdf");
  assert.equal(result.expiresInSeconds, 120);
});
