import { useEffect, useMemo, useState } from "react";

/* ===============================
   BACKEND BASE URL
================================ */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://in-forest-fire-monitoring-dashboard.onrender.com";

/* ===============================
   ANALYTICS PANEL (FIXED)
================================ */
const Analytics = ({ selectedDistrict, searchDistrict }) => {
  const [summary, setSummary] = useState({
    total: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  });

  const [lastUpdated, setLastUpdated] = useState(null);

  /* ===============================
     ACTIVE DISTRICT (SINGLE SOURCE)
  ================================ */
  const activeDistrict = useMemo(() => {
    return selectedDistrict?.district || searchDistrict || null;
  }, [selectedDistrict, searchDistrict]);

  /* ===============================
     FETCH REAL-TIME DATA (FIXED)
  ================================ */
  useEffect(() => {
    if (!activeDistrict) {
      // Reset when no district is selected
      setSummary({ total: 0, High: 0, Medium: 0, Low: 0 });
      setLastUpdated(null);
      return;
    }

    fetch(
      `${API_BASE}/api/realtime/${activeDistrict.toLowerCase()}`
    )
      .then(res => res.json())
      .then(data => {
        const total = data.activeFires || 0;

        // Simple severity split (UI-level logic)
        const High = total > 50 ? total : 0;
        const Medium = total > 10 && total <= 50 ? total : 0;
        const Low = total <= 10 ? total : 0;

        setSummary({
          total,
          High,
          Medium,
          Low,
        });

        setLastUpdated(data.lastUpdated || null);
      })
      .catch(() => {
        setSummary({ total: 0, High: 0, Medium: 0, Low: 0 });
        setLastUpdated(null);
      });
  }, [activeDistrict]);

  /* ===============================
     RENDER
  ================================ */
  return (
    <section className="analytics-section">
      {/* ===============================
         SECTION 5 — OVERVIEW
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
         SECTION 6 — DISTRICT STATUS
      ================================ */}
      <div className="district-status-box">
        {!activeDistrict ? (
          <div className="empty muted">
            Select a district to view real-time fire status
          </div>
        ) : (
          <div
            className={`status-card ${
              summary.total > 0 ? "danger" : "safe"
            }`}
          >
            <div className="status-title">{activeDistrict}</div>
            <div className="status-value">
              {summary.total > 0
                ? `${summary.total} active fire(s) detected`
                : "No active forest fire cases"}
            </div>
            {lastUpdated && (
              <div className="status-sub">
                Last updated: {lastUpdated}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Analytics;
