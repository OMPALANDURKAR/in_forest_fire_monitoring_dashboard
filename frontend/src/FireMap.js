import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";

/* ===============================
   DISTRICT NAME NORMALIZER
================================ */
const normalizeDistrict = (name) => {
  if (!name) return null;

  return name
    .toLowerCase()
    .replace(" district", "")
    .trim();
};

/* ===============================
   SAFELY EXTRACT DISTRICT NAME
   (THIS WAS THE MAIN ISSUE)
================================ */
const getDistrictName = (properties) => {
  return (
    properties.DISTRICT ||
    properties.district ||
    properties.NAME_3 ||
    properties.NAME_2 ||
    properties.dtname ||
    null
  );
};

const FireMap = () => {

  /* ===============================
     STATE VARIABLES
  ================================ */
  const [fires, setFires] = useState([]);
  const [districtRisk, setDistrictRisk] = useState({});
  const [districtGeo, setDistrictGeo] = useState(null);

  const [summary, setSummary] = useState({
    High: 0,
    Medium: 0,
    Low: 0
  });

  /* ===============================
     FETCH FIRE POINTS
  ================================ */
  useEffect(() => {
    fetch("http://localhost:5000/api/fires")
      .then(res => res.json())
      .then(data => setFires(data))
      .catch(err => console.error("Fire fetch error:", err));
  }, []);

  /* ===============================
     FETCH DISTRICT DATA
  ================================ */
  useEffect(() => {
    fetch("http://localhost:5000/api/district-risk")
      .then(res => res.json())
      .then(data => setDistrictRisk(data));

    fetch("http://localhost:5000/api/districts")
      .then(res => res.json())
      .then(data => setDistrictGeo(data));
  }, []);

  /* ===============================
     COMPUTE RISK SUMMARY
  ================================ */
  useEffect(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };

    Object.values(districtRisk).forEach(d => {
      if (d.risk === "High") counts.High++;
      else if (d.risk === "Medium") counts.Medium++;
      else if (d.risk === "Low") counts.Low++;
    });

    setSummary(counts);
  }, [districtRisk]);

  /* ===============================
     DISTRICT STYLE FUNCTION
  ================================ */
  const getDistrictStyle = (feature) => {
    const rawName = getDistrictName(feature.properties);
    const districtKey = normalizeDistrict(rawName);
    const info = districtRisk[districtKey];

    if (!info) {
      return {
        fillOpacity: 0,
        weight: 0
      };
    }

    let color = "green";
    if (info.risk === "High") color = "red";
    else if (info.risk === "Medium") color = "orange";

    return {
      fillColor: color,
      fillOpacity: 0.6,
      color: "#333",
      weight: 1
    };
  };

  /* ===============================
     FIRE POINT COLOR
  ================================ */
  const getFireColor = (brightness) => {
    if (brightness > 350) return "red";
    if (brightness >= 300) return "orange";
    return "green";
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <>
      {/* 🔥 FIRE RISK SUMMARY */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          zIndex: 1000
        }}
      >
        <h4>Fire Risk Summary</h4>
        <p style={{ color: "red" }}>High Risk: {summary.High}</p>
        <p style={{ color: "orange" }}>Medium Risk: {summary.Medium}</p>
        <p style={{ color: "green" }}>Low Risk: {summary.Low}</p>
      </div>

      <MapContainer
        center={[22.5937, 78.9629]}
        zoom={5}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🟢🟡🔴 DISTRICT LAYER */}
        {districtGeo && (
          <GeoJSON
            data={districtGeo}
            style={getDistrictStyle}
            onEachFeature={(feature, layer) => {
              const rawName = getDistrictName(feature.properties);
              const districtKey = normalizeDistrict(rawName);
              const info = districtRisk[districtKey];

              if (info) {
                layer.bindPopup(`
                  <b>District:</b> ${rawName}<br/>
                  <b>State:</b> ${info.state}<br/>
                  <b>Fire Count:</b> ${info.fire_count}<br/>
                  <b>Risk:</b> ${info.risk}
                `);
              }
            }}
          />
        )}

        {/* 🔥 FIRE POINT MARKERS */}
        {fires.map((fire, index) => {
          const lat = Number(fire.latitude);
          const lon = Number(fire.longitude);
          const brightness = Number(fire.brightness);

          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <CircleMarker
              key={index}
              center={[lat, lon]}
              radius={5}
              pathOptions={{
                color: getFireColor(brightness),
                fillColor: getFireColor(brightness),
                fillOpacity: 0.7
              }}
            >
              <Popup>
                <b>Date:</b> {fire.acq_date}<br />
                <b>Brightness:</b> {brightness}<br />
                <b>Confidence:</b> {fire.confidence}<br />
                <b>District:</b> {fire.district}<br />
                <b>State:</b> {fire.state}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </>
  );
};

export default FireMap;
