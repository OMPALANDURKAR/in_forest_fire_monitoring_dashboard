import {
  MapContainer,
  TileLayer,
  CircleMarker,
  GeoJSON,
  useMap
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
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
const normalize = (name) =>
  name
    ? name.toLowerCase().replace(/district/g, "").replace(/[^a-z]/g, "").trim()
    : "";

const normalizeState = (name) =>
  name
    ? name.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "").trim()
    : "";

const getDistrictName = (p) =>
  p?.DISTRICT || p?.district || p?.NAME_3 || p?.NAME_2 || p?.dtname || null;

const getStateName = (p) => p?.NAME_1 || null;

const isValidGeoJSON = (geo) =>
  geo &&
  geo.type === "FeatureCollection" &&
  Array.isArray(geo.features) &&
  geo.features.length > 0;

/* ===============================
   MAP PANES
================================ */
const MapPanes = () => {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane("statesPane")) {
      map.createPane("statesPane");
      map.getPane("statesPane").style.zIndex = 400;
    }
    if (!map.getPane("districtsPane")) {
      map.createPane("districtsPane");
      map.getPane("districtsPane").style.zIndex = 300;
    }
  }, [map]);

  return null;
};

/* ===============================
   FOCUS STATE
================================ */
const FocusState = ({ stateGeo, selectedState }) => {
  const map = useMap();

  useEffect(() => {
    if (!isValidGeoJSON(stateGeo) || !selectedState) return;

    const feature = stateGeo.features.find(
      (f) =>
        normalizeState(getStateName(f.properties)) ===
        normalizeState(selectedState)
    );

    if (!feature) return;

    const layer = L.geoJSON(feature);
    map.fitBounds(layer.getBounds(), { padding: [60, 60] });
  }, [stateGeo, selectedState, map]);

  return null;
};

/* ===============================
   FOCUS DISTRICT
================================ */
const FocusDistrict = ({ districtGeo, selectedDistrict }) => {
  const map = useMap();

  useEffect(() => {
    if (!isValidGeoJSON(districtGeo) || !selectedDistrict) return;

    const feature = districtGeo.features.find(
      (f) =>
        normalize(getDistrictName(f.properties)) ===
        normalize(selectedDistrict)
    );

    if (!feature) return;

    const layer = L.geoJSON(feature);
    map.fitBounds(layer.getBounds(), { padding: [50, 50] });
  }, [districtGeo, selectedDistrict, map]);

  return null;
};

/* ===============================
   MAIN COMPONENT
================================ */
const FireMap = ({
  searchDistrict,
  riskFilter,
  dateFrom,
  dateTo,
  selectedState,
  setSelectedState,
  selectedDistrict,
  setSelectedDistrict
}) => {

  const [mapFires, setMapFires] = useState([]);
  const [districtGeo, setDistrictGeo] = useState(null);
  const [stateGeo, setStateGeo] = useState(null);
  const [stateRisk, setStateRisk] = useState([]);

  const [stateHistoryData, setStateHistoryData] = useState(null);
  const [districtHistoryData, setDistrictHistoryData] = useState(null); // ✅ NEW

  /* ===============================
     FETCH STATIC DATA
  ================================ */
  useEffect(() => {
    fetch(`${API_BASE}/api/fires`).then(r => r.json()).then(setMapFires);
    fetch(`${API_BASE}/api/districts`).then(r => r.json()).then(setDistrictGeo);
    fetch(`${API_BASE}/api/states`).then(r => r.json()).then(setStateGeo);
    fetch(`${API_BASE}/api/state-risk`).then(r => r.json()).then(setStateRisk);
  }, []);

  /* ===============================
     SEARCH HANDLER
  ================================ */
  useEffect(() => {
    if (!searchDistrict) {
      setSelectedState(null);
      setSelectedDistrict(null);
      return;
    }

    let matched = false;

    // STATE SEARCH
    if (isValidGeoJSON(stateGeo)) {
      const stateMatch = stateGeo.features.find((f) => {
        const stateName = getStateName(f.properties);
        return (
          stateName &&
          normalizeState(stateName) === normalizeState(searchDistrict)
        );
      });

      if (stateMatch) {
        const stateName = getStateName(stateMatch.properties);
        setSelectedState(stateName);
        setSelectedDistrict(null);
        matched = true;
      }
    }

    // DISTRICT SEARCH
    if (!matched && isValidGeoJSON(districtGeo)) {
      const districtMatch = districtGeo.features.find((f) => {
        const districtName = getDistrictName(f.properties);
        return (
          districtName &&
          normalize(districtName) === normalize(searchDistrict)
        );
      });

      if (districtMatch) {
        const districtName = getDistrictName(districtMatch.properties);
        setSelectedDistrict(districtName);
        setSelectedState(null);
        matched = true;
      }
    }

    if (!matched) {
      setSelectedState(null);
      setSelectedDistrict(null);
    }

  }, [searchDistrict, stateGeo, districtGeo]);

  /* ===============================
     FETCH STATE HISTORY
  ================================ */
  useEffect(() => {
    if (!selectedState) {
      setStateHistoryData(null);
      return;
    }

    fetch(`${API_BASE}/api/predict-state/${selectedState}`)
      .then(res => res.json())
      .then(setStateHistoryData)
      .catch(() => setStateHistoryData(null));

  }, [selectedState]);

  /* ===============================
     FETCH DISTRICT HISTORY  ✅ NEW
  ================================ */
  useEffect(() => {
    if (!selectedDistrict) {
      setDistrictHistoryData(null);
      return;
    }

    fetch(`${API_BASE}/api/history/${selectedDistrict}`)
      .then(res => res.json())
      .then(setDistrictHistoryData)
      .catch(() => setDistrictHistoryData(null));

  }, [selectedDistrict]);

  /* ===============================
     FILTER FIRES
  ================================ */
  const finalFires = useMemo(() => {
    return mapFires.filter((f) => {
      if (f.brightness > 350 && !riskFilter.high) return false;
      if (f.brightness >= 300 && f.brightness <= 350 && !riskFilter.medium) return false;
      if (f.brightness < 300 && !riskFilter.low) return false;

      if (dateFrom && dateTo) {
        const d = new Date(f.acq_date);
        return d >= new Date(dateFrom) && d <= new Date(dateTo);
      }

      return true;
    });
  }, [mapFires, riskFilter, dateFrom, dateTo]);

  const fireColor = (b) =>
    b > 350 ? "#dc2626" :
    b >= 300 ? "#f59e0b" :
    "#16a34a";

  const getRiskColor = (r) =>
    r === "High" ? "#dc2626" :
    r === "Medium" ? "#f59e0b" :
    "#16a34a";

  return (
    <div className="map-container">
      <MapContainer center={[22.6, 79]} zoom={5}>
        <MapPanes />

        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {isValidGeoJSON(stateGeo) && (
          <GeoJSON
            pane="statesPane"
            data={stateGeo}
            style={(feature) => {
              const stateName = getStateName(feature.properties);
              const risk = stateRisk.find(
                (s) =>
                  normalizeState(s.state) ===
                  normalizeState(stateName)
              );
              const active =
                normalizeState(stateName) ===
                normalizeState(selectedState);

              return {
                fillColor: getRiskColor(risk?.risk),
                fillOpacity: active ? 0.6 : 0.2,
                weight: active ? 3 : 1,
                color: active ? "#000" : "#64748b"
              };
            }}
          />
        )}

        {isValidGeoJSON(districtGeo) && (
          <GeoJSON
            pane="districtsPane"
            data={districtGeo}
            style={{
              color: "#94a3b8",
              weight: 0.5,
              fillOpacity: 0,
              interactive: false
            }}
          />
        )}

        {finalFires.map((f, i) => (
          <CircleMarker
            key={i}
            center={[+f.latitude, +f.longitude]}
            radius={3}
            pathOptions={{ color: fireColor(f.brightness) }}
          />
        ))}

        <FocusState stateGeo={stateGeo} selectedState={selectedState} />
        <FocusDistrict districtGeo={districtGeo} selectedDistrict={selectedDistrict} />
      </MapContainer>

      {/* STATE POPUP */}
      {selectedState && stateHistoryData && (
        <div className="state-history-popup">
          <h3>{selectedState}</h3>
          <div>Total Fires: {stateHistoryData.historicalFireCount}</div>
          <div>Risk: {stateHistoryData.riskLevel}</div>
          <div>Risk %: {stateHistoryData.riskPercentage}%</div>
        </div>
      )}

      {/* DISTRICT POPUP  ✅ RESTORED */}
      {selectedDistrict && (
  <div className="district-history-popup">
    <div className="popup-header">
      <h3>{selectedDistrict}</h3>
      <button onClick={() => setSelectedDistrict(null)}>✕</button>
    </div>

    {districtHistoryData ? (
      <>
        <div>Total Fires: {districtHistoryData.totalFires ?? 0}</div>
        <div>First Fire: {districtHistoryData.firstFireDate ?? "N/A"}</div>
        <div>Last Fire: {districtHistoryData.lastFireDate ?? "N/A"}</div>
      </>
    ) : (
      <div>Loading...</div>
    )}
  </div>
)}

    </div>
  );
};

export default FireMap;
