import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { MapPinLine } from "@phosphor-icons/react";
import { DEMO_POLYGON, MAP_VIEW } from "./demoData.js";

const DRAW_STYLES = [
  {
    id: "draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": "#f3a21a",
      "fill-outline-color": "#f3a21a",
      "fill-opacity": 0.18,
    },
  },
  {
    id: "draw-polygon-stroke",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#f39a06",
      "line-width": 2,
    },
  },
  {
    id: "draw-active-line",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#f39a06",
      "line-width": 2,
      "line-dasharray": [0.8, 1.4],
    },
  },
  {
    id: "draw-midpoint",
    type: "circle",
    filter: ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"]],
    paint: {
      "circle-radius": 4,
      "circle-color": "#ffffff",
      "circle-stroke-color": "#f39a06",
      "circle-stroke-width": 1.5,
    },
  },
  {
    id: "draw-vertex-halo",
    type: "circle",
    filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
    paint: {
      "circle-radius": 6,
      "circle-color": "#ffffff",
      "circle-stroke-color": "#f39a06",
      "circle-stroke-width": 1.5,
    },
  },
  {
    id: "draw-vertex",
    type: "circle",
    filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
    paint: {
      "circle-radius": 2.4,
      "circle-color": "#ffffff",
    },
  },
];

function getPolygons(draw) {
  return draw
    .getAll()
    .features.filter(
      (feature) =>
        feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon",
    );
}

function tuneLightMapPalette(map) {
  for (const layer of map.getStyle().layers || []) {
    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", "#f6f5f1");
      continue;
    }

    if (layer.type !== "fill") continue;

    if (/water/i.test(layer.id)) {
      map.setPaintProperty(layer.id, "fill-color", "#c2e3ef");
      map.setPaintProperty(layer.id, "fill-opacity", 0.95);
    } else if (/park|landuse.*green|landcover.*green|national-park/i.test(layer.id)) {
      map.setPaintProperty(layer.id, "fill-color", "#dfead6");
      map.setPaintProperty(layer.id, "fill-opacity", 0.88);
    } else if (/building/i.test(layer.id)) {
      map.setPaintProperty(layer.id, "fill-color", "#e8e5df");
    }
  }
}

export function MapCanvas({
  accessToken,
  points,
  onPolygonsChange,
  onDrawingChange,
  registerActions,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const pointsRef = useRef(points);
  const callbacksRef = useRef({ onPolygonsChange, onDrawingChange });
  const [mapStatus, setMapStatus] = useState(accessToken ? "loading" : "missing-token");

  pointsRef.current = points;
  callbacksRef.current = { onPolygonsChange, onDrawingChange };

  useEffect(() => {
    if (!accessToken || !containerRef.current) return undefined;

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: MAP_VIEW.center,
      zoom: MAP_VIEW.zoom,
      maxBounds: MAP_VIEW.maxBounds,
      attributionControl: false,
      antialias: true,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: "simple_select",
      userProperties: true,
      styles: DRAW_STYLES,
    });

    mapRef.current = map;
    drawRef.current = draw;
    map.addControl(draw);

    const syncPolygons = () => {
      callbacksRef.current.onPolygonsChange(getPolygons(draw));
    };

    const handleModeChange = (event) => {
      callbacksRef.current.onDrawingChange(event.mode === "draw_polygon");
    };

    map.on("draw.create", syncPolygons);
    map.on("draw.update", syncPolygons);
    map.on("draw.delete", syncPolygons);
    map.on("draw.modechange", handleModeChange);

    map.on("load", () => {
      tuneLightMapPalette(map);

      map.addSource("pickup-points", {
        type: "geojson",
        data: pointsRef.current,
        cluster: false,
      });

      map.addLayer({
        id: "pickup-points",
        type: "circle",
        source: "pickup-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3.8, 14, 5.8, 17, 7.4],
          "circle-color": [
            "case",
            ["boolean", ["get", "selected"], false],
            "#ef6b5a",
            ["get", "routeColor"],
          ],
          "circle-opacity": 0.9,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.4,
          "circle-stroke-opacity": 0.95,
        },
      });

      const [demoPolygonId] = draw.add(DEMO_POLYGON);
      if (demoPolygonId) {
        draw.changeMode("direct_select", { featureId: demoPolygonId });
      }
      setMapStatus("ready");
    });

    map.on("error", (event) => {
      if (event?.error) setMapStatus("error");
    });

    registerActions({
      startDrawing() {
        draw.changeMode("draw_polygon");
        callbacksRef.current.onDrawingChange(true);
      },
      clearPolygons() {
        draw.deleteAll();
        draw.changeMode("simple_select");
        callbacksRef.current.onPolygonsChange([]);
        callbacksRef.current.onDrawingChange(false);
      },
    });

    return () => {
      registerActions(null);
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, [accessToken, registerActions]);

  useEffect(() => {
    const source = mapRef.current?.getSource("pickup-points");
    if (source) source.setData(points);
  }, [points]);

  return (
    <div className="map-canvas" aria-label="Karta över valda körlistor">
      <div ref={containerRef} className="mapbox-container" />

      {mapStatus === "loading" && (
        <div className="map-state" role="status">
          <span className="map-loader" aria-hidden="true" />
          Kartan laddas…
        </div>
      )}

      {mapStatus === "missing-token" && (
        <div className="map-state map-state--message" role="status">
          <MapPinLine size={31} weight="regular" aria-hidden="true" />
          <strong>Kartan väntar på Mapbox</strong>
          <span>Lägg till den lokala testtoken när kartvyn ska verifieras.</span>
        </div>
      )}

      {mapStatus === "error" && (
        <div className="map-state map-state--message" role="alert">
          <MapPinLine size={31} weight="regular" aria-hidden="true" />
          <strong>Kartan kunde inte laddas</strong>
          <span>Kontrollera den lokala kartkonfigurationen och försök igen.</span>
        </div>
      )}
    </div>
  );
}
