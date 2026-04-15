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

test("parseImageAnalysisText normalizes environment boundary type casing before validation", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1000",
    sourceImageId: "image-1000",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Indoor area with visible court markings.",
      surfaceType: "indoor",
      spaceSize: "medium",
      boundaryType: "Indoor Court",
      visibleEquipment: ["cones"],
      constraints: [],
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "medium",
    }),
  });

  assert.equal(profile.boundaryType, "indoor-court");
});

test("parseImageAnalysisText maps unsupported environment boundary values to unknown", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1001",
    sourceImageId: "image-1001",
    sourceImageMimeType: "image/png",
    text: JSON.stringify({
      summary: "Covered structure with unclear boundaries.",
      surfaceType: "turf",
      spaceSize: "unknown",
      boundaryType: "Metal Trusses",
      visibleEquipment: [],
      constraints: [],
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "low",
    }),
  });

  assert.equal(profile.boundaryType, "unknown");
});

test("parseImageAnalysisText keeps valid environment constraints arrays", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1002",
    sourceImageId: "image-1002",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Tight indoor space with limited width.",
      surfaceType: "indoor",
      spaceSize: "small",
      boundaryType: "indoor-court",
      visibleEquipment: ["cones"],
      constraints: ["limited-width", "shared-space"],
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "medium",
    }),
  });

  assert.deepEqual(profile.constraints, ["limited-width", "shared-space"]);
});

test("parseImageAnalysisText normalizes invalid environment constraints shapes to an empty array", () => {
  const nonArrayProfile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1003",
    sourceImageId: "image-1003",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Open area with unclear constraints.",
      surfaceType: "turf",
      spaceSize: "medium",
      boundaryType: "mixed",
      visibleEquipment: [],
      constraints: "limited-width",
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "low",
    }),
  });

  const mixedArrayProfile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1004",
    sourceImageId: "image-1004",
    sourceImageMimeType: "image/png",
    text: JSON.stringify({
      summary: "Shared field with partially visible setup.",
      surfaceType: "grass",
      spaceSize: "large",
      boundaryType: "full-field",
      visibleEquipment: [],
      constraints: ["shared-space", 3],
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "low",
    }),
  });

  assert.deepEqual(nonArrayProfile.constraints, []);
  assert.deepEqual(mixedArrayProfile.constraints, []);
});

test("parseImageAnalysisText keeps valid environment safety notes arrays", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1005",
    sourceImageId: "image-1005",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Indoor area with a slick sideline.",
      surfaceType: "indoor",
      spaceSize: "small",
      boundaryType: "indoor-court",
      visibleEquipment: ["cones"],
      constraints: [],
      safetyNotes: ["wet-surface", "low-ceiling"],
      assumptions: [],
      analysisConfidence: "medium",
    }),
  });

  assert.deepEqual(profile.safetyNotes, ["wet-surface", "low-ceiling"]);
});

test("parseImageAnalysisText normalizes invalid environment safety note shapes to an empty array", () => {
  const nonArrayProfile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1006",
    sourceImageId: "image-1006",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Open turf field with unclear hazards.",
      surfaceType: "turf",
      spaceSize: "medium",
      boundaryType: "mixed",
      visibleEquipment: [],
      constraints: [],
      safetyNotes: "wet-surface",
      assumptions: [],
      analysisConfidence: "low",
    }),
  });

  const mixedArrayProfile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1007",
    sourceImageId: "image-1007",
    sourceImageMimeType: "image/png",
    text: JSON.stringify({
      summary: "Shared space with partially visible hazards.",
      surfaceType: "grass",
      spaceSize: "large",
      boundaryType: "full-field",
      visibleEquipment: [],
      constraints: [],
      safetyNotes: ["slippery", false],
      assumptions: [],
      analysisConfidence: "low",
    }),
  });

  assert.deepEqual(nonArrayProfile.safetyNotes, []);
  assert.deepEqual(mixedArrayProfile.safetyNotes, []);
});

test("parseImageAnalysisText keeps valid environment assumptions arrays", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1008",
    sourceImageId: "image-1008",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Outdoor turf area with one partially visible goal.",
      surfaceType: "turf",
      spaceSize: "medium",
      boundaryType: "mixed",
      visibleEquipment: ["cones"],
      constraints: [],
      safetyNotes: [],
      assumptions: ["ball count not visible", "sideline width estimated"],
      analysisConfidence: "medium",
    }),
  });

  assert.deepEqual(profile.assumptions, ["ball count not visible", "sideline width estimated"]);
});

test("parseImageAnalysisText normalizes invalid environment assumption shapes to an empty array", () => {
  const nonArrayProfile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1009",
    sourceImageId: "image-1009",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Indoor area with incomplete visibility.",
      surfaceType: "indoor",
      spaceSize: "small",
      boundaryType: "indoor-court",
      visibleEquipment: [],
      constraints: [],
      safetyNotes: [],
      assumptions: "player count estimated",
      analysisConfidence: "low",
    }),
  });

  const mixedArrayProfile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1010",
    sourceImageId: "image-1010",
    sourceImageMimeType: "image/png",
    text: JSON.stringify({
      summary: "Shared field with partially blocked sight lines.",
      surfaceType: "grass",
      spaceSize: "large",
      boundaryType: "full-field",
      visibleEquipment: [],
      constraints: [],
      safetyNotes: [],
      assumptions: ["goal depth estimated", 2],
      analysisConfidence: "low",
    }),
  });

  assert.deepEqual(nonArrayProfile.assumptions, []);
  assert.deepEqual(mixedArrayProfile.assumptions, []);
});

test("parseImageAnalysisText normalizes environment analysis confidence casing before validation", () => {
  const profile = parseImageAnalysisText({
    mode: "environment_profile",
    analysisId: "analysis-1011",
    sourceImageId: "image-1011",
    sourceImageMimeType: "image/jpeg",
    text: JSON.stringify({
      summary: "Indoor space with clearly visible setup markers.",
      surfaceType: "indoor",
      spaceSize: "small",
      boundaryType: "indoor-court",
      visibleEquipment: ["cones"],
      constraints: [],
      safetyNotes: [],
      assumptions: [],
      analysisConfidence: "High",
    }),
  });

  assert.equal(profile.analysisConfidence, "high");
});

test("parseImageAnalysisText keeps unsupported environment analysis confidence values fail-closed", () => {
  assert.throws(
    () =>
      parseImageAnalysisText({
        mode: "environment_profile",
        analysisId: "analysis-1012",
        sourceImageId: "image-1012",
        sourceImageMimeType: "image/png",
        text: JSON.stringify({
          summary: "Outdoor area with partially visible details.",
          surfaceType: "grass",
          spaceSize: "medium",
          boundaryType: "mixed",
          visibleEquipment: [],
          constraints: [],
          safetyNotes: [],
          assumptions: [],
          analysisConfidence: "Very High",
        }),
      }),
    (error) => {
      assert.equal(error.code, "invalid_field");
      assert.equal(error.details.field, "profile.analysisConfidence");
      return true;
    }
  );
});
