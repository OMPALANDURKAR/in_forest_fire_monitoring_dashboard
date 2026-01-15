import { useEffect, useState } from "react";

/* ===============================
   BACKEND BASE URL
================================ */
const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://in-forest-fire-monitoring-dashboard.onrender.com";

/* ===============================
   ANALYTICS PANEL (FIRMS NRT – FINAL)
================================ */
const Analytics = () => {
  const [summary, setSummary] = useState({
    total: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  });

  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  /* ===============================
     FETCH FIRMS NRT DATA (ONLY SOURCE)
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
  }, []);

  /* ===============================
     RENDER
  ================================ */
  return (
    <section className="analytics-section">
      {/* HEADER */}
      <div className="analytics-header">
        <h2>Near Real-Time Fire Overview</h2>
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

      {/* ===============================
         FIRE SEVERITY DISTRIBUTION (EYE CATCHY)
      ================================ */}
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
