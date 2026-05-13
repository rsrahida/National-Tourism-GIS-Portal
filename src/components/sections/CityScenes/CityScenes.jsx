import { useEffect, useRef, useState, useCallback } from "react";
import Map from "@arcgis/core/Map";
import SceneView from "@arcgis/core/views/SceneView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import Camera from "@arcgis/core/Camera";
import mockData from "../../../../public/mockData.json";
import styles from "./CityScenes.module.css";

const enc = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const HIGHLIGHT_PIN =
  enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="40" height="52">
  <defs>
    <radialGradient id="hpg" cx="40%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#c8e86b"/>
      <stop offset="100%" stop-color="#5a8a00"/>
    </radialGradient>
    <filter id="hsh" x="-50%" y="-30%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
  </defs>
  <path d="M20 2 C10 2 2 10 2 20 C2 32 20 50 20 50 C20 50 38 32 38 20 C38 10 30 2 20 2Z"
    fill="url(#hpg)" stroke="rgba(255,255,255,0.8)" stroke-width="2" filter="url(#hsh)"/>
  <circle cx="20" cy="20" r="8" fill="rgba(255,255,255,0.95)"/>
  <circle cx="20" cy="20" r="4.5" fill="#5a8a00"/>
</svg>`);

const SCENES = mockData.cityScenes;
const AUTOPLAY_INTERVAL = 9000;

const OFFSETS = [
  {
    altAdd: 1800,
    headingDelta: 50,
    tiltDelta: -10,
    dur: 5500,
    easing: "out-cubic",
  },
  {
    altAdd: 1400,
    headingDelta: -40,
    tiltDelta: -12,
    dur: 6000,
    easing: "out-expo",
  },
  {
    altAdd: 2000,
    headingDelta: 70,
    tiltDelta: -8,
    dur: 5000,
    easing: "out-cubic",
  },
];

const ENVS = [
  { date: new Date("2024-06-15T07:00:00Z"), shadows: false },
  { date: new Date("2024-06-15T07:00:00Z"), shadows: false },
  { date: new Date("2024-06-15T07:00:00Z"), shadows: false },
];

const makeCamera = (lon, lat, z, heading, tilt) =>
  new Camera({
    position: new Point({
      longitude: lon,
      latitude: lat,
      z,
      spatialReference: { wkid: 4326 },
    }),
    heading,
    tilt: Math.max(0, Math.min(80, tilt)),
  });

const CityScene = () => {
  const mapDivRef = useRef(null);
  const viewRef = useRef(null);
  const hlLayerRef = useRef(null);
  const flyAbortRef = useRef(null);
  const autoTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip] = useState(null);
  const [titleVisible, setTitleVisible] = useState(true);
  const [activePill, setActivePill] = useState(null);

  const showHighlights = useCallback((scene) => {
    const layer = hlLayerRef.current;
    if (!layer) return;
    layer.removeAll();
    scene.highlights.forEach((h) => {
      layer.add(
        new Graphic({
          geometry: new Point({
            longitude: h.coordinates[0],
            latitude: h.coordinates[1],
            z: 5,
            spatialReference: { wkid: 4326 },
          }),
          symbol: new PictureMarkerSymbol({
            url: HIGHLIGHT_PIN,
            width: 30,
            height: 39,
            yoffset: 19,
          }),
          attributes: { name: h.name },
        }),
      );
    });
  }, []);

  const flyTo = useCallback(
    async (idx) => {
      const view = viewRef.current;
      if (!view) return;

      if (flyAbortRef.current) flyAbortRef.current.abort();
      const ctrl = new AbortController();
      flyAbortRef.current = ctrl;

      const scene = SCENES[idx];
      const cam = scene.camera;
      const offset = OFFSETS[idx % OFFSETS.length];
      const env = ENVS[idx % ENVS.length];
      const lon = scene.center[0];
      const lat = scene.center[1];

      setIsFlying(true);
      setTitleVisible(false);
      setActivePill(null);

      view.environment = {
        atmosphere: { quality: "high" },
        lighting: { date: env.date, directShadowsEnabled: env.shadows },
      };

      try {
        await view.goTo(
          makeCamera(
            lon,
            lat,
            cam.altitude + offset.altAdd,
            cam.heading + offset.headingDelta,
            cam.tilt + offset.tiltDelta,
          ),
          { animate: false },
        );
      } catch (_) {
        return;
      }

      if (ctrl.signal.aborted) return;

      showHighlights(scene);

      try {
        await view.goTo(
          makeCamera(lon, lat, cam.altitude, cam.heading, cam.tilt),
          { animate: true, duration: offset.dur, easing: offset.easing },
        );
      } catch (_) {}

      if (ctrl.signal.aborted) return;

      setIsFlying(false);
      setTimeout(() => setTitleVisible(true), 150);
    },
    [showHighlights],
  );

  const flyToHighlight = useCallback(async (highlight, pillName) => {
    const view = viewRef.current;
    if (!view) return;

    if (flyAbortRef.current) flyAbortRef.current.abort();
    const ctrl = new AbortController();
    flyAbortRef.current = ctrl;

    clearInterval(autoTimerRef.current);
    clearInterval(progressTimerRef.current);
    setPaused(true);
    setActivePill(pillName);
    setIsFlying(true);
    setTitleVisible(false);

    const [lon, lat] = highlight.coordinates;
    const currentHeading = view.camera?.heading ?? 0;

    try {
      await view.goTo(makeCamera(lon, lat, 380, currentHeading, 58), {
        animate: true,
        duration: 2800,
        easing: "out-cubic",
      });
    } catch (_) {}

    if (ctrl.signal.aborted) return;

    setIsFlying(false);
    setTimeout(() => setTitleVisible(true), 150);
  }, []);

  useEffect(() => {
    const hlLayer = new GraphicsLayer({
      title: "SceneHighlights",
      elevationInfo: { mode: "relative-to-ground", offset: 5 },
    });
    hlLayerRef.current = hlLayer;

    const map = new Map({
      basemap: "satellite",
      ground: "world-elevation",
      layers: [hlLayer],
    });

    const first = SCENES[0];
    const fOff = OFFSETS[0];

    const view = new SceneView({
      container: mapDivRef.current,
      map,
      camera: makeCamera(
        first.center[0],
        first.center[1],
        first.camera.altitude + fOff.altAdd,
        first.camera.heading + fOff.headingDelta,
        first.camera.tilt + fOff.tiltDelta,
      ),
      popupEnabled: false,
      ui: { components: [] },
      environment: {
        atmosphere: { quality: "high" },
        lighting: { date: ENVS[0].date, directShadowsEnabled: false },
      },
    });

    view.when(() => {
      setTimeout(() => {
        setMapLoaded(true);
        flyTo(0);
      }, 800);

      view.on("pointer-move", async (e) => {
        const res = await view.hitTest(e);
        const hit = res.results.find(
          (r) => r.graphic?.layer?.title === "SceneHighlights",
        );
        setTooltip(
          hit ? { x: e.x, y: e.y, name: hit.graphic.attributes?.name } : null,
        );
      });
    });

    viewRef.current = view;
    return () => {
      if (flyAbortRef.current) flyAbortRef.current.abort();
      clearInterval(autoTimerRef.current);
      clearInterval(progressTimerRef.current);
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [flyTo]);

  useEffect(() => {
    if (!mapLoaded || paused) {
      clearInterval(autoTimerRef.current);
      clearInterval(progressTimerRef.current);
      return;
    }
    setProgress(0);
    const step = 100 / (AUTOPLAY_INTERVAL / 80);
    progressTimerRef.current = setInterval(
      () => setProgress((p) => Math.min(p + step, 100)),
      80,
    );
    autoTimerRef.current = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % SCENES.length;
        flyTo(next);
        return next;
      });
      setProgress(0);
    }, AUTOPLAY_INTERVAL);
    return () => {
      clearInterval(autoTimerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [mapLoaded, paused, flyTo]);

  const goToScene = (idx) => {
    if (idx === activeIdx) return;
    clearInterval(autoTimerRef.current);
    clearInterval(progressTimerRef.current);
    setProgress(0);
    setActiveIdx(idx);
    setPaused(false);
    setActivePill(null);
    flyTo(idx);
  };

  const activeScene = SCENES[activeIdx];

  return (
    <div className={styles.container}>
      {!mapLoaded && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingInner}>
            <div className={styles.loadingLabel}>3D xəritə yüklənir</div>
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
        style={{ opacity: mapLoaded ? 1 : 0, transition: "opacity 1s ease" }}
      />
      <div className={styles.filmBottom} />
      <div
        className={`${styles.titleBlock} ${titleVisible ? styles.titleVisible : styles.titleHidden}`}
      >
        <div className={styles.titleEyebrow}>
          AZƏRBAYCAN - XƏRİTƏNİ 3D KƏŞF EDİN
        </div>
        <div className={styles.titleMain}>{activeScene.name}</div>

        <div className={styles.highlightPills}>
          {activeScene.highlights.map((h, i) => (
            <span
              key={i}
              className={`${styles.pill} ${activePill === h.name ? styles.pillActive : ""}`}
              onClick={() => flyToHighlight(h, h.name)}
              title={`${h.name} — klikləyin`}
            >
              📍 {h.name}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.filmStrip}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={styles.filmRow}>
          <div className={styles.filmLeft}>
            <button
              className={styles.playBtn}
              onClick={() => {
                setPaused((p) => !p);
                setActivePill(null);
              }}
            >
              {paused ? "▶" : "⏸"}
            </button>
            <span className={styles.filmCounter}>
              {String(activeIdx + 1).padStart(2, "0")} /{" "}
              {String(SCENES.length).padStart(2, "0")}
            </span>
            {isFlying && <span className={styles.flyingDot} />}
          </div>
          <div className={styles.filmCards}>
            {SCENES.map((scene, i) => (
              <button
                key={scene.id}
                className={`${styles.filmCard} ${i === activeIdx ? styles.filmCardActive : ""}`}
                onClick={() => goToScene(i)}
              >
                <div className={styles.filmCardNum}>0{i + 1}</div>
                <div className={styles.filmCardName}>{scene.name}</div>
                <div className={styles.filmCardSub}>{scene.nameEn}</div>
                {i === activeIdx && (
                  <div className={styles.filmCardBar}>
                    <div
                      className={styles.filmCardBarFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className={styles.filmRight}>
            <button
              className={styles.navBtn}
              onClick={() =>
                goToScene((activeIdx - 1 + SCENES.length) % SCENES.length)
              }
            >
              ‹
            </button>
            <button
              className={styles.navBtn}
              onClick={() => goToScene((activeIdx + 1) % SCENES.length)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 18, top: tooltip.y - 14 }}
        >
          <div className={styles.tooltipName}>📍 {tooltip.name}</div>
        </div>
      )}
    </div>
  );
};

export default CityScene;
