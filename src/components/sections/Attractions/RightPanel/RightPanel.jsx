import React, { useState, useRef } from "react";
import mockData from "../../../../../public/mockData.json";
import styles from "./RightPanel.module.css";

const RightPanel = ({ isOpen, viewRef }) => {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);
  const savedViewRef = useRef(null);

  const results =
    query.trim().length > 0
      ? mockData.attractions.filter(
          (a) =>
            a.name.toLowerCase().includes(query.toLowerCase()) ||
            a.city.toLowerCase().includes(query.toLowerCase()) ||
            a.category.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  const saveCurrentView = () => {
    if (!viewRef?.current) return;
    savedViewRef.current = {
      center: viewRef.current.center.clone(),
      zoom: viewRef.current.zoom,
    };
  };

  const handleHover = (attraction) => {
    if (!viewRef?.current) return;
    setActiveId(attraction.id);
    viewRef.current.goTo(
      {
        center: [attraction.coordinates[0], attraction.coordinates[1]],
        zoom: 16,
      },
      { duration: 600, easing: "ease-in-out" },
    );
  };

  const handleMouseLeave = () => {
    setActiveId(null);
  };

  const handleSelect = (attraction) => {
    if (!viewRef?.current) return;
    viewRef.current.goTo(
      {
        center: [attraction.coordinates[0], attraction.coordinates[1]],
        zoom: 17,
      },
      { duration: 800, easing: "ease-in-out" },
    );
    setQuery(attraction.name);
  };

  const handleClear = () => {
    setQuery("");
    setActiveId(null);
    if (viewRef?.current && savedViewRef.current) {
      viewRef.current.goTo(
        {
          center: savedViewRef.current.center,
          zoom: savedViewRef.current.zoom,
        },
        { duration: 800, easing: "ease-in-out" },
      );
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (query.trim() === "" && val.trim() !== "") {
      saveCurrentView();
    }
    setQuery(val);
  };

  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.content}>
        <div className={styles.searchWrapper}>
          <div className={styles.searchBox}>
            <svg
              className={styles.searchIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Axtar..."
              value={query}
              onChange={handleInputChange}
            />
            {query && (
              <button className={styles.clearBtn} onClick={handleClear}>
                ✕
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className={styles.resultList}>
              {results.map((attraction) => (
                <div
                  key={attraction.id}
                  className={`${styles.resultItem} ${
                    activeId === attraction.id ? styles.resultItemActive : ""
                  }`}
                  onMouseEnter={() => handleHover(attraction)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleSelect(attraction)}
                >
                  <div className={styles.resultName}>{attraction.name}</div>
                  <div className={styles.resultMeta}>
                    {attraction.city} · {attraction.category}
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.trim().length > 0 && results.length === 0 && (
            <div className={styles.noResult}>Nəticə tapılmadı</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
