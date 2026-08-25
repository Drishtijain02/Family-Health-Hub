import { useState } from "react";

function ReportAISummary() {
  const [reportText, setReportText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSummary = async () => {
    if (!reportText.trim()) {
      setError("Please enter your medical report details first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

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

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate analysis");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>AI Report Analysis</h2>

      <p>
        Enter the details from your medical report to get a
        simple, easy-to-understand explanation.
      </p>

      <textarea
        value={reportText}
        onChange={(e) => setReportText(e.target.value)}
        placeholder="Paste medical report details here..."
        rows={10}
      />

      <br />

      <button onClick={generateSummary} disabled={loading}>
        {loading ? "Analyzing..." : "Generate AI Analysis"}
      </button>

      {error && (
        <p>
          <strong>Error:</strong> {error}
        </p>
      )}

      {analysis && (
        <div>
          <h3>Overall Summary</h3>
          <p>{analysis.summary}</p>

          {analysis.parameters?.length > 0 && (
            <div>
              <h3>Report Parameters</h3>

              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {analysis.parameters.map((parameter, index) => (
                    <tr key={index}>
                      <td>{parameter.name}</td>
                      <td>{parameter.value}</td>
                      <td>{parameter.unit || "-"}</td>
                      <td>{parameter.reference_range || "-"}</td>
                      <td>{parameter.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {analysis.abnormal_parameters?.length > 0 && (
            <div>
              <h3>Values That May Need Attention</h3>

              {analysis.abnormal_parameters.map((item, index) => (
                <div key={index}>
                  <strong>{item.name}</strong>

                  <p>
                    Value: {item.value}
                  </p>

                  <p>
                    Reference Range:{" "}
                    {item.reference_range || "Not provided"}
                  </p>

                  <p>
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {analysis.explanation?.length > 0 && (
            <div>
              <h3>What It Generally Means</h3>

              <ul>
                {analysis.explanation.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations?.length > 0 && (
            <div>
              <h3>Questions / Recommendations</h3>

              <ul>
                {analysis.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <small>
            This AI-generated analysis is for informational purposes only
            and is not a medical diagnosis. Please consult a qualified
            healthcare professional for medical advice.
          </small>
        </div>
      )}
    </div>
  );
}

export default ReportAISummary;