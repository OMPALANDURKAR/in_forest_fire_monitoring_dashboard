const SidebarFilters = ({
  searchDistrict,
  setSearchDistrict,
  riskFilter,
  setRiskFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  realtimeInfo,
  futureRisk,
  loadingRealtime,
  loadingFuture
}) => {
  return (
    <aside className="sidebar">

      <h3>Search & Filters</h3>

      {/* =========================
         SEARCH
      ========================= */}
      <div className="filter-section">
        <label className="filter-label">Search District</label>
        <input
          type="text"
          placeholder="Type district name"
          value={searchDistrict}
          onChange={(e) => setSearchDistrict(e.target.value)}
        />
      </div>

      {/* =========================
         RISK FILTER
      ========================= */}
      <div className="filter-section">
        <label className="filter-label">Risk Level</label>

        <div className="risk-filters">
          {["high", "medium", "low"].map(level => (
            <label key={level} className="risk-item">
              <input
                type="checkbox"
                checked={riskFilter[level]}
                onChange={() =>
                  setRiskFilter(prev => ({
                    ...prev,
                    [level]: !prev[level]
                  }))
                }
              />
              <span className={`risk-dot risk-${level}`} />
              <span>{level.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>

      {/* =========================
         DATE RANGE
      ========================= */}
      <div className="filter-section">
        <label className="filter-label">Date Range</label>
        <div className="date-group">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* =========================
         REAL-TIME FIRE STATUS
      ========================= */}
      <div className="sidebar-card">
        <h4>Real-Time Fire Status</h4>

        {!searchDistrict ? (
          <p className="muted">Search a district to view status</p>
        ) : loadingRealtime ? (
          <p className="muted">Fetching real-time fire data…</p>
        ) : realtimeInfo ? (
          <>
            <p>
              <strong>Active Fires:</strong> {realtimeInfo.count}
            </p>
            <p>
              <strong>Status:</strong> {realtimeInfo.status}
            </p>
          </>
        ) : (
          <p className="success">No risk of forest fire</p>
        )}
      </div>

      {/* =========================
         FUTURE RISK PREDICTION
      ========================= */}
      <div className="sidebar-card">
        <h4>Future Risk Prediction</h4>

        {!searchDistrict ? (
          <p className="muted">Search a district to view prediction</p>
        ) : loadingFuture ? (
          <p className="muted">Analyzing historical trends…</p>
        ) : futureRisk ? (
          <>
            <p className="risk-percent">
              {futureRisk.percentage}%
            </p>
            <p>
              <strong>Risk Level:</strong> {futureRisk.level}
            </p>
            <p className="explanation">
              {futureRisk.reason}
            </p>
          </>
        ) : (
          <p className="muted">Prediction unavailable</p>
        )}
      </div>

    </aside>
  );
};

export default SidebarFilters;
