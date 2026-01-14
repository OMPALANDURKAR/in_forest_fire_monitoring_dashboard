import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  GeoJSON,
  useMap
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./styles/firemap.css";
import useDebounce from "./hooks/useDebounce";

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

const getFireRisk = (brightness) => {
  if (brightness > 350) return "High";
  if (brightness >= 300) return "Medium";
  return "Low";
};

/* ===============================
   DISTRICT SEARCH HANDLER
================================ */
const DistrictSearchHandler = ({
  districtGeo,
  districtRisk,
  searchDistrict,
  setSelectedDistrict,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!searchDistrict || !districtGeo?.features) return;

    const target = searchDistrict.toLowerCase().trim();

    for (const feature of districtGeo.features) {
      const raw = getDistrictName(feature.properties);
      if (!raw) continue;

      if (normalizeDistrict(raw) === target) {
        try {
          const bounds = feature.geometry.coordinates[0].map(
            ([lng, lat]) => [lat, lng]
          );
          map.fitBounds(bounds, { padding: [40, 40] });
        } catch {}

        const info = districtRisk[target];
        if (info) {
          setSelectedDistrict({
            district: raw,
            state: info.state,
            fireCount: info.fire_count,
            risk: info.risk
          });
        }
        break;
      }
    }
  }, [searchDistrict, districtGeo, districtRisk, map, setSelectedDistrict]);

  return null;
};

/* ===============================
   MAIN MAP COMPONENT
================================ */
const FireMap = ({
  searchDistrict,
  riskFilter,
  dateFrom,
  dateTo,
  setSelectedDistrict
}) => {
  const [fires, setFires] = useState([]);
  const [districtGeo, setDistrictGeo] = useState(null);
  const [districtRisk, setDistrictRisk] = useState({});
  const [basemap, setBasemap] = useState("satellite");
  const [dataMode, setDataMode] = useState("historical");

  // 🔑 POPUP CONTROL STATE
  const [activePopup, setActivePopup] = useState(null);

  const debouncedSearch = useDebounce(searchDistrict, 500);

  /* ===============================
     TILE LAYERS
  ================================ */
  const tileLayers = useMemo(
    () => ({
      street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap"
      },
      satellite: {
        url:
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "© Esri"
      }
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
     FETCH STATIC DATA
  ================================ */
  useEffect(() => {
    fetch(`${API_BASE}/api/districts`)
      .then(res => res.json())
      .then(setDistrictGeo);

    fetch(`${API_BASE}/api/district-risk`)
      .then(res => res.json())
      .then(setDistrictRisk);
  }, []);

  /* ===============================
     FILTER FIRES
  ================================ */
  const finalFires = useMemo(() => {
    return fires.filter(f => {
      if (f.brightness > 350 && !riskFilter.high) return false;
      if (f.brightness >= 300 && f.brightness <= 350 && !riskFilter.medium)
        return false;
      if (f.brightness < 300 && !riskFilter.low) return false;

      if (dateFrom && dateTo) {
        const d = new Date(f.acq_date);
        return d >= new Date(dateFrom) && d <= new Date(dateTo);
      }
      return true;
    });
  }, [fires, riskFilter, dateFrom, dateTo]);

  const fireColor = (b) =>
    b > 350 ? "#dc2626" : b >= 300 ? "#f59e0b" : "#16a34a";

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="map-container">
      {/* TOGGLES */}
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

      <MapContainer center={[22.6, 79]} zoom={5}>
        <TileLayer
          url={tileLayers[basemap].url}
          attribution={tileLayers[basemap].attribution}
        />

        {/* DISTRICT BOUNDARIES */}
        {districtGeo && (
          <GeoJSON
            data={districtGeo}
            style={{ color: "#64748b", weight: 0.6, fillOpacity: 0 }}
          />
        )}

        {/* FIRE MARKERS */}
        {finalFires.map((f, idx) => (
          <CircleMarker
            key={idx}
            center={[+f.latitude, +f.longitude]}
            radius={4}
            pathOptions={{
              color: fireColor(f.brightness),
              fillColor: fireColor(f.brightness),
              fillOpacity: 0.7,
              weight: 0
            }}
            eventHandlers={{
              click: () => {
                setActivePopup(f); // 🔑 popup trigger
              }
            }}
          />
        ))}

        {/* 🔑 CONTROLLED POPUP (PRODUCTION SAFE) */}
        {activePopup && (
          <Popup
            position={[+activePopup.latitude, +activePopup.longitude]}
            onClose={() => setActivePopup(null)}
            autoPan
          >
            <div style={{ fontSize: "13px" }}>
              <div><strong>District:</strong> {activePopup.district || "N/A"}</div>
              <div><strong>Risk:</strong> {getFireRisk(activePopup.brightness)}</div>
              <div><strong>Date:</strong> {activePopup.acq_date}</div>
              <div><strong>Time:</strong> {activePopup.acq_time}</div>
            </div>
          </Popup>
        )}

        {/* SEARCH HANDLER */}
        {districtGeo && (
          <DistrictSearchHandler
            districtGeo={districtGeo}
            districtRisk={districtRisk}
            searchDistrict={debouncedSearch}
            setSelectedDistrict={setSelectedDistrict}
          />
        )}
      </MapContainer>

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
