import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMap,
  faHotel,
  faUtensils,
  faRoute,
  faCalendarDays,
  faCube,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";

const sidebarItems = [
  { path: "/", icon: faLocationDot },
  { path: "/attractions", icon: faMap },
  { path: "/hotel-zones", icon: faHotel },
  { path: "/restaurants-nearby", icon: faUtensils },
  { path: "/route-planner", icon: faRoute },
  { path: "/events", icon: faCalendarDays },
  { path: "/city-scenes", icon: faCube },
  { path: "/story-maps", icon: faBookOpen },
];
const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.menu}>
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            title={item.path}
          >
            <FontAwesomeIcon icon={item.icon} />
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
