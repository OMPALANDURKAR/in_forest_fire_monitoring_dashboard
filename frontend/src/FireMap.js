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
   BACKEND BASE URL (BUILD-TIME)
================================ */
const API_BASE = process.env.REACT_APP_API_URL;

/* ===============================
   UTILS
================================ */
const normalizeDistrict = (name) =>
  name ? name.toLowerCase().replace(" district", "").trim() : null;

const getDistrictName = (p) =>
  p.DISTRICT || p.district || p.NAME_3 || p.NAME_2 || p.dtname || null;

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
  setSelectedDistrict
}) => {
  const map = useMap();

  useEffect(() => {
    if (!searchDistrict || !districtGeo) return;

    const target = searchDistrict.toLowerCase().trim();

    for (const feature of districtGeo.features) {
      const raw = getDistrictName(feature.properties);
      if (!raw) continue;

      if (normalizeDistrict(raw) === target) {
        const bounds = feature.geometry.coordinates[0].map(
          ([lng, lat]) => [lat, lng]
        );

        map.fitBounds(bounds, { padding: [40, 40] });

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
  setSelectedDistrict,
  searchDistrict,
  riskFilter,
  dateFrom,
  dateTo
}) => {
  const [fires, setFires] = useState([]);
  const [districtGeo, setDistrictGeo] = useState(null);
  const [districtRisk, setDistrictRisk] = useState({});
  const [basemap, setBasemap] = useState("satellite");
  const [dataMode, setDataMode] = useState("historical");

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
    if (!API_BASE) {
      console.error("❌ REACT_APP_API_URL missing");
      return;
    }

    const url =
      dataMode === "historical"
        ? `${API_BASE}/api/fires`
        : `${API_BASE}/api/fires-realtime`;

    fetch(url)
      .then(res => res.json())
      .then(setFires)
      .catch(err => console.error("❌ Fire fetch error:", err));
  }, [dataMode]);

  /* ===============================
     FETCH STATIC DATA
  ================================ */
  useEffect(() => {
    if (!API_BASE) return;

    fetch(`${API_BASE}/api/districts`)
      .then(res => res.json())
      .then(setDistrictGeo)
      .catch(console.error);

    fetch(`${API_BASE}/api/district-risk`)
      .then(res => res.json())
      .then(setDistrictRisk)
      .catch(console.error);
  }, []);

  /* ===============================
     FILTERS
  ================================ */
  const riskFilteredFires = useMemo(() => {
    return fires.filter(f => {
      if (f.brightness > 350 && !riskFilter.high) return false;
      if (f.brightness >= 300 && f.brightness <= 350 && !riskFilter.medium)
        return false;
      if (f.brightness < 300 && !riskFilter.low) return false;
      return true;
    });
  }, [fires, riskFilter]);

  const finalFires = useMemo(() => {
    if (!dateFrom || !dateTo) return riskFilteredFires;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    return riskFilteredFires.filter(f => {
      const d = new Date(f.acq_date);
      return d >= from && d <= to;
    });
  }, [riskFilteredFires, dateFrom, dateTo]);

  /* ===============================
     COLOR LOGIC
  ================================ */
  const fireColor = (b) =>
    b > 350 ? "#dc2626" : b >= 300 ? "#f59e0b" : "#16a34a";

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

        {districtGeo && (
          <GeoJSON
            data={districtGeo}
            style={{ color: "#64748b", weight: 0.6, fillOpacity: 0 }}
            onEachFeature={(feature, layer) => {
              const name = getDistrictName(feature.properties);
              const key = normalizeDistrict(name);
              const info = districtRisk[key];

              if (info) {
                layer.on("click", () => {
                  setSelectedDistrict({
                    district: name,
                    state: info.state,
                    fireCount: info.fire_count,
                    risk: info.risk
                  });
                });
              }
            }}
          />
        )}

        {finalFires.map((f, idx) => {
          const lat = Number(f.latitude);
          const lon = Number(f.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <CircleMarker
              key={idx}
              center={[lat, lon]}
              radius={f.brightness > 350 ? 4 : 3}
              pathOptions={{
                color: fireColor(f.brightness),
                fillColor: fireColor(f.brightness),
                fillOpacity: 0.7,
                weight: 0
              }}
            >
              <Popup>
                <div style={{ fontSize: "13px" }}>
                  <div><strong>District:</strong> {f.district || "N/A"}</div>
                  <div><strong>Risk:</strong> {getFireRisk(f.brightness)}</div>
                  <div><strong>Date:</strong> {f.acq_date}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {districtGeo && (
          <DistrictSearchHandler
            districtGeo={districtGeo}
            districtRisk={districtRisk}
            searchDistrict={debouncedSearch}
            setSelectedDistrict={setSelectedDistrict}
          />
        )}
      </MapContainer>

      <div className="legend">
        <div><span className="dot red" /> High</div>
        <div><span className="dot orange" /> Medium</div>
        <div><span className="dot green" /> Low</div>
      </div>
    </div>
  );
};

export default FireMap;
