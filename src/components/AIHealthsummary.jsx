import React, { useEffect, useState } from "react";
import "./AIHealthSummary.css";

const AIHealthSummary = ({
  member,
  medicalReports = [],
  prescriptions = [],
  healthRecords = [],
}) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSummary = async () => {
    if (!member?.name) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/ai/health-overview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            member,
            medicalReports,
            prescriptions,
            healthRecords,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Unable to generate summary");
      }

      setSummary(data.summary);
    } catch (err) {
      console.error("AI Health Summary error:", err);
      setError("Unable to generate health summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSummary();
  }, [member]);

  return (
    <div className="ai-health-summary">
      <div className="ai-summary-header">
        <div>
          <h2>AI Health Summary</h2>
          <p>Your recent health information at a glance</p>
        </div>

        <span className="ai-badge">✦ AI</span>
      </div>

      {loading && (
        <div className="ai-summary-loading">
          <div className="loading-icon">✦</div>
          <strong>Analyzing health information...</strong>
          <p>Generating a personalized overview for {member?.name}.</p>
        </div>
      )}

      {error && !loading && (
        <div className="ai-summary-error">
          <span>⚠️</span>
          <div>
            <strong>Unable to generate summary</strong>
            <p>{error}</p>
            <button onClick={generateSummary}>Try Again</button>
          </div>
        </div>
      )}

      {summary && !loading && !error && (
        <div className="ai-generated-summary">
          <div className="summary-icon">✓</div>

          <div className="summary-content">
            <strong>AI Health Overview</strong>

            <div className="summary-text">
              {summary}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !summary && (
        <div className="ai-summary-empty">
          No health information is available for analysis yet.
        </div>
      )}

      <button
        className="view-insights-btn"
        onClick={generateSummary}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "↻ Refresh Health Summary"}
      </button>

      <p className="ai-disclaimer">
        AI-generated information is for general understanding only and does
        not replace professional medical advice.
      </p>
    </div>
  );
};

export default AIHealthSummary;