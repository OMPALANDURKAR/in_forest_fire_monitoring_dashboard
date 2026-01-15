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
   UTILS (STRICT NORMALIZATION)
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
   VALID DISTRICT CHECK
================================ */
const isValidDistrict = (name, geo) => {
  if (!name || !geo?.features) return false;
  const target = normalize(name);

  return geo.features.some(f => {
    const d = getDistrictName(f.properties);
    return normalize(d) === target;
  });
};

/* ===============================
   MAP FOCUS HANDLER
================================ */
const FocusDistrict = ({ districtGeo, searchDistrict }) => {
  const map = useMap();

  useEffect(() => {
    if (!isValidDistrict(searchDistrict, districtGeo)) return;

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
  /* ===============================
     MAP DATA
  ================================ */
  const [mapFires, setMapFires] = useState([]);
  const [districtGeo, setDistrictGeo] = useState(null);
  const [dataMode, setDataMode] = useState("historical");

  /* 🔥 BASEMAP STATE (FIX) */
  const [basemap, setBasemap] = useState("satellite");

  /* ===============================
     POPUP STATE
  ================================ */
  const [popupDistrict, setPopupDistrict] = useState(null);
  const [popupData, setPopupData] = useState(null);

  /* ===============================
     FETCH MAP FIRES
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
     FETCH DISTRICTS
  ================================ */
  useEffect(() => {
    fetch(`${API_BASE}/api/districts`)
      .then(res => res.json())
      .then(setDistrictGeo)
      .catch(() => {});
  }, []);

  /* ===============================
     OPEN POPUP (BACKEND)
  ================================ */
  const openPopup = async (district) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/history/${normalize(district)}`
      );
      const data = await res.json();

      setPopupDistrict(district);
      setPopupData(data);
    } catch {
      setPopupDistrict(district);
      setPopupData({ totalFires: 0 });
    }
  };

  /* ===============================
     SEARCH → POPUP (SINGLE SOURCE)
  ================================ */
  useEffect(() => {
    if (
      dataMode !== "historical" ||
      !isValidDistrict(searchDistrict, districtGeo)
    ) {
      setPopupDistrict(null);
      setPopupData(null);
      return;
    }
    openPopup(searchDistrict);
  }, [searchDistrict, dataMode, districtGeo]);

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

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="map-container">

      {/* DATA MODE TOGGLE */}
      <div className="data-toggle">
        <button
          className={dataMode === "historical" ? "active" : ""}
          onClick={() => setDataMode("historical")}
        >
          Historical
        </button>
        <button
          className={dataMode === "realtime" ? "active" : ""}
          onClick={() => {
            setDataMode("realtime");
            setPopupDistrict(null);
            setPopupData(null);
          }}
        >
          FIRMS
        </button>
      </div>

      {/* 🔥 BASEMAP TOGGLE (RESTORED) */}
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

      {/* POPUP */}
      {popupDistrict && popupData && (
        <div className="history-popup">
          <div className="history-popup-header">
            <h3>{formatDistrict(popupDistrict)}</h3>
            <button
              className="history-popup-close"
              onClick={() => {
                setPopupDistrict(null);
                setPopupData(null);
              }}
            >
              ✕
            </button>
          </div>

          <div className="history-popup-body">
            {popupData.totalFires === 0 ? (
              <p className="muted">No historical fire records available</p>
            ) : (
              <div className="history-stats">
                <div className="history-stat">
                  <span className="label">Total Fires</span>
                  <span className="value">{popupData.totalFires}</span>
                </div>
                <div className="history-stat">
                  <span className="label">First Recorded</span>
                  <span className="value">{popupData.firstFireDate}</span>
                </div>
                <div className="history-stat">
                  <span className="label">Last Recorded</span>
                  <span className="value">{popupData.lastFireDate}</span>
                </div>
              </div>
            )}

            <div className="history-footer">
              Historical data derived from NASA FIRMS archives
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireMap;
