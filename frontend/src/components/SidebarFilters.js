const SidebarFilters = ({
  searchDistrict = "",
  setSearchDistrict,
  realtimeInfo,
  futureRisk,
  loadingRealtime = false,
  loadingFuture = false,
  selectedType = "district" // "district" or "state"
}) => {
  const regionLabel =
    selectedType === "state" ? "State" : "District";

  return (
    <aside className="sidebar">

      {/* =========================
         SEARCH (DISTRICT / STATE)
      ========================= */}
      <div className="sidebar-block">
        <h4 className="block-title">Search Region</h4>
        <input
          type="text"
          placeholder="Search district or state"
          value={searchDistrict}
          onChange={e => setSearchDistrict(e.target.value)}
        />
      </div>

      {/* =========================
         REAL-TIME STATUS
      ========================= */}
      <div className="sidebar-block status-block">
        <h4 className="block-title">
          Real-Time Status ({regionLabel})
        </h4>

        {!searchDistrict ? (
          <p className="muted">
            Select a district or state
          </p>
        ) : loadingRealtime ? (
          <p className="muted">
            Checking FIRMS near-real-time data…
          </p>
        ) : realtimeInfo?.activeFires > 0 ? (
          <>
            <div className="status-pill danger">
              🔴 Active Fires Detected
            </div>

            <p className="status-text">
              {realtimeInfo.activeFires} active fire(s)
              reported in this {regionLabel.toLowerCase()}
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
         AI RISK OUTLOOK
      ========================= */}
      <div className="sidebar-block ai-block">
        <h4 className="block-title">
          AI Risk Outlook ({regionLabel})
        </h4>

        {!searchDistrict ? (
          <p className="muted">
            Search a region to view risk outlook
          </p>
        ) : loadingFuture ? (
          <p className="muted">
            Analyzing historical patterns…
          </p>
        ) : futureRisk ? (
          <>
            <div className="risk-meter">
              <div
                className={`risk-fill ${futureRisk.riskLevel?.toLowerCase()}`}
                style={{
                  width: `${futureRisk.riskPercentage || 0}%`
                }}
              />
            </div>

            <div className="risk-summary">
              <span className="risk-value">
                {futureRisk.riskPercentage || 0}%
              </span>
              <span className="risk-label">
                {futureRisk.riskLevel || "Unknown"} Risk
              </span>
            </div>

            <p className="ai-reason">
              {futureRisk.logic ||
                `Risk derived from historical fire frequency and recent trends in this ${regionLabel.toLowerCase()}.`}
            </p>
          </>
        ) : (
          <p className="muted">
            Risk data unavailable
          </p>
        )}
      </div>

    </aside>
  );
};

export default SidebarFilters;
