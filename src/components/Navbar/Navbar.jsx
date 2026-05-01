import React from "react";
import { Link, NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

const navItems = [
  { path: "/attractions", label: "Attraksiyonlar" },
  { path: "/hotel-zones", label: "Otellər" },
  { path: "/restaurants-nearby", label: "Restoranlar" },
  { path: "/route-planner", label: "Marşrutlar" },
  { path: "/events", label: "Tədbirlər" },
  { path: "/city-scenes", label: "3D xəritə" },
  { path: "/story-maps", label: "Hekayələr" },
];

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <img
            src="/src/assets/icons/plane-up-solid-full.svg"
            alt="logo"
            className={styles.icon}
          />
          <div className={styles.logoText}>
            <span className={styles.main}>TourGIS</span>
            <span className={styles.sub}>Milli Portal</span>
          </div>
        </Link>
        <div className={styles.menu}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className={styles.live}>
          <span className={styles.liveDot}></span>
          <span>Canlı</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
