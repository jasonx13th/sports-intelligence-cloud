"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateCreateTemplate,
  validateGenerateFromTemplate,
} = require("./template-validate");

test("validateCreateTemplate accepts valid input", () => {
  const result = validateCreateTemplate({
    sourceSessionId: "session-123",
    name: "Pressing Template",
    description: "Reusable pressing session",
    tags: ["defending", "transition"],
  });

  assert.deepEqual(result, {
    sourceSessionId: "session-123",
    name: "Pressing Template",
    description: "Reusable pressing session",
    tags: ["defending", "transition"],
  });
});

test("validateCreateTemplate rejects missing sourceSessionId", () => {
  assert.throws(
    () =>
      validateCreateTemplate({
        name: "Pressing Template",
      }),
    (err) => {
      assert.ok(err);
      return true;
    }
  );
});

test("validateGenerateFromTemplate accepts empty body", () => {
  const result = validateGenerateFromTemplate({});
  assert.deepEqual(result, {});
});

test("validateGenerateFromTemplate rejects unknown fields", () => {
  assert.throws(
    () =>
      validateGenerateFromTemplate({
        tenantId: "spoofed",
      }),
    (err) => {
      assert.ok(err);
      return true;
    }
  );
});
