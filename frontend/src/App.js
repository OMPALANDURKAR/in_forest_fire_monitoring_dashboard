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

  const [searchDistrict, setSearchDistrict] = useState("");

  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [riskFilter, setRiskFilter] = useState({
    high: true,
    medium: true,
    low: true,
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [realtimeInfo, setRealtimeInfo] = useState(null);
  const [loadingRealtime, setLoadingRealtime] = useState(false);

  const [futureRisk, setFutureRisk] = useState(null);
  const [loadingFuture, setLoadingFuture] = useState(false);

  /* ===============================
     REAL-TIME FIRE STATUS
  ================================ */
  useEffect(() => {
    if (!searchDistrict) {
      setRealtimeInfo(null);
      return;
    }

    setLoadingRealtime(true);

    fetch(`${API_BASE}/api/realtime/${searchDistrict.toLowerCase()}`)
      .then(res => {
        if (!res.ok) throw new Error("Realtime API failed");
        return res.json();
      })
      .then(data => {
        setRealtimeInfo(data || null);
      })
      .catch(() => {
        setRealtimeInfo(null);
      })
      .finally(() => setLoadingRealtime(false));

  }, [searchDistrict]);

  /* ===============================
     AI RISK OUTLOOK (SMART SWITCH)
  ================================ */
  useEffect(() => {

    if (!selectedState && !selectedDistrict) {
      setFutureRisk(null);
      return;
    }

    setLoadingFuture(true);

    let endpoint = "";

    if (selectedState) {
      endpoint = `/api/predict-state/${selectedState}`;
    } else if (selectedDistrict) {
      endpoint = `/api/predict/${selectedDistrict}`;
    }

    fetch(`${API_BASE}${endpoint}`)
      .then(res => {
        if (!res.ok) throw new Error("Predict API failed");
        return res.json();
      })
      .then(data => {
        setFutureRisk(data || null);
      })
      .catch(() => {
        setFutureRisk(null);
      })
      .finally(() => setLoadingFuture(false));

  }, [selectedState, selectedDistrict]);

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
          realtimeInfo={realtimeInfo}
          futureRisk={futureRisk}
          loadingRealtime={loadingRealtime}
          loadingFuture={loadingFuture}
          selectedType={selectedState ? "state" : "district"}
        />

        {/* CENTER MAP */}
        <FireMap
          searchDistrict={searchDistrict}
          riskFilter={riskFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          selectedState={selectedState}
          setSelectedState={setSelectedState}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
        />

        {/* RIGHT PANEL */}
        <Analytics
          selectedState={selectedState}
          popupDistrict={selectedDistrict}
        />

      </div>
    </div>
  );
}

export default App;
