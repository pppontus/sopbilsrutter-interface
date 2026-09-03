import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { MapPinLine } from "@phosphor-icons/react";

const DRAW_STYLES = [
  {
    id: "draw-polygon-fill", type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: { "fill-color": "#f3a21a", "fill-outline-color": "#f3a21a", "fill-opacity": 0.18 },
  },
  {
    id: "draw-polygon-stroke", type: "line",
    filter: ["all", ["==", "$type", "Polygon"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#f39a06", "line-width": 2 },
  },
  {
    id: "draw-active-line", type: "line",
    filter: ["all", ["==", "$type", "LineString"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#f39a06", "line-width": 2, "line-dasharray": [0.8, 1.4] },
  },
  {
    id: "draw-midpoint", type: "circle",
    filter: ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"], ["==", "active", "true"]],
    paint: { "circle-radius": 4, "circle-color": "#ffffff", "circle-stroke-color": "#f39a06", "circle-stroke-width": 1.5 },
  },
  {
    id: "draw-vertex-halo", type: "circle",
    filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["==", "active", "true"]],
    paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-stroke-color": "#f39a06", "circle-stroke-width": 1.5 },
  },
  {
    id: "draw-vertex", type: "circle",
    filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["==", "active", "true"]],
    paint: { "circle-radius": 2.4, "circle-color": "#ffffff" },
  },
];

function getPolygons(draw) {
  return draw.getAll().features.filter((feature) =>
    feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon",
  );
}

function fitMapToBounds(map, bounds) {
  if (!bounds) return;
  if (bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1]) {
    map.easeTo({ center: bounds[0], zoom: 15, duration: 0 });
    return;
  }
  map.fitBounds(bounds, { padding: { top: 105, right: 70, bottom: 150, left: 70 }, duration: 0, maxZoom: 16 });
}

function tuneLightMapPalette(map) {
  for (const layer of map.getStyle().layers || []) {
    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", "#f6f5f1");
    } else if (layer.type === "fill" && /water/i.test(layer.id)) {
      map.setPaintProperty(layer.id, "fill-color", "#c2e3ef");
      map.setPaintProperty(layer.id, "fill-opacity", 0.95);
    } else if (layer.type === "fill" && /park|landuse.*green|landcover.*green|national-park/i.test(layer.id)) {
      map.setPaintProperty(layer.id, "fill-color", "#dfead6");
      map.setPaintProperty(layer.id, "fill-opacity", 0.88);
    } else if (layer.type === "fill" && /building/i.test(layer.id)) {
      map.setPaintProperty(layer.id, "fill-color", "#e8e5df");
    }
  }
}

export function MapCanvas({
  accessToken,
  points,
  bounds,
  interactionMode,
  onPolygonsChange,
  onDrawingChange,
  registerActions,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const hoveredPointIdRef = useRef(null);
  const pointsRef = useRef(points);
  const boundsRef = useRef(bounds);
  const interactionRef = useRef(interactionMode);
  const callbacksRef = useRef({ onPolygonsChange, onDrawingChange });
  const [mapStatus, setMapStatus] = useState(accessToken ? "loading" : "missing-token");

  pointsRef.current = points;
  boundsRef.current = bounds;
  interactionRef.current = interactionMode;
  callbacksRef.current = { onPolygonsChange, onDrawingChange };

  useEffect(() => {
    if (!accessToken || !containerRef.current) return undefined;
    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [15.57, 58.42],
      zoom: 10,
      attributionControl: false,
      antialias: true,
      transformRequest: (url) => ({ url, referrerPolicy: "no-referrer-when-downgrade" }),
    });
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: "simple_select",
      userProperties: true,
      styles: DRAW_STYLES,
    });
    let mapHasLoaded = false;
    const loadTimeout = window.setTimeout(() => {
      if (!mapHasLoaded) setMapStatus("error");
    }, 12000);

    mapRef.current = map;
    map.addControl(draw);

    const syncPolygons = () => callbacksRef.current.onPolygonsChange(getPolygons(draw));
    const clearHoveredPoint = () => {
      if (hoveredPointIdRef.current !== null) {
        map.removeFeatureState({ source: "pickup-points", id: hoveredPointIdRef.current }, "hover");
        hoveredPointIdRef.current = null;
      }
      popupRef.current?.remove();
      map.getCanvas().style.cursor = "";
    };
    const handlePointMove = (event) => {
      if (interactionRef.current === "drawing") {
        clearHoveredPoint();
        return;
      }
      const feature = event.features?.[0];
      if (!feature) return;
      if (hoveredPointIdRef.current !== feature.id) {
        if (hoveredPointIdRef.current !== null) {
          map.removeFeatureState({ source: "pickup-points", id: hoveredPointIdRef.current }, "hover");
        }
        hoveredPointIdRef.current = feature.id;
        map.setFeatureState({ source: "pickup-points", id: feature.id }, { hover: true });
      }
      const [longitude, latitude] = feature.geometry.coordinates;
      const content = document.createElement("div");
      const title = document.createElement("strong");
      const detail = document.createElement("span");
      const coordinates = document.createElement("span");
      title.textContent = feature.properties?.routeName || "Körlista";
      detail.textContent = `Punkt ${feature.properties?.sequence}`;
      coordinates.textContent = `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;
      content.append(title, detail, coordinates);
      popupRef.current ||= new mapboxgl.Popup({
        closeButton: false, closeOnClick: false, className: "pickup-point-popup", offset: 14,
      });
      popupRef.current.setLngLat(feature.geometry.coordinates).setDOMContent(content).addTo(map);
    };
    const handleModeChange = (event) =>
      callbacksRef.current.onDrawingChange(event.mode === "draw_polygon");

    map.on("draw.create", syncPolygons);
    map.on("draw.update", syncPolygons);
    map.on("draw.delete", syncPolygons);
    map.on("draw.modechange", handleModeChange);

    map.on("load", () => {
      mapHasLoaded = true;
      window.clearTimeout(loadTimeout);
      tuneLightMapPalette(map);
      map.addSource("pickup-points", { type: "geojson", data: pointsRef.current, cluster: false });
      map.addLayer({
        id: "pickup-point-hover", type: "circle", source: "pickup-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 8, 14, 15, 17, 18],
          "circle-color": "#fff4e5",
          "circle-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.88, 0],
          "circle-stroke-color": "#d87916",
          "circle-stroke-width": ["case", ["boolean", ["feature-state", "hover"], false], 1.5, 0],
        },
      });
      map.addLayer({
        id: "pickup-points", type: "circle", source: "pickup-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3, 14, 5.8, 17, 7.4],
          "circle-color": ["case", ["boolean", ["get", "selected"], false], "#ef6b5a", ["get", "routeColor"]],
          "circle-opacity": 0.87,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.2,
          "circle-stroke-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "pickup-point-hit", type: "circle", source: "pickup-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 8, 14, 15, 17, 20],
          "circle-color": "#ffffff", "circle-opacity": 0.01,
        },
      });
      map.on("mousemove", "pickup-point-hit", handlePointMove);
      map.on("mouseleave", "pickup-point-hit", clearHoveredPoint);
      fitMapToBounds(map, boundsRef.current);
      setMapStatus("ready");
    });

    map.on("error", (event) => {
      if (mapHasLoaded || !event?.error) return;
      const status = event.error.status ?? event.error.statusCode;
      if (status === 401 || status === 403) {
        window.clearTimeout(loadTimeout);
        setMapStatus("error");
      }
    });

    registerActions({
      startDrawing() {
        draw.changeMode("draw_polygon");
        callbacksRef.current.onDrawingChange(true);
      },
      stopDrawing() {
        draw.changeMode("simple_select", { featureIds: [] });
        callbacksRef.current.onDrawingChange(false);
      },
      clearPolygons() {
        draw.deleteAll();
        draw.changeMode("simple_select");
        callbacksRef.current.onPolygonsChange([]);
        callbacksRef.current.onDrawingChange(false);
      },
    });

    return () => {
      window.clearTimeout(loadTimeout);
      popupRef.current?.remove();
      registerActions(null);
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken, registerActions]);

  useEffect(() => {
    const source = mapRef.current?.getSource("pickup-points");
    if (source) source.setData(points);
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.loaded()) fitMapToBounds(map, bounds);
  }, [bounds]);

  useEffect(() => {
    if (interactionMode !== "drawing") return;
    const map = mapRef.current;
    if (map && hoveredPointIdRef.current !== null) {
      map.removeFeatureState({ source: "pickup-points", id: hoveredPointIdRef.current }, "hover");
      hoveredPointIdRef.current = null;
    }
    popupRef.current?.remove();
  }, [interactionMode]);

  return (
    <div className="map-canvas" aria-label="Karta över valda körlistor">
      <div ref={containerRef} className="mapbox-container" />
      {mapStatus === "loading" && (
        <div className="map-state" role="status"><span className="map-loader" aria-hidden="true" />Kartan laddas…</div>
      )}
      {mapStatus === "missing-token" && (
        <div className="map-state map-state--message" role="status">
          <MapPinLine size={31} aria-hidden="true" />
          <strong>Kartan väntar på Mapbox</strong>
          <span>Den lokala kartkonfigurationen saknas.</span>
        </div>
      )}
      {mapStatus === "error" && (
        <div className="map-state map-state--message" role="alert">
          <MapPinLine size={31} aria-hidden="true" />
          <strong>Kartan kunde inte laddas</strong>
          <span>Kontrollera kartkonfigurationen och försök igen.</span>
        </div>
      )}
    </div>
  );
}
