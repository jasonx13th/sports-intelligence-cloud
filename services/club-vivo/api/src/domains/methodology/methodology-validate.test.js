"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateCreateMethodology,
  validateMethodologyScope,
  validateSaveMethodology,
  validatePublishMethodology,
  LIMITS,
  SCOPE_VALUES,
  STATUS_VALUES,
} = require("./methodology-validate");

test("validateCreateMethodology accepts valid input, trims strings, and defaults status", () => {
  const result = validateCreateMethodology({
    scope: "shared",
    title: " Shared Possession Model ",
    content: "  Principles for decision-making in possession.  ",
  });

  assert.deepEqual(result, {
    scope: "shared",
    title: "Shared Possession Model",
    content: "Principles for decision-making in possession.",
    status: "draft",
  });
});

test("validateCreateMethodology accepts a supported explicit status", () => {
  const result = validateCreateMethodology({
    scope: "travel",
    title: "Travel Game Model",
    content: "Published guidance for travel coaches.",
    status: "published",
  });

  assert.equal(result.status, "published");
});

test("validateCreateMethodology rejects unknown fields including tenantId", () => {
  assert.throws(
    () =>
      validateCreateMethodology({
        scope: "shared",
        title: "Shared Model",
        content: "Methodology content",
        tenantId: "spoofed",
        extraField: true,
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["tenantId", "extraField"] });
      return true;
    }
  );
});

test("validateCreateMethodology rejects unsupported scope values", () => {
  assert.throws(
    () =>
      validateCreateMethodology({
        scope: "academy",
        title: "Shared Model",
        content: "Methodology content",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "scope");
      assert.deepEqual(err.details.allowed, SCOPE_VALUES);
      return true;
    }
  );
});

test("validateCreateMethodology rejects unsupported status values", () => {
  assert.throws(
    () =>
      validateCreateMethodology({
        scope: "shared",
        title: "Shared Model",
        content: "Methodology content",
        status: "archived",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "status");
      assert.deepEqual(err.details.allowed, STATUS_VALUES);
      return true;
    }
  );
});

test("validateCreateMethodology rejects blank title after trim", () => {
  assert.throws(
    () =>
      validateCreateMethodology({
        scope: "shared",
        title: "   ",
        content: "Methodology content",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "title");
      return true;
    }
  );
});

test("validateCreateMethodology rejects blank content after trim", () => {
  assert.throws(
    () =>
      validateCreateMethodology({
        scope: "shared",
        title: "Shared Model",
        content: "   ",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "content");
      return true;
    }
  );
});

test("validateCreateMethodology enforces the title max length", () => {
  assert.throws(
    () =>
      validateCreateMethodology({
        scope: "ost",
        title: "a".repeat(LIMITS.titleMax + 1),
        content: "Methodology content",
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "title");
      assert.equal(err.details.max, LIMITS.titleMax);
      return true;
    }
  );
});

test("validateCreateMethodology enforces the content max length", () => {
  assert.throws(
    () =>
      validateCreateMethodology({
        scope: "ost",
        title: "OST Model",
        content: "a".repeat(LIMITS.contentMax + 1),
      }),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "content");
      assert.equal(err.details.max, LIMITS.contentMax);
      return true;
    }
  );
});

test("validateMethodologyScope accepts supported scope values", () => {
  assert.equal(validateMethodologyScope("shared"), "shared");
  assert.equal(validateMethodologyScope(" travel "), "travel");
});

test("validateMethodologyScope rejects unsupported scope values", () => {
  assert.throws(() => validateMethodologyScope("academy"), (err) => {
    assert.equal(err.code, "invalid_field");
    assert.equal(err.details.field, "scope");
    assert.deepEqual(err.details.allowed, SCOPE_VALUES);
    return true;
  });
});

test("validateSaveMethodology accepts title and content only", () => {
  const result = validateSaveMethodology({
    title: " Shared Possession Model ",
    content: "  Principles for decision-making in possession.  ",
  });

  assert.deepEqual(result, {
    title: "Shared Possession Model",
    content: "Principles for decision-making in possession.",
  });
});

test("validateSaveMethodology rejects unknown fields including scope and tenantId", () => {
  assert.throws(
    () =>
      validateSaveMethodology({
        scope: "shared",
        title: "Shared Model",
        content: "Methodology content",
        tenantId: "spoofed",
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["scope", "tenantId"] });
      return true;
    }
  );
});

test("validatePublishMethodology accepts an empty body", () => {
  assert.deepEqual(validatePublishMethodology({}), {});
});

test("validatePublishMethodology rejects unexpected body fields", () => {
  assert.throws(
    () =>
      validatePublishMethodology({
        durationMin: 45,
      }),
    (err) => {
      assert.equal(err.code, "unknown_fields");
      assert.deepEqual(err.details, { unknown: ["durationMin"] });
      return true;
    }
  );
});
