import assert from "node:assert/strict";
import test from "node:test";
import source from "../src/data/waste-routes-2026-05-07.json" with { type: "json" };
import { COLLECTION_DATE, PICKUP_POINTS, ROUTE_LISTS, getPointBounds } from "../src/routeData.js";
import { flowReducer, initialFlow } from "../src/flow.js";
import { asPointFeatureCollection, findAffectedPoints, summarizeAffectedPoints } from "../src/selection.js";

test("the provided export is represented exactly as source records", () => {
  assert.equal(COLLECTION_DATE, "2026-05-07");
  assert.equal(ROUTE_LISTS.length, 17);
  assert.equal(PICKUP_POINTS.length, 2968);
  assert.equal(
    ROUTE_LISTS.reduce((sum, route) => sum + route.pointCount, 0),
    source.routes.reduce((sum, route) => sum + route.coordinates.length, 0),
  );
  ROUTE_LISTS.forEach((route, index) => {
    assert.equal(route.name, source.routes[index].name);
    assert.equal(route.id, source.routes[index].id);
    assert.equal(route.pointCount, source.routes[index].coordinates.length);
  });
  assert.deepEqual(PICKUP_POINTS[0].geometry.coordinates, source.routes[0].coordinates[0]);
  assert.deepEqual(PICKUP_POINTS.at(-1).geometry.coordinates, source.routes.at(-1).coordinates.at(-1));
});

test("all coordinates are valid and their bounds are calculated", () => {
  assert.ok(PICKUP_POINTS.every((point) => {
    const [longitude, latitude] = point.geometry.coordinates;
    return Number.isFinite(longitude) && Number.isFinite(latitude)
      && Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90;
  }));
  assert.deepEqual(getPointBounds(PICKUP_POINTS), [
    [15.339235, 58.27285],
    [15.796098, 58.567677],
  ]);
});

test("a point on a polygon boundary is included", () => {
  const point = {
    type: "Feature",
    properties: { id: "boundary", routeId: "test" },
    geometry: { type: "Point", coordinates: [0, 0] },
  };
  const polygon = {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
  };
  assert.deepEqual(findAffectedPoints([point], [polygon]), [point]);
});

test("selection summary and map collection use coordinate records", () => {
  const points = PICKUP_POINTS.slice(0, 3);
  const ids = new Set(points.slice(0, 2).map((point) => point.properties.id));
  assert.deepEqual(summarizeAffectedPoints(points), {
    pointCount: 3,
    routeIds: [ROUTE_LISTS[0].id],
  });
  const collection = asPointFeatureCollection(points, ids);
  assert.deepEqual(collection.features.map((point) => point.properties.selected), [true, true, false]);
});

test("route choice is locked after entering the map", () => {
  let state = flowReducer(initialFlow, { type: "toggle-route", id: ROUTE_LISTS[0].id });
  state = flowReducer(state, { type: "open-map" });
  const locked = flowReducer(state, { type: "toggle-route", id: ROUTE_LISTS[1].id });
  assert.deepEqual(locked.selectedRouteIds, [ROUTE_LISTS[0].id]);
  assert.equal(locked.step, "map");
});

test("whole-route and area previews are gated by a valid selection", () => {
  assert.equal(flowReducer(initialFlow, { type: "preview-all" }).previewScope, null);
  let routeState = flowReducer(initialFlow, { type: "toggle-route", id: ROUTE_LISTS[0].id });
  assert.equal(flowReducer(routeState, { type: "preview-all" }).previewScope, "all");
  let mapState = flowReducer(routeState, { type: "open-map" });
  assert.equal(flowReducer(mapState, { type: "preview-area", pointCount: 0 }).previewScope, null);
  mapState = flowReducer(mapState, { type: "set-polygons", polygons: [{ id: "area" }] });
  assert.equal(flowReducer(mapState, { type: "preview-area", pointCount: 12 }).previewScope, "area");
});
