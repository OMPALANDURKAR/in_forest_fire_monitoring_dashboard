const SidebarFilters = ({
  searchDistrict,
  setSearchDistrict,
  riskFilter,
  setRiskFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo
}) => {

  return (
    <aside className="sidebar">

      {/* =========================
         DISTRICT SEARCH
      ========================= */}
      <h3>Search & Filters</h3>

      <label>Search District</label>
      <input
  type="text"
  value={searchDistrict}
  onChange={(e) => setSearchDistrict(e.target.value)}
  placeholder="Search district"
/>
      {/* =========================
         RISK FILTERS
      ========================= */}
      <label>Risk Level</label>

      <div className="risk-filters">

        <div className="risk-item">
          <input
  type="checkbox"
  checked={riskFilter.high}
  onChange={() =>
    setRiskFilter(prev => ({ ...prev, high: !prev.high }))
  }
/>
          <span className="risk-dot risk-high" />
          <span>High</span>
        </div>

        <div className="risk-item">
          <input
  type="checkbox"
  checked={riskFilter.medium}
  onChange={() =>
    setRiskFilter(prev => ({ ...prev, medium: !prev.medium }))
  }
/>
          <span className="risk-dot risk-medium" />
          <span>Medium</span>
        </div>

        <div className="risk-item">
          <input
  type="checkbox"
  checked={riskFilter.low}
  onChange={() =>
    setRiskFilter(prev => ({ ...prev, low: !prev.low }))
  }
/>
          <span className="risk-dot risk-low" />
          <span>Low</span>
        </div>

      </div>

      {/* =========================
         DATE FILTERS
      ========================= */}
      <label>Date From</label>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
      />

      <label>Date To</label>
      <input
  type="date"
  value={dateFrom}
  onChange={(e) => setDateFrom(e.target.value)}
/>
<input
  type="date"
  value={dateTo}
  onChange={(e) => setDateTo(e.target.value)}
/>
    </aside>
  );
};

export default SidebarFilters;
