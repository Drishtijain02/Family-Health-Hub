/**
 * TEMPORARY MOCK ANALYSIS SERVICE
 *
 * This is a placeholder for the Aug 25-26 milestone.
 * It simulates AI analysis of medical reports with mock data.
 *
 * FUTURE INTEGRATION (Aug 31):
 * Replace the analyzeMedicalReport() function with the real OCR → AI pipeline.
 * The real implementation will be provided by teammates handling OCR and AI logic.
 *
 * DO NOT use this file to design the real API contract.
 * This is purely a temporary mock for frontend development.
 */

/**
 * Mock analysis function.
 * Simulates async processing and returns structured mock results.
 *
 * @param {Object} report - The medical report object
 * @returns {Promise<Object>} - Mock analysis result
 */
export async function analyzeMedicalReport(report) {
  // Simulate processing delay (mock async work)
  await new Promise((resolve) => setTimeout(resolve, 2800))

  // Randomly simulate occasional errors (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Mock analysis service temporarily unavailable. Please try again.')
  }

  // Return mock analysis based on report type
  return generateMockAnalysis(report)
}

/**
 * Generate mock analysis data for UI testing.
 * Different results based on report type for variety.
 */
function generateMockAnalysis(report) {
  const mockResultsByType = {
    'Blood test': {
      summary: 'The report shows a low Vitamin D level.',
      abnormal_parameters: [
        {
          name: 'Vitamin D',
          value: '18 ng/mL',
          status: 'Low',
          reference_range: '30-100 ng/mL',
        },
      ],
      explanation:
        'The reported Vitamin D value of 18 ng/mL is below the typical reference range (30-100 ng/mL). This finding is informational only.',
      recommendations: [
        'Discuss this result with a qualified healthcare professional.',
        'Your doctor may recommend vitamin D supplementation.',
        'Consider dietary sources and safe sun exposure as advised.',
      ],
    },
    'Lab report': {
      summary: 'All measured parameters appear within typical reference ranges.',
      abnormal_parameters: [],
      explanation:
        'The laboratory test results show measured values within the reference ranges provided in the report. This is an informational summary only.',
      recommendations: [
        'Continue routine health monitoring as advised by your healthcare provider.',
        'Maintain a healthy lifestyle with balanced nutrition and regular activity.',
      ],
    },
    Cardiology: {
      summary: 'ECG shows normal sinus rhythm.',
      abnormal_parameters: [],
      explanation:
        'The electrocardiogram demonstrates regular rhythm with no obvious acute abnormalities in this informational review.',
      recommendations: [
        'Discuss the complete findings with your cardiologist.',
        'Continue any prescribed medications as directed.',
        'Follow up as scheduled with your healthcare provider.',
      ],
    },
    Imaging: {
      summary: 'No acute abnormalities noted in this informational review.',
      abnormal_parameters: [],
      explanation:
        'The imaging study shows no obvious acute findings in this preliminary informational analysis. Detailed radiological interpretation by a specialist is recommended.',
      recommendations: [
        'Consult with your referring physician for professional interpretation.',
        'Follow any additional imaging or tests recommended by your doctor.',
      ],
    },
  }

  // Select mock result based on report type, fallback to generic
  const mockData = mockResultsByType[report.type] || {
    summary: 'Medical report reviewed for informational purposes.',
    abnormal_parameters: [],
    explanation:
      'This is an informational summary based on the uploaded medical report. It is not a medical diagnosis or professional medical advice.',
    recommendations: [
      'Discuss these findings with your healthcare provider.',
      'Keep this report for your medical records.',
    ],
  }

  return {
    ...mockData,
    analyzed_at: new Date().toISOString(),
    report_id: report.id,
    report_name: report.name,
  }
}
