import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./styles/firemap.css";
import "./styles/dashboard.css";

import Header from "./components/Header";
import SidebarFilters from "./components/SidebarFilters";
import Analytics from "./components/Analytics";

// ⚠️ path check kar lena
import FireMap from "./FireMap";

function App() {
  /* ===============================
     GLOBAL STATES
  ================================ */

  // Search & filters
  const [searchDistrict, setSearchDistrict] = useState("");

  const [riskFilter, setRiskFilter] = useState({
    high: true,
    medium: true,
    low: true
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Selected district (from map click OR search)
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // 🔥 Real-time FIRMS
  const [realtimeInfo, setRealtimeInfo] = useState(null);
  const [loadingRealtime, setLoadingRealtime] = useState(false);

  // 🔮 Future risk prediction
  const [futureRisk, setFutureRisk] = useState(null);
  const [loadingFuture, setLoadingFuture] = useState(false);

  /* ===============================
     DERIVED DISTRICT NAME
     (Search OR Map Click)
  ================================ */
  const activeDistrict =
    selectedDistrict?.district || searchDistrict;

  /* ===============================
     REAL-TIME FIRE STATUS (FIRMS)
  ================================ */
  useEffect(() => {
    if (!activeDistrict) {
      setRealtimeInfo(null);
      return;
    }

    setLoadingRealtime(true);

    fetch(
      `http://localhost:5000/api/realtime/${activeDistrict.toLowerCase()}`
    )
      .then(res => res.json())
      .then(data => {
        if (!data || data.count === 0) {
          setRealtimeInfo(null);
        } else {
          setRealtimeInfo(data);
        }
      })
      .catch(() => setRealtimeInfo(null))
      .finally(() => setLoadingRealtime(false));
  }, [activeDistrict]);

  /* ===============================
     FUTURE RISK PREDICTION
  ================================ */
  useEffect(() => {
    if (!activeDistrict) {
      setFutureRisk(null);
      return;
    }

    setLoadingFuture(true);

    fetch(
      `http://localhost:5000/api/predict/${activeDistrict.toLowerCase()}`
    )
      .then(res => res.json())
      .then(data => {
        if (data) {
          setFutureRisk(data);
        } else {
          setFutureRisk(null);
        }
      })
      .catch(() => setFutureRisk(null))
      .finally(() => setLoadingFuture(false));
  }, [activeDistrict]);

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
          setSelectedDistrict={setSelectedDistrict}
        />

        {/* RIGHT PANEL */}
        <Analytics selectedDistrict={selectedDistrict} />
      </div>
    </div>
  );
}

export default App;
