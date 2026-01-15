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
   UTILS (🔥 FIXED)
================================ */
const normalize = (name) =>
  name
    ? name
        .toLowerCase()
        .replace(/district/g, "")
        .replace(/[^a-z]/g, "")
        .trim()
    : "";

const formatDistrict = (name) =>
  name ? name.charAt(0).toUpperCase() + name.slice(1) : "";

const getDistrictName = (p) =>
  p?.DISTRICT || p?.district || p?.NAME_3 || p?.NAME_2 || p?.dtname || null;

/* ===============================
   MAP FOCUS HANDLER
================================ */
const FocusDistrict = ({ districtGeo, searchDistrict }) => {
  const map = useMap();

  useEffect(() => {
    if (!searchDistrict || !districtGeo?.features) return;

    const target = normalize(searchDistrict);

    const feature = districtGeo.features.find(f => {
      const name = getDistrictName(f.properties);
      return normalize(name) === target;
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

/* ==================================================
   MAIN COMPONENT
================================================== */
const FireMap = ({ searchDistrict, riskFilter, dateFrom, dateTo }) => {
  const [mapFires, setMapFires] = useState([]);
  const [historicalFires, setHistoricalFires] = useState([]);
  const [districtGeo, setDistrictGeo] = useState(null);

  const [basemap, setBasemap] = useState("satellite");
  const [dataMode, setDataMode] = useState("historical");

  const [popupDistrict, setPopupDistrict] = useState(null);
  const [popupStats, setPopupStats] = useState(null);

  /* ===============================
     FETCH MAP DATA
  ================================ */
  useEffect(() => {
    const url =
      dataMode === "historical"
        ? `${API_BASE}/api/fires`
        : `${API_BASE}/api/fires-realtime`;

    fetch(url)
      .then(res => res.json())
      .then(data => setMapFires(Array.isArray(data) ? data : []))
      .catch(() => setMapFires([]));
  }, [dataMode]);

  /* ===============================
     FETCH HISTORICAL DATA (POPUP)
  ================================ */
  useEffect(() => {
    fetch(`${API_BASE}/api/fires`)
      .then(res => res.json())
      .then(data => setHistoricalFires(Array.isArray(data) ? data : []))
      .catch(() => setHistoricalFires([]));
  }, []);

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
     OPEN POPUP (🔥 FIXED)
  ================================ */
  const openPopup = (district) => {
    const history = historicalFires.filter(
      f => normalize(f.district) === normalize(district)
    );

    setPopupDistrict(district);

    if (!history.length) {
      setPopupStats({ empty: true });
      return;
    }

    const dates = history
      .map(f => new Date(f.acq_date))
      .filter(d => !isNaN(d));

    setPopupStats({
      total: history.length,
      firstFire: dates.length
        ? new Date(Math.min(...dates)).toISOString().split("T")[0]
        : "N/A",
      lastFire: dates.length
        ? new Date(Math.max(...dates)).toISOString().split("T")[0]
        : "N/A",
    });
  };

  useEffect(() => {
    if (searchDistrict) openPopup(searchDistrict);
  }, [searchDistrict]);

  /* ===============================
     FILTER MAP FIRES
  ================================ */
  const finalFires = useMemo(() => {
    return mapFires
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
  }, [mapFires, riskFilter, dateFrom, dateTo]);

  const fireColor = (b) =>
    b > 350 ? "#dc2626" : b >= 300 ? "#f59e0b" : "#16a34a";

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

      <MapContainer center={[22.6, 79]} zoom={5} preferCanvas>
        <TileLayer
          url={
            basemap === "satellite"
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />

        {districtGeo && (
          <GeoJSON
            data={districtGeo}
            style={{ color: "#64748b", weight: 0.6, fillOpacity: 0 }}
            onEachFeature={(feature, layer) => {
              layer.on("click", () => {
                const name = getDistrictName(feature.properties);
                if (name) openPopup(name);
              });
            }}
          />
        )}

        {finalFires.map((f, idx) => (
          <CircleMarker
            key={idx}
            center={[+f.latitude, +f.longitude]}
            radius={3}
            pathOptions={{
              color: fireColor(f.brightness),
              fillOpacity: 0.7,
              weight: 0,
            }}
          />
        ))}

        {districtGeo && searchDistrict && (
          <FocusDistrict
            districtGeo={districtGeo}
            searchDistrict={searchDistrict}
          />
        )}
      </MapContainer>

      {popupDistrict && popupStats && (
        <div className="history-popup">
          <h3>{formatDistrict(popupDistrict)}</h3>

          {popupStats.empty ? (
            <p className="muted">
              No historical fire records available for this district
            </p>
          ) : (
            <>
              <p><b>Total Historical Fires:</b> {popupStats.total}</p>
              <p><b>First Fire:</b> {popupStats.firstFire}</p>
              <p><b>Last Fire:</b> {popupStats.lastFire}</p>
            </>
          )}

          <p className="popup-note">
            Historical data derived from NASA FIRMS archives
          </p>

          <button onClick={() => setPopupDistrict(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default FireMap;
