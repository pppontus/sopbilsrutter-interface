export const initialFlow = {
  step: "routes", selectedRouteIds: [], polygons: [], previewScope: null,
};

export function flowReducer(state, action) {
  switch (action.type) {
    case "toggle-route": {
      if (state.step !== "routes" || state.previewScope) return state;
      const ids = new Set(state.selectedRouteIds);
      if (ids.has(action.id)) ids.delete(action.id);
      else ids.add(action.id);
      return { ...state, selectedRouteIds: [...ids], polygons: [] };
    }
    case "select-routes":
      if (state.step !== "routes" || state.previewScope) return state;
      return { ...state, selectedRouteIds: [...new Set(action.ids)], polygons: [] };
    case "open-map":
      if (state.step !== "routes" || !state.selectedRouteIds.length) return state;
      return { ...state, step: "map", polygons: [], previewScope: null };
    case "back":
      return { ...state, step: "routes", polygons: [], previewScope: null };
    case "set-polygons":
      if (state.step !== "map") return state;
      return { ...state, polygons: action.polygons };
    case "preview-all":
      if (state.step !== "routes" || !state.selectedRouteIds.length) return state;
      return { ...state, previewScope: "all" };
    case "preview-area":
      if (state.step !== "map" || !state.polygons.length || !action.pointCount) return state;
      return { ...state, previewScope: "area" };
    case "close-preview":
      return { ...state, previewScope: null };
    default:
      return state;
  }
}
