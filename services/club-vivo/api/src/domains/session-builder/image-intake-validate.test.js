"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateImageAnalysisRequest,
  validateConfirmedProfile,
} = require("./image-intake-validate");

function makeSourceImage(overrides = {}) {
  return {
    filename: "field.jpg",
    mimeType: "image/jpeg",
    bytesBase64: "ZmFrZQ==",
    ...overrides,
  };
}

test("validateImageAnalysisRequest accepts one supported environment_profile image request", () => {
  const result = validateImageAnalysisRequest({
    requestType: "image-analysis",
    mode: "environment_profile",
    sourceImage: makeSourceImage(),
  });

  assert.equal(result.mode, "environment_profile");
  assert.equal(result.sourceImage.mimeType, "image/jpeg");
});

test("validateImageAnalysisRequest fails closed for unsupported mode", () => {
  assert.throws(
    () =>
      validateImageAnalysisRequest({
        requestType: "image-analysis",
        mode: "freeform_anything",
        sourceImage: makeSourceImage(),
      }),
    (error) => {
      assert.equal(error.code, "invalid_field");
      assert.equal(error.details.field, "mode");
      return true;
    }
  );
});

test("validateImageAnalysisRequest rejects client-supplied tenant fields", () => {
  assert.throws(
    () =>
      validateImageAnalysisRequest({
        requestType: "image-analysis",
        mode: "setup_to_drill",
        tenantId: "tenant_spoofed",
        sourceImage: makeSourceImage(),
      }),
    (error) => {
      assert.equal(error.code, "unknown_fields");
      assert.deepEqual(error.details.unknown, ["tenantId"]);
      return true;
    }
  );
});

test("validateConfirmedProfile requires confirmed status and keeps setup_to_drill distinct", () => {
  assert.throws(
    () =>
      validateConfirmedProfile({
        mode: "setup_to_drill",
        schemaVersion: 1,
        analysisId: "analysis-123",
        status: "draft",
        sourceImageId: "image-123",
        sourceImageMimeType: "image/png",
        summary: "Cone box with two lines.",
        layoutType: "box",
        spaceSize: "small",
        playerOrganization: "two-lines",
        visibleEquipment: ["cones"],
        focusTags: ["passing"],
        constraints: [],
        assumptions: [],
        analysisConfidence: "medium",
      }),
    (error) => {
      assert.equal(error.code, "invalid_field");
      assert.equal(error.details.field, "confirmedProfile.status");
      return true;
    }
  );
});
