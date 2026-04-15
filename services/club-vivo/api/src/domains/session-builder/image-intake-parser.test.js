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
