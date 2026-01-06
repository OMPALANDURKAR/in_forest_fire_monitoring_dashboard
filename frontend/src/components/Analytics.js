import { useEffect, useMemo, useState } from "react";

/* ===============================
   REAL-TIME ANALYTICS PANEL
================================ */
const Analytics = ({ selectedDistrict }) => {
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     FETCH REAL-TIME FIRMS DATA
  ================================ */
  useEffect(() => {
    setLoading(true);

    fetch("http://localhost:5000/api/fires-realtime")
      .then(res => res.json())
      .then(data => {
        setFires(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Real-time fetch error:", err);
        setLoading(false);
      });
  }, []);

  /* ===============================
     FILTER BY SELECTED DISTRICT
  ================================ */
  const filteredFires = useMemo(() => {
    if (!selectedDistrict?.district) return fires;

    const target = selectedDistrict.district.toLowerCase();

    return fires.filter(
      f =>
        f.district &&
        f.district.toLowerCase() === target
    );
  }, [fires, selectedDistrict]);

  /* ===============================
     LIVE SUMMARY
  ================================ */
  const summary = useMemo(() => {
    const s = { total: 0, High: 0, Medium: 0, Low: 0 };

    filteredFires.forEach(f => {
      s.total++;
      if (f.brightness > 350) s.High++;
      else if (f.brightness >= 300) s.Medium++;
      else s.Low++;
    });

    return s;
  }, [filteredFires]);

  /* ===============================
     RENDER
  ================================ */
  return (
    <section className="analytics-section">

      <div className="chart-title">
        🔥 Live Forest Fire Activity
        {selectedDistrict?.district && (
          <span className="district-tag">
            {selectedDistrict.district}
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading">
          Loading real-time data…
        </div>
      ) : filteredFires.length === 0 ? (
        <div className="empty">
          {selectedDistrict
            ? "No active fires detected in this district"
            : "No active fires detected"}
        </div>
      ) : (
        <>
          {/* 🔢 LIVE STATS */}
          <div className="analytics-grid">

            <div className="stat-card">
              <div className="stat-label">Active Fires</div>
              <div className="stat-value">{summary.total}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">High</div>
              <div className="stat-value">{summary.High}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Medium</div>
              <div className="stat-value">{summary.Medium}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Low</div>
              <div className="stat-value">{summary.Low}</div>
            </div>

          </div>

          {/* 📍 LIVE FIRE LIST */}
          <div className="fire-list">
            {filteredFires.slice(0, 15).map((f, idx) => (
              <div key={idx} className="fire-item">

                <div className={`fire-risk ${getRiskClass(f.brightness)}`}>
                  {getRiskLabel(f.brightness)}
                </div>

                <div className="fire-details">
                  <div><strong>Lat:</strong> {f.latitude}</div>
                  <div><strong>Lon:</strong> {f.longitude}</div>
                  <div><strong>Date:</strong> {f.acq_date}</div>
                  <div><strong>Time:</strong> {f.acq_time}</div>
                </div>

              </div>
            ))}
          </div>
        </>
      )}

    </section>
  );
};

/* ===============================
   HELPERS
================================ */
const getRiskLabel = (brightness) => {
  if (brightness > 350) return "High";
  if (brightness >= 300) return "Medium";
  return "Low";
};

const getRiskClass = (brightness) => {
  if (brightness > 350) return "risk-high";
  if (brightness >= 300) return "risk-medium";
  return "risk-low";
};

export default Analytics;
