import React from "react";
import styles from "./RightPanel.module.css";

const RightPanel = ({ isOpen }) => {
  return (
    <div className={`${styles.panel} ${isOpen ? styles.open : styles.closed}`}>
      <div className={styles.content}></div>
    </div>
  );
};

export default RightPanel;
