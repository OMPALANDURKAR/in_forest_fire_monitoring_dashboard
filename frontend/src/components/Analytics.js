import { useEffect, useMemo, useState } from "react";

/* ===============================
   BACKEND BASE URL
================================ */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://in-forest-fire-monitoring-dashboard.onrender.com";

/* ===============================
   ANALYTICS PANEL (STABLE & FAST)
================================ */
const Analytics = ({ selectedDistrict, searchDistrict }) => {
  const [summary, setSummary] = useState({
    total: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  });

  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  /* ===============================
     ACTIVE DISTRICT (SINGLE SOURCE)
  ================================ */
  const activeDistrict = useMemo(() => {
    return selectedDistrict?.district || searchDistrict || null;
  }, [selectedDistrict, searchDistrict]);

  /* ===============================
     FETCH NRT SUMMARY (ONCE ONLY)
     → SECTION 5 DATA
  ================================ */
  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/api/fires-realtime`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data) || cancelled) return;

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

    return () => {
      cancelled = true;
    };
  }, []);

  /* ===============================
     RENDER
  ================================ */
  return (
    <section className="analytics-section">
      {/* ===============================
         SECTION 5 — SUMMARY (UNCHANGED)
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
         SECTION 6 — STATUS ONLY (SAFE)
      ================================ */}
      <div className="district-status-box">
        {!activeDistrict && (
          <div className="empty muted">
            Select a district to view real-time fire status
          </div>
        )}

        {activeDistrict && (
          <div className="status-card safe">
            <div className="status-title">{activeDistrict}</div>
            <div className="status-value">
              No active forest fire cases
            </div>
            <div className="status-sub">
              Last updated: {lastUpdated} {lastUpdatedTime}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Analytics;
