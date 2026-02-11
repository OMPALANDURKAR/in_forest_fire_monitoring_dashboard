import { useEffect, useState } from "react";

/* ===============================
   BACKEND BASE URL
================================ */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://in-forest-fire-monitoring-dashboard.onrender.com";

/* ===============================
   ANALYTICS PANEL (DYNAMIC)
================================ */
const Analytics = ({ selectedState, popupDistrict }) => {
  const [summary, setSummary] = useState({
    total: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  });

  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  const [title, setTitle] = useState("Near Real-Time Fire Overview");

  /* ===============================
     FETCH BASED ON CONTEXT
  ================================ */
  useEffect(() => {
    let cancelled = false;

    let endpoint = `${API_BASE}/api/fires-realtime`;
    let contextTitle = "India - Near Real-Time Fire Overview";

    if (selectedState) {
      endpoint = `${API_BASE}/api/fires-realtime/state/${selectedState}`;
      contextTitle = `${selectedState} - Near Real-Time Overview`;
    }

    if (popupDistrict) {
      endpoint = `${API_BASE}/api/fires-realtime/district/${popupDistrict}`;
      contextTitle = `${popupDistrict} - Near Real-Time Overview`;
    }

    setTitle(contextTitle);

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data) || cancelled) return;

        const s = { total: 0, High: 0, Medium: 0, Low: 0 };

        data.forEach(f => {
          s.total++;

          if (f.confidence === "h") s.High++;
          else if (f.confidence === "n") s.Medium++;
          else s.Low++;
        });

        setSummary(s);

        if (data.length) {
          const latest = data.reduce((a, b) =>
            `${a.acq_date}${a.acq_time}` >
            `${b.acq_date}${b.acq_time}`
              ? a
              : b
          );

          setLastUpdated(latest.acq_date);
          setLastUpdatedTime(latest.acq_time);
        } else {
          setLastUpdated(null);
          setLastUpdatedTime(null);
        }
      })
      .catch(() => {
        setSummary({ total: 0, High: 0, Medium: 0, Low: 0 });
        setLastUpdated(null);
        setLastUpdatedTime(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedState, popupDistrict]);

  /* ===============================
     RENDER
  ================================ */
  return (
    <section className="analytics-section">

      {/* HEADER */}
      <div className="analytics-header">
        <h2>{title}</h2>

        {lastUpdated && (
          <div className="subtext">
            Last satellite update: {lastUpdated} {lastUpdatedTime}
          </div>
        )}
      </div>

      {/* SUMMARY CARDS */}
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

      {/* DONUT CHART */}
      <div className="fire-chart-card">
        <h3 className="chart-title">Fire Severity Distribution</h3>

        <div
          className="donut-chart animate"
          style={{
            "--high": summary.High,
            "--medium": summary.Medium,
            "--low": summary.Low,
            "--total": summary.total || 1
          }}
        />

        <div className="chart-legend">
          <div><span className="dot high" /> High</div>
          <div><span className="dot medium" /> Medium</div>
          <div><span className="dot low" /> Low</div>
        </div>
      </div>

    </section>
  );
};

export default Analytics;
