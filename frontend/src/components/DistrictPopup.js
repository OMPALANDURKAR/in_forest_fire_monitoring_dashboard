import { Popup } from "react-leaflet";

/* ==================================================
   DISTRICT POPUP (SUPPLEMENTARY)
   - Historical context only
   - Not used as primary popup
   - Modal popup in FireMap.js is authoritative
================================================== */

const DistrictPopup = ({ district, position, onClose }) => {
  if (!district || !position) return null;

  return (
    <Popup position={position} closeButton={false} autoPan>
      <div className="district-popup-content">

        {/* CLOSE */}
        <button className="close-btn" onClick={onClose}>✖</button>

        {/* HEADER */}
        <h3>{district.district}</h3>
        {district.state && (
          <p className="state">{district.state}</p>
        )}

        {/* DATA SOURCE */}
        <div className="popup-section">
          <strong>Data Source</strong>
          <div>NASA FIRMS – Historical Records</div>
          <div>Thermal anomaly based fire detection</div>
        </div>

        {/* HISTORICAL SUMMARY */}
        <div className="popup-section">
          <strong>Historical Fire Summary</strong>
          <div>
            <strong>Total Recorded Fires:</strong>{" "}
            {district.fireCount ?? "Not Available"}
          </div>
        </div>

        {/* RISK CONTEXT (NON-AI) */}
        {district.risk && (
          <div className="popup-section">
            <strong>Historical Risk Category</strong>
            <div>
              <span
                style={{
                  fontWeight: 600,
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
        )}

        {/* CONTEXT NOTE */}
        <div className="popup-section note">
          <strong>Context</strong>
          <p>
            This popup presents a quick summary of historical fire
            occurrences for the selected district. Detailed analysis
            and AI-based risk assessment are available in the dashboard
            panels.
          </p>
        </div>

      </div>
    </Popup>
  );
};

export default DistrictPopup;
