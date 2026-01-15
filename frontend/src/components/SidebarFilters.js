const SidebarFilters = ({
  searchDistrict = "",
  setSearchDistrict,
  realtimeInfo,
  futureRisk,
  loadingRealtime = false,
  loadingFuture = false
}) => {
  return (
    <aside className="sidebar">

      {/* =========================
         DISTRICT SEARCH
      ========================= */}
      <div className="sidebar-block">
        <h4 className="block-title">District</h4>
        <input
          type="text"
          placeholder="Search district"
          value={searchDistrict}
          onChange={e => setSearchDistrict(e.target.value)}
        />
      </div>

      {/* =========================
         REAL-TIME STATUS (FIRMS)
      ========================= */}
      <div className="sidebar-block status-block">
        <h4 className="block-title">Real-Time Status</h4>

        {!searchDistrict ? (
          <p className="muted">Select a district</p>
        ) : loadingRealtime ? (
          <p className="muted">Checking FIRMS data…</p>
        ) : realtimeInfo?.activeFires > 0 ? (
          <>
            <div className="status-pill danger">
              🔴 Active Fires Detected
            </div>
            <p className="status-text">
              {realtimeInfo.activeFires} active fire(s) reported
            </p>
            <small className="muted">
              Source: NASA FIRMS (Near Real-Time)
            </small>
          </>
        ) : (
          <div className="status-pill safe">
            🟢 No Active Fires Detected
          </div>
        )}
      </div>

      {/* =========================
         AI RISK OUTLOOK (LOGIC-BASED)
      ========================= */}
      <div className="sidebar-block ai-block">
        <h4 className="block-title">AI Risk Outlook</h4>

        {!searchDistrict ? (
          <p className="muted">Search a district to view risk</p>
        ) : loadingFuture ? (
          <p className="muted">Analyzing historical trends…</p>
        ) : futureRisk ? (
          <>
            {/* RISK BAR */}
            <div className="risk-meter">
              <div
                className={`risk-fill ${futureRisk.riskLevel?.toLowerCase()}`}
                style={{ width: `${futureRisk.riskPercentage || 0}%` }}
              />
            </div>

            {/* RISK SUMMARY */}
            <div className="risk-summary">
              <span className="risk-value">
                {futureRisk.riskPercentage || 0}%
              </span>
              <span className="risk-label">
                {futureRisk.riskLevel || "Unknown"} Risk
              </span>
            </div>

            {/* EXPLANATION */}
            <p className="ai-reason">
              {futureRisk.logic ||
                "Risk derived from historical fire frequency"}
            </p>
          </>
        ) : (
          <p className="muted">Risk data unavailable</p>
        )}
      </div>

    </aside>
  );
};

export default SidebarFilters;
