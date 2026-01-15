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
         REAL-TIME STATUS
      ========================= */}
      <div className="sidebar-block status-block">
        <h4 className="block-title">Real-Time Status</h4>

        {!searchDistrict ? (
          <p className="muted">Select a district</p>
        ) : loadingRealtime ? (
          <p className="muted">Checking FIRMS data…</p>
        ) : realtimeInfo?.count > 0 ? (
          <>
            <div className="status-pill danger">
              🔴 Active Fires Detected
            </div>
            <p className="status-text">
              {realtimeInfo.count} active fire(s)
            </p>
          </>
        ) : (
          <div className="status-pill safe">
            🟢 No Active Fire Risk
          </div>
        )}
      </div>

      {/* =========================
         AI RISK OUTLOOK
      ========================= */}
      <div className="sidebar-block ai-block">
        <h4 className="block-title">AI Risk Outlook</h4>

        {!searchDistrict ? (
          <p className="muted">Search district to view risk</p>
        ) : loadingFuture ? (
          <p className="muted">Analyzing trends…</p>
        ) : futureRisk ? (
          <>
            <div className="risk-meter">
              <div
                className={`risk-fill ${futureRisk.level?.toLowerCase() || ""}`}
                style={{ width: `${futureRisk.percentage || 0}%` }}
              />
            </div>

            <div className="risk-summary">
              <span className="risk-value">
                {futureRisk.percentage || 0}%
              </span>
              <span className="risk-label">
                {futureRisk.level || "Unknown"} Risk
              </span>
            </div>

            <p className="ai-reason">
              {futureRisk.reason || "No explanation available"}
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
