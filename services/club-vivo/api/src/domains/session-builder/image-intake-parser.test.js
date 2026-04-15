"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { parseImageAnalysisText } = require("./image-intake-parser");

test("parseImageAnalysisText accepts fenced environment profile JSON and applies the draft envelope", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-123",
    sourceImageId: "image-123",
    sourceImageMimeType: "image/jpeg",
    text: [
      "```json",
      JSON.stringify({
        summary: "Small turf space with one goal.",
        surfaceType: "turf",
        spaceSize: "small",
        boundaryType: "small-grid",
        visibleEquipment: ["cones", "goal"],
        constraints: ["limited-width"],
        safetyNotes: ["wet-surface"],
        assumptions: ["ball count not visible"],
        analysisConfidence: "medium",
      }),
      "```",
    ].join("\n"),
  });

  assert.equal(profile.status, "draft");
  assert.equal(profile.mode, "environment_profile");
  assert.deepEqual(profile.visibleEquipment, ["cones", "goal"]);
});

test("parseImageAnalysisText rejects unsupported fields from model output", () => {
  assert.throws(
    () =>
      parseImageAnalysisText({
        mode: "setup_to_drill",
        analysisId: "analysis-123",
        sourceImageId: "image-123",
        sourceImageMimeType: "image/png",
        text: JSON.stringify({
          summary: "Cone box with two lines.",
          layoutType: "box",
          spaceSize: "small",
          playerOrganization: "two-lines",
          visibleEquipment: ["cones"],
          focusTags: ["passing"],
          constraints: [],
          assumptions: [],
          analysisConfidence: "medium",
          tenantId: "spoofed",
        }),
      }),
    (error) => {
      assert.equal(error.code, "unknown_fields");
      assert.equal(error.details.field, "profile");
      return true;
    }
  );
});

test("parseImageAnalysisText normalizes common environment surface synonyms before validation", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-456",
    sourceImageId: "image-456",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Synthetic turf area with one goal.",
      surfaceType: "Synthetic Turf",
      spaceSize: "small",
      boundaryType: "small-grid",
      visibleEquipment: ["cones"],
      constraints: [],
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "medium",
    }),
  });

  assert.equal(profile.surfaceType, "turf");
});

test("parseImageAnalysisText maps unsupported environment surface values to unknown", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-789",
    sourceImageId: "image-789",
    sourceImageMimeType: "image/png",
    text: JSON.stringify({
      summary: "Unclear surface markings.",
      surfaceType: "sand pit",
      spaceSize: "small",
      boundaryType: "mixed",
      visibleEquipment: [],
      constraints: [],
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "low",
    }),
  });

  assert.equal(profile.surfaceType, "unknown");
});

test("parseImageAnalysisText normalizes environment space size casing before validation", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-999",
    sourceImageId: "image-999",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Size could not be determined from the photo.",
      surfaceType: "turf",
      spaceSize: "Unknown",
      boundaryType: "mixed",
      visibleEquipment: ["cones"],
      constraints: [],
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "low",
    }),
  });

  assert.equal(profile.spaceSize, "unknown");
});
