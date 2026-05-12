import { useState, useEffect, useRef } from "react";
import styles from "./RouteRight.module.css";

const RouteRight = ({
  isOpen,
  origin,
  destination,
  originSuggestions,
  destinationSuggestions,
  routeResults,
  selectedMode,
  isAnimating,
  loading,
  error,
  MODES,
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
}) => {
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [showOriginDrop, setShowOriginDrop] = useState(false);
  const [showDestDrop, setShowDestDrop] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowOriginDrop(false);
        setShowDestDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOriginChange = (e) => {
    const val = e.target.value;
    setOriginText(val);
    setOrigin(null);
    setShowOriginDrop(true);
    searchPlace(val, "origin");
  };

  const handleDestChange = (e) => {
    const val = e.target.value;
    setDestinationText(val);
    setDestination(null);
    setShowDestDrop(true);
    searchPlace(val, "destination");
  };

  const handleOriginSelect = (place) => {
    setOriginText(place.name);
    setOrigin(place);
    setOriginSuggestions([]);
    setShowOriginDrop(false);
  };

  const handleDestSelect = (place) => {
    setDestinationText(place.name);
    setDestination(place);
    setDestinationSuggestions([]);
    setShowDestDrop(false);
  };

  const handleReset = () => {
    setOriginText("");
    setDestinationText("");
    setShowOriginDrop(false);
    setShowDestDrop(false);
    resetRoute();
  };

  const handleSwap = () => {
    const tempText = originText;
    const tempPlace = origin;
    setOriginText(destinationText);
    setDestinationText(tempText);
    setOrigin(destination);
    setDestination(tempPlace);
  };

  return (
    <div
      className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}
      ref={panelRef}
    >
      <div className={styles.content}>
        {/* Başlıq */}
        <div className={styles.header}>
          <div>
            <p className={styles.title}>Marşrut Planlayıcı</p>
          </div>
        </div>

        <div className={styles.inputBlock}>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>
              <i
                className="fa-solid fa-location-dot"
                style={{ color: "white" }}
              ></i>
            </span>
            <input
              className={styles.input}
              type="text"
              placeholder="Başlanğıc nöqtəsini seçin..."
              value={originText}
              onChange={handleOriginChange}
              onFocus={() =>
                originSuggestions.length && setShowOriginDrop(true)
              }
            />
            {originText && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setOriginText("");
                  setOrigin(null);
                  setOriginSuggestions([]);
                }}
              >
                ✕
              </button>
            )}
            {showOriginDrop && originSuggestions.length > 0 && (
              <ul className={styles.dropdown}>
                {originSuggestions.map((place, i) => (
                  <li
                    key={i}
                    className={styles.dropdownItem}
                    onMouseDown={() => handleOriginSelect(place)}
                  >
                    <span className={styles.dropIcon}>📍</span>
                    <span>{place.name.split(",").slice(0, 2).join(",")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            className={styles.swapBtn}
            onClick={handleSwap}
            title="Dəyişdir"
          >
            ⇅
          </button>
          <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>
              <i
                className="fa-solid fa-location-dot"
                style={{ color: "red" }}
              ></i>
            </span>
            <input
              className={styles.input}
              type="text"
              placeholder="Son nöqtəni seçin..."
              value={destinationText}
              onChange={handleDestChange}
              onFocus={() =>
                destinationSuggestions.length && setShowDestDrop(true)
              }
            />
            {destinationText && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setDestinationText("");
                  setDestination(null);
                  setDestinationSuggestions([]);
                }}
              >
                ✕
              </button>
            )}
            {showDestDrop && destinationSuggestions.length > 0 && (
              <ul className={styles.dropdown}>
                {destinationSuggestions.map((place, i) => (
                  <li
                    key={i}
                    className={styles.dropdownItem}
                    onMouseDown={() => handleDestSelect(place)}
                  >
                    <span className={styles.dropIcon}>🏁</span>
                    <span>{place.name.split(",").slice(0, 2).join(",")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          className={styles.searchBtn}
          onClick={fetchRoute}
          disabled={!origin || !destination || loading}
        >
          {loading ? (
            <span className={styles.spinner}>Axtarılır...</span>
          ) : (
            <>
              <i className="fa-solid fa-magnifying-glass" /> Marşrut Tap
            </>
          )}
        </button>
        {error && <div className={styles.errorBox}> {error}</div>}
        {routeResults && (
          <div className={styles.results}>
            <p className={styles.resultsLabel}>Nəqliyyat növünü seçin:</p>

            {Object.entries(MODES).map(([modeKey, modeInfo]) => {
              const result = routeResults[modeKey];
              const isSelected = selectedMode === modeKey;

              return (
                <div
                  key={modeKey}
                  className={`${styles.modeCard} ${isSelected ? styles.modeCardActive : ""}`}
                  onClick={() => selectMode(modeKey)}
                  style={
                    isSelected
                      ? {
                          borderColor: modeInfo.color,
                          boxShadow: `0 0 12px ${modeInfo.color}38`,
                        }
                      : {}
                  }
                >
                  <div className={styles.modeLeft}>
                    <span
                      className={styles.modeIcon}
                      dangerouslySetInnerHTML={{ __html: modeInfo.icon }}
                    />
                    <span className={styles.modeLabel}>{modeInfo.label}</span>
                  </div>
                  <div className={styles.modeRight}>
                    <span className={styles.modeDist}>{result.distance}</span>
                    <span
                      className={styles.modeDur}
                      style={{ color: modeInfo.color }}
                    >
                      {result.duration}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className={styles.animBtns}>
              {!isAnimating ? (
                <button
                  className={styles.startBtn}
                  onClick={startAnimation}
                  style={{
                    borderColor: MODES[selectedMode].color,
                    color: MODES[selectedMode].color,
                  }}
                >
                  ▶ Başla
                </button>
              ) : (
                <button className={styles.stopBtn} onClick={stopAnimation}>
                  ⏹ Dayandır
                </button>
              )}
              <button className={styles.resetBtn} onClick={handleReset}>
                ↺ Sıfırla
              </button>
            </div>
            {isAnimating && (
              <div className={styles.animStatus}>
                <span
                  className={styles.animDot}
                  style={{ background: MODES[selectedMode].color }}
                />
                <span
                  dangerouslySetInnerHTML={{ __html: MODES[selectedMode].icon }}
                />{" "}
                {MODES[selectedMode].label} ilə hərəkət edirsiniz...
              </div>
            )}
          </div>
        )}
        {!routeResults && !loading && !error && (
          <div className={styles.emptyState}>
            <p>Başlanğıc və son nöqtəni daxil edərək</p>
            <p>
              <strong>"Marşrut Tap"</strong> düyməsinə basın
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteRight;
