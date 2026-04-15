"use strict";

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

function mimeTypeToExtension(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "bin";
}

function buildSessionBuilderImageKey({ tenantId, mode, analysisId, sourceImageId, mimeType }) {
  const extension = mimeTypeToExtension(mimeType);
  return `tenant/${tenantId}/session-builder/image-intake/v1/${mode}/${analysisId}/source/${sourceImageId}.${extension}`;
}

function createSessionBuilderImageStorage({
  bucketName,
  s3Client = new S3Client({}),
} = {}) {
  return {
    async putSourceImage({ tenantId, mode, analysisId, sourceImageId, mimeType, imageBuffer, contentSha256 }) {
      const key = buildSessionBuilderImageKey({
        tenantId,
        mode,
        analysisId,
        sourceImageId,
        mimeType,
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: imageBuffer,
          ContentType: mimeType,
          ...(contentSha256 ? { Metadata: { contentsha256: contentSha256 } } : {}),
        })
      );

      return { key };
    },
  };
}

module.exports = {
  mimeTypeToExtension,
  buildSessionBuilderImageKey,
  createSessionBuilderImageStorage,
};
