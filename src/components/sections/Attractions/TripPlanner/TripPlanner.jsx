import React from "react";
import styles from "./TripPlanner.module.css";

const CATEGORY_ICONS = {
  tarix: "🏛",
  muzey: "🎨",
  din: "🕌",
  park: "🌳",
  memarlıq: "🏗",
  təbiət: "🏔",
  mədəniyyət: "🎭",
};

const TripPlanner = ({
  tripAttractions,
  onRemove,
  onGoToSearch,
  onSelectAttraction,
  viewRef,
}) => {
  if (tripAttractions.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.tabTitle}>
          <span>🗺</span> Gəzinti Planı
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🗺</div>
          <div className={styles.emptyText}>Hələ attraksion seçilməyib.</div>
          <div className={styles.emptyHint}>
            Attraksion detallarında "Gəzinti planına əlavə et" düyməsinə basın
            və ya Favoritlər tabından "+" ilə əlavə edin.
          </div>
          <button className={styles.goSearchBtn} onClick={onGoToSearch}>
            🔍 Attraksionlara bax
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.tabTitle}>
        <span>🗺</span> Gəzinti Planı
        <span className={styles.tabTitleCount}>{tripAttractions.length}</span>
      </div>

      <div className={styles.tripList}>
        {tripAttractions.map((a, index) => (
          <div key={a.id} className={styles.tripItem}>
            <div className={styles.tripIndex}>{index + 1}</div>
            <div className={styles.tripIcon}>
              {CATEGORY_ICONS[a.category] ?? "📍"}
            </div>
            <div
              className={styles.tripInfo}
              onClick={() => {
                if (viewRef?.current) {
                  viewRef.current.goTo(
                    { center: [a.coordinates[0], a.coordinates[1]], zoom: 16 },
                    { duration: 700, easing: "ease-in-out" }
                  );
                }
                if (onSelectAttraction) onSelectAttraction(a);
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
              onClick={() => onRemove(a.id)}
              title="Sil"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripPlanner;