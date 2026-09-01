import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

export function findAffectedPoints(points, polygons) {
  if (!polygons.length) return [];

  return points.filter((point) =>
    polygons.some((polygon) =>
      booleanPointInPolygon(point, polygon, { ignoreBoundary: false }),
    ),
  );
}

export function summarizeAffectedPoints(points) {
  return {
    pickupCount: points.length,
    customerCount: new Set(points.map((point) => point.properties.customerId)).size,
    routeIds: [...new Set(points.map((point) => point.properties.routeId))],
  };
}

export function asPointFeatureCollection(points, affectedIds = new Set()) {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      ...point,
      properties: {
        ...point.properties,
        selected: affectedIds.has(point.properties.id),
      },
    })),
  };
}
