import { useEffect, useState } from "react";

const Analytics = () => {
  const [summary, setSummary] = useState({
    total: 0,
    High: 0,
    Medium: 0,
    Low: 0
  });

  /* ===============================
     FETCH DISTRICT RISK SUMMARY
  ================================ */
  useEffect(() => {
    fetch("http://localhost:5000/api/district-risk")
      .then(res => res.json())
      .then(data => {
        const counts = { total: 0, High: 0, Medium: 0, Low: 0 };

        Object.values(data).forEach(d => {
          counts.total++;
          if (d.risk === "High") counts.High++;
          else if (d.risk === "Medium") counts.Medium++;
          else if (d.risk === "Low") counts.Low++;
        });

        setSummary(counts);
      })
      .catch(err => console.error("Analytics fetch error:", err));
  }, []);

  /* ===============================
     BAR HEIGHTS
  ================================ */
  const highPct = summary.total ? (summary.High / summary.total) * 100 : 0;
  const mediumPct = summary.total ? (summary.Medium / summary.total) * 100 : 0;
  const lowPct = summary.total ? (summary.Low / summary.total) * 100 : 0;

  return (
    <section className="analytics-section">

      {/* 🔢 STAT CARDS */}
      <div className="analytics-grid">

        <div className="stat-card">
          <div className="stat-label">Total Districts</div>
          <div className="stat-value">{summary.total}</div>
          <div className="stat-icon total">📊</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">High Risk</div>
          <div className="stat-value">{summary.High}</div>
          <div className="stat-icon high">🔥</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Medium Risk</div>
          <div className="stat-value">{summary.Medium}</div>
          <div className="stat-icon medium">⚠️</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Low Risk</div>
          <div className="stat-value">{summary.Low}</div>
          <div className="stat-icon low">✅</div>
        </div>

      </div>

      {/* 📊 BAR CHART */}
      <div className="chart-container">
        <div className="chart-title">Risk Distribution</div>

        <div className="bar-chart">

          <div className="bar-item">
            <div className="bar">
              <div
                className="bar-fill high"
                style={{ height: `${highPct}%` }}
              />
            </div>
            <div className="bar-value">{summary.High}</div>
            <div className="bar-label">High</div>
          </div>

          <div className="bar-item">
            <div className="bar">
              <div
                className="bar-fill medium"
                style={{ height: `${mediumPct}%` }}
              />
            </div>
            <div className="bar-value">{summary.Medium}</div>
            <div className="bar-label">Medium</div>
          </div>

          <div className="bar-item">
            <div className="bar">
              <div
                className="bar-fill low"
                style={{ height: `${lowPct}%` }}
              />
            </div>
            <div className="bar-value">{summary.Low}</div>
            <div className="bar-label">Low</div>
          </div>

        </div>
      </div>

    </section>
  );
};

export default Analytics;
