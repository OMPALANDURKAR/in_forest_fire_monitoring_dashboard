import {
  MapContainer,
  TileLayer,
  CircleMarker,
  GeoJSON,
  useMap
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./styles/firemap.css";

/* ===============================
   BACKEND BASE URL
================================ */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://in-forest-fire-monitoring-dashboard.onrender.com";

/* ===============================
   UTILS
================================ */
const normalizeDistrict = (name) =>
  name ? name.toLowerCase().replace(" district", "").trim() : null;

const getDistrictName = (p) =>
  p?.DISTRICT || p?.district || p?.NAME_3 || p?.NAME_2 || p?.dtname || null;

/* ===============================
   MAP FOCUS HANDLER
================================ */
const FocusDistrict = ({ districtGeo, searchDistrict }) => {
  const map = useMap();

  useEffect(() => {
    if (!searchDistrict || !districtGeo?.features) return;

    const target = normalizeDistrict(searchDistrict);

    const feature = districtGeo.features.find(f => {
      const name = getDistrictName(f.properties);
      return normalizeDistrict(name) === target;
    });

    if (!feature) return;

    try {
      const bounds = feature.geometry.coordinates[0].map(
        ([lng, lat]) => [lat, lng]
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch {}
  }, [searchDistrict, districtGeo, map]);

  return null;
};

/* ===============================
   MAIN MAP COMPONENT
================================ */
const FireMap = ({ searchDistrict, riskFilter, dateFrom, dateTo }) => {
  const [fires, setFires] = useState([]);
  const [districtGeo, setDistrictGeo] = useState(null);
  const [basemap, setBasemap] = useState("satellite");
  const [dataMode, setDataMode] = useState("historical");

  /* 🔹 POPUP STATE */
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [popupDistrict, setPopupDistrict] = useState(null);

  /* ===============================
     TILE LAYERS
  ================================ */
  const tileLayers = useMemo(
    () => ({
      street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap",
      },
      satellite: {
        url:
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "© Esri",
      },
    }),
    []
  );

  /* ===============================
     FETCH FIRE DATA
  ================================ */
  useEffect(() => {
    const url =
      dataMode === "historical"
        ? `${API_BASE}/api/fires`
        : `${API_BASE}/api/fires-realtime`;

    fetch(url)
      .then(res => res.json())
      .then(data => setFires(Array.isArray(data) ? data : []))
      .catch(() => setFires([]));
  }, [dataMode]);

  /* ===============================
     FETCH DISTRICTS
  ================================ */
  useEffect(() => {
    fetch(`${API_BASE}/api/districts`)
      .then(res => res.json())
      .then(setDistrictGeo)
      .catch(() => {});
  }, []);

  /* ===============================
     FETCH HISTORY (POPUP)
  ================================ */
  const fetchDistrictHistory = async (district) => {
    if (!district) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/history/${district.toLowerCase()}`
      );
      const data = await res.json();

      setPopupDistrict(district);
      setPopupData(data);
      setShowPopup(true);
    } catch {
      setShowPopup(false);
    }
  };

  /* 🔹 SEARCH TRIGGER */
  useEffect(() => {
    if (searchDistrict) {
      fetchDistrictHistory(searchDistrict);
    }
  }, [searchDistrict]);

  /* ===============================
     FILTER FIRES
  ================================ */
  const finalFires = useMemo(() => {
    return fires
      .filter(f => {
        if (f.brightness > 350 && !riskFilter.high) return false;
        if (f.brightness >= 300 && f.brightness <= 350 && !riskFilter.medium)
          return false;
        if (f.brightness < 300 && !riskFilter.low) return false;

        if (dateFrom && dateTo) {
          const d = new Date(f.acq_date);
          return d >= new Date(dateFrom) && d <= new Date(dateTo);
        }
        return true;
      })
      .slice(0, 400);
  }, [fires, riskFilter, dateFrom, dateTo]);

  const fireColor = (b) =>
    b > 350 ? "#dc2626" : b >= 300 ? "#f59e0b" : "#16a34a";

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="map-container">
      {/* MODE TOGGLE */}
      <div className="data-toggle">
        <button
          className={dataMode === "historical" ? "active" : ""}
          onClick={() => setDataMode("historical")}
        >
          Historical
        </button>
        <button
          className={dataMode === "realtime" ? "active" : ""}
          onClick={() => setDataMode("realtime")}
        >
          FIRMS
        </button>
      </div>

      {/* BASEMAP TOGGLE */}
      <div className="basemap-toggle">
        <button
          className={basemap === "street" ? "active" : ""}
          onClick={() => setBasemap("street")}
        >
          Street
        </button>
        <button
          className={basemap === "satellite" ? "active" : ""}
          onClick={() => setBasemap("satellite")}
        >
          Satellite
        </button>
      </div>

      <MapContainer center={[22.6, 79]} zoom={5} preferCanvas>
        <TileLayer
          url={tileLayers[basemap].url}
          attribution={tileLayers[basemap].attribution}
        />

        {/* DISTRICTS (CLICK ENABLED) */}
        {districtGeo && (
          <GeoJSON
            data={districtGeo}
            style={{ color: "#64748b", weight: 0.6, fillOpacity: 0 }}
            onEachFeature={(feature, layer) => {
              layer.on("click", () => {
                const name = getDistrictName(feature.properties);
                if (name) fetchDistrictHistory(name);
              });
            }}
          />
        )}

        {/* FIRE POINTS */}
        {finalFires.map((f, idx) => (
          <CircleMarker
            key={idx}
            center={[+f.latitude, +f.longitude]}
            radius={3}
            pathOptions={{
              color: fireColor(f.brightness),
              fillColor: fireColor(f.brightness),
              fillOpacity: 0.7,
              weight: 0,
            }}
          />
        ))}

        {/* SEARCH → FOCUS */}
        {districtGeo && searchDistrict && (
          <FocusDistrict
            districtGeo={districtGeo}
            searchDistrict={searchDistrict}
          />
        )}
      </MapContainer>

      {/* POPUP */}
      {showPopup && popupData && (
        <div className="history-popup">
          <h3>{popupDistrict}</h3>
          <p><b>Total Historical Fires:</b> {popupData.totalFires}</p>
          <p><b>First Fire:</b> {popupData.firstFireDate || "N/A"}</p>
          <p><b>Last Fire:</b> {popupData.lastFireDate || "N/A"}</p>
          <button onClick={() => setShowPopup(false)}>Close</button>
        </div>
      )}

      {/* LEGEND */}
      <div className="legend">
        <div><span className="dot red" /> High</div>
        <div><span className="dot orange" /> Medium</div>
        <div><span className="dot green" /> Low</div>
      </div>
    </div>
  );
};

export default FireMap;
