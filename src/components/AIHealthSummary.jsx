import { useState } from "react";
import "./AIHealthSummary.css";

const EMPTY_ARRAY = [];

const API_URL = "http://localhost:5000";

function SectionIcon({ type }) {
  const icons = {
    overview: "✦",
    observation: "⌁",
    attention: "⚠",
    positive: "✓",
    explain: "◈",
    doctor: "＋",
  };

  return (
    <span className={`ai-summary-section-icon ${type}`}>
      {icons[type] || "•"}
    </span>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="ai-summary-info-card">
      <div className="ai-summary-info-icon">{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value || "Not available"}</strong>
      </div>
    </div>
  );
}

function BulletList({ items, emptyText }) {
  if (!items || items.length === 0) {
    return (
      <p className="ai-summary-empty-text">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="ai-summary-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AIHealthSummary({
  member,
  medicalReports = EMPTY_ARRAY,
  prescriptions = EMPTY_ARRAY,
  healthRecords = EMPTY_ARRAY,
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSummary = async () => {
    if (!member?.id && !member?.name) {
      setError("Please select a family member first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/ai/health-overview`,
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
        throw new Error(
          data.error ||
            "Unable to generate health overview."
        );
      }

      let parsedSummary = data.summary;

      if (typeof parsedSummary === "string") {
        try {
          const cleaned = parsedSummary
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

          parsedSummary = JSON.parse(cleaned);
        } catch {
          parsedSummary = {
            overall_status: "Informational",
            overall_summary: parsedSummary,
            key_stats: [],
            recent_observations: [],
            attention_items: [],
            positive_findings: [],
            possible_explanations: "",
            doctor_questions: [],
          };
        }
      }

      setSummary(parsedSummary);
    } catch (err) {
      console.error(
        "AI health summary error:",
        err
      );

      setError(
        err.message ||
          "Unable to generate the health overview."
      );
    } finally {
      setLoading(false);
    }
  };

  const status =
    summary?.overall_status ||
    "Informational";

  const statusClass =
    status.toLowerCase().includes("attention") ||
    status.toLowerCase().includes("concern")
      ? "attention"
      : status.toLowerCase().includes("good") ||
        status.toLowerCase().includes("stable")
        ? "good"
        : "informational";

  return (
    <div className="ai-summary">

      {/* HEADER */}
      <div className="ai-summary-header">
        <div>
          <div className="ai-summary-title-row">
            <h2>AI Health Summary</h2>

            <span className="ai-summary-ai-badge">
              ✦ AI
            </span>
          </div>

          <p>
            Get a quick AI-powered overview of{" "}
            <strong>
              {member?.name || "this family member"}
            </strong>
          </p>
        </div>

        {summary && (
          <button
            type="button"
            className="ai-summary-refresh"
            onClick={generateSummary}
            disabled={loading}
            title="Regenerate summary"
          >
            {loading ? "…" : "↻"}
          </button>
        )}
      </div>

      {/* BEFORE GENERATION */}
      {!loading && !summary && !error && (
        <div className="ai-summary-generate-card">

          <div className="ai-summary-generate-icon">
            ✦
          </div>

          <div className="ai-summary-generate-content">
            <h3>
              Understand your health at a glance
            </h3>

            <p>
              Generate an AI summary using the available
              medical records and health information.
            </p>

            <span className="ai-summary-token-note">
              AI analysis runs only when you request it.
            </span>

            <button
              type="button"
              className="ai-summary-generate-button"
              onClick={generateSummary}
              disabled={!member}
            >
              <span>✦</span>
              Generate Health Summary
            </button>
          </div>

        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="ai-summary-state">

          <div className="ai-summary-spinner" />

          <div>
            <strong>
              Analyzing health information
            </strong>

            <p>
              Reviewing the available records…
            </p>
          </div>

        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="ai-summary-error">

          <div className="ai-summary-error-icon">
            !
          </div>

          <div>
            <strong>
              Unable to generate summary
            </strong>

            <p>{error}</p>

            <button
              type="button"
              onClick={generateSummary}
              className="ai-summary-retry"
            >
              Try again
            </button>
          </div>

        </div>
      )}

      {/* GENERATED SUMMARY */}
{!loading && !error && summary && (
  <div className="ai-summary-content">

    {/* OVERALL */}
    <section className="ai-summary-overall">
      <div className="ai-summary-overall-icon">
        {statusClass === "attention" ? "!" : "✓"}
      </div>

      <div className="ai-summary-overall-content">
        <div className="ai-summary-overall-top">
          <span>Overall health status</span>

          <span className={`ai-summary-status ${statusClass}`}>
            {status}
          </span>
        </div>

        <p>
          {summary.overall_summary}
        </p>
      </div>
    </section>

    {/* QUICK INSIGHTS */}
    {summary.key_stats?.length > 0 && (
      <section className="ai-summary-section">
        <div className="ai-summary-section-heading">
          <SectionIcon type="overview" />
          <h3>Quick insights</h3>
        </div>

        <div className="ai-summary-info-grid">
          {summary.key_stats
            .slice(0, 3)
            .map((stat, index) => (
              <InfoCard
                key={`${stat.label}-${index}`}
                label={stat.label}
                value={stat.value}
                icon={["🩸", "💊", "📄"][index] || "•"}
              />
            ))}
        </div>
      </section>
    )}

    {/* ATTENTION */}
    {summary.attention_items?.length > 0 && (
      <section className="ai-summary-section">
        <div className="ai-summary-section-heading">
          <SectionIcon type="attention" />
          <h3>Keep an eye on</h3>
        </div>

        <div className="ai-summary-attention-list">
          {summary.attention_items
            .slice(0, 2)
            .map((item, index) => (
              <div
                className="ai-summary-attention-item"
                key={`${item}-${index}`}
              >
                <span>!</span>
                <p>{item}</p>
              </div>
            ))}
        </div>
      </section>
    )}

    {/* POSITIVE */}
    {summary.positive_findings?.length > 0 && (
      <section className="ai-summary-section">
        <div className="ai-summary-section-heading">
          <SectionIcon type="positive" />
          <h3>Good to know</h3>
        </div>

        <BulletList
          items={summary.positive_findings.slice(0, 2)}
          emptyText=""
        />
      </section>
    )}

    {/* DISCLAIMER */}
    <div className="ai-summary-disclaimer">
      <span>ⓘ</span>

      <p>
        <strong>AI information.</strong>{" "}
        For informational purposes only — not a diagnosis.
      </p>
    </div>

  </div> 
 )} </div>)}

