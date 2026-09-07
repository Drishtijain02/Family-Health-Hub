import { useState } from "react";
import "./AIHealthSummary.css";

export default function AIHealthSummary({
  member,
  medicalReports = [],
  prescriptions = [],
  healthRecords = [],
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSummary = async () => {
    if (!member) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_AI_API_URL}/api/ai/health-overview`,
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

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate health summary");
      }

      setSummary(data.summary);
    } catch (err) {
      console.error("Health summary error:", err);
      setError(err.message || "Failed to generate health summary");
    } finally {
      setLoading(false);
    }
  };

  if (!member) {
    return null;
  }

  return (
    <div className="ai-health-summary">
      <div className="ai-health-summary-header">
        <div>
          <span className="ai-health-summary-label">AI HEALTH SUMMARY</span>
          <h3>{member.name}'s Health Overview</h3>
        </div>

        <button
          type="button"
          className="ai-summary-generate-btn"
          onClick={generateSummary}
          disabled={loading}
        >
          {loading ? "Analyzing..." : summary ? "Regenerate" : "Generate Health Summary"}
        </button>
      </div>

      {error && (
        <div className="ai-summary-error">
          {error}
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="ai-summary-empty">
          <p>
            Generate a short AI-powered overview using this member's available
            health information.
          </p>
        </div>
      )}

      {loading && (
        <div className="ai-summary-loading">
          <span>Analyzing health information...</span>
        </div>
      )}

      {summary && !loading && (
        <div className="ai-summary-content">
          <div className="ai-summary-status">
            <span className="ai-summary-status-label">Overall status</span>
            <strong>{summary.overall_status || "Informational"}</strong>
          </div>

          {summary.overall_summary && (
            <p className="ai-summary-overview">
              {summary.overall_summary}
            </p>
          )}

          {Array.isArray(summary.key_stats) &&
            summary.key_stats.length > 0 && (
              <div className="ai-summary-section">
                <h4>Quick stats</h4>

                <div className="ai-summary-stats">
                  {summary.key_stats.map((stat, index) => (
                    <div className="ai-summary-stat" key={index}>
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {Array.isArray(summary.attention_items) &&
            summary.attention_items.length > 0 && (
              <div className="ai-summary-section">
                <h4>Keep an eye on</h4>

                <ul>
                  {summary.attention_items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

          {Array.isArray(summary.positive_findings) &&
            summary.positive_findings.length > 0 && (
              <div className="ai-summary-section">
                <h4>Good to know</h4>

                <ul>
                  {summary.positive_findings.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

          <p className="ai-summary-disclaimer">
            AI-generated information is for general guidance only and should
            not replace professional medical advice.
          </p>
        </div>
      )}
    </div>
  );
}