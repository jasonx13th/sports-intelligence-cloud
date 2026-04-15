"use strict";

const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { ServiceUnavailableError, InternalError } = require("../errors/errors");

function buildModePrompt(mode) {
  if (mode === "environment_profile") {
    return [
      "Analyze the single training-space image and return JSON only.",
      "Return fields: summary, surfaceType, spaceSize, boundaryType, visibleEquipment, constraints, safetyNotes, assumptions, analysisConfidence.",
      "Use only allowed enum values.",
      "Do not include markdown, code fences, explanations, tenant data, person identity, or extra keys.",
      "If uncertain, use unknown or put the uncertainty in assumptions.",
    ].join(" ");
  }

  return [
    "Analyze the single drill-setup image and return JSON only.",
    "Return fields: summary, layoutType, spaceSize, playerOrganization, visibleEquipment, focusTags, constraints, assumptions, analysisConfidence.",
    "Use only allowed enum values.",
    "Do not include markdown, code fences, explanations, tenant data, person identity, or extra keys.",
    "If uncertain, use unknown or put the uncertainty in assumptions.",
  ].join(" ");
}

function buildRequestBody({ mode, mimeType, imageBase64 }) {
  return {
    system: [{ text: buildModePrompt(mode) }],
    messages: [
      {
        role: "user",
        content: [
          { text: `Mode: ${mode}. Return one compact JSON object only.` },
          {
            image: {
              format: mimeType === "image/jpeg" ? "jpeg" : mimeType.replace("image/", ""),
              source: {
                bytes: imageBase64,
              },
            },
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 500,
      temperature: 0.1,
    },
  };
}

function extractOutputText(modelResponse) {
  const content = modelResponse?.output?.message?.content;
  if (!Array.isArray(content)) {
    throw new InternalError({
      code: "session_builder.image_analysis.invalid_response",
      message: "Internal server error",
    });
  }

  const textBlock = content.find((item) => typeof item?.text === "string" && item.text.trim());
  if (!textBlock) {
    throw new InternalError({
      code: "session_builder.image_analysis.invalid_response",
      message: "Internal server error",
    });
  }

  return textBlock.text;
}

function createSessionBuilderImageAnalysis({
  bedrockClient = new BedrockRuntimeClient({}),
  modelId = process.env.SESSION_IMAGE_ANALYSIS_MODEL_ID,
} = {}) {
  return {
    async analyzeImage({ mode, mimeType, imageBase64 }) {
      if (!modelId) {
        throw new InternalError({
          code: "platform.misconfig.missing_env",
          message: "Internal server error",
          details: { missing: ["SESSION_IMAGE_ANALYSIS_MODEL_ID"] },
        });
      }

      try {
        const response = await bedrockClient.send(
          new InvokeModelCommand({
            modelId,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(buildRequestBody({ mode, mimeType, imageBase64 })),
          })
        );

        const responseText = Buffer.from(response.body).toString("utf8");
        const parsedResponse = JSON.parse(responseText);

        return {
          text: extractOutputText(parsedResponse),
          usage: parsedResponse.usage || {},
          metrics: parsedResponse.metrics || {},
          stopReason: parsedResponse.stopReason,
        };
      } catch (error) {
        throw new ServiceUnavailableError({
          code: "session_builder.image_analysis_unavailable",
          message: "Service unavailable",
          details: { reason: "bedrock_invoke_failed" },
          cause: error,
        });
      }
    },
  };
}

module.exports = {
  buildModePrompt,
  buildRequestBody,
  extractOutputText,
  createSessionBuilderImageAnalysis,
};
