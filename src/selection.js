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

export function applyManualSelectionOverrides(
  points,
  baseAffectedIds = new Set(),
  manualOverrides = new Map(),
) {
  return points.filter((point) => {
    const pointId = point.properties.id;
    return manualOverrides.has(pointId)
      ? manualOverrides.get(pointId)
      : baseAffectedIds.has(pointId);
  });
}

export function countActiveManualOverrides(
  points,
  baseAffectedIds = new Set(),
  manualOverrides = new Map(),
) {
  return points.reduce((count, point) => {
    const pointId = point.properties.id;
    if (!manualOverrides.has(pointId)) return count;
    return manualOverrides.get(pointId) !== baseAffectedIds.has(pointId)
      ? count + 1
      : count;
  }, 0);
}

export function asPointFeatureCollection(
  points,
  affectedIds = new Set(),
  manualOverrides = new Map(),
) {
  return {
    type: "FeatureCollection",
    features: points.map((point) => {
      const pointId = point.properties.id;
      const baseSelected = affectedIds.has(pointId);
      const hasManualOverride = manualOverrides.has(pointId);
      const selected = hasManualOverride
        ? manualOverrides.get(pointId)
        : baseSelected;

      return {
        ...point,
        properties: {
          ...point.properties,
          selected,
          manualAdjustment: hasManualOverride
            ? selected
              ? "included"
              : "excluded"
            : "",
        },
      };
    }),
  };
}
