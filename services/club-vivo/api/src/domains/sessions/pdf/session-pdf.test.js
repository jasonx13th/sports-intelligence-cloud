"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createSessionPdfBuffer } = require("./session-pdf");

test("createSessionPdfBuffer returns a PDF buffer with session fields", () => {
  const pdfBuffer = createSessionPdfBuffer({
    tenantId: "tenant_authoritative",
    session: {
      sessionId: "session-123",
      createdAt: "2026-03-25T00:00:00.000Z",
      sport: "soccer",
      ageBand: "u14",
      durationMin: 75,
      objectiveTags: ["pressing", "transition"],
      activities: [{ title: "Warm-up" }, { title: "Small-sided game" }],
    },
  });

  assert.ok(Buffer.isBuffer(pdfBuffer));
  assert.equal(pdfBuffer.subarray(0, 5).toString("utf8"), "%PDF-");

  const pdfText = pdfBuffer.toString("utf8");
  assert.match(pdfText, /session-123/);
  assert.match(pdfText, /soccer/);
  assert.match(pdfText, /Warm-up/);
});
