import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { useRoute } from "../../../hooks/useRoute";
import RouteRight from "./RouteRight/RouteRight";
import styles from "./RoutePlanner.module.css";

const MODE_SVGS = {
  driving: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="34" height="34">
      <circle cx="17" cy="17" r="16" fill="rgba(26,46,5,0.88)" stroke="${color}" stroke-width="2"/>
      <path d="M8 20 L10 14 Q10.5 12 12 12 L22 12 Q23.5 12 24 14 L26 20 L26 23 Q26 24 25 24 L23 24 Q22 24 22 23 L22 22 L12 22 L12 23 Q12 24 11 24 L9 24 Q8 24 8 23 Z" fill="${color}"/>
      <circle cx="12" cy="22" r="2" fill="rgba(26,46,5,0.9)" stroke="${color}" stroke-width="1"/>
      <circle cx="22" cy="22" r="2" fill="rgba(26,46,5,0.9)" stroke="${color}" stroke-width="1"/>
      <rect x="11" y="14" width="12" height="5" rx="1" fill="rgba(26,46,5,0.6)"/>
    </svg>`,
  bus: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="34" height="34">
      <circle cx="17" cy="17" r="16" fill="rgba(26,46,5,0.88)" stroke="${color}" stroke-width="2"/>
      <rect x="9" y="11" width="16" height="14" rx="2" fill="${color}"/>
      <rect x="10" y="12" width="6" height="5" rx="1" fill="rgba(26,46,5,0.7)"/>
      <rect x="18" y="12" width="6" height="5" rx="1" fill="rgba(26,46,5,0.7)"/>
      <rect x="9" y="20" width="16" height="2" fill="rgba(26,46,5,0.3)"/>
      <circle cx="12" cy="25" r="2" fill="rgba(26,46,5,0.9)" stroke="${color}" stroke-width="1"/>
      <circle cx="22" cy="25" r="2" fill="rgba(26,46,5,0.9)" stroke="${color}" stroke-width="1"/>
    </svg>`,
  walking: (color) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="34" height="34">
      <circle cx="17" cy="17" r="16" fill="rgba(26,46,5,0.88)" stroke="${color}" stroke-width="2"/>
      <circle cx="17" cy="10" r="2.5" fill="${color}"/>
      <path d="M17 13 L15 18 L12 20 M17 13 L19 18 L22 20 M15 18 L14 24 M19 18 L20 24" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`,
};

const svgToUrl = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

const RoutePlanner = () => {
  const routeData = useRoute();
  const mapDivRef = useRef(null);
  const viewRef = useRef(null);
  const graphicsLayerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // refs to track previous values for zoom triggers
  const prevOriginRef = useRef(null);
  const prevDestinationRef = useRef(null);
  const prevRouteResultsRef = useRef(null);
  const prevIsAnimatingRef = useRef(false);

  const {
    origin,
    destination,
    routePoints,
    selectedMode,
    isAnimating,
    animMarker,
    routeResults,
    MODES,
  } = routeData;

  // ── MAP INIT ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const graphicsLayer = new GraphicsLayer();
    graphicsLayerRef.current = graphicsLayer;

    const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [graphicsLayer],
    });

    const view = new MapView({
      container: mapDivRef.current,
      map,
      center: [49.8671, 40.4093],
      zoom: 12,
      popupEnabled: false,
    });

    view.when(() => {
      setTimeout(() => setMapLoaded(true), 1000);
    });

    viewRef.current = view;

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  // ── ZOOM 1: Başlanğıc nöqtə seçiləndə → o nöqtəyə zoom ────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !origin) return;
    if (origin === prevOriginRef.current) return;
    prevOriginRef.current = origin;

    view.goTo(
      { center: [origin.lng, origin.lat], zoom: 14 },
      { animate: true, duration: 800 },
    );
  }, [origin]);

  // ── ZOOM 2: Son nöqtə seçiləndə → o nöqtəyə zoom ──────────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !destination) return;
    if (destination === prevDestinationRef.current) return;
    prevDestinationRef.current = destination;

    view.goTo(
      { center: [destination.lng, destination.lat], zoom: 14 },
      { animate: true, duration: 800 },
    );
  }, [destination]);

  // ── ZOOM 3: "Marşrutu tap" basılanda → zoom yoxdur ────────────────────────
  // routeResults dəyişəndə ref-i yeniləyirik, amma goTo çağırmırıq
  useEffect(() => {
    if (!routeResults) return;
    prevRouteResultsRef.current = routeResults;
  }, [routeResults]);

  // ── ZOOM 4: "Başla" basılanda → başlanğıc nöqtəyə zoom ─────────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const justStarted = isAnimating && !prevIsAnimatingRef.current;
    prevIsAnimatingRef.current = isAnimating;

    if (justStarted && origin) {
      view.goTo(
        { center: [origin.lng, origin.lat], zoom: 14 },
        { animate: true, duration: 800 },
      );
    }
  }, [isAnimating, origin]);

  // ── GRAPHICS ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = graphicsLayerRef.current;
    const view = viewRef.current;
    if (!layer || !view) return;

    layer.removeAll();

    const routeColor = MODES[selectedMode]?.color || "#a0d228";
    const rgb = hexToRgb(routeColor);

    // Origin marker
    if (origin) {
      layer.add(
        new Graphic({
          geometry: {
            type: "point",
            longitude: origin.lng,
            latitude: origin.lat,
          },
          symbol: {
            type: "simple-marker",
            color: [160, 210, 40],
            outline: { color: [255, 255, 255], width: 2.5 },
            size: 14,
          },
        }),
      );
    }

    // Destination marker
    if (destination) {
      layer.add(
        new Graphic({
          geometry: {
            type: "point",
            longitude: destination.lng,
            latitude: destination.lat,
          },
          symbol: {
            type: "simple-marker",
            color: [255, 107, 107],
            outline: { color: [255, 255, 255], width: 2.5 },
            size: 14,
          },
        }),
      );
    }

    // Route polyline
    if (routePoints && routePoints.length > 0) {
      const polyline = {
        type: "polyline",
        paths: [routePoints.map((p) => [p.lng, p.lat])],
      };
      layer.add(
        new Graphic({
          geometry: polyline,
          symbol: {
            type: "simple-line",
            color: [...rgb, 0.18],
            width: 9,
            cap: "round",
            join: "round",
          },
        }),
      );
      layer.add(
        new Graphic({
          geometry: polyline,
          symbol: {
            type: "simple-line",
            color: [...rgb, 0.92],
            width: 4,
            cap: "round",
            join: "round",
          },
        }),
      );
    }

    // Animation marker
    if (isAnimating && animMarker) {
      const svgFn = MODE_SVGS[selectedMode] || MODE_SVGS.driving;
      const iconUrl = svgToUrl(svgFn(routeColor));
      layer.add(
        new Graphic({
          geometry: {
            type: "point",
            longitude: animMarker.lng,
            latitude: animMarker.lat,
          },
          symbol: {
            type: "picture-marker",
            url: iconUrl,
            width: "34px",
            height: "34px",
          },
        }),
      );
    }
  }, [
    origin,
    destination,
    routePoints,
    selectedMode,
    isAnimating,
    animMarker,
    MODES,
  ]);

  return (
    <div className={styles.container}>
      {!mapLoaded && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingText}>Xəritə yüklənir</div>
            <div className={styles.dots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <div
        ref={mapDivRef}
        className={styles.mapDiv}
        style={{ opacity: mapLoaded ? 1 : 0, transition: "opacity 0.6s ease" }}
      />

      {!origin && !destination && (
        <div className={styles.mapHint}>
          <span>👉</span>
          <span>Sağ paneldən başlanğıc və son nöqtəni daxil edin</span>
        </div>
      )}

      <div className={styles.rightSide}>
        <RouteRight {...routeData} isOpen={isPanelOpen} />
      </div>

      {createPortal(
        <button
          className={styles.hamburger}
          onClick={() => setIsPanelOpen((prev) => !prev)}
        >
          {isPanelOpen ? "✕" : "☰"}
        </button>,
        document.body,
      )}
    </div>
  );
};

export default RoutePlanner;
