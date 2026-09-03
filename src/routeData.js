import source from "./data/waste-routes-2026-05-07.json" with { type: "json" };

const ROUTE_COLORS = [
  "#1765c1", "#0f8589", "#7c65c4", "#b37b12", "#60758e", "#b14d85",
  "#417b4f", "#6b70ae", "#1e8580", "#946742", "#486bb0", "#884ea0",
  "#32796b", "#a66b30", "#5e748f", "#975569", "#6f7e37",
];

export const COLLECTION_DATE = source.routes[0].collectionDate;

export const ROUTE_LISTS = source.routes.map((route, index) => ({
  id: route.id,
  name: route.name,
  collectionDate: route.collectionDate,
  color: ROUTE_COLORS[index % ROUTE_COLORS.length],
  pointCount: route.coordinates.length,
}));

// Preserve every source record, including co-located points. The export has no
// customer or pickup-point IDs with which to establish their identity.
export const PICKUP_POINTS = source.routes.flatMap((route, routeIndex) =>
  route.coordinates.map((coordinates, index) => {
    const id = `${route.id}:${index}`;
    return {
      type: "Feature", id,
      properties: {
        id, routeId: route.id, routeName: route.name,
        routeColor: ROUTE_LISTS[routeIndex].color, sequence: index + 1,
      },
      geometry: { type: "Point", coordinates },
    };
  }),
);

export function getPointBounds(points) {
  if (!points.length) return null;
  return points.reduce((bounds, point) => {
    const [longitude, latitude] = point.geometry.coordinates;
    return [
      [Math.min(bounds[0][0], longitude), Math.min(bounds[0][1], latitude)],
      [Math.max(bounds[1][0], longitude), Math.max(bounds[1][1], latitude)],
    ];
  }, [[180, 90], [-180, -90]]);
}
