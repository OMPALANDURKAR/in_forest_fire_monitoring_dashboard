import { useEffect, useState } from "react";
import { Popup } from "react-leaflet";

const DistrictPopup = ({ district, position, onClose }) => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ BACKEND BASE URL (FROM ENV)
  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!district?.district || !API_BASE) return;

    setLoading(true);

    fetch(
      `${API_BASE}/api/ai/predict/${district.district.toLowerCase()}`
    )
      .then(res => res.json())
      .then(data => {
        setAiData(data.aiPrediction || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("AI fetch error:", err);
        setLoading(false);
      });
  }, [district, API_BASE]);

  if (!district || !position) return null;

  return (
    <Popup position={position} closeButton={false}>
      <div className="district-popup-content">
        <button className="close-btn" onClick={onClose}>✖</button>

        <h3>{district.district}</h3>
        <p className="state">{district.state}</p>

        {/* HISTORICAL SUMMARY */}
        <div className="popup-section">
          <strong>Historical Summary</strong>
          <div>Total Fires: {district.fireCount}</div>
          <div>Current Risk: {district.risk}</div>
        </div>

        {/* AI SECTION */}
        <div className="popup-section">
          <strong>AI Prediction</strong>

          {loading ? (
            <div>Analyzing historical data…</div>
          ) : aiData ? (
            <>
              <div>
                Predicted Risk: <b>{aiData.predictedRisk}</b>
              </div>
              <div>Trend: {aiData.trend}</div>
              <div>Alert: {aiData.alert ? "Yes" : "No"}</div>
              <p className="explanation">{aiData.explanation}</p>
            </>
          ) : (
            <div>AI data unavailable</div>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default DistrictPopup;
