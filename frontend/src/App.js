import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./styles/firemap.css";
import "./styles/dashboard.css";
import Header from "./components/Header";
import SidebarFilters from "./components/SidebarFilters";
import Analytics from "./components/Analytics";
import FireMap from "./FireMap";

/* ===============================
   BACKEND BASE URL
================================ */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://in-forest-fire-monitoring-dashboard.onrender.com";

function App() {
  /* ===============================
     GLOBAL STATES
  ================================ */

  // 🔍 Search input (SINGLE SOURCE OF TRUTH)
  const [searchDistrict, setSearchDistrict] = useState("");

  // 🎚 Risk filters
  const [riskFilter, setRiskFilter] = useState({
    high: true,
    medium: true,
    low: true,
  });

  // 📅 Date filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 🔥 Sidebar real-time info
  const [realtimeInfo, setRealtimeInfo] = useState(null);
  const [loadingRealtime, setLoadingRealtime] = useState(false);

  // 🔮 Sidebar AI risk
  const [futureRisk, setFutureRisk] = useState(null);
  const [loadingFuture, setLoadingFuture] = useState(false);

  /* ===============================
     REAL-TIME FIRE STATUS (FIRMS)
  ================================ */
  useEffect(() => {
    if (!searchDistrict) {
      setRealtimeInfo(null);
      return;
    }

    setLoadingRealtime(true);

    fetch(
      `${API_BASE}/api/realtime/${searchDistrict.toLowerCase()}`
    )
      .then(res => {
        if (!res.ok) throw new Error("Realtime API failed");
        return res.json();
      })
      .then(data => {
        setRealtimeInfo(data || null);
      })
      .catch(err => {
        console.error("❌ Realtime fetch error:", err);
        setRealtimeInfo(null);
      })
      .finally(() => setLoadingRealtime(false));
  }, [searchDistrict]);

  /* ===============================
     AI RISK OUTLOOK (HISTORICAL)
  ================================ */
  useEffect(() => {
    if (!searchDistrict) {
      setFutureRisk(null);
      return;
    }

    setLoadingFuture(true);

    fetch(
      `${API_BASE}/api/predict/${searchDistrict.toLowerCase()}`
    )
      .then(res => {
        if (!res.ok) throw new Error("Predict API failed");
        return res.json();
      })
      .then(data => {
        setFutureRisk(data || null);
      })
      .catch(err => {
        console.error("❌ Prediction fetch error:", err);
        setFutureRisk(null);
      })
      .finally(() => setLoadingFuture(false));
  }, [searchDistrict]);

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="dashboard-container">
      <Header />

      <div className="main-layout">
        {/* LEFT SIDEBAR */}
        <SidebarFilters
          searchDistrict={searchDistrict}
          setSearchDistrict={setSearchDistrict}
          riskFilter={riskFilter}
          setRiskFilter={setRiskFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          realtimeInfo={realtimeInfo}
          futureRisk={futureRisk}
          loadingRealtime={loadingRealtime}
          loadingFuture={loadingFuture}
        />

        {/* CENTER MAP */}
        <FireMap
          searchDistrict={searchDistrict}
          riskFilter={riskFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />

        {/* RIGHT PANEL */}
        <Analytics
          searchDistrict={searchDistrict}
        />
      </div>
    </div>
  );
}

export default App;
