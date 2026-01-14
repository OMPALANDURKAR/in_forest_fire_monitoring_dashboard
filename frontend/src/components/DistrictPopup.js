import { Popup } from "react-leaflet";

const DistrictPopup = ({ district, position, onClose }) => {
  if (!district || !position) return null;

  return (
    <Popup position={position} closeButton={false} autoPan>
      <div className="district-popup-content">
        <button className="close-btn" onClick={onClose}>✖</button>

        {/* HEADER */}
        <h3>{district.district}</h3>
        <p className="state">{district.state}</p>

        {/* FIRE DETECTION SUMMARY */}
        <div className="popup-section">
          <strong>Fire Detection Summary</strong>
          <div>
            <strong>Data Source:</strong> Historical Data
          </div>
          <div>
            <strong>Detection Method:</strong> Thermal anomaly analysis
          </div>
        </div>

        {/* CURRENT STATUS */}
        <div className="popup-section">
          
          <div>
            <strong>Active Fire Detections:</strong> {district.fireCount}
          </div>
          <div>
            <strong>Risk Level:</strong>{" "}
            <span
              style={{
                fontWeight: "600",
                color:
                  district.risk === "High"
                    ? "#dc2626"
                    : district.risk === "Medium"
                    ? "#f59e0b"
                    : "#16a34a"
              }}
            >
              {district.risk}
            </span>
          </div>
        </div>

        {/* CONTEXT NOTE */}
        <div className="popup-section note">
          <strong>Note</strong>
          <p>
            This assessment is based solely on observed historical fire
            events. No AI-based or future fire prediction is included.
          </p>
        </div>
      </div>
    </Popup>
  );
};

export default DistrictPopup;
