"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DRILL_DIAGRAM_SPEC_VERSION,
  validateDiagramSpecV1,
} = require("./diagram-spec-validate");

function makeValidDiagramSpec(overrides = {}) {
  return {
    diagramId: "diag_001",
    specVersion: DRILL_DIAGRAM_SPEC_VERSION,
    activityId: "act_001",
    title: "4v2 Defensive Rondo Setup",
    diagramType: "setup",
    sport: "soccer",
    objects: [
      {
        objectId: "player_1",
        type: "player",
        x: 100,
        y: 120,
      },
    ],
    ...overrides,
  };
}

test("validateDiagramSpecV1 accepts a minimal valid spec", () => {
  const result = validateDiagramSpecV1(makeValidDiagramSpec());

  assert.equal(result.specVersion, DRILL_DIAGRAM_SPEC_VERSION);
  assert.equal(result.diagramType, "setup");
  assert.equal(result.sport, "soccer");
});

test("validateDiagramSpecV1 rejects drill-diagram-spec/v1", () => {
  assert.throws(
    () => validateDiagramSpecV1(makeValidDiagramSpec({ specVersion: "drill-diagram-spec/v1" })),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "invalid_spec_version");
      assert.equal(err.details.field, "specVersion");
      return true;
    }
  );
});

test("validateDiagramSpecV1 rejects unsupported diagramType", () => {
  assert.throws(
    () => validateDiagramSpecV1(makeValidDiagramSpec({ diagramType: "variation" })),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "unsupported_diagram_type");
      assert.equal(err.details.field, "diagramType");
      return true;
    }
  );
});

test("validateDiagramSpecV1 rejects non-soccer sport", () => {
  assert.throws(
    () => validateDiagramSpecV1(makeValidDiagramSpec({ sport: "basketball" })),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "unsupported_sport");
      assert.equal(err.details.field, "sport");
      return true;
    }
  );
});

test("validateDiagramSpecV1 rejects bad connection refs", () => {
  assert.throws(
    () =>
      validateDiagramSpecV1(
        makeValidDiagramSpec({
          connections: [
            {
              connectionId: "conn_1",
              type: "pass",
              fromRef: "player_1",
              toRef: "missing_object",
            },
          ],
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "invalid_connection_ref");
      assert.equal(err.details.field, "toRef");
      return true;
    }
  );
});

test("validateDiagramSpecV1 rejects invalid object type or missing coordinates", () => {
  assert.throws(
    () =>
      validateDiagramSpecV1(
        makeValidDiagramSpec({
          objects: [{ objectId: "obj_bad", type: "rocket", x: 100, y: 120 }],
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.reason, "unsupported_object_type");
      assert.equal(err.details.field, "type");
      return true;
    }
  );

  assert.throws(
    () =>
      validateDiagramSpecV1(
        makeValidDiagramSpec({
          objects: [{ objectId: "obj_missing_x", type: "player", y: 120 }],
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "x");
      return true;
    }
  );
});

test("validateDiagramSpecV1 rejects invalid zone geometry", () => {
  assert.throws(
    () =>
      validateDiagramSpecV1(
        makeValidDiagramSpec({
          field: {
            zones: [
              {
                zoneId: "zone_1",
                shape: "rectangle",
                x: 50,
                y: 50,
                width: 100,
              },
            ],
          },
        })
      ),
    (err) => {
      assert.equal(err.code, "invalid_field");
      assert.equal(err.details.field, "height");
      return true;
    }
  );
});
