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
  onDistrictSelect
}) => {
  const map = useMap();

  useEffect(() => {
    if (!searchDistrict || !districtGeo) return;

    const target = searchDistrict.toLowerCase().trim();

    for (const feature of districtGeo.features) {
      const rawName = getDistrictName(feature.properties);
      if (!rawName) continue;

      if (normalizeDistrict(rawName) === target) {
        const coords = feature.geometry.coordinates[0];
        const bounds = coords.map(([lng, lat]) => [lat, lng]);

        // 1️⃣ Zoom first
        map.fitBounds(bounds, { padding: [40, 40] });

        // 2️⃣ Compute centroid for popup
        const centroid = bounds.reduce(
          (acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]],
          [0, 0]
        ).map(v => v / bounds.length);

        const info = districtRisk[target];
        if (!info) return;

        const districtData = {
          district: rawName,
          state: info.state,
          fireCount: info.fire_count,
          risk: info.risk
        };

        // ✅ FIX: open popup ONLY after zoom finishes
        map.once("moveend", () => {
          onDistrictSelect(districtData, centroid);
        });

        break;
      }
    }
  }, [searchDistrict, districtGeo, districtRisk, map, onDistrictSelect]);

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
  /* ---------- STATE ---------- */
  const [fires, setFires] = useState([]);
  const [districtGeo, setDistrictGeo] = useState(null);
  const [districtRisk, setDistrictRisk] = useState({});
  const [basemap, setBasemap] = useState("satellite");

  // Popup state
  const [popupDistrict, setPopupDistrict] = useState(null);
  const [popupPosition, setPopupPosition] = useState(null);

  const debouncedSearch = useDebounce(searchDistrict, 500);

  /* ---------- TILE LAYERS ---------- */
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

  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    fetch("http://localhost:5000/api/fires")
      .then(res => res.json())
      .then(setFires)
      .catch(console.error);

    fetch("http://localhost:5000/api/districts")
      .then(res => res.json())
      .then(setDistrictGeo);

    fetch("http://localhost:5000/api/district-risk")
      .then(res => res.json())
      .then(setDistrictRisk);
  }, []);

  /* ---------- FILTER FIRES ---------- */
  const filteredFires = useMemo(() => {
    return fires.filter(f => {
      if (f.brightness > 350 && !riskFilter.high) return false;
      if (f.brightness >= 300 && f.brightness <= 350 && !riskFilter.medium)
        return false;
      if (f.brightness < 300 && !riskFilter.low) return false;

      if (dateFrom && dateTo) {
        const d = new Date(f.acq_date);
        if (d < new Date(dateFrom) || d > new Date(dateTo)) return false;
      }

      return true;
    });
  }, [fires, riskFilter, dateFrom, dateTo]);

  const fireColor = (b) =>
    b > 350 ? "#b71c1c" : b >= 300 ? "#f9a825" : "#1b5e20";

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="map-container">

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

        {/* DISTRICT BOUNDARIES */}
        {districtGeo && (
          <GeoJSON
            data={districtGeo}
            style={{
              color: "#64748b",
              weight: 0.6,
              fillOpacity: 0
            }}
            onEachFeature={(feature, layer) => {
              const name = getDistrictName(feature.properties);
              const key = normalizeDistrict(name);
              const info = districtRisk[key];
              if (!info) return;

              layer.on("click", (e) => {
                const districtData = {
                  district: name,
                  state: info.state,
                  fireCount: info.fire_count,
                  risk: info.risk
                };

                setPopupDistrict(districtData);
                setPopupPosition([e.latlng.lat, e.latlng.lng]);
                setSelectedDistrict(districtData);
              });
            }}
          />
        )}

        {/* DISTRICT POPUP */}
        {popupDistrict && popupPosition && (
          <Popup
            position={popupPosition}
            closeButton
            eventHandlers={{
              remove: () => {
                setPopupDistrict(null);
                setPopupPosition(null);
              }
            }}
          >
            <div className="district-popup-content">
              <h3>{popupDistrict.district}</h3>
              <div><strong>State:</strong> {popupDistrict.state}</div>
              <div><strong>Total Fires:</strong> {popupDistrict.fireCount}</div>
              <div><strong>Risk Level:</strong> {popupDistrict.risk}</div>
            </div>
          </Popup>
        )}

        {/* FIRE POINTS */}
        {filteredFires.map((f, idx) => {
          const lat = Number(f.latitude);
          const lon = Number(f.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <CircleMarker
              key={idx}
              center={[lat, lon]}
              radius={4}
              pathOptions={{
                color: fireColor(f.brightness),
                fillColor: fireColor(f.brightness),
                fillOpacity: 0.7,
                weight: 0
              }}
            >
              <Popup>
                <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                  <div><strong>District:</strong> {f.district || "N/A"}</div>
                  <div><strong>Risk:</strong> {getFireRisk(f.brightness)}</div>
                  <div><strong>Date:</strong> {f.acq_date}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* SEARCH HANDLER */}
        {districtGeo && (
          <DistrictSearchHandler
            districtGeo={districtGeo}
            districtRisk={districtRisk}
            searchDistrict={debouncedSearch}
            onDistrictSelect={(data, pos) => {
              setPopupDistrict(data);
              setPopupPosition(pos);
              setSelectedDistrict(data);
            }}
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
