function ReportAISummary({ analysis, loading, error }) {
  if (loading) {
    return (
      <div className="ai-summary-card">
        <div className="ai-summary-header">
          <div>
            <span className="ai-label">AI ANALYSIS</span>
            <h2>Analyzing Medical Report</h2>
            <p>Please wait while the report is being analyzed.</p>
          </div>
        </div>

        <div className="ai-loading">
          <div className="ai-loader"></div>
          <p>Reading report and identifying important findings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-summary-card">
        <div className="ai-error">
          <h3>Analysis Failed</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="ai-summary-card">
        <div className="ai-empty">
          <span className="ai-label">AI HEALTH ANALYSIS</span>
          <h2>No Analysis Available</h2>
          <p>
            Upload or select a medical report to generate an AI-powered
            summary and explanation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-summary-wrapper">

      <div className="ai-summary-card">
        <div className="ai-summary-header">
          <div>
            <span className="ai-label">AI HEALTH ANALYSIS</span>
            <h2>Medical Report Summary</h2>
            <p>
              An easy-to-understand interpretation of the available
              report information.
            </p>
          </div>

          <div className="ai-badge">
            AI Generated
          </div>
        </div>

        <div className="summary-section">
          <h3>Overall Summary</h3>

          <p className="summary-text">
            {analysis.summary ||
              "No overall summary was generated for this report."}
          </p>
        </div>
      </div>


      {analysis.abnormal_parameters?.length > 0 && (
        <div className="ai-summary-card attention-card">

          <div className="section-heading">
            <div>
              <span className="section-label">IMPORTANT</span>
              <h3>Values That May Need Attention</h3>
            </div>

            <span className="attention-count">
              {analysis.abnormal_parameters.length}
            </span>
          </div>

          <div className="abnormal-list">
            {analysis.abnormal_parameters.map((item, index) => (
              <div className="abnormal-item" key={index}>

                <div className="abnormal-top">
                  <strong>{item.name}</strong>

                  <span className="abnormal-value">
                    {item.value}
                  </span>
                </div>

                <div className="abnormal-details">
                  <span>
                    Reference:{" "}
                    {item.reference_range || "Not provided"}
                  </span>
                </div>

                <p>
                  {item.reason ||
                    "This value appears outside the reference range provided in the report."}
                </p>

              </div>
            ))}
          </div>
        </div>
      )}


      {analysis.explanation?.length > 0 && (
        <div className="ai-summary-card">

          <div className="section-heading">
            <div>
              <span className="section-label">INTERPRETATION</span>
              <h3>What Does This Mean?</h3>
            </div>
          </div>

          <div className="explanation-list">
            {analysis.explanation.map((item, index) => (
              <div className="explanation-item" key={index}>
                <span className="explanation-number">
                  {index + 1}
                </span>

                <p>{item}</p>
              </div>
            ))}
          </div>

        </div>
      )}


      {analysis.parameters?.length > 0 && (
        <div className="ai-summary-card">

          <div className="section-heading">
            <div>
              <span className="section-label">REPORT DATA</span>
              <h3>Parameter Details</h3>
            </div>
          </div>

          <div className="parameters-table-wrapper">
            <table className="parameters-table">

              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {analysis.parameters.map((parameter, index) => (

                  <tr key={index}>

                    <td className="parameter-name">
                      {parameter.name}
                    </td>

                    <td className="parameter-value">
                      {parameter.value}
                    </td>

                    <td>
                      {parameter.unit || "-"}
                    </td>

                    <td>
                      {parameter.reference_range || "-"}
                    </td>

                    <td>
                      <span
                        className={`status-pill ${
                          parameter.status || "unclear"
                        }`}
                      >
                        {parameter.status || "unclear"}
                      </span>
                    </td>

                  </tr>

                ))}
              </tbody>

            </table>
          </div>

        </div>
      )}


      {analysis.recommendations?.length > 0 && (
        <div className="ai-summary-card">

          <div className="section-heading">
            <div>
              <span className="section-label">NEXT STEPS</span>
              <h3>Recommendations</h3>
            </div>
          </div>

          <div className="recommendation-list">

            {analysis.recommendations.map((item, index) => (

              <div className="recommendation-item" key={index}>

                <span className="recommendation-icon">
                  ✓
                </span>

                <p>{item}</p>

              </div>

            ))}

          </div>

        </div>
      )}


      <div className="ai-disclaimer">

        <strong>Important:</strong>

        <span>
          This AI-generated analysis is for informational purposes
          only and is not a medical diagnosis. Results should be
          interpreted by a qualified healthcare professional in the
          context of the patient's symptoms and medical history.
        </span>

      </div>

    </div>
  );
}

export default ReportAISummary;