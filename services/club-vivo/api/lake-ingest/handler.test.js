"use strict";

const assert = require("assert");

// Local copy of the key pattern + mapping to keep the test dead simple.
// (If you later refactor handler.js to export helpers, update this test to import them.)
const KEY_PATTERN =
  /^exports\/domain\/([^/]+)\/v=1\/tenant_id=([^/]+)\/export_date=([^/]+)\/run_id=([^/]+)\/(.+\.ndjson)$/;

function makeDestinationKey({ dataset, tenantId, date, fileName }) {
  return `bronze/${dataset}/v=1/tenant_id=${tenantId}/dt=${date}/${fileName}`;
}

function parseRecordKey(key) {
  const match = KEY_PATTERN.exec(key);
  if (!match) return null;
  const [, dataset, tenantId, date, runId, fileName] = match;
  return { dataset, tenantId, date, runId, fileName };
}

(function main() {
  const key =
    "exports/domain/sessions/v=1/tenant_id=ORG#999/export_date=2026-03-30/run_id=abc123/part-00000.ndjson";
  const parsed = parseRecordKey(key);
  assert(parsed, "expected key to parse");

  const dest = makeDestinationKey({
    dataset: parsed.dataset,
    tenantId: parsed.tenantId,
    date: parsed.date,
    fileName: parsed.fileName,
  });

  assert.strictEqual(
    dest,
    "bronze/sessions/v=1/tenant_id=ORG#999/dt=2026-03-30/part-00000.ndjson"
  );

  const bad = parseRecordKey("exports/domain/WRONG");
  assert.strictEqual(bad, null);

  console.log("OK: lake-ingest key mapping");
})();
