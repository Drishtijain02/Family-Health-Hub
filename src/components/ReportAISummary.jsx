import { useState } from "react";

function ReportAISummary() {
  const [reportText, setReportText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSummary = async () => {
    if (!reportText.trim()) {
      setError("Please enter your medical report details first.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/ai/report-summary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reportText: reportText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>AI Report Summary</h2>

      <p>
        Enter the details from your medical report to get a simple,
        easy-to-understand explanation.
      </p>

      <textarea
        value={reportText}
        onChange={(e) => setReportText(e.target.value)}
        placeholder="Paste medical report details here..."
        rows={10}
      />

      <br />

      <button onClick={generateSummary} disabled={loading}>
        {loading ? "Analyzing..." : "Generate AI Summary"}
      </button>

      {error && (
        <p>
          <strong>Error:</strong> {error}
        </p>
      )}

      {summary && (
        <div>
          <h3>AI Summary</h3>
          <p>{summary}</p>

          <small>
            This AI-generated summary is for informational purposes only and
            is not a medical diagnosis. Please consult a qualified doctor for
            medical advice.
          </small>
        </div>
      )}
    </div>
  );
}

export default ReportAISummary;