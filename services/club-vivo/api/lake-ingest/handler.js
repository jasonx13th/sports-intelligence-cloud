"use strict";

const { S3Client, HeadObjectCommand, CopyObjectCommand } = require("@aws-sdk/client-s3");

const EVENT_SUCCESS = "lake_ingest_success";
const EVENT_SKIP = "lake_ingest_skip_exists";
const EVENT_FAILURE = "lake_ingest_failure";

const KEY_PATTERN = /^exports\/domain\/([^/]+)\/v=1\/tenant_id=([^/]+)\/export_date=([^/]+)\/run_id=([^/]+)\/(.+\.ndjson)$/;

function makeDestinationKey({ dataset, tenantId, date, fileName }) {
  return `bronze/${dataset}/v=1/tenant_id=${tenantId}/dt=${date}/${fileName}`;
}

function log(eventType, message, extra = {}) {
  console.info(JSON.stringify({ eventType, message, ...extra }));
}

function createS3Client() {
  return new S3Client({});
}

async function objectExists(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") {
      return false;
    }
    throw err;
  }
}

async function copyObject(s3, sourceBucket, sourceKey, destinationBucket, destinationKey) {
  const copySource = `${sourceBucket}/${encodeURIComponent(sourceKey).replace(/%2F/g, "/")}`;
  await s3.send(
    new CopyObjectCommand({
      CopySource: copySource,
      Bucket: destinationBucket,
      Key: destinationKey,
    })
  );
}

function parseRecordKey(key) {
  const match = KEY_PATTERN.exec(key);
  if (!match) return null;

  const [, dataset, tenantId, date, runId, fileName] = match;
  return { dataset, tenantId, date, runId, fileName };
}

exports.handler = async function handler(event) {
  const sourceBucket = process.env.DOMAIN_EXPORT_BUCKET;
  const destinationBucket = process.env.LAKE_BUCKET;

  if (!sourceBucket || !destinationBucket) {
    throw new Error("Missing DOMAIN_EXPORT_BUCKET or LAKE_BUCKET environment variable");
  }

  const s3 = createS3Client();
  const results = [];

  for (const record of event.Records || []) {
    const eventName = record.eventName;
    const objectKey = decodeURIComponent(record.s3?.object?.key?.replace(/\+/g, " ") || "");

    if (!objectKey || !eventName?.startsWith("ObjectCreated")) {
      log(EVENT_FAILURE, "unexpected event record", { eventName, objectKey });
      results.push({ objectKey, status: "skipped", reason: "unsupported event" });
      continue;
    }

    const parsed = parseRecordKey(objectKey);
    if (!parsed) {
      log(EVENT_FAILURE, "export key did not match expected pattern", { objectKey });
      results.push({ objectKey, status: "skipped", reason: "invalid export key" });
      continue;
    }

    const { dataset, tenantId, date, fileName } = parsed;
    const destinationKey = makeDestinationKey({ dataset, tenantId, date, fileName });

    try {
      const exists = await objectExists(s3, destinationBucket, destinationKey);
      if (exists) {
        log(EVENT_SKIP, "destination object already exists", {
          sourceBucket,
          sourceKey: objectKey,
          destinationBucket,
          destinationKey,
          tenantId,
        });
        results.push({ objectKey, status: "skipped", reason: "destination exists" });
        continue;
      }

      await copyObject(s3, sourceBucket, objectKey, destinationBucket, destinationKey);

      log(EVENT_SUCCESS, "lake ingest completed", {
        sourceBucket,
        sourceKey: objectKey,
        destinationBucket,
        destinationKey,
        tenantId,
      });
      results.push({ objectKey, status: "copied", destinationKey });
    } catch (err) {
      log(EVENT_FAILURE, "lake ingest failed", {
        sourceBucket,
        sourceKey: objectKey,
        destinationBucket,
        destinationKey,
        tenantId,
        error: err?.message || String(err),
      });
      throw err;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ results }),
  };
};
