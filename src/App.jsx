import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Eraser,
  List,
  MagnifyingGlass,
  Polygon,
  X,
} from "@phosphor-icons/react";
import { MapCanvas } from "./MapCanvas.jsx";
import {
  DEFAULT_SELECTED_ROUTE_IDS,
  DEMO_POLYGON,
  OUTAGE_REASONS,
  PICKUP_POINTS,
  ROUTE_LISTS,
} from "./demoData.js";
import {
  asPointFeatureCollection,
  findAffectedPoints,
  summarizeAffectedPoints,
} from "./selection.js";

const DEFAULT_REASON = OUTAGE_REASONS[0];

function PreviewDialog({ affectedSummary, reason, message, selectedRoutes, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">Förhandsgranskning</span>
            <h2 id="preview-title">Meddelande till berörda kunder</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            aria-label="Stäng förhandsgranskningen"
            onClick={onClose}
          >
            <X size={21} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <dl className="preview-summary">
          <div>
            <dt>Mottagare</dt>
            <dd>{affectedSummary.customerCount} kunder</dd>
          </div>
          <div>
            <dt>Hämtställen</dt>
            <dd>{affectedSummary.pickupCount}</dd>
          </div>
          <div>
            <dt>Körlistor</dt>
            <dd>{selectedRoutes.map((route) => route.name.replace("Körlista ", "")).join(", ")}</dd>
          </div>
          <div>
            <dt>Orsak</dt>
            <dd>{reason.label}</dd>
          </div>
        </dl>

        <div className="message-preview">
          <span>Meddelande</span>
          <p>{message}</p>
        </div>

        <div className="prototype-notice">
          Detta är en prototyp. Inget meddelande skickas.
        </div>

        <button className="primary-button dialog-close" type="button" onClick={onClose}>
          Stäng
        </button>
      </section>
    </div>
  );
}

export function App() {
  const [selectedRouteIds, setSelectedRouteIds] = useState(
    () => new Set(DEFAULT_SELECTED_ROUTE_IDS),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [polygons, setPolygons] = useState([DEMO_POLYGON]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [reasonId, setReasonId] = useState(DEFAULT_REASON.id);
  const [message, setMessage] = useState(DEFAULT_REASON.message);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapActionsRef = useRef(null);

  const registerMapActions = useCallback((actions) => {
    mapActionsRef.current = actions;
  }, []);

  const selectedRoutes = useMemo(
    () => ROUTE_LISTS.filter((route) => selectedRouteIds.has(route.id)),
    [selectedRouteIds],
  );

  const visiblePoints = useMemo(
    () => PICKUP_POINTS.filter((point) => selectedRouteIds.has(point.properties.routeId)),
    [selectedRouteIds],
  );

  const affectedPoints = useMemo(
    () => findAffectedPoints(visiblePoints, polygons),
    [visiblePoints, polygons],
  );

  const affectedSummary = useMemo(
    () => summarizeAffectedPoints(affectedPoints),
    [affectedPoints],
  );

  const affectedIds = useMemo(
    () => new Set(affectedPoints.map((point) => point.properties.id)),
    [affectedPoints],
  );

  const pointCollection = useMemo(
    () => asPointFeatureCollection(visiblePoints, affectedIds),
    [visiblePoints, affectedIds],
  );

  const filteredRoutes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("sv");
    if (!query) return ROUTE_LISTS;
    return ROUTE_LISTS.filter((route) =>
      `${route.name} ${route.area}`.toLocaleLowerCase("sv").includes(query),
    );
  }, [searchQuery]);

  const selectedReason =
    OUTAGE_REASONS.find((reason) => reason.id === reasonId) || DEFAULT_REASON;

  const toggleRoute = (routeId) => {
    setSelectedRouteIds((current) => {
      const next = new Set(current);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  };

  const handleReasonChange = (event) => {
    const nextReason = OUTAGE_REASONS.find((reason) => reason.id === event.target.value);
    if (!nextReason) return;
    setReasonId(nextReason.id);
    setMessage(nextReason.message);
  };

  const startDrawing = () => {
    mapActionsRef.current?.startDrawing();
  };

  const clearSelection = () => {
    mapActionsRef.current?.clearPolygons();
    if (!mapActionsRef.current) setPolygons([]);
  };

  const routeCountLabel = `${affectedSummary.routeIds.length} ${
    affectedSummary.routeIds.length === 1 ? "körlista" : "körlistor"
  }`;

  return (
    <main className="app-shell">
      <aside className={`route-sidebar ${isSidebarOpen ? "route-sidebar--open" : ""}`}>
        <div className="sidebar-heading">
          <h1>Körlistor</h1>
          <button
            className="icon-button sidebar-close"
            type="button"
            aria-label="Stäng körlistor"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <label className="route-search">
          <MagnifyingGlass size={20} weight="regular" aria-hidden="true" />
          <span className="sr-only">Sök körlista</span>
          <input
            type="search"
            value={searchQuery}
            placeholder="Sök körlista"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="route-list" aria-label="Tillgängliga körlistor">
          {filteredRoutes.map((route) => (
            <label
              className="route-row"
              key={route.id}
              style={{ "--route-color": route.color }}
            >
              <input
                type="checkbox"
                checked={selectedRouteIds.has(route.id)}
                onChange={() => toggleRoute(route.id)}
              />
              <span className="route-dot" aria-hidden="true" />
              <span className="route-copy">
                <strong>{route.name} · {route.area}</strong>
                <span>{route.binCount} kärl</span>
              </span>
            </label>
          ))}

          {filteredRoutes.length === 0 && (
            <p className="empty-routes">Ingen körlista matchar din sökning.</p>
          )}
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Stäng körlistor"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <section className="map-workspace" aria-label="Arbetsyta för områdesmarkering">
        <MapCanvas
          accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
          points={pointCollection}
          onPolygonsChange={setPolygons}
          onDrawingChange={setIsDrawing}
          registerActions={registerMapActions}
        />

        <div className="map-toolbar" aria-label="Kartverktyg">
          <button
            className={`map-tool map-tool--primary ${isDrawing ? "is-active" : ""}`}
            type="button"
            aria-pressed={isDrawing}
            onClick={startDrawing}
          >
            <Polygon size={22} weight="regular" aria-hidden="true" />
            Markera område
          </button>
          <button
            className="map-tool"
            type="button"
            disabled={polygons.length === 0}
            onClick={clearSelection}
          >
            <Eraser size={22} weight="regular" aria-hidden="true" />
            Rensa markering
          </button>
        </div>

        <button
          className="routes-toggle"
          type="button"
          aria-expanded={isSidebarOpen}
          onClick={() => setIsSidebarOpen(true)}
        >
          <List size={20} weight="bold" aria-hidden="true" />
          Körlistor
        </button>

        <section className="action-panel" aria-labelledby="affected-heading">
          <div className="affected-heading">
            <h2 id="affected-heading">
              {affectedSummary.pickupCount > 0
                ? `${affectedSummary.pickupCount} hämtställen berörs`
                : "Inga hämtställen berörs"}
            </h2>
            <p>
              {affectedSummary.pickupCount > 0
                ? `${affectedSummary.customerCount} kunder på ${routeCountLabel}`
                : "Rita ett område för att markera hämtställen"}
            </p>
          </div>

          <label className="field">
            <span>Orsak</span>
            <select value={reasonId} onChange={handleReasonChange}>
              {OUTAGE_REASONS.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Meddelande till kunder</span>
            <textarea
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          <button
            className="primary-button preview-button"
            type="button"
            disabled={affectedSummary.pickupCount === 0 || !message.trim()}
            onClick={() => setIsPreviewOpen(true)}
          >
            Förhandsgranska utskick
          </button>

          <p className="prototype-caption">Detta är en prototyp – inget meddelande skickas.</p>
        </section>
      </section>

      {isPreviewOpen && (
        <PreviewDialog
          affectedSummary={affectedSummary}
          reason={selectedReason}
          message={message}
          selectedRoutes={selectedRoutes.filter((route) =>
            affectedSummary.routeIds.includes(route.id),
          )}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </main>
  );
}
