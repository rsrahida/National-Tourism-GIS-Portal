import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MapView from "./components/MapView/MapView";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Loading from "./components/Loading/Loading";
import Attractions from "./components/sections/Attractions/Attractions";
import RoutePlanner from "./components/sections/RoutePlanner/RoutePlanner";
import HotelZones from "./components/sections/HotelZones/HotelZones";
import RestaurantNearby from "./components/sections/RestaurantNearby/RestaurantNearby";
import EventsLayer from "./components/sections/EventsLayer/EventsLayer";
import CityScenes from "./components/sections/CityScenes/CityScenes";
import StoryMaps from "./components/sections/StoryMaps/StoryMaps";

import styles from "./App.module.css";

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={styles.app}>
      <Navbar />

      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.content}>
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/attractions" element={<Attractions />} />
            <Route path="/route-planner" element={<RoutePlanner />} />
            <Route path="/hotel-zones" element={<HotelZones />} />
            <Route path="/restaurants-nearby" element={<RestaurantNearby />} />
            <Route path="/events" element={<EventsLayer />} />
            <Route path="/city-scenes" element={<CityScenes />} />
            <Route path="/story-maps" element={<StoryMaps />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
