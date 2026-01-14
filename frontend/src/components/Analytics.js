import { useEffect, useMemo, useState } from "react";

/* ===============================
   BACKEND BASE URL
================================ */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://in-forest-fire-monitoring-dashboard.onrender.com";

/* ===============================
   ANALYTICS PANEL
================================ */
const Analytics = ({ selectedDistrict, searchDistrict }) => {
  const [fires, setFires] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  });

  const [districtStatus, setDistrictStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);
  const [loadingDistrict, setLoadingDistrict] = useState(false);

  /* ===============================
     ACTIVE DISTRICT (🔑 SINGLE SOURCE)
  ================================ */
  const activeDistrict = useMemo(() => {
    return selectedDistrict?.district || searchDistrict || null;
  }, [selectedDistrict, searchDistrict]);

  const hasSearch = Boolean(activeDistrict);

  /* ===============================
     FETCH NRT DATA (ONCE)
     → SECTION 5 + DEFAULT SECTION 6
  ================================ */
  useEffect(() => {
    fetch(`${API_BASE}/api/fires-realtime`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;

        setFires(data);

        const s = { total: 0, High: 0, Medium: 0, Low: 0 };

        data.forEach(f => {
          s.total++;
          if (f.brightness > 350) s.High++;
          else if (f.brightness >= 300) s.Medium++;
          else s.Low++;
        });

        setSummary(s);

        if (data.length) {
          const latest = data.reduce(
            (a, b) => (a.acq_date > b.acq_date ? a : b)
          );
          setLastUpdated(latest.acq_date);
          setLastUpdatedTime(latest.acq_time);
        }
      })
      .catch(() => {});
  }, []);

  /* ===============================
     FETCH DISTRICT STATUS
     → WHEN SEARCH OR MAP SELECTION
  ================================ */
  useEffect(() => {
    if (!activeDistrict) {
      setDistrictStatus(null);
      return;
    }

    setLoadingDistrict(true);

    fetch(`${API_BASE}/api/realtime/${activeDistrict.toLowerCase()}`)
      .then(res => res.json())
      .then(data => {
        setDistrictStatus(data);
        setLoadingDistrict(false);
      })
      .catch(() => {
        setDistrictStatus(null);
        setLoadingDistrict(false);
      });
  }, [activeDistrict]);

  /* ===============================
     RENDER
  ================================ */
  return (
    <section className="analytics-section">
      {/* ===============================
         SECTION 5 — UNCHANGED
      ================================ */}
      <div className="analytics-header">
        <h2>Near Real-Time Fire Overview</h2>
        {lastUpdated && (
          <div className="subtext">
            Last satellite update: {lastUpdated}
          </div>
        )}
      </div>

      <div className="analytics-grid">
        <div className="stat-card">
          <div className="stat-label">Active Fires</div>
          <div className="stat-value">{summary.total}</div>
        </div>

        <div className="stat-card risk-high">
          <div className="stat-label">High</div>
          <div className="stat-value">{summary.High}</div>
        </div>

        <div className="stat-card risk-medium">
          <div className="stat-label">Medium</div>
          <div className="stat-value">{summary.Medium}</div>
        </div>

        <div className="stat-card risk-low">
          <div className="stat-label">Low</div>
          <div className="stat-value">{summary.Low}</div>
        </div>
      </div>

      {/* ===============================
         SECTION 6 — FINAL DUAL MODE
      ================================ */}
      <div className="fire-list scrollable">
        {/* 🟢 NO SEARCH → SCROLLING FEED */}
        {!hasSearch &&
          fires.map((f, idx) => (
            <div key={idx} className="fire-item">
              <div className={`fire-risk ${getRiskClass(f.brightness)}`}>
                {getRiskLabel(f.brightness)}
              </div>

              <div className="fire-details">
                <div><strong>Date:</strong> {f.acq_date}</div>
                <div><strong>Time:</strong> {f.acq_time}</div>
              </div>
            </div>
          ))}

        {/* 🔵 SEARCH → DISTRICT STATUS CARD */}
        {hasSearch && (
          <>
            {loadingDistrict ? (
              <div className="loading">
                Fetching district fire status…
              </div>
            ) : districtStatus ? (
              <div className="fire-item">
                <div className="fire-risk risk-high">Active</div>
                <div className="fire-details">
                  <div><strong>District:</strong> {activeDistrict}</div>
                  <div>
                    <strong>Active Forest Fire Cases:</strong>{" "}
                    {districtStatus.count}
                  </div>
                  <div><strong>Status:</strong> Active</div>
                  <div>
                    <strong>Last updated scan:</strong>{" "}
                    {lastUpdated} {lastUpdatedTime}
                  </div>
                </div>
              </div>
            ) : (
              <div className="fire-item">
                <div className="fire-risk risk-low">Safe</div>
                <div className="fire-details">
                  <div>
                    {activeDistrict} district does not have any active
                    forest fire cases
                  </div>
                  <div className="muted">
                    (Last updated scan on {lastUpdated} {lastUpdatedTime})
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

/* ===============================
   HELPERS
================================ */
const getRiskLabel = b =>
  b > 350 ? "High" : b >= 300 ? "Medium" : "Low";

const getRiskClass = b =>
  b > 350 ? "risk-high" : b >= 300 ? "risk-medium" : "risk-low";

export default Analytics;
