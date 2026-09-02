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
    filter: [
      "all",
      ["==", "meta", "midpoint"],
      ["==", "$type", "Point"],
      ["==", "active", "true"],
    ],
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
    filter: [
      "all",
      ["==", "meta", "vertex"],
      ["==", "$type", "Point"],
      ["==", "active", "true"],
    ],
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
    filter: [
      "all",
      ["==", "meta", "vertex"],
      ["==", "$type", "Point"],
      ["==", "active", "true"],
    ],
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
  interactionMode,
  onPointToggle,
  onPolygonsChange,
  onDrawingChange,
  registerActions,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const popupRef = useRef(null);
  const hoveredPointIdRef = useRef(null);
  const pointsRef = useRef(points);
  const interactionRef = useRef({ interactionMode, onPointToggle });
  const callbacksRef = useRef({ onPolygonsChange, onDrawingChange });
  const [mapStatus, setMapStatus] = useState(accessToken ? "loading" : "missing-token");

  pointsRef.current = points;
  interactionRef.current = { interactionMode, onPointToggle };
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
      transformRequest: (url) => ({
        url,
        // Preserve the repository path for the URL-restricted Pages token.
        referrerPolicy: "no-referrer-when-downgrade",
      }),
    });

    let mapHasLoaded = false;
    const loadTimeout = window.setTimeout(() => {
      if (!mapHasLoaded) setMapStatus("error");
    }, 12000);

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

    const clearHoveredPoint = () => {
      if (hoveredPointIdRef.current !== null) {
        map.removeFeatureState(
          { source: "pickup-points", id: hoveredPointIdRef.current },
          "hover",
        );
        hoveredPointIdRef.current = null;
      }
      popupRef.current?.remove();
      map.getCanvas().style.cursor = "";
    };

    const setHoveredPoint = (pointId) => {
      if (hoveredPointIdRef.current === pointId) return;

      if (hoveredPointIdRef.current !== null) {
        map.removeFeatureState(
          { source: "pickup-points", id: hoveredPointIdRef.current },
          "hover",
        );
      }

      hoveredPointIdRef.current = pointId;
      map.setFeatureState({ source: "pickup-points", id: pointId }, { hover: true });
    };

    const isFeatureSelected = (feature) =>
      feature.properties?.selected === true || feature.properties?.selected === "true";

    const showPointPopup = (feature, selected = isFeatureSelected(feature)) => {
      const content = document.createElement("div");
      const address = document.createElement("strong");
      const detail = document.createElement("span");
      const adjusting = interactionRef.current.interactionMode === "adjusting";

      address.textContent = feature.properties?.address || "Adress saknas";
      detail.textContent = adjusting
        ? selected
          ? "Berörd · Klicka för att ta bort"
          : "Inte berörd · Klicka för att lägga till"
        : `${feature.properties?.routeName} · ${feature.properties?.area}`;
      content.append(address, detail);

      popupRef.current ||= new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "pickup-point-popup",
        offset: 14,
      });
      popupRef.current
        .setLngLat(feature.geometry.coordinates)
        .setDOMContent(content)
        .addTo(map);
    };

    const handlePointMove = (event) => {
      if (interactionRef.current.interactionMode === "drawing") {
        clearHoveredPoint();
        return;
      }

      const feature = event.features?.[0];
      if (!feature) return;

      setHoveredPoint(feature.id);
      map.getCanvas().style.cursor =
        interactionRef.current.interactionMode === "adjusting" ? "pointer" : "";
      showPointPopup(feature);
    };

    const handlePointClick = (event) => {
      if (interactionRef.current.interactionMode !== "adjusting") return;

      const feature = event.features?.[0];
      const pointId = feature?.properties?.id;
      if (!feature || !pointId) return;

      const nextSelected = !isFeatureSelected(feature);
      interactionRef.current.onPointToggle(pointId);
      showPointPopup(feature, nextSelected);
    };

    const handleModeChange = (event) => {
      callbacksRef.current.onDrawingChange(event.mode === "draw_polygon");
    };

    map.on("draw.create", syncPolygons);
    map.on("draw.update", syncPolygons);
    map.on("draw.delete", syncPolygons);
    map.on("draw.modechange", handleModeChange);

    map.on("load", () => {
      mapHasLoaded = true;
      window.clearTimeout(loadTimeout);
      tuneLightMapPalette(map);

      map.addSource("pickup-points", {
        type: "geojson",
        data: pointsRef.current,
        cluster: false,
      });

      map.addLayer({
        id: "pickup-point-hover",
        type: "circle",
        source: "pickup-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 11, 14, 15, 17, 18],
          "circle-color": "#fff4e5",
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.88,
            0,
          ],
          "circle-stroke-color": "#d87916",
          "circle-stroke-width": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1.5,
            0,
          ],
          "circle-stroke-opacity": 0.7,
        },
      });

      map.addLayer({
        id: "pickup-points",
        type: "circle",
        source: "pickup-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3.8, 14, 5.8, 17, 7.4],
          "circle-color": [
            "case",
            ["==", ["get", "manualAdjustment"], "excluded"],
            "#ffffff",
            ["boolean", ["get", "selected"], false],
            "#ef6b5a",
            ["get", "routeColor"],
          ],
          "circle-opacity": 0.9,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "manualAdjustment"], "excluded"],
            "#ef6b5a",
            "#ffffff",
          ],
          "circle-stroke-width": [
            "case",
            ["==", ["get", "manualAdjustment"], "excluded"],
            2.4,
            1.4,
          ],
          "circle-stroke-opacity": 0.95,
        },
      });

      map.addLayer({
        id: "pickup-point-hit",
        type: "circle",
        source: "pickup-points",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 12, 14, 17, 17, 22],
          "circle-color": "#ffffff",
          "circle-opacity": 0.01,
        },
      });

      map.on("mousemove", "pickup-point-hit", handlePointMove);
      map.on("mouseleave", "pickup-point-hit", clearHoveredPoint);
      map.on("click", "pickup-point-hit", handlePointClick);

      const [demoPolygonId] = draw.add(DEMO_POLYGON);
      if (demoPolygonId) {
        draw.changeMode("direct_select", { featureId: demoPolygonId });
      }
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
      popupRef.current = null;
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

  useEffect(() => {
    if (interactionMode !== "drawing") return;

    const map = mapRef.current;
    if (map && hoveredPointIdRef.current !== null) {
      map.removeFeatureState(
        { source: "pickup-points", id: hoveredPointIdRef.current },
        "hover",
      );
      hoveredPointIdRef.current = null;
    }
    popupRef.current?.remove();
  }, [interactionMode]);

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
