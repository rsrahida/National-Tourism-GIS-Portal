import React, { useEffect, useState } from "react";
import styles from "./Loading.module.css";

const Loading = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 100 / 20;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.loading}>
      <div className={styles.grid} />
      <div className={styles.content}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <img
              src="/src/assets/icons/plane-up-solid-full.svg"
              alt="logo"
              className={styles.planeSvg}
            />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoMain}>TourGIS</span>
            <span className={styles.logoSub}>Milli Portal</span>
          </div>
        </div>
        <div className={styles.mapBox}>
          <div className={styles.mapLines}>
            <div className={styles.lineH} style={{ top: "30%" }} />
            <div className={styles.lineH} style={{ top: "60%" }} />
            <div className={styles.lineV} style={{ left: "30%" }} />
            <div className={styles.lineV} style={{ left: "60%" }} />
          </div>
          <div className={`${styles.pin} ${styles.pinA}`}>
            <div className={styles.pinDot} />
            <div className={styles.pinRing} />
          </div>
          <div className={`${styles.pin} ${styles.pinB}`}>
            <div className={styles.pinDot} />
            <div className={styles.pinRing} />
          </div>
          <div className={`${styles.pin} ${styles.pinC}`}>
            <div className={styles.pinDot} />
            <div className={styles.pinRing} />
          </div>
          <svg className={styles.lineSvg} viewBox="0 0 200 160">
            <path
              d="M 40 50 Q 100 20 160 80 Q 180 100 120 130"
              fill="none"
              stroke="#cfd8b6"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.4"
            />
          </svg>
        </div>
        <div className={styles.progressWrapper}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className={styles.progressLabels}>
            <span className={styles.progressLabel}>Yüklənir...</span>
            <span className={styles.progressPercent}>
              {Math.min(Math.round(progress), 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
