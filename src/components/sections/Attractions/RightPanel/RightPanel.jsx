import React, { useState, useRef, useEffect } from "react";
import mockData from "../../../../../public/mockData.json";
import styles from "./RightPanel.module.css";

const ALL_CATEGORIES = [
  ...new Set(mockData.attractions.map((a) => a.category)),
];

const CATEGORY_ICONS = {
  tarix: "",
  muzey: "",
  din: "",
  park: "",
  memarliq: "",
  tebiet: "",
  medeniyyet: "",
};

const LS_KEY = "gis_favorites";

const loadFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
};

const saveFavorites = (ids) =>
  localStorage.setItem(LS_KEY, JSON.stringify(ids));

const StarRating = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;

  return (
    <div className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={
            i < full
              ? styles.starFull
              : i === full && half
                ? styles.starHalf
                : styles.starEmpty
          }
        >
          ★
        </span>
      ))}
      <span className={styles.ratingNum}>{rating}</span>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) =>
  value ? (
    <div className={styles.infoRow}>
      <span className={styles.infoIcon}>{icon}</span>

      <div className={styles.infoText}>
        <span className={styles.infoLabel}>{label}</span>
        <span className={styles.infoValue}>{value}</span>
      </div>
    </div>
  ) : null;

const HeartBtn = ({ isFav, onToggle }) => (
  <button
    className={`${styles.heartBtn} ${isFav ? styles.heartBtnActive : ""}`}
    onClick={onToggle}
  >
    {isFav ? "♥" : "♡"}
  </button>
);

const Section = ({ title, count, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span className={styles.sectionTitle}>{title}</span>

        {count > 0 && <span className={styles.sectionCount}>{count}</span>}

        <span
          className={`${styles.sectionChevron} ${
            open ? styles.sectionChevronOpen : ""
          }`}
        >
          ›
        </span>
      </button>

      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
};

const safeGoTo = (viewRef, center, zoom = 16) => {
  if (!viewRef?.current) return;

  viewRef.current
    .goTo(
      { center, zoom },
      {
        duration: 700,
        easing: "ease-in-out",
      },
    )
    .catch(() => {});
};

const RightPanel = ({
  isOpen,
  viewRef,
  onCategoryFilter,
  selectedAttraction,
  onClearSelection,
  onSelectAttraction,
}) => {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);

  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const [favoriteIds, setFavoriteIds] = useState(loadFavorites);

  const [tripAttractions, setTripAttractions] = useState([]);

  const savedViewRef = useRef(null);

  useEffect(() => {
    saveFavorites(favoriteIds);
  }, [favoriteIds]);

  const isFav = (id) => favoriteIds.includes(id);

  const toggleFav = (id) =>
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );

  const favoriteAttractions = mockData.attractions.filter((a) =>
    favoriteIds.includes(a.id),
  );

  const isInTrip = (id) => tripAttractions.some((a) => a.id === id);

  const toggleTrip = (attraction) =>
    setTripAttractions((prev) =>
      prev.find((a) => a.id === attraction.id)
        ? prev.filter((a) => a.id !== attraction.id)
        : [...prev, attraction],
    );

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

  const handleHover = (a) => {
    if (!viewRef?.current) return;

    setActiveId(a.id);

    safeGoTo(viewRef, [a.coordinates[0], a.coordinates[1]], 16);
  };

  const handleSelect = (a) => {
    safeGoTo(viewRef, [a.coordinates[0], a.coordinates[1]], 17);

    setQuery("");

    if (onSelectAttraction) {
      onSelectAttraction(a);
    }
  };

  const handleClear = () => {
    setQuery("");
    setActiveId(null);

    if (viewRef?.current && savedViewRef.current) {
      safeGoTo(viewRef, savedViewRef.current.center, savedViewRef.current.zoom);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;

    if (query.trim() === "" && val.trim() !== "") {
      saveCurrentView();
    }

    setQuery(val);
  };

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);

      next.has(cat) ? next.delete(cat) : next.add(cat);

      if (onCategoryFilter) {
        onCategoryFilter(next.size > 0 ? [...next] : null);
      }

      return next;
    });
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());

    if (onCategoryFilter) {
      onCategoryFilter(null);
    }
  };

  if (selectedAttraction) {
    const a = selectedAttraction;

    return (
      <div
        className={`${styles.panel} ${isOpen ? styles.open : styles.closed}`}
      >
        <div className={styles.contents}>
          <div className={styles.detailTopRow}>
            <button className={styles.backBtn} onClick={onClearSelection}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Geri qayıt
            </button>

            <HeartBtn isFav={isFav(a.id)} onToggle={() => toggleFav(a.id)} />
          </div>

          <h2 className={styles.detailName}>{a.name}</h2>

          {a.nameEn && <p className={styles.detailNameEn}>{a.nameEn}</p>}

          <StarRating rating={parseFloat(a.rating)} />

          <p className={styles.reviewCount}>
            {Number(a.reviewCount).toLocaleString()} rəy
          </p>

          <p className={styles.detailDescription}>{a.description}</p>

          <div className={styles.infoBlock}>
            <InfoRow
              label="Şəhər / Rayon"
              value={`${a.city}${a.district ? ` · ${a.district}` : ""}`}
            />

            <InfoRow label="İş saatları" value={a.openHours} />

            <InfoRow label="Giriş haqqı" value={a.entryFee} />

            <InfoRow label="Telefon" value={a.phone} />

            <InfoRow
              label="Əlçatanlıq"
              value={
                a.accessibility === "true" || a.accessibility === true
                  ? "Mövcuddur"
                  : "Yoxdur"
              }
            />

            <InfoRow
              label="Parkinq"
              value={
                a.parkingNearby === "true" || a.parkingNearby === true
                  ? "Yaxınlıqda var"
                  : "Yoxdur"
              }
            />
          </div>

          <button
            className={`${styles.addTripBtn} ${
              isInTrip(a.id) ? styles.addTripBtnActive : ""
            }`}
            onClick={() => toggleTrip(a)}
          >
            {isInTrip(a.id) ? "Plandan çıxar" : "Səyahət planına əlavə et"}
          </button>
        </div>
      </div>
    );
  }

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
              {results.map((a) => (
                <div
                  key={a.id}
                  className={`${styles.resultItem} ${
                    activeId === a.id ? styles.resultItemActive : ""
                  }`}
                  onMouseEnter={() => handleHover(a)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() => handleSelect(a)}
                >
                  <div className={styles.resultName}>{a.name}</div>

                  <div className={styles.resultMeta}>
                    {a.city} · {a.category}
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.trim().length > 0 && results.length === 0 && (
            <div className={styles.noResult}>Nəticə tapılmadı</div>
          )}
        </div>


        <Section title="Kateqoriyalar" count={selectedCategories.size}>
          <div className={styles.chipGrid}>
            {ALL_CATEGORIES.map((cat) => {
              const isActive = selectedCategories.has(cat);

              return (
                <button
                  key={cat}
                  className={`${styles.chip} ${
                    isActive ? styles.chipActive : ""
                  }`}
                  onClick={() => toggleCategory(cat)}
                >
                  <span className={styles.chipLabel}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </span>

                  {isActive && <span className={styles.chipCheck}>✓</span>}
                </button>
              );
            })}
          </div>

          {selectedCategories.size > 0 && (
            <button className={styles.clearFiltersBtn} onClick={clearFilters}>
              Filtrləri sıfırla
            </button>
          )}
        </Section>

        <Section title="Favorilər" count={favoriteIds.length}>
          {favoriteAttractions.length === 0 ? (
            <div className={styles.emptyMini}>
              Attraksion detallarından favorilərə əlavə
              edə bilərsiniz.
            </div>
          ) : (
            <div className={styles.favList}>
              {favoriteAttractions.map((a) => (
                <div key={a.id} className={styles.favItem}>
                  <div
                    className={styles.favItemMain}
                    onClick={() => {
                      safeGoTo(
                        viewRef,
                        [a.coordinates[0], a.coordinates[1]],
                        16,
                      );

                      if (onSelectAttraction) {
                        onSelectAttraction(a);
                      }
                    }}
                  >
                    <div className={styles.favInfo}>
                      <div className={styles.favName}>{a.name}</div>

                      <div className={styles.favMeta}>
                        {a.city} · {a.rating}
                      </div>
                    </div>
                  </div>

                  <div className={styles.favActions}>
                    <button
                      className={`${styles.favTripBtn} ${
                        isInTrip(a.id) ? styles.favTripBtnActive : ""
                      }`}
                      onClick={() => toggleTrip(a)}
                      title={
                        isInTrip(a.id) ? "Plandan çıxar" : "Plana əlavə et"
                      }
                    >
                      {isInTrip(a.id) ? "✓" : "+"}
                    </button>

                    <button
                      className={styles.favRemoveBtn}
                      onClick={() => toggleFav(a.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Səyahət Planı" count={tripAttractions.length}>
          {tripAttractions.length === 0 ? (
            <div className={styles.emptyMini}>
              Səyahət planına attraksion əlavə edin.
            </div>
          ) : (
            <div className={styles.tripList}>
              {tripAttractions.map((a, index) => (
                <div key={a.id} className={styles.tripItem}>
                  <div className={styles.tripIndex}>{index + 1}</div>

                  <div
                    className={styles.tripInfo}
                    onClick={() => {
                      safeGoTo(
                        viewRef,
                        [a.coordinates[0], a.coordinates[1]],
                        16,
                      );

                      if (onSelectAttraction) {
                        onSelectAttraction(a);
                      }
                    }}
                  >
                    <div className={styles.tripName}>{a.name}</div>

                    <div className={styles.tripMeta}>
                      {a.city}

                      {a.openHours ? ` · ${a.openHours}` : ""}
                    </div>

                    {a.entryFee && (
                      <div className={styles.tripFee}>{a.entryFee}</div>
                    )}
                  </div>

                  <button
                    className={styles.removeBtn}
                    onClick={() =>
                      setTripAttractions((prev) =>
                        prev.filter((x) => x.id !== a.id),
                      )
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

export default RightPanel;
