import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SELECTED_ROUTE_IDS,
  DEMO_POLYGON,
  PICKUP_POINTS,
  ROUTE_LISTS,
} from "../src/demoData.js";
import {
  applyManualSelectionOverrides,
  asPointFeatureCollection,
  countActiveManualOverrides,
  findAffectedPoints,
  summarizeAffectedPoints,
} from "../src/selection.js";

test("demo data contains the exact planned route counts", () => {
  assert.equal(PICKUP_POINTS.length, 442);

  for (const route of ROUTE_LISTS) {
    const routePoints = PICKUP_POINTS.filter(
      (point) => point.properties.routeId === route.id,
    );
    assert.equal(routePoints.length, route.binCount);
  }
});

test("the initial polygon matches the reference summary", () => {
  const visiblePoints = PICKUP_POINTS.filter((point) =>
    DEFAULT_SELECTED_ROUTE_IDS.includes(point.properties.routeId),
  );
  const affected = findAffectedPoints(visiblePoints, [DEMO_POLYGON]);
  const summary = summarizeAffectedPoints(affected);

  assert.deepEqual(summary, {
    pickupCount: 47,
    customerCount: 39,
    routeIds: ["12", "18"],
  });
});

test("every synthetic pickup point has a deterministic property address", () => {
  assert.equal(PICKUP_POINTS[0].properties.address, "Hamngatan 14");
  assert.ok(
    PICKUP_POINTS.every((point) => /^.+ \d+$/.test(point.properties.address)),
  );
});

test("manual overrides can exclude and include individual properties", () => {
  const visiblePoints = PICKUP_POINTS.filter((point) =>
    DEFAULT_SELECTED_ROUTE_IDS.includes(point.properties.routeId),
  );
  const baseAffected = findAffectedPoints(visiblePoints, [DEMO_POLYGON]);
  const baseAffectedIds = new Set(
    baseAffected.map((point) => point.properties.id),
  );
  const excludedPoint = baseAffected[0];
  const includedPoint = visiblePoints.find(
    (point) => !baseAffectedIds.has(point.properties.id),
  );
  const overrides = new Map([
    [excludedPoint.properties.id, false],
    [includedPoint.properties.id, true],
  ]);

  const adjusted = applyManualSelectionOverrides(
    visiblePoints,
    baseAffectedIds,
    overrides,
  );
  const adjustedIds = new Set(adjusted.map((point) => point.properties.id));
  const collection = asPointFeatureCollection(
    visiblePoints,
    baseAffectedIds,
    overrides,
  );

  assert.equal(adjusted.length, 47);
  assert.equal(adjustedIds.has(excludedPoint.properties.id), false);
  assert.equal(adjustedIds.has(includedPoint.properties.id), true);
  assert.equal(
    countActiveManualOverrides(visiblePoints, baseAffectedIds, overrides),
    2,
  );
  assert.equal(
    collection.features.find(
      (point) => point.properties.id === excludedPoint.properties.id,
    ).properties.manualAdjustment,
    "excluded",
  );
  assert.equal(
    collection.features.find(
      (point) => point.properties.id === includedPoint.properties.id,
    ).properties.manualAdjustment,
    "included",
  );
});

test("a point on a polygon boundary is included", () => {
  const boundaryPoint = {
    type: "Feature",
    properties: { id: "boundary", customerId: "customer", routeId: "test" },
    geometry: { type: "Point", coordinates: [0, 0] },
  };
  const square = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    },
  };

  assert.deepEqual(findAffectedPoints([boundaryPoint], [square]), [boundaryPoint]);
});

test("overlapping polygons include each pickup point only once", () => {
  const visiblePoints = PICKUP_POINTS.filter((point) =>
    DEFAULT_SELECTED_ROUTE_IDS.includes(point.properties.routeId),
  );
  const affected = findAffectedPoints(visiblePoints, [DEMO_POLYGON, DEMO_POLYGON]);

  assert.equal(affected.length, 47);
  assert.equal(new Set(affected.map((point) => point.properties.id)).size, 47);
});

test("no polygon yields an empty selection", () => {
  assert.deepEqual(findAffectedPoints(PICKUP_POINTS, []), []);
  assert.deepEqual(summarizeAffectedPoints([]), {
    pickupCount: 0,
    customerCount: 0,
    routeIds: [],
  });
});
