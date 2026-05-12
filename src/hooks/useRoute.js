import { useState, useRef, useCallback } from "react";

const OSRM_BASE = "https://router.project-osrm.org/route/v1";
const NOMINATIM_BASE = "/nominatim/search";

const AVG_SPEED_KMH = {
  driving: 100,
  bus: 90,
  walking: 5,
};

const MODES = {
  driving: {
    label: "Avtomobil",
    icon: '<i class="fa-solid fa-car"></i>',
    color: "#00e5ff",
    osrmProfile: "driving",
    speedKmh: AVG_SPEED_KMH.driving,
  },
  bus: {
    label: "Avtobus",
    icon: '<i class="fa-solid fa-bus"></i>',
    color: "#ffd166",
    osrmProfile: "driving",
    speedKmh: AVG_SPEED_KMH.bus,
    stopPenaltyPerKm: 44,
  },
  walking: {
    label: "Piyada",
    icon: '<i class="fa-solid fa-person-walking"></i>',
    color: "#00ff88",
    osrmProfile: "walking",
    speedKmh: AVG_SPEED_KMH.walking,
  },
};

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} s ${m} dəq`;
  if (h > 0) return `${h} saat`;
  if (m === 0) return "1 dəq-dən az";
  return `${m} dəq`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return (meters / 1000).toFixed(1) + " km";
}

function convertCoords(geoJsonCoords) {
  return geoJsonCoords.map(([lng, lat]) => ({ lat, lng }));
}

function calcDuration(distanceMeters, modeKey) {
  const mode = MODES[modeKey];
  const distanceKm = distanceMeters / 1000;
  let seconds = (distanceKm / mode.speedKmh) * 3600;
  if (modeKey === "bus" && mode.stopPenaltyPerKm) {
    seconds += distanceKm * mode.stopPenaltyPerKm;
  }
  return Math.round(seconds);
}

export function useRoute() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [routeResults, setRouteResults] = useState(null);
  const [selectedMode, setSelectedMode] = useState("driving");
  const [routePoints, setRoutePoints] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animMarker, setAnimMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const animFrameRef = useRef(null);
  const animIndexRef = useRef(0);
  const debounceRef = useRef(null);

  const searchPlace = useCallback((query, type) => {
    if (!query || query.length < 2) {
      type === "origin"
        ? setOriginSuggestions([])
        : setDestinationSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const url =
          `${NOMINATIM_BASE}` +
          `?q=${encodeURIComponent(query)}` +
          `&format=json&limit=5&countrycodes=az&addressdetails=1`;

        const res = await fetch(url, {
          headers: {
            "Accept-Language": "az",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        const suggestions = data.map((item) => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));

        type === "origin"
          ? setOriginSuggestions(suggestions)
          : setDestinationSuggestions(suggestions);
      } catch (err) {
        console.error("Nominatim xətası:", err);
      }
    }, 400);
  }, []);

  const fetchRoute = useCallback(async () => {
    if (!origin || !destination) {
      setError("Zəhmət olmasa başlanğıc və son nöqtəni seçin");
      return;
    }

    setLoading(true);
    setError(null);
    setRouteResults(null);

    try {
      const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

      const [drivingRes, walkingRes] = await Promise.all([
        fetch(
          `${OSRM_BASE}/driving/${coords}?overview=full&geometries=geojson`,
        ),
        fetch(
          `${OSRM_BASE}/walking/${coords}?overview=full&geometries=geojson`,
        ),
      ]);

      const [drivingData, walkingData] = await Promise.all([
        drivingRes.json(),
        walkingRes.json(),
      ]);

      if (drivingData.code !== "Ok" || walkingData.code !== "Ok") {
        throw new Error("Marşrut tapılmadı");
      }

      const drivingRoute = drivingData.routes[0];
      const walkingRoute = walkingData.routes[0];

      const drivingPoints = convertCoords(drivingRoute.geometry.coordinates);
      const walkingPoints = convertCoords(walkingRoute.geometry.coordinates);

      const drivingDurSec = calcDuration(drivingRoute.distance, "driving");
      const busDurSec = calcDuration(drivingRoute.distance, "bus");
      const walkingDurSec = calcDuration(walkingRoute.distance, "walking");

      const results = {
        driving: {
          ...MODES.driving,
          distance: formatDistance(drivingRoute.distance),
          distanceM: drivingRoute.distance,
          durationSec: drivingDurSec,
          duration: formatDuration(drivingDurSec),
          points: drivingPoints,
        },
        bus: {
          ...MODES.bus,
          distance: formatDistance(drivingRoute.distance),
          distanceM: drivingRoute.distance,
          durationSec: busDurSec,
          duration: formatDuration(busDurSec),
          points: drivingPoints,
        },
        walking: {
          ...MODES.walking,
          distance: formatDistance(walkingRoute.distance),
          distanceM: walkingRoute.distance,
          durationSec: walkingDurSec,
          duration: formatDuration(walkingDurSec),
          points: walkingPoints,
        },
      };

      setRouteResults(results);
      setSelectedMode("driving");
      setRoutePoints(results.driving.points);
    } catch (err) {
      setError("Marşrut tapılmadı. Yenidən cəhd edin.");
      console.error("Route xətası:", err);
    } finally {
      setLoading(false);
    }
  }, [origin, destination]);

  const selectMode = useCallback(
    (mode) => {
      if (!routeResults) return;
      stopAnimation();
      setSelectedMode(mode);
      setRoutePoints(routeResults[mode].points);
      setAnimMarker(null);
    },
    [routeResults],
  );

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const startAnimation = useCallback(() => {
    if (!routePoints.length || !routeResults) return;

    stopAnimation();
    animIndexRef.current = 0;
    setIsAnimating(true);
    setAnimMarker(routePoints[0]);

    const allPoints = [...routePoints];

    const SPEED_MULT = 40;
    const totalMs =
      (routeResults[selectedMode].durationSec * 1000) / SPEED_MULT;
    const stepMs = totalMs / allPoints.length;

    let lastTime = null;
    let accumulated = 0;

    const animate = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;
      accumulated += delta;

      if (accumulated >= stepMs) {
        accumulated = 0;
        animIndexRef.current += 1;

        if (animIndexRef.current >= allPoints.length) {
          setAnimMarker(allPoints[allPoints.length - 1]);
          setRoutePoints([]);
          setIsAnimating(false);
          return;
        }

        const current = animIndexRef.current;
        setAnimMarker(allPoints[current]);
        setRoutePoints(allPoints.slice(current));
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [routePoints, routeResults, selectedMode, stopAnimation]);

  const resetRoute = useCallback(() => {
    stopAnimation();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setOrigin(null);
    setDestination(null);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setRouteResults(null);
    setRoutePoints([]);
    setSelectedMode("driving");
    setAnimMarker(null);
    setError(null);
  }, [stopAnimation]);

  return {
    origin,
    destination,
    originSuggestions,
    destinationSuggestions,
    routeResults,
    selectedMode,
    routePoints,
    isAnimating,
    animMarker,
    loading,
    error,
    setOrigin,
    setDestination,
    setOriginSuggestions,
    setDestinationSuggestions,
    searchPlace,
    fetchRoute,
    selectMode,
    startAnimation,
    stopAnimation,
    resetRoute,
    MODES,
  };
}
