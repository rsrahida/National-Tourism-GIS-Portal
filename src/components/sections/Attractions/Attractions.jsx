import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Attractions.module.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import mockData from "../../../../public/mockData.json";
import RightPanel from "./RightPanel/RightPanel";

const enc = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const pin = ({ id, topColor, midColor, iconPath }) =>
  enc(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 56" width="44" height="56">
  <defs>
    <linearGradient id="pg${id}" x1="30%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="${topColor}"/>
      <stop offset="100%" stop-color="${midColor}"/>
    </linearGradient>
    <filter id="sh${id}" x="-40%" y="-20%" width="180%" height="180%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
    <clipPath id="cp${id}">
      <path d="M22 3 C11.5 3 3 11.5 3 22 C3 34.5 22 53 22 53 C22 53 41 34.5 41 22 C41 11.5 32.5 3 22 3Z"/>
    </clipPath>
  </defs>
  <path
    d="M22 3 C11.5 3 3 11.5 3 22 C3 34.5 22 53 22 53 C22 53 41 34.5 41 22 C41 11.5 32.5 3 22 3Z"
    fill="url(#pg${id})"
    stroke="rgba(255,255,255,0.5)"
    stroke-width="1.5"
    filter="url(#sh${id})"
  />
  <ellipse cx="16" cy="14" rx="7" ry="5" fill="rgba(255,255,255,0.16)" clip-path="url(#cp${id})"/>
  ${iconPath}
</svg>`);

const W = "#ffffff";
const WD = "rgba(255,255,255,0.55)";

const ICONS = {
  tarix: pin({
    id: "t",
    topColor: "#e03030",
    midColor: "#8b0000",
    iconPath: `
      <rect x="16" y="24" width="12" height="12" rx="1" fill="${W}"/>
      <rect x="19.5" y="29.5" width="5" height="6.5" rx="2.5" fill="rgba(139,0,0,0.7)"/>
      <rect x="15" y="19.5" width="3.5" height="5.5" rx="0.8" fill="${W}"/>
      <rect x="20.25" y="18.5" width="3.5" height="6.5" rx="0.8" fill="${W}"/>
      <rect x="25.5" y="19.5" width="3.5" height="5.5" rx="0.8" fill="${W}"/>
      <rect x="19.5" y="24.5" width="5" height="3.5" rx="1" fill="rgba(139,0,0,0.65)"/>
    `,
  }),
  muzey: pin({
    id: "m",
    topColor: "#d42020",
    midColor: "#7a0000",
    iconPath: `
      <polygon points="22,12 13,20 31,20" fill="${W}"/>
      <rect x="14" y="20" width="2.5" height="11" fill="${W}"/>
      <rect x="19" y="20" width="2.5" height="11" fill="${W}"/>
      <rect x="24" y="20" width="2.5" height="11" fill="${W}"/>
      <rect x="29" y="20" width="2.5" height="11" fill="${W}"/>
      <rect x="12" y="31" width="20" height="2.5" rx="0.5" fill="${W}"/>
      <rect x="13" y="33.5" width="18" height="2" rx="0.5" fill="${WD}"/>
    `,
  }),
  din: pin({
    id: "d",
    topColor: "#e84040",
    midColor: "#950505",
    iconPath: `
      <rect x="12" y="19" width="4" height="15" rx="1.5" fill="${W}"/>
      <polygon points="14,15 12,19 16,19" fill="${W}"/>
      <path d="M13.2 14.2 Q15 12.2 16.5 14.2 Q14.8 13.5 13.2 14.2Z" fill="${W}"/>
      <rect x="16" y="26" width="16" height="10" rx="1" fill="${W}"/>
      <path d="M16 26 Q16 16 24 16 Q32 16 32 26Z" fill="${W}"/>
      <path d="M18.5 26 Q18.5 19 24 19 Q29.5 19 29.5 26" stroke="rgba(149,5,5,0.4)" stroke-width="1" fill="none"/>
      <path d="M21 36 L21 29.5 Q24 27 27 29.5 L27 36Z" fill="rgba(149,5,5,0.6)"/>
    `,
  }),
  park: pin({
    id: "p",
    topColor: "#e03535",
    midColor: "#900a0a",
    iconPath: `
      <path d="M22 31 Q14 25 15 15 Q20 18 22 31Z" fill="${W}"/>
      <path d="M22 31 Q30 25 29 15 Q24 18 22 31Z" fill="${W}"/>
      <path d="M22 31 Q17 21 22 12 Q27 21 22 31Z" fill="${WD}"/>
      <rect x="20.5" y="31" width="3" height="5.5" rx="1.5" fill="${W}"/>
      <path d="M17 36.5 Q22 34.5 27 36.5" stroke="${W}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    `,
  }),
  memarlıq: pin({
    id: "a",
    topColor: "#cc2828",
    midColor: "#7d0808",
    iconPath: `
      <rect x="12" y="25" width="7" height="11" rx="0.8" fill="${WD}"/>
      <rect x="18" y="17" width="8" height="19" rx="0.8" fill="${W}"/>
      <rect x="25" y="22" width="7" height="14" rx="0.8" fill="rgba(255,255,255,0.75)"/>
      <rect x="19.5" y="19" width="2" height="2" rx="0.3" fill="rgba(125,8,8,0.6)"/>
      <rect x="22.5" y="19" width="2" height="2" rx="0.3" fill="rgba(125,8,8,0.6)"/>
      <rect x="19.5" y="23" width="2" height="2" rx="0.3" fill="rgba(125,8,8,0.6)"/>
      <rect x="22.5" y="23" width="2" height="2" rx="0.3" fill="rgba(125,8,8,0.6)"/>
      <rect x="19.5" y="27" width="2" height="2" rx="0.3" fill="rgba(125,8,8,0.6)"/>
      <rect x="22.5" y="27" width="2" height="2" rx="0.3" fill="rgba(125,8,8,0.6)"/>
      <rect x="11" y="36" width="22" height="1.5" rx="0.5" fill="${W}"/>
    `,
  }),
  təbiət: pin({
    id: "n",
    topColor: "#d93030",
    midColor: "#880505",
    iconPath: `
      <circle cx="31" cy="15" r="3" fill="${W}"/>
      <line x1="31" y1="11" x2="31" y2="10" stroke="${W}" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="34.1" y1="12" x2="35.1" y2="11" stroke="${W}" stroke-width="1.3" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="36" y2="15" stroke="${W}" stroke-width="1.3" stroke-linecap="round"/>
      <polygon points="28,36 21,21 35,36" fill="${WD}"/>
      <polygon points="18,36 10,23 26,36" fill="${W}"/>
      <polygon points="18,23 15.5,29 20.5,29" fill="rgba(255,255,255,0.9)"/>
    `,
  }),
  mədəniyyət: pin({
    id: "c",
    topColor: "#e02828",
    midColor: "#8c0808",
    iconPath: `
      <polygon points="22,12 33,22 22,32 11,22" fill="none" stroke="${W}" stroke-width="2"/>
      <polygon points="22,16 28,22 22,28 16,22" fill="${W}"/>
      <circle cx="22" cy="22" r="2.8" fill="rgba(140,8,8,0.7)"/>
      <circle cx="22" cy="12" r="1.6" fill="${W}"/>
      <circle cx="33" cy="22" r="1.6" fill="${W}"/>
      <circle cx="22" cy="32" r="1.6" fill="${W}"/>
      <circle cx="11" cy="22" r="1.6" fill="${W}"/>
    `,
  }),
};

const DEFAULT_ICON = pin({
  id: "def",
  topColor: "#cc3333",
  midColor: "#7a0000",
  iconPath: `<circle cx="22" cy="22" r="6" fill="${W}"/>`,
});

const CLUSTER_PIN = enc(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 66" width="52" height="66">
  <defs>
    <linearGradient id="pgcl" x1="30%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="#e03030"/>
      <stop offset="100%" stop-color="#8b0000"/>
    </linearGradient>
    <filter id="shcl" x="-40%" y="-20%" width="180%" height="180%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
    <clipPath id="cpcl">
      <path d="M26 3 C14 3 3 14 3 26 C3 41 26 63 26 63 C26 63 49 41 49 26 C49 14 38 3 26 3Z"/>
    </clipPath>
  </defs>
  <path
    d="M26 3 C14 3 3 14 3 26 C3 41 26 63 26 63 C26 63 49 41 49 26 C49 14 38 3 26 3Z"
    fill="url(#pgcl)"
    stroke="rgba(255,255,255,0.6)"
    stroke-width="2"
    filter="url(#shcl)"
  />
  <ellipse cx="19" cy="16" rx="9" ry="6" fill="rgba(255,255,255,0.18)" clip-path="url(#cpcl)"/>
</svg>`);

const buildRenderer = () => ({
  type: "unique-value",
  field: "category",
  uniqueValueInfos: Object.entries(ICONS).map(([category, iconUrl]) => ({
    value: category,
    symbol: {
      type: "picture-marker",
      url: iconUrl,
      width: "32px",
      height: "40px",
      yoffset: "0px",
    },
  })),
  defaultSymbol: {
    type: "picture-marker",
    url: DEFAULT_ICON,
    width: "32px",
    height: "40px",
    yoffset: "0px",
  },
});

const buildFeatureReduction = () => ({
  type: "cluster",
  clusterRadius: "75px",
  clusterMinSize: 34,
  clusterMaxSize: 58,
  labelingInfo: [
    {
      deconflictionStrategy: "none",
      labelExpressionInfo: {
        expression: "Text($feature.cluster_count, '#,###')",
      },
      symbol: {
        type: "text",
        color: "#ffffff",
        font: { weight: "bold", family: "Noto Sans", size: 13 },
        haloColor: [30, 45, 3, 0.95],
        haloSize: 2,
        yoffset: 7,
      },
      labelPlacement: "center-center",
    },
  ],
  symbol: {
    type: "picture-marker",
    url: CLUSTER_PIN,
    width: "38px",
    height: "48px",
    yoffset: "0px",
  },
  popupTemplate: {
    title: "{cluster_count} attraksion",
    content: "Yaxınlaşdırmaq üçün cluster-ə klikləyin.",
  },
});

const Attractions = () => {
  const mapDivRef = useRef(null);
  const viewRef = useRef(null);
  const layerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [selectedAttraction, setSelectedAttraction] = useState(null);

  useEffect(() => {
    const geojson = {
      type: "FeatureCollection",
      features: mockData.attractions.map((attraction) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [attraction.coordinates[0], attraction.coordinates[1]],
        },
        properties: {
          id: attraction.id,
          name: attraction.name,
          nameEn: attraction.nameEn,
          category: attraction.category,
          city: attraction.city,
          district: attraction.district,
          rating: attraction.rating,
          reviewCount: attraction.reviewCount,
          entryFee: attraction.entryFee,
          openHours: attraction.openHours,
          description: attraction.description,
          pinColor: attraction.pinColor,
          tags: attraction.tags.join(", "),
          phone: attraction.phone || "",
          website: attraction.website || "",
          unesco: String(attraction.unesco),
          featured: String(attraction.featured),
          accessibility: String(attraction.accessibility),
          parkingNearby: String(attraction.parkingNearby),
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const attractionsLayer = new GeoJSONLayer({
      url,
      title: "Attraksiyonlar",
      fields: [
        { name: "id", alias: "ID", type: "string" },
        { name: "name", alias: "Ad", type: "string" },
        { name: "nameEn", alias: "Ad (EN)", type: "string" },
        { name: "category", alias: "Kateqoriya", type: "string" },
        { name: "city", alias: "Şəhər", type: "string" },
        { name: "district", alias: "Rayon", type: "string" },
        { name: "rating", alias: "Reytinq", type: "double" },
        { name: "reviewCount", alias: "Rəy sayı", type: "integer" },
        { name: "entryFee", alias: "Giriş haqqı", type: "string" },
        { name: "openHours", alias: "İş saatları", type: "string" },
        { name: "description", alias: "Haqqında", type: "string" },
        { name: "unesco", alias: "UNESCO", type: "string" },
        { name: "featured", alias: "Seçilmiş", type: "string" },
        { name: "pinColor", alias: "Pin rəngi", type: "string" },
        { name: "tags", alias: "Teqlər", type: "string" },
        { name: "phone", alias: "Telefon", type: "string" },
        { name: "website", alias: "Vebsayt", type: "string" },
        { name: "accessibility", alias: "Əlçatanlıq", type: "string" },
        { name: "parkingNearby", alias: "Parkinq", type: "string" },
      ],
      outFields: ["*"],
      renderer: buildRenderer(),
      featureReduction: buildFeatureReduction(),
    });

    layerRef.current = attractionsLayer;

    const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [attractionsLayer],
    });

    const view = new MapView({
      container: mapDivRef.current,
      map: map,
      center: [47.5769, 40.1431],
      zoom: 7,
      popupEnabled: false,
    });

    view.when(() => {
      setTimeout(() => setMapLoaded(true), 1000);
      view.on("pointer-move", async (event) => {
        const response = await view.hitTest(event);

        const result = response.results.find(
          (r) => r.graphic?.layer?.title === "Attraksiyonlar"
        );

        if (result) {
          const attrs = result.graphic.attributes;

          if (attrs.cluster_count) {
            setTooltip(null);
            return;
          }
          setTooltip({
            x: event.x,
            y: event.y,
            attrs,
          });
        } else {
          setTooltip(null);
        }
      });
      view.on("click", async (event) => {
        const response = await view.hitTest(event);

        const result = response.results.find(
          (r) => r.graphic?.layer?.title === "Attraksiyonlar"
        );

        if (result) {
          const attrs = result.graphic.attributes;
          if (attrs.cluster_count) return;
          const full = mockData.attractions.find((a) => a.id === attrs.id);
          if (full) {
            setSelectedAttraction(full);
            setIsPanelOpen(true);
          }
        }
      });
    });

    viewRef.current = view;

    return () => {
      URL.revokeObjectURL(url);
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  const handleCategoryFilter = (categories) => {
    if (!layerRef.current) return;

    if (!categories || categories.length === 0) {
      layerRef.current.definitionExpression = "";
    } else {
      const quoted = categories.map((c) => `'${c}'`).join(", ");
      layerRef.current.definitionExpression = `category IN (${quoted})`;
    }
  };

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

      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 18, top: tooltip.y - 14 }}
        >
          <div className={styles.tooltipName}>{tooltip.attrs.name}</div>

          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Yerləşdiyi şəhər:</span>
            <span className={styles.tooltipValue}>{tooltip.attrs.city}</span>
          </div>

          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Kateqoriyası:</span>
            <span className={styles.tooltipValue}>
              {tooltip.attrs.category}
            </span>
          </div>

          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Giriş məbləği:</span>
            <span className={styles.tooltipValue}>
              {tooltip.attrs.entryFee}
            </span>
          </div>

          {tooltip.attrs.openHours && (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>İş saatları:</span>
              <span className={styles.tooltipValue}>
                {tooltip.attrs.openHours}
              </span>
            </div>
          )}
        </div>
      )}

      <RightPanel
        isOpen={isPanelOpen}
        viewRef={viewRef}
        onCategoryFilter={handleCategoryFilter}
        selectedAttraction={selectedAttraction}
        onClearSelection={() => setSelectedAttraction(null)}
        onSelectAttraction={(attraction) => setSelectedAttraction(attraction)}
      />

      {createPortal(
        <button
          style={{
            position: "fixed",
            top: "70px",
            right: "5px",
            width: "31px",
            height: "45px",
            background: "#415808",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            cursor: "pointer",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          {isPanelOpen ? "✕" : "☰"}
        </button>,
        document.body
      )}
    </div>
  );
};

export default Attractions;