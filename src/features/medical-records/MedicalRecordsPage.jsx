import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteMedicalRecord,
  fetchMedicalRecords,
  getMedicalRecordSignedUrl,
  uploadMedicalRecord,
  updateMedicalRecord,
} from './medicalRecords'
import { analyzeMedicalReport } from './analysisService'
import './MedicalRecordsPage.css'

const mockReports = [
  { id: 1, name: 'CBC Blood Report', date: 'Feb 24, 2025', status: 'Analyzed', type: 'Blood test', uploadedBy: 'Sunita Sharma' },
  { id: 2, name: 'Thyroid Test Report', date: 'Feb 18, 2025', status: 'Analyzed', type: 'Lab report', uploadedBy: 'Sunita Sharma' },
  { id: 3, name: 'Vitamin D Test Report', date: 'Feb 10, 2025', status: 'Analyzed', type: 'Blood test', uploadedBy: 'Sunita Sharma' },
  { id: 4, name: 'ECG Report', date: 'Feb 05, 2025', status: 'Analyzed', type: 'Cardiology', uploadedBy: 'Sunita Sharma' },
  { id: 5, name: 'Liver Function Test', date: 'Jan 28, 2025', status: 'Analyzed', type: 'Lab report', uploadedBy: 'Sunita Sharma' },
  { id: 6, name: 'Lipid Profile', date: 'Jan 20, 2025', status: 'Analyzed', type: 'Blood test', uploadedBy: 'Sunita Sharma' },
  { id: 7, name: 'X-Ray Chest', date: 'Jan 12, 2025', status: 'Pending', type: 'Imaging', uploadedBy: 'Sunita Sharma' },
  { id: 8, name: 'Urine Routine Test', date: 'Jan 05, 2025', status: 'Analyzed', type: 'Lab report', uploadedBy: 'Sunita Sharma' },
]

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <path d="m14 6-6 6 6 6M8 12h12" />,
    spark: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    filter: <path d="M4 6h16M7 12h10m-7 6h4" />,
    sort: <><path d="M8 6v12M5 9l3-3 3 3M16 18V6m-3 9 3 3 3-3" /></>,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M5 14v5h14v-5" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    document: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  }

  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name="document" size={25} /></div>
      <h3>No Medical Reports Yet</h3>
      <p>Upload your first medical report to get started.</p>
    </div>
  )
}

function ReportPreview({ report }) {
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadFile() {
      if (!report?.file_url) {
        setFileUrl('')
        setFileType('')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const url = await getMedicalRecordSignedUrl(report.file_url)
        let detectedType = ''

        try {
          const response = await fetch(url, { method: 'HEAD' })
          detectedType = response.headers.get('content-type') || ''
        } catch (error) {
          console.warn('Unable to detect file type:', error)
        }

        if (active) {
          setFileUrl(url)
          setFileType(detectedType)
          setLoading(false)
        }
      } catch (error) {
        console.error('Unable to load report:', error)
        if (active) {
          setFileUrl('')
          setFileType('')
          setLoading(false)
        }
      }
    }

    void loadFile()
    return () => { active = false }
  }, [report])

  if (!report) {
    return <div className="report-preview"><p>No report selected.</p></div>
  }

  const fileName = report.name || report.title || 'Medical Report'
  const reportDate = report.date || report.record_date || 'Date not available'
  const reportType = report.type || report.record_type || report.category || 'Medical Report'
  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'

  return (
    <div className="report-preview">
      <div className="preview-brand">
        <span className="preview-mark">+</span>
        <div>
          <strong>Family Health Hub</strong>
          <small>Medical Report</small>
        </div>
      </div>

      <div className="preview-heading">
        <div>
          <p>{reportType}</p>
          <h3>{fileName}</h3>
        </div>
        <span>Available</span>
      </div>

      <div className="preview-patient">
        <div><small>Report name</small><strong>{fileName}</strong></div>
        <div><small>Report type</small><strong>{reportType}</strong></div>
        <div><small>Uploaded / recorded on</small><strong>{reportDate}</strong></div>
      </div>

      <div className="real-report-viewer">
        {loading && <div className="report-loading">Loading your uploaded report...</div>}

        {!loading && fileUrl && isImage && (
          <img src={fileUrl} alt={fileName} className="uploaded-report-image" />
        )}

        {!loading && fileUrl && isPdf && (
          <iframe src={fileUrl} title={fileName} className="uploaded-report-frame" />
        )}

        {!loading && fileUrl && !isImage && !isPdf && (
          <div className="report-loading">
            This file type cannot be previewed directly.
            <br />Please open the original report.
          </div>
        )}

        {!loading && !fileUrl && (
          <div className="report-loading">
            {report.isRealRecord
              ? 'Unable to display this report. Use Open private report from the actions menu.'
              : 'This is a demo report preview.'}
          </div>
        )}
      </div>

      <p className="preview-note">
        This is the original report uploaded to Family Health Hub.
        Results should be interpreted by a qualified healthcare professional alongside the patient's medical history.
      </p>
    </div>
  )
}

function AiSummary({ report, analysisState, onAnalyze }) {
  const { status, data, error } = analysisState

  if (status === 'not-analyzed') {
    return (
      <div className="ai-summary-empty">
        <div className="summary-icon-large"><Icon name="spark" size={32} /></div>
        <h3>Understand Your Report</h3>
        <p>
          Get a simple explanation of your medical report, including important findings,
          medical terms, possible reasons and suggested next steps.
        </p>
        <button className="primary-button" onClick={() => onAnalyze(report)}>
          <Icon name="spark" /> Analyze Report with AI
        </button>
        <p className="ai-disclaimer">AI-generated information is for educational purposes only and is not a medical diagnosis.</p>
      </div>
    )
  }

  if (status === 'analyzing') {
    return (
      <div className="ai-summary-loading">
        <div className="loading-spinner" />
        <h3>Understanding Your Report...</h3>
        <p>We're reading the report and preparing a simple explanation for you.</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="ai-summary-error">
        <h3>Analysis Failed</h3>
        <p className="error-message">{error || 'Unable to analyze the report.'}</p>
        <button className="secondary-button" onClick={() => onAnalyze(report)}>Retry Analysis</button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="ai-summary">
      <div className="ai-summary-intro">
        <div className="summary-header">
          <span className="summary-icon"><Icon name="spark" /></span>
          <div>
            <span className="section-label">AI HEALTH SUMMARY</span>
            <h3>{data.overall_status}</h3>
          </div>
        </div>
        <p className="summary-text">{data.overall_summary}</p>
      </div>

      {data.key_findings?.length > 0 && (
        <section className="ai-section">
          <h4>What Stands Out?</h4>
          <div className="finding-list">
            {data.key_findings.map((finding, index) => (
              <div className="finding-card" key={index}>
                <div className="finding-header">
                  <strong>{finding.title}</strong>
                  {finding.value && <span className="finding-value">{finding.value}</span>}
                </div>
                {finding.reference_range && <div className="finding-reference">Reference range: {finding.reference_range}</div>}
                <p>{finding.explanation}</p>
                {finding.why_it_matters && (
                  <div className="why-it-matters">
                    <strong>Why this matters:</strong><span>{finding.why_it_matters}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.normal_findings?.length > 0 && (
        <section className="ai-section">
          <h4>What Looks Reassuring?</h4>
          <div className="normal-findings">
            {data.normal_findings.map((item, index) => (
              <div className="normal-finding" key={index}>
                <span className="normal-check">✓</span>
                <div>
                  <strong>{item.title}</strong>
                  {item.value && <span className="normal-value">{item.value}</span>}
                  <p>{item.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.medical_terms?.length > 0 && (
        <section className="ai-section">
          <h4>What Do These Medical Terms Mean?</h4>
          <div className="medical-terms">
            {data.medical_terms.map((item, index) => (
              <div className="medical-term" key={index}>
                <strong>{item.term}</strong>
                <p>{item.meaning}</p>
                {item.why_it_is_measured && (
                  <div><span>Why it is measured:</span> {item.why_it_is_measured}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.possible_explanations && (
        <section className="ai-section">
          <h4>What Could Explain These Findings?</h4>
          <div className="possible-explanations"><div className="explanation-card"><p>{data.possible_explanations}</p></div></div>
          <p className="ai-small-note">These are possible explanations only. The report alone cannot determine the underlying cause.</p>
        </section>
      )}

      {data.what_to_do_next?.length > 0 && (
        <section className="ai-section">
          <h4>What Should I Do Next?</h4>
          <div className="next-steps">
            {data.what_to_do_next.map((step, index) => (
              <div className="next-step" key={index}><span>{index + 1}</span><p>{step}</p></div>
            ))}
          </div>
        </section>
      )}

      {data.simple_takeaway && (
        <section className="ai-takeaway">
          <span className="section-label">IN SIMPLE WORDS</span>
          <h4>So, what should I understand?</h4>
          <p>{data.simple_takeaway}</p>
        </section>
      )}

      <div className="ai-disclaimer">
        <strong>Important:</strong>
        <span>This AI-generated explanation is for informational purposes only and is not a medical diagnosis. Always discuss medical results with a qualified healthcare professional.</span>
      </div>
    </div>
  )
}

function ChartView({ reports }) {
  const datedReports = reports
    .map((report) => {
      const rawDate = report.record_date || ''
      const date = rawDate ? new Date(`${rawDate}T00:00:00`) : null
      return date && !Number.isNaN(date.getTime()) ? { report, date } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date)

  const monthMap = new Map()
  datedReports.forEach(({ date }) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  })

  const points = [...monthMap.entries()].map(([key, count]) => {
    const [year, month] = key.split('-').map(Number)
    return {
      key,
      label: new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1)),
      count,
    }
  })

  const maxCount = Math.max(...points.map((point) => point.count), 1)
  const chartWidth = 680
  const chartHeight = 260
  const left = 48
  const right = 18
  const top = 22
  const bottom = 48
  const innerWidth = chartWidth - left - right
  const innerHeight = chartHeight - top - bottom
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0

  return (
    <div className="chart-view">
      <div className="chart-heading">
        <div>
          <p>Real report activity</p>
          <h3>Reports uploaded over time</h3>
        </div>
        <span className="chart-total">{reports.length} total</span>
      </div>

      {points.length ? (
        <div className="chart-card">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Medical reports uploaded over time">
            {[0, 0.5, 1].map((fraction) => {
              const y = top + innerHeight * (1 - fraction)
              return <line key={fraction} className="chart-grid" x1={left} y1={y} x2={chartWidth - right} y2={y} />
            })}

            {points.length > 1 && (
              <polyline
                className="chart-line"
                points={points.map((point, index) => {
                  const x = left + step * index
                  const y = top + innerHeight * (1 - point.count / maxCount)
                  return `${x},${y}`
                }).join(' ')}
              />
            )}

            {points.map((point, index) => {
              const x = points.length === 1 ? left + innerWidth / 2 : left + step * index
              const y = top + innerHeight * (1 - point.count / maxCount)
              return (
                <g key={point.key}>
                  <circle className="chart-point" cx={x} cy={y} r="5" />
                  <text className="chart-value" x={x} y={y - 12} textAnchor="middle">{point.count}</text>
                  <text className="chart-label" x={x} y={chartHeight - 16} textAnchor="middle">{point.label}</text>
                </g>
              )
            })}
          </svg>
        </div>
      ) : (
        <div className="chart-empty">
          <Icon name="document" size={24} />
          <strong>No dated reports yet</strong>
          <p>Add a record date to a report and it will appear here.</p>
        </div>
      )}

      <p className="chart-caption">Based only on the medical reports stored for {reports[0]?.uploadedBy || 'this family member'}. No medical measurements are inferred.</p>
    </div>
  )
}

function formatRecordDate(value) {
  if (!value) return 'Date not added'
  if (value === 'Today') return value
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function mapMedicalRecord(record, member) {
  return {
    ...record,
    name: record.title,
    date: formatRecordDate(record.record_date),
    status: 'Available',
    type: record.record_type || record.category || 'Medical report',
    uploadedBy: member.name,
    isRealRecord: true,
  }
}

function UploadModal({ onClose, onUpload, isRealDataMode, memberName }) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', recordType: '', category: '', date: '', description: '' })

  function setChosenFile(nextFile) {
    if (!nextFile) return
    const extension = nextFile.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
      setFile(null)
      setError('Please choose a PDF, JPG, JPEG, or PNG file.')
      setStatus('error')
      return
    }
    setFile(nextFile)
    setError('')
    setStatus('selected')
    setForm((current) => ({
      ...current,
      title: current.title || nextFile.name.replace(/\.[^/.]+$/, ''),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!file || !form.title.trim()) {
      setError(!file ? 'Choose a report before uploading.' : 'Add a report title before uploading.')
      setStatus('error')
      return
    }

    setStatus('uploading')
    setError('')

    try {
      await onUpload({
        file,
        title: form.title.trim(),
        recordType: form.recordType,
        category: form.category,
        recordDate: form.date,
        description: form.description,
      })
      setStatus('success')
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload this medical report.')
      setStatus('error')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close upload panel">
          <Icon name="close" />
        </button>

        <p className="eyebrow">Medical reports</p>
        <h2 id="upload-title">Upload Report</h2>
        <p className="modal-intro">
          Add a private medical report for {memberName || 'this family member'}.
        </p>

        {status === 'success' ? (
          <div className="upload-success">
            <span><Icon name="check" size={26} /></span>
            <h3>Report uploaded successfully</h3>
            <p>Your report has been added to the private medical record archive.</p>
            <button className="primary-button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className={`drop-zone ${isDragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => { event.preventDefault(); setIsDragging(false); setChosenFile(event.dataTransfer.files?.[0]) }}
            >
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setChosenFile(event.target.files?.[0])} />
              <span className="drop-icon"><Icon name="upload" /></span>
              {file ? (
                <span className="selected-file"><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</small></span>
              ) : (
                <span><strong>Drag & drop your report here</strong><small>or browse files from your device</small></span>
              )}
              <span className="browse-button">Browse files</span>
            </label>

            <p className="format-note">Supported formats: PDF, JPG, JPEG, PNG</p>
            {error && <p className="form-error">{error}</p>}

            <label>Report title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Annual blood test" />
            </label>

            <div className="modal-form-grid">
              <label>Record type
                <select value={form.recordType} onChange={(event) => setForm({ ...form, recordType: event.target.value })}>
                  <option value="">Select type</option>
                  <option>Lab Report</option><option>Imaging Report</option><option>Prescription</option><option>Consultation</option><option>Other</option>
                </select>
              </label>
              <label>Category
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. Blood work" />
              </label>
            </div>

            <label>Record date
              <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </label>

            <label>Description <span className="optional">Optional</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" placeholder="Add a short note about this report" />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button className="primary-button" type="submit" disabled={status === 'uploading'}>
                {status === 'uploading' ? 'Uploading…' : 'Upload report'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

function EditReportModal({ report, onClose, onSave, isSaving }) {
  const [form, setForm] = useState({
    title: report?.title || report?.name || '',
    recordType: report?.record_type || report?.type || '',
    category: report?.category || '',
    date: report?.record_date || '',
    description: report?.description || '',
  })
  const [error, setError] = useState('')

  if (!report) return null

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Report title is required.')
      return
    }
    setError('')
    try {
      await onSave({
        title: form.title.trim(),
        recordType: form.recordType,
        category: form.category,
        recordDate: form.date,
        description: form.description,
      })
    } catch (saveError) {
      setError(saveError.message || 'Unable to update this report.')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-report-title">
        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close edit panel">
          <Icon name="close" />
        </button>
        <p className="eyebrow">Medical report</p>
        <h2 id="edit-report-title">Edit report</h2>
        <p className="modal-intro">Update the report details. The uploaded file itself will remain unchanged.</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Report title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus />
          </label>

          <div className="modal-form-grid">
            <label>Record type
              <select value={form.recordType} onChange={(event) => setForm({ ...form, recordType: event.target.value })}>
                <option value="">Select type</option>
                <option>Lab Report</option>
                <option>Imaging Report</option>
                <option>Prescription</option>
                <option>Consultation</option>
                <option>Other</option>
              </select>
            </label>
            <label>Category
              <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. Blood work" />
            </label>
          </div>

          <label>Record date
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>

          <label>Description <span className="optional">Optional</span>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="4" />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function MedicalRecordsPage({
  selectedMember,
  onRecordsChanged,
}) {
  const [reports, setReports] = useState([])
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [activeTab, setActiveTab] = useState('Report')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [recordsError, setRecordsError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [reportAnalysis, setReportAnalysis] = useState({})
  const [reportItemMenuOpen, setReportItemMenuOpen] = useState(null)
  const [editingReport, setEditingReport] = useState(null)
  const [isSavingReport, setIsSavingReport] = useState(false)

  const isRealDataMode = Boolean(selectedMember)
  const selectedReport = reports.find((report) => report.id === selectedReportId)

  const getAnalysisState = useCallback((reportId) => (
    reportAnalysis[reportId] || { status: 'not-analyzed', data: null, error: null }
  ), [reportAnalysis])

  const getReportDisplayStatus = useCallback((report) => {
    const analysisState = getAnalysisState(report.id)

    if (analysisState.status === 'analyzing') return { label: 'Analyzing', className: 'analyzing' }
    if (analysisState.status === 'analyzed') return { label: 'Analyzed', className: 'analyzed' }

    return {
      label: report.isRealRecord ? 'Available' : 'Pending',
      className: report.isRealRecord ? 'available' : 'pending',
    }
  }, [getAnalysisState])

  const visibleReports = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = reports.filter((report) => {
      const matchesSearch = !query || report.name.toLowerCase().includes(query)
      if (!matchesSearch) return false

      if (filter === 'All') return true
      return getReportDisplayStatus(report).label === filter
    })

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name)
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name)
      if (sortOrder === 'oldest') {
        return new Date(a.record_date || '1970-01-01') - new Date(b.record_date || '1970-01-01')
      }
      if (sortOrder === 'type') return (a.type || '').localeCompare(b.type || '')
      return new Date(b.record_date || '1970-01-01') - new Date(a.record_date || '1970-01-01')
    })
  }, [filter, reports, search, getReportDisplayStatus, sortOrder])
  const loadRealRecords = useCallback(async (member) => {
    if (!member) return

    setIsLoadingRecords(true)
    setRecordsError('')
    setActionError('')

    try {
      const data = await fetchMedicalRecords(member.id)
      const mapped = data.map((record) => mapMedicalRecord(record, member))
      setReports(mapped)
      setSelectedReportId(mapped[0]?.id || null)
      setActiveTab('Report')
    } catch (loadError) {
      setReports([])
      setSelectedReportId(null)
      setRecordsError(loadError.message || 'Unable to load medical reports.')
    } finally {
      setIsLoadingRecords(false)
    }
  }, [])

  useEffect(() => {
    setReportItemMenuOpen(null)
    setIsActionMenuOpen(false)
    setActiveTab('Report')
    setSearch('')
    setFilter('All')
    setSortOrder('newest')
    setEditingReport(null)

    if (selectedMember) {
      void loadRealRecords(selectedMember)
    } else {
      setReports(mockReports)
      setSelectedReportId(mockReports[0]?.id || null)
      setRecordsError('')
      setActionError('')
    }
  }, [selectedMember, loadRealRecords])

  async function handleRealUpload(details) {
    if (!selectedMember) return
    await uploadMedicalRecord({
      familyMemberId: selectedMember.id,
      ...details,
    })
    await loadRealRecords(selectedMember)
  }

  async function handleOpenReport() {
    if (!selectedReport?.isRealRecord) return

    setActionError('')

    try {
      const signedUrl = await getMedicalRecordSignedUrl(selectedReport.file_url)
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    } catch (openError) {
      setActionError(openError.message || 'Unable to open this medical report.')
    } finally {
      setIsActionMenuOpen(false)
    }
  }

  async function handleDeleteReport(reportToDelete = selectedReport) {
    if (
      !reportToDelete?.isRealRecord ||
      !window.confirm(
        `Delete "${reportToDelete.name}"? This removes the report and its private file.`
      )
    ) {
      return
    }

    setActionError('')

    try {
      await deleteMedicalRecord(reportToDelete)
      setIsActionMenuOpen(false)
      setReportItemMenuOpen(null)
      await loadRealRecords(selectedMember)
    } catch (deleteError) {
      setActionError(deleteError.message || 'Unable to delete this medical report.')
    }
  }

  async function handleSaveReportChanges(changes) {
  if (!editingReport || !selectedMember) return

  setIsSavingReport(true)
  setActionError('')

  try {
    const record = await updateMedicalRecord({
      id: editingReport.id,
      familyMemberId: selectedMember.id,
      ...changes,
    })

    const mapped = mapMedicalRecord(record, selectedMember)

    setReports((current) =>
      current.map((item) =>
        item.id === mapped.id ? mapped : item
      )
    )

    setEditingReport(null)

    if (onRecordsChanged) {
      await onRecordsChanged()
    }
  } catch (error) {
    setActionError(
      error.message || 'Unable to update this medical report.'
    )
    throw error
  } finally {
    setIsSavingReport(false)
  }
}

  async function handleAnalyzeReport(report) {
    setReportAnalysis((previous) => ({
      ...previous,
      [report.id]: { status: 'analyzing', data: null, error: null },
    }))

    try {
      const analysis = await analyzeMedicalReport(report)

      setReportAnalysis((previous) => ({
        ...previous,
        [report.id]: { status: 'analyzed', data: analysis, error: null },
      }))

      setSelectedReportId(report.id)
      setActiveTab('AI Summary')
    } catch (error) {
      setReportAnalysis((previous) => ({
        ...previous,
        [report.id]: { status: 'error', data: null, error: error.message },
      }))
    }
  }

  function handleReportItemMenu(event, reportId) {
    event.stopPropagation()
    setReportItemMenuOpen((current) => current === reportId ? null : reportId)
  }

  useEffect(() => {
    if (reportItemMenuOpen === null) return undefined

    function handleClickOutside(event) {
      if (!event.target.closest('.report-item-menu') && !event.target.closest('.report-more')) {
        setReportItemMenuOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [reportItemMenuOpen])

  return (
    <div className="medical-records-page">
      <div className="medical-records-header">
        <div>
          <span className="page-kicker">HEALTH RECORDS</span>
          <h1>Medical Reports</h1>
          <p>All your medical reports in one secure place.</p>
        </div>

        <div className="medical-member-context">
          <span className="context-avatar">{selectedMember?.avatar || 'H'}</span>
          <div>
            <small>Selected profile</small>
            <strong>{selectedMember?.name || 'Family member'}</strong>
          </div>
        </div>
      </div>

      <section className="toolbar">
        <label className="search-box">
          <Icon name="search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports" />
        </label>

        <div className="toolbar-actions">
          <button className="toolbar-button" onClick={() =>
              setFilter((current) =>
                current === 'All'
                  ? 'Available'
                  : current === 'Available'
                    ? 'Analyzed'
                    : current === 'Analyzed'
                      ? 'Pending'
                      : 'All'
              )
            }>
            <Icon name="filter" /> Filter: {filter}
          </button>

          <label className="sort-control">
            <Icon name="sort" />
            <span className="sr-only">Sort reports</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort reports">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="type">Report type</option>
            </select>
          </label>
          <button className="primary-button upload-trigger" onClick={() => setIsUploadOpen(true)}>
            <Icon name="upload" /> Upload Report
          </button>
        </div>
      </section>

      {recordsError && <div className="records-alert error" role="alert">{recordsError}</div>}
      {actionError && <div className="records-alert error" role="alert">{actionError}</div>}

      <div className="workspace">
        <section className="reports-column">
          <div className="reports-heading">
            <div>
              <p className="eyebrow">{isRealDataMode ? `${selectedMember.name}'s records` : "Sample records"}</p>
              <h2>All Reports <span>{isLoadingRecords ? '…' : visibleReports.length}</span></h2>
            </div>
          </div>

          {isLoadingRecords ? (
            <div className="empty-state loading-state"><div className="loading-spinner" /><p>Loading medical reports…</p></div>
          ) : visibleReports.length ? (
            <div className="report-list">
              {visibleReports.map((report) => {
                const displayStatus = getReportDisplayStatus(report)
                const isSelected = selectedReportId === report.id

                return (
                  <div className="report-item-wrapper" key={report.id}>
                    <button className={`report-item ${isSelected ? 'selected' : ''}`} onClick={() => {
                      setSelectedReportId(report.id)
                      setActiveTab('Report')
                      setIsActionMenuOpen(false)
                      setReportItemMenuOpen(null)
                    }}>
                      <span className="report-document"><Icon name="document" /></span>
                      <span className="report-meta"><strong>{report.name}</strong><small>{report.date}</small></span>
                      <span className={`status ${displayStatus.className}`}>
                        {displayStatus.label === 'Analyzed' && <Icon name="check" size={12} />}
                        {displayStatus.label}
                      </span>
                      <span className="report-more" onClick={(event) => handleReportItemMenu(event, report.id)}>
                        <Icon name="more" />
                      </span>
                    </button>

                    {reportItemMenuOpen === report.id && (
                      <div className="report-item-menu">
                        <button type="button" onClick={(event) => {
                          event.stopPropagation()
                          handleAnalyzeReport(report)
                          setReportItemMenuOpen(null)
                        }}>
                          {getAnalysisState(report.id).status === 'analyzed' ? 'Re-analyze report' : 'Analyze report'}
                        </button>

                        {report.isRealRecord && (
                          <>
                            <button type="button" onClick={(event) => {
                              event.stopPropagation()
                              setReportItemMenuOpen(null)
                              setEditingReport(report)
                            }}>
                              Edit report
                            </button>
                            <button type="button" className="danger-action" onClick={(event) => {
                              event.stopPropagation()
                              setReportItemMenuOpen(null)
                              handleDeleteReport(report)
                            }}>
                              Delete report
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>

        <section className="detail-panel">
          {selectedReport ? (
            <>
              <div className="detail-heading">
                <div>
                  <p className="eyebrow">{selectedReport.type}</p>
                  <h2>{selectedReport.name}</h2>
                  <p>{selectedReport.date} <span>•</span> Uploaded by {selectedReport.uploadedBy}</p>
                </div>

                <div className="report-actions-wrap">
                  <button className="icon-button" aria-label="Report actions" onClick={() => setIsActionMenuOpen((current) => !current)}>
                    <Icon name="more" />
                  </button>

                  {isActionMenuOpen && (
                    <div className="report-actions-menu">
                      {selectedReport.isRealRecord && <button type="button" onClick={handleOpenReport}>Open private report</button>}
                      {selectedReport.isRealRecord && <button type="button" onClick={() => { setEditingReport(selectedReport); setIsActionMenuOpen(false) }}>Edit report</button>}
                      {getAnalysisState(selectedReport.id).status !== 'analyzing' && (
                        <button type="button" onClick={() => {
                          handleAnalyzeReport(selectedReport)
                          setIsActionMenuOpen(false)
                        }}>
                          {getAnalysisState(selectedReport.id).status === 'analyzed' ? 'Re-analyze report' : 'Analyze report'}
                        </button>
                      )}
                      {selectedReport.isRealRecord && <button type="button" onClick={() => handleDeleteReport()}>Delete report</button>}
                    </div>
                  )}
                </div>
              </div>

              <div className="tabs" role="tablist">
                {['Report', 'AI Summary', 'Chart View', 'History'].map((tab) => (
                  <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="tab-content">
                {activeTab === 'Report' && (
                  <>
                    {getAnalysisState(selectedReport.id).status === 'not-analyzed' && (
                      <div className="analyze-action-bar">
                        <button className="primary-button analyze-trigger" onClick={() => handleAnalyzeReport(selectedReport)}>
                          <Icon name="spark" /> Analyze Report with AI
                        </button>
                      </div>
                    )}
                    {getAnalysisState(selectedReport.id).status === 'analyzing' && (
                      <div className="analyze-action-bar"><div className="analyze-status analyzing"><span className="analyze-spinner" /> Analyzing report with AI...</div></div>
                    )}
                    {getAnalysisState(selectedReport.id).status === 'analyzed' && (
                      <div className="analyze-action-bar"><div className="analyze-status analyzed"><Icon name="check" /> Analysis complete. View in AI Summary tab.</div></div>
                    )}
                    <ReportPreview report={selectedReport} />
                  </>
                )}

                {activeTab === 'AI Summary' && (
                  <AiSummary report={selectedReport} analysisState={getAnalysisState(selectedReport.id)} onAnalyze={handleAnalyzeReport} />
                )}

                {activeTab === 'Chart View' && <ChartView reports={reports} />}

                {activeTab === 'History' && (
                  <div className="history-view">
                    <div className="history-heading">
                      <div>
                        <p>Complete medical activity</p>
                        <h3>Report history</h3>
                      </div>
                      <span>{reports.length} reports</span>
                    </div>
                    {reports.length ? (
                      <div className="history-list">
                        {[...reports]
                          .sort((a, b) => {
                            const aDate = new Date(`${a.record_date || '1970-01-01'}T00:00:00`)
                            const bDate = new Date(`${b.record_date || '1970-01-01'}T00:00:00`)
                            return bDate - aDate
                          })
                          .map((report) => (
                            <article className="history-entry" key={report.id}>
                              <div className="history-entry-date">{report.date}</div>
                              <div className="history-entry-icon"><Icon name="document" size={17} /></div>
                              <div className="history-entry-content">
                                <strong>{report.name}</strong>
                                <p>{report.type}{report.category ? ` · ${report.category}` : ''} · Uploaded by {report.uploadedBy}</p>
                                {report.description && <small>{report.description}</small>}
                              </div>
                              <span className="history-entry-status">{getReportDisplayStatus(report).label}</span>
                            </article>
                          ))}
                      </div>
                    ) : (
                      <EmptyState />
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>

      {editingReport && (
        <EditReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSave={handleSaveReportChanges}
          isSaving={isSavingReport}
        />
      )}

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUpload={handleRealUpload}
          isRealDataMode={isRealDataMode}
          memberName={selectedMember?.name}
        />
      )}
    </div>
  )
}
