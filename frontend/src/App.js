import { useState } from "react";
import "leaflet/dist/leaflet.css";
import "./styles/firemap.css";
import "./styles/dashboard.css";

import Header from "./components/Header";
import SidebarFilters from "./components/SidebarFilters";
import FireMap from "./FireMap";

function App() {
  const [searchDistrict, setSearchDistrict] = useState("");

  const [riskFilter, setRiskFilter] = useState({
    high: true,
    medium: true,
    low: true
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedDistrict, setSelectedDistrict] = useState(null);

  return (
    <div className="dashboard-container">
      <Header />

      <div className="main-layout">
        <SidebarFilters
          searchDistrict={searchDistrict}
          setSearchDistrict={setSearchDistrict}
          riskFilter={riskFilter}
          setRiskFilter={setRiskFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />

        <FireMap
          searchDistrict={searchDistrict}
          riskFilter={riskFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          setSelectedDistrict={setSelectedDistrict}
        />
      </div>
    </div>
  );
}

export default App;
