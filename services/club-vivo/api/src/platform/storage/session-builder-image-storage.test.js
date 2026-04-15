"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSessionBuilderImageKey,
  createSessionBuilderImageStorage,
} = require("./session-builder-image-storage");

test("buildSessionBuilderImageKey derives the tenant-scoped image intake prefix", () => {
  const key = buildSessionBuilderImageKey({
    tenantId: "tenant_authoritative",
    mode: "environment_profile",
    analysisId: "analysis-123",
    sourceImageId: "image-123",
    mimeType: "image/jpeg",
  });

  assert.equal(
    key,
    "tenant/tenant_authoritative/session-builder/image-intake/v1/environment_profile/analysis-123/source/image-123.jpg"
  );
});

test("createSessionBuilderImageStorage writes source images under the derived tenant key", async () => {
  const calls = [];
  const storage = createSessionBuilderImageStorage({
    bucketName: "session-images",
    s3Client: {
      send: async (command) => {
        calls.push(command.input);
        return {};
      },
    },
  });

  const result = await storage.putSourceImage({
    tenantId: "tenant_authoritative",
    mode: "setup_to_drill",
    analysisId: "analysis-123",
    sourceImageId: "image-123",
    mimeType: "image/png",
    imageBuffer: Buffer.from("fake"),
    contentSha256: "abc123",
  });

  assert.equal(
    result.key,
    "tenant/tenant_authoritative/session-builder/image-intake/v1/setup_to_drill/analysis-123/source/image-123.png"
  );
  assert.equal(calls[0].Bucket, "session-images");
  assert.equal(
    calls[0].Key,
    "tenant/tenant_authoritative/session-builder/image-intake/v1/setup_to_drill/analysis-123/source/image-123.png"
  );
  assert.deepEqual(calls[0].Metadata, { contentsha256: "abc123" });
});
