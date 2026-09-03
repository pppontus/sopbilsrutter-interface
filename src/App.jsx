import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Eraser,
  MagnifyingGlass,
  MapTrifold,
  Polygon,
  Rows,
  X,
} from "@phosphor-icons/react";
import { MapCanvas } from "./MapCanvas.jsx";
import { COLLECTION_DATE, PICKUP_POINTS, ROUTE_LISTS, getPointBounds } from "./routeData.js";
import { initialFlow, flowReducer } from "./flow.js";
import {
  asPointFeatureCollection,
  findAffectedPoints,
  summarizeAffectedPoints,
} from "./selection.js";

const formatDate = (date) =>
  new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(`${date}T12:00:00`));

function PrototypeDialog({ scope, selectedRoutes, pointCount, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const routeLabel = selectedRoutes.length === 1 ? "hela körlistan" : "hela körlistorna";

  return (
    <dialog
      ref={dialogRef}
      className="prototype-dialog"
      aria-labelledby="prototype-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="dialog-card">
        <div className="dialog-header">
          <span className="dialog-icon" aria-hidden="true">
            <Check size={24} weight="bold" />
          </span>
          <button className="icon-button" type="button" aria-label="Stäng" onClick={onClose}>
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <span className="eyebrow">Nästa steg</span>
        <h2 id="prototype-title">Utskicket kommer i den färdiga tjänsten</h2>
        <p>
          I den här prototypen kan du välja mottagare, men inget meddelande skickas.
          Den färdiga tjänsten tar dig vidare till granskning och utskick.
        </p>
        <dl className="preview-summary">
          <div>
            <dt>Omfattning</dt>
            <dd>{scope === "all" ? routeLabel : "Markerat område"}</dd>
          </div>
          <div>
            <dt>Körlistor</dt>
            <dd>{selectedRoutes.map((route) => route.name).join(", ")}</dd>
          </div>
          <div>
            <dt>Koordinatposter</dt>
            <dd>{pointCount.toLocaleString("sv-SE")}</dd>
          </div>
        </dl>
        <button className="primary-button dialog-close" type="button" onClick={onClose}>
          Tillbaka till prototypen
        </button>
      </section>
    </dialog>
  );
}

function RouteStep({ selectedRouteIds, dispatch }) {
  const [searchQuery, setSearchQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selectedRouteIds), [selectedRouteIds]);
  const filteredRoutes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("sv");
    return query
      ? ROUTE_LISTS.filter((route) => route.name.toLocaleLowerCase("sv").includes(query))
      : ROUTE_LISTS;
  }, [searchQuery]);
  const selectedRoutes = ROUTE_LISTS.filter((route) => selectedSet.has(route.id));
  const totalPoints = selectedRoutes.reduce((sum, route) => sum + route.pointCount, 0);
  const visibleIds = filteredRoutes.map((route) => route.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  const updateVisibleSelection = () => {
    const ids = new Set(selectedRouteIds);
    visibleIds.forEach((id) => allVisibleSelected ? ids.delete(id) : ids.add(id));
    dispatch({ type: "select-routes", ids: [...ids] });
  };

  return (
    <main className="route-step">
      <header className="flow-header">
        <div>
          <span className="eyebrow">Störning i sophämtningen</span>
          <h1>Vilka körlistor berörs?</h1>
          <p>Välj en eller flera körlistor för {formatDate(COLLECTION_DATE)}.</p>
        </div>
        <ol className="step-indicator" aria-label="Steg">
          <li className="is-current"><span>1</span> Välj körlistor</li>
          <li><span>2</span> Markera område vid behov</li>
        </ol>
      </header>

      <div className="route-layout">
        <section className="route-picker" aria-labelledby="route-picker-title">
          <div className="picker-toolbar">
            <label className="route-search">
              <MagnifyingGlass size={20} aria-hidden="true" />
              <span className="sr-only">Sök körlista</span>
              <input
                type="search"
                value={searchQuery}
                placeholder="Sök körlista"
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <button className="text-button" type="button" onClick={updateVisibleSelection}>
              {allVisibleSelected ? "Avmarkera visade" : "Markera alla visade"}
            </button>
          </div>
          <h2 id="route-picker-title" className="sr-only">Tillgängliga körlistor</h2>
          <div className="route-grid">
            {filteredRoutes.map((route) => (
              <label
                className={`route-card ${selectedSet.has(route.id) ? "is-selected" : ""}`}
                key={route.id}
                style={{ "--route-color": route.color }}
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(route.id)}
                  onChange={() => dispatch({ type: "toggle-route", id: route.id })}
                />
                <span className="route-dot" aria-hidden="true" />
                <span className="route-copy">
                  <strong>{route.name}</strong>
                  <span>{route.pointCount.toLocaleString("sv-SE")} koordinatposter</span>
                </span>
                <span className="check-mark" aria-hidden="true"><Check size={15} weight="bold" /></span>
              </label>
            ))}
            {filteredRoutes.length === 0 && (
              <p className="empty-routes">Ingen körlista matchar din sökning.</p>
            )}
          </div>
        </section>

        <aside className="scope-panel" aria-labelledby="scope-heading">
          <span className="eyebrow">Vald omfattning</span>
          <h2 id="scope-heading">
            {selectedRoutes.length
              ? `${selectedRoutes.length} ${selectedRoutes.length === 1 ? "körlista" : "körlistor"}`
              : "Välj minst en körlista"}
          </h2>
          <p className="scope-summary">
            {selectedRoutes.length
              ? `${totalPoints.toLocaleString("sv-SE")} koordinatposter valda`
              : "Därefter väljer du om hela eller delar av körlistan berörs."}
          </p>

          <div className="scope-actions">
            <button
              className="scope-action scope-action--primary"
              type="button"
              disabled={!selectedRoutes.length}
              onClick={() => dispatch({ type: "preview-all" })}
            >
              <Rows size={24} weight="regular" aria-hidden="true" />
              <span>
                <strong>Meddela hela {selectedRoutes.length === 1 ? "körlistan" : "körlistorna"}</strong>
                <small>Alla punkter i ditt val omfattas.</small>
              </span>
            </button>
            <button
              className="scope-action"
              type="button"
              disabled={!selectedRoutes.length}
              onClick={() => dispatch({ type: "open-map" })}
            >
              <MapTrifold size={24} weight="regular" aria-hidden="true" />
              <span>
                <strong>Meddela delar av {selectedRoutes.length === 1 ? "körlistan" : "körlistorna"}</strong>
                <small>Markera ett område på kartan.</small>
              </span>
            </button>
          </div>
          <p className="source-note">
            Underlaget innehåller koordinater men inga adresser eller kunduppgifter.
          </p>
        </aside>
      </div>
    </main>
  );
}

function MapStep({ state, dispatch }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const mapActionsRef = useRef(null);
  const selectedSet = useMemo(() => new Set(state.selectedRouteIds), [state.selectedRouteIds]);
  const selectedRoutes = ROUTE_LISTS.filter((route) => selectedSet.has(route.id));
  const visiblePoints = useMemo(
    () => PICKUP_POINTS.filter((point) => selectedSet.has(point.properties.routeId)),
    [selectedSet],
  );
  const affectedPoints = useMemo(
    () => findAffectedPoints(visiblePoints, state.polygons),
    [visiblePoints, state.polygons],
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
  const bounds = useMemo(() => getPointBounds(visiblePoints), [visiblePoints]);
  const registerMapActions = useCallback((actions) => {
    mapActionsRef.current = actions;
  }, []);
  const handleBack = () => {
    mapActionsRef.current?.stopDrawing();
    dispatch({ type: "back" });
  };
  const clearSelection = () => {
    mapActionsRef.current?.clearPolygons();
    dispatch({ type: "set-polygons", polygons: [] });
  };

  return (
    <main className="app-shell">
      <aside className="selected-sidebar">
        <button className="back-button" type="button" onClick={handleBack}>
          <ArrowLeft size={19} weight="bold" aria-hidden="true" />
          Ändra körlistor
        </button>
        <span className="eyebrow">Steg 2 av 2</span>
        <h1>Markera berört område</h1>
        <p className="sidebar-intro">
          Körlistorna är valda. Rita området där sopbilen inte kan hämta.
        </p>
        <div className="locked-routes">
          <div className="locked-heading">
            <h2>{selectedRoutes.length} valda {selectedRoutes.length === 1 ? "körlista" : "körlistor"}</h2>
            <span>Låsta i detta steg</span>
          </div>
          <ul>
            {selectedRoutes.map((route) => (
              <li key={route.id}>
                <span className="route-dot" style={{ "--route-color": route.color }} aria-hidden="true" />
                <span><strong>{route.name}</strong>{route.pointCount.toLocaleString("sv-SE")} koordinatposter</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className={`map-workspace ${isDrawing ? "is-drawing" : ""}`} aria-label="Arbetsyta för områdesmarkering">
        <MapCanvas
          accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
          points={pointCollection}
          bounds={bounds}
          interactionMode={isDrawing ? "drawing" : "idle"}
          onPolygonsChange={(polygons) => dispatch({ type: "set-polygons", polygons })}
          onDrawingChange={setIsDrawing}
          registerActions={registerMapActions}
        />
        <div className="map-toolbar">
          <div className="map-toolbar-actions" aria-label="Kartverktyg">
            <button
              className={`map-tool map-tool--primary ${isDrawing ? "is-active" : ""}`}
              type="button"
              aria-pressed={isDrawing}
              onClick={() => isDrawing
                ? mapActionsRef.current?.stopDrawing()
                : mapActionsRef.current?.startDrawing()}
            >
              <Polygon size={22} weight={isDrawing ? "fill" : "regular"} aria-hidden="true" />
              {isDrawing ? "Avsluta ritläge" : "Markera område"}
            </button>
            <button
              className="map-tool"
              type="button"
              disabled={!state.polygons.length}
              onClick={clearSelection}
            >
              <Eraser size={22} aria-hidden="true" />
              Rensa markering
            </button>
          </div>
          <div className={`drawing-status ${isDrawing ? "is-active" : ""}`} role="status">
            <span className="drawing-status-dot" aria-hidden="true" />
            <strong>{isDrawing ? "Ritläge aktivt" : "Ritläge av"}</strong>
            <span>{isDrawing ? "Klicka ut hörn · dubbelklicka för att avsluta" : "Starta ritläget för att markera ett område"}</span>
          </div>
        </div>

        <section className="action-panel" aria-labelledby="affected-heading">
          <div className="affected-heading">
            <h2 id="affected-heading">
              {affectedSummary.pointCount
                ? `${affectedSummary.pointCount.toLocaleString("sv-SE")} koordinatposter berörs`
                : "Inga punkter markerade"}
            </h2>
            <p>
              {affectedSummary.pointCount
                ? `På ${affectedSummary.routeIds.length} ${affectedSummary.routeIds.length === 1 ? "körlista" : "körlistor"}`
                : "Rita ett område på kartan för att välja mottagare."}
            </p>
          </div>
          <button
            className="primary-button preview-button"
            type="button"
            disabled={!affectedSummary.pointCount}
            onClick={() => dispatch({ type: "preview-area", pointCount: affectedSummary.pointCount })}
          >
            Meddela kunder
          </button>
          <p className="prototype-caption">Prototyp · Inget meddelande skickas.</p>
        </section>
      </section>
    </main>
  );
}

export function App() {
  const [state, dispatch] = useReducer(flowReducer, initialFlow);
  const selectedSet = useMemo(() => new Set(state.selectedRouteIds), [state.selectedRouteIds]);
  const selectedRoutes = ROUTE_LISTS.filter((route) => selectedSet.has(route.id));
  const visiblePoints = PICKUP_POINTS.filter((point) => selectedSet.has(point.properties.routeId));
  const affectedPoints = findAffectedPoints(visiblePoints, state.polygons);
  const previewPointCount = state.previewScope === "all" ? visiblePoints.length : affectedPoints.length;

  return (
    <>
      {state.step === "routes"
        ? <RouteStep selectedRouteIds={state.selectedRouteIds} dispatch={dispatch} />
        : <MapStep state={state} dispatch={dispatch} />}
      {state.previewScope && (
        <PrototypeDialog
          scope={state.previewScope}
          selectedRoutes={selectedRoutes}
          pointCount={previewPointCount}
          onClose={() => dispatch({ type: "close-preview" })}
        />
      )}
    </>
  );
}
