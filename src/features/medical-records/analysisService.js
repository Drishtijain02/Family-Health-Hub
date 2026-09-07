import { getMedicalRecordSignedUrl } from './medicalRecords'

const OCR_API_URL = import.meta.env.VITE_OCR_API_URL
const AI_API_URL = import.meta.env.VITE_AI_API_URL

export async function analyzeMedicalReport(report) {
  if (!report?.file_url) {
    throw new Error('This medical report does not have a file available for analysis.')
  }
  const signedUrl = await getMedicalRecordSignedUrl(report.file_url)
  const fileResponse = await fetch(signedUrl)

  if (!fileResponse.ok) {
    throw new Error('Unable to download the medical report for analysis.')
  }

  const blob = await fileResponse.blob()

  const file = new File(
    [blob],
    report.name || 'medical-report',
    {
      type: blob.type || 'application/octet-stream',
    }
  )

  const formData = new FormData()
  formData.append('file', file)

  const ocrResponse = await fetch(
    `${OCR_API_URL}/api/extract-text`,
    {
      method: 'POST',
      body: formData,
    }
  )

  const ocrData = await ocrResponse.json()

  if (!ocrResponse.ok || !ocrData.success) {
    throw new Error(
      ocrData.error || 'Unable to extract text from the medical report.'
    )
  }

  if (!ocrData.text?.trim()) {
    throw new Error('No readable text was found in the medical report.')
  }

  const aiResponse = await fetch(
    `${AI_API_URL}/api/ai/report-summary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportText: ocrData.text,
      }),
    }
  )

  const aiData = await aiResponse.json()

  if (!aiResponse.ok || !aiData.success) {
    throw new Error(
      aiData.error || 'Unable to generate the AI report analysis.'
    )
  }

  return {
    ...aiData.analysis,
    analyzed_at: new Date().toISOString(),
    report_id: report.id,
    report_name: report.name,
  }
}