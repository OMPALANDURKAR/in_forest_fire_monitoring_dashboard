import { useEffect, useMemo, useState } from "react";

/* ===============================
   NEAR REAL-TIME ANALYTICS PANEL
   (DECISION SNAPSHOT)
================================ */
const Analytics = ({ selectedDistrict }) => {
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ BACKEND BASE URL (FROM VERCEL ENV)
  const API_BASE = process.env.REACT_APP_API_URL;

  /* ===============================
     FETCH FIRMS DATA
  ================================ */
  useEffect(() => {
    setLoading(true);

    fetch(`${API_BASE}/api/fires-realtime`)
      .then(res => res.json())
      .then(data => {
        setFires(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Real-time fetch error:", err);
        setLoading(false);
      });
  }, [API_BASE]);

  /* ===============================
     FILTER BY SELECTED DISTRICT
  ================================ */
  const filteredFires = useMemo(() => {
    if (!selectedDistrict?.district) return fires;

    const target = selectedDistrict.district.toLowerCase();
    return fires.filter(
      f => f.district && f.district.toLowerCase() === target
    );
  }, [fires, selectedDistrict]);

  /* ===============================
     SUMMARY CALCULATION
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
     LAST SATELLITE UPDATE
  ================================ */
  const lastUpdated = useMemo(() => {
    if (!fires.length) return null;

    return fires.reduce(
      (latest, f) =>
        f.acq_date > latest ? f.acq_date : latest,
      fires[0].acq_date
    );
  }, [fires]);

  /* ===============================
     DAYS AGO
  ================================ */
  const daysAgo = lastUpdated
    ? Math.floor(
        (Date.now() - new Date(lastUpdated).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  /* ===============================
     RENDER
  ================================ */
  return (
    <section className="analytics-section">

      <div className="analytics-header">
        <h2>
          Near Real-Time Fire Overview
          {selectedDistrict?.district && (
            <span className="district-tag">
              {selectedDistrict.district}
            </span>
          )}
        </h2>

        {lastUpdated && (
          <div className="subtext">
            Last satellite update: {lastUpdated}
            {daysAgo > 0 &&
              ` (${daysAgo} day${daysAgo > 1 ? "s" : ""} ago)`}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">
          Loading satellite detections…
        </div>
      ) : filteredFires.length === 0 ? (
        <div className="empty">
          {selectedDistrict
            ? "No active fires detected in this district"
            : "No active fires detected nationwide"}
        </div>
      ) : (
        <>
          <div className="analytics-grid">

            <div className="stat-card">
              <div className="stat-label">Active Fires</div>
              <div className="stat-value">{summary.total}</div>
            </div>

            <div className="stat-card risk-high">
              <div className="stat-label">High Risk</div>
              <div className="stat-value">{summary.High}</div>
            </div>

            <div className="stat-card risk-medium">
              <div className="stat-label">Medium Risk</div>
              <div className="stat-value">{summary.Medium}</div>
            </div>

            <div className="stat-card risk-low">
              <div className="stat-label">Low Risk</div>
              <div className="stat-value">{summary.Low}</div>
            </div>

          </div>

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
