import React from "react";

const AIHealthSummary = () => {
  return (
    <div className="ai-health-summary">
      <div className="ai-summary-header">
        <div>
          <h2>AI Health Summary</h2>
          <p>Your recent health information at a glance</p>
        </div>
        <span className="ai-badge">✦ AI</span>
      </div>

      <div className="health-status">
        <div className="status-icon">✓</div>
        <div>
          <span>Overall Health Status</span>
          <h3>Generally Stable</h3>
        </div>
      </div>

      <div className="summary-text">
        Your recent medical reports appear generally stable.
        A few values may require attention and should be discussed
        with your healthcare provider.
      </div>

      <div className="health-insights">
        <div className="insight normal">
          <span className="insight-icon">✓</span>
          <div>
            <strong>Within Range</strong>
            <p>Most recent parameters</p>
          </div>
        </div>

        <div className="insight attention">
          <span className="insight-icon">!</span>
          <div>
            <strong>Needs Attention</strong>
            <p>2 parameters</p>
          </div>
        </div>
      </div>

      <button className="view-insights-btn">
        View Health Insights →
      </button>
    </div>
  );
};

export default AIHealthSummary;