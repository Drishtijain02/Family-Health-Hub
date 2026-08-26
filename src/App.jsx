import { useCallback, useEffect, useMemo, useState } from 'react'
import DevelopmentTestBridge from './features/medical-records/DevelopmentTestBridge'
import {
  deleteMedicalRecord,
  fetchMedicalRecords,
  getMedicalRecordSignedUrl,
  uploadMedicalRecord,
} from './features/medical-records/medicalRecords'
import { analyzeMedicalReport } from './features/medical-records/analysisService'
import './App.css'

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

const navigation = ['Overview', 'Medical Reports', 'Prescriptions', 'Timeline', 'AI Health', 'Reminders', 'Emergency Card', 'Settings']
const familyMembers = [['Sunita', 'Mother', 'S'], ['Rajesh', 'Father', 'R'], ['Ananya', 'Daughter', 'A'], ['Arjun', 'Son', 'A'], ['Kamla', 'Dadi', 'K']]

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <path d="m14 6-6 6 6 6M8 12h12" />,
    home: <><path d="m3 10 9-7 9 7v10H3z" /><path d="M9 20v-6h6v6" /></>, report: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h5M9 13h6M9 17h6" /></>, pill: <><path d="m9 5 10 10a4 4 0 0 1-6 6L3 11a4 4 0 0 1 6-6Z" /><path d="m6 8 10 10" /></>, timeline: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h8v10" /></>, spark: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />, bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></>, card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>, settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1H5.3v-3h.2A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1A1.7 1.7 0 0 0 10.7 6a1.7 1.7 0 0 0 1-1.5v-.2h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>, search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>, filter: <path d="M4 6h16M7 12h10m-7 6h4" />, sort: <><path d="M8 6v12M5 9l3-3 3 3M16 18V6m-3 9 3 3 3-3" /></>, upload: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M5 14v5h14v-5" /></>, more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>, close: <path d="m6 6 12 12M18 6 6 18" />, check: <path d="m5 12 4 4L19 6" />, document: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function EmptyState() { return <div className="empty-state"><div className="empty-icon"><Icon name="document" size={25} /></div><h3>No Medical Reports Yet</h3><p>Upload your first medical report to get started.</p></div> }
function ReportPreview() { return <div className="report-preview"><div className="preview-brand"><span className="preview-mark">+</span><div><strong>WellSpring Diagnostics</strong><small>Trusted care, clear results</small></div></div><div className="preview-heading"><div><p>Complete Blood Count</p><h3>Laboratory Test Report</h3></div><span>Final report</span></div><div className="preview-patient"><div><small>Patient name</small><strong>Sunita Sharma</strong></div><div><small>Age / Gender</small><strong>48 years / Female</strong></div><div><small>Collected on</small><strong>24 Feb 2025</strong></div></div><table><thead><tr><th>Test</th><th>Result</th><th>Reference range</th></tr></thead><tbody><tr><td>Haemoglobin</td><td>12.8 g/dL</td><td>12.0 – 15.5</td></tr><tr><td>White blood cells</td><td>7.2 × 10⁹/L</td><td>4.0 – 11.0</td></tr><tr><td>Platelet count</td><td>256 × 10⁹/L</td><td>150 – 450</td></tr><tr><td>Red blood cells</td><td>4.5 × 10¹²/L</td><td>3.8 – 5.2</td></tr></tbody></table><p className="preview-note">Results should be interpreted by a qualified healthcare professional alongside your medical history.</p></div> }
function AiSummary({ report, analysisState, onAnalyze }) {
  const { status, data, error } = analysisState

  if (status === 'not-analyzed') {
    return <div className="ai-summary-empty"><div className="summary-icon-large"><Icon name="spark" size={32} /></div><h3>AI Analysis Not Started</h3><p>Analyze this medical report with AI to extract key findings, identify abnormal parameters, and get actionable health insights.</p><button className="primary-button" onClick={() => onAnalyze(report)}><Icon name="spark" />Analyze Report with AI</button><p className="ai-disclaimer">AI-generated summaries are informational only and not a substitute for professional medical advice. Always consult with a qualified healthcare provider.</p></div>
  }

  if (status === 'analyzing') {
    return <div className="ai-summary-loading"><div className="loading-spinner" /><h3>Analyzing Report...</h3><p>Processing the medical report with AI. This may take a few moments.</p></div>
  }

  if (status === 'error') {
    return <div className="ai-summary-error"><h3>Analysis Failed</h3><p className="error-message">{error || 'Unable to analyze the report. Please try again.'}</p><button className="secondary-button" onClick={() => onAnalyze(report)}>Retry Analysis</button></div>
  }

  return <div className="ai-summary"><div className="summary-header"><span className="summary-icon"><Icon name="spark" /></span><div><p>AI Health Summary</p><h3>{data.summary}</h3></div></div>{data.abnormal_parameters && data.abnormal_parameters.length > 0 && <div className="abnormal-section"><h4>Flagged Parameters</h4><div className="abnormal-grid">{data.abnormal_parameters.map((param, idx) => <div key={idx} className="abnormal-item"><small>{param.name}</small><strong className={`status-${param.status.toLowerCase()}`}>{param.status}</strong><span>{param.value}</span>{param.reference_range && <span className="ref-range">Ref: {param.reference_range}</span>}</div>)}</div></div>}<div className="explanation-section"><h4>What does this mean?</h4><p>{data.explanation}</p></div>{data.recommendations && data.recommendations.length > 0 && <div className="recommendations-section"><h4>Recommendations</h4><ul>{data.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}</ul></div>}<div className="analysis-meta"><small>Analyzed on {new Date(data.analyzed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div><p className="ai-disclaimer">AI-generated summaries are informational only and not a substitute for professional medical advice. Always consult with a qualified healthcare provider.</p></div>
}
function ChartView() { return <div className="chart-view"><div><p>Haemoglobin trend</p><h3>Recent test history</h3></div><svg viewBox="0 0 520 180" role="img" aria-label="Mock haemoglobin trend chart"><path className="chart-grid" d="M35 25H500M35 80H500M35 135H500M35 150H500" /><path className="chart-line" d="M48 120 C110 100 130 110 175 88 S255 106 300 77 S390 62 465 45" /><circle cx="48" cy="120" r="4" /><circle cx="175" cy="88" r="4" /><circle cx="300" cy="77" r="4" /><circle cx="465" cy="45" r="4" /><text x="40" y="172">May 2024</text><text x="157" y="172">Oct 2024</text><text x="280" y="172">Jan 2025</text><text x="438" y="172">Feb 2025</text></svg><p className="chart-caption">Mock chart based on report history. It is for informational viewing only.</p></div> }

function formatRecordDate(value) {
  if (!value) return 'Date not added'
  if (value === 'Today') return value
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function mapMedicalRecord(record, member) {
  return { ...record, name: record.title, date: formatRecordDate(record.record_date), status: 'Available', type: record.record_type || record.category || 'Medical report', uploadedBy: member.name, isRealRecord: true }
}

function UploadModal({ onClose, onUploaded, onUpload, isRealDataMode }) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', recordType: '', category: '', date: '', description: '' })
  function setChosenFile(nextFile) { if (!nextFile) return; const extension = nextFile.name.split('.').pop()?.toLowerCase(); if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) { setFile(null); setError('Please choose a PDF, JPG, JPEG, or PNG file.'); setStatus('error'); return }; setFile(nextFile); setError(''); setStatus('selected'); setForm((current) => ({ ...current, title: current.title || nextFile.name.replace(/\.[^/.]+$/, '') })) }
  async function handleSubmit(event) { event.preventDefault(); if (!file || !form.title.trim()) { setError(!file ? 'Choose a report before uploading.' : 'Add a report title before uploading.'); setStatus('error'); return }; setStatus('uploading'); setError(''); try { if (onUpload) { await onUpload({ file, title: form.title.trim(), recordType: form.recordType, category: form.category, recordDate: form.date, description: form.description }) } else { await new Promise((resolve) => window.setTimeout(resolve, 850)); onUploaded({ name: form.title.trim(), date: form.date || 'Today', status: 'Pending', type: form.recordType || 'Medical report', uploadedBy: 'Sunita Sharma' }) }; setStatus('success') } catch (uploadError) { setError(uploadError.message || 'Unable to upload this medical report.'); setStatus('error') } }
  return <div className="modal-backdrop" role="presentation"><section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title"><button className="icon-button modal-close" onClick={onClose} aria-label="Close upload panel"><Icon name="close" /></button><p className="eyebrow">Medical reports</p><h2 id="upload-title">Upload Report</h2><p className="modal-intro">{isRealDataMode ? 'Add a private report for the signed-in development test member.' : 'Add a report for Sunita. This demo keeps the file only in your browser session.'}</p>{status === 'success' ? <div className="upload-success"><span><Icon name="check" size={26} /></span><h3>Report ready to review</h3><p>{isRealDataMode ? 'Your report was uploaded to the private development test archive.' : 'Your mock report has been added to the list. No file was uploaded to storage.'}</p><button className="primary-button" onClick={onClose}>Done</button></div> : <form onSubmit={handleSubmit}><label className={`drop-zone ${isDragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); setChosenFile(event.dataTransfer.files?.[0]) }}><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setChosenFile(event.target.files?.[0])} /><span className="drop-icon"><Icon name="upload" /></span>{file ? <span className="selected-file"><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</small></span> : <span><strong>Drag & drop your report here</strong><small>or browse files from your device</small></span>}<span className="browse-button">Browse files</span></label><p className="format-note">Supported formats: PDF, JPG, JPEG, PNG</p>{error && <p className="form-error">{error}</p>}<label>Report title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Annual blood test" /></label><div className="modal-form-grid"><label>Record type<select value={form.recordType} onChange={(event) => setForm({ ...form, recordType: event.target.value })}><option value="">Select type</option><option>Lab Report</option><option>Imaging Report</option><option>Prescription</option><option>Consultation</option><option>Other</option></select></label><label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. Blood work" /></label></div><label>Record date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Description <span className="optional">Optional</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" placeholder="Add a short note about this report" /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" disabled={status === 'uploading'}>{status === 'uploading' ? 'Uploading…' : 'Upload report'}</button></div></form>}</section></div>
}

function App() {
  const [reports, setReports] = useState(mockReports)
  const [selectedReportId, setSelectedReportId] = useState(1)
  const [activeTab, setActiveTab] = useState('Report')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [developmentMember, setDevelopmentMember] = useState(null)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [recordsError, setRecordsError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [reportAnalysis, setReportAnalysis] = useState({})
  const [reportItemMenuOpen, setReportItemMenuOpen] = useState(null)
  const isRealDataMode = Boolean(developmentMember)
  const selectedReport = reports.find((report) => report.id === selectedReportId)

  const getAnalysisState = useCallback((reportId) => {
    return reportAnalysis[reportId] || { status: 'not-analyzed', data: null, error: null }
  }, [reportAnalysis])

  const getReportDisplayStatus = useCallback((report) => {
    const analysisState = getAnalysisState(report.id)

    if (analysisState.status === 'analyzing') {
      return { label: 'Analyzing', className: 'analyzing' }
    }

    if (analysisState.status === 'analyzed') {
      return { label: 'Analyzed', className: 'analyzed' }
    }

    return {
      label: report.isRealRecord ? 'Available' : 'Pending',
      className: report.isRealRecord ? 'available' : 'pending'
    }
  }, [getAnalysisState])

  const visibleReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = report.name.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (filter === 'All') return true

      // Filter based on display status (which includes analysis state)
      const displayStatus = getReportDisplayStatus(report)
      return displayStatus.label === filter
    })
  }, [filter, reports, search, getReportDisplayStatus])
  const loadRealRecords = useCallback(async (member) => { if (!member) return; setIsLoadingRecords(true); setRecordsError(''); try { const data = await fetchMedicalRecords(member.id); const mapped = data.map((record) => mapMedicalRecord(record, member)); setReports(mapped); setSelectedReportId(mapped[0]?.id || null) } catch (loadError) { setReports([]); setSelectedReportId(null); setRecordsError(loadError.message || 'Unable to load medical reports.') } finally { setIsLoadingRecords(false) } }, [])
  const handleDevelopmentMemberChange = useCallback((member) => { setDevelopmentMember(member); if (!member) { setReports(mockReports); setSelectedReportId(1); setRecordsError(''); setActionError(''); return }; void loadRealRecords(member) }, [loadRealRecords])

  function addMockReport(report) { const newReport = { ...report, id: Date.now() }; setReports((current) => [newReport, ...current]); setSelectedReportId(newReport.id); setActiveTab('Report') }
  async function handleRealUpload(details) { await uploadMedicalRecord({ familyMemberId: developmentMember.id, ...details }); await loadRealRecords(developmentMember) }
  async function handleOpenReport() { if (!selectedReport?.isRealRecord) return; setActionError(''); try { const signedUrl = await getMedicalRecordSignedUrl(selectedReport.file_url); window.open(signedUrl, '_blank', 'noopener,noreferrer') } catch (openError) { setActionError(openError.message || 'Unable to open this medical report.') } finally { setIsActionMenuOpen(false) } }
  async function handleDeleteReport() { if (!selectedReport?.isRealRecord || !window.confirm(`Delete "${selectedReport.name}"? This removes the report and its private file.`)) return; setActionError(''); try { await deleteMedicalRecord(selectedReport); setIsActionMenuOpen(false); await loadRealRecords(developmentMember) } catch (deleteError) { setActionError(deleteError.message || 'Unable to delete this medical report.') } }

  async function handleAnalyzeReport(report) {
    setReportAnalysis((prev) => ({
      ...prev,
      [report.id]: { status: 'analyzing', data: null, error: null }
    }))

    try {
      const analysis = await analyzeMedicalReport(report)
      setReportAnalysis((prev) => ({
        ...prev,
        [report.id]: { status: 'analyzed', data: analysis, error: null }
      }))
      setActiveTab('AI Summary')
    } catch (error) {
      setReportAnalysis((prev) => ({
        ...prev,
        [report.id]: { status: 'error', data: null, error: error.message }
      }))
    }
  }

  function handleReportItemMenu(event, reportId) {
    event.stopPropagation()
    setReportItemMenuOpen(reportItemMenuOpen === reportId ? null : reportId)
  }

  function handleCloseReportItemMenu() {
    setReportItemMenuOpen(null)
  }

  // Close menu when clicking outside
  useEffect(() => {
    if (reportItemMenuOpen === null) return

    function handleClickOutside(event) {
      const menu = document.querySelector('.report-item-menu')
      if (menu && !menu.contains(event.target)) {
        setReportItemMenuOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [reportItemMenuOpen])

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">+</span><span>Health<span>Hub</span></span></div><nav className="main-nav" aria-label="Primary navigation">{navigation.map((item) => <button className={item === 'Medical Reports' ? 'active' : ''} key={item}><Icon name={{ Overview: 'home', 'Medical Reports': 'report', Prescriptions: 'pill', Timeline: 'timeline', 'AI Health': 'spark', Reminders: 'bell', 'Emergency Card': 'card', Settings: 'settings' }[item]} />{item}</button>)}</nav><div className="members"><p>Family Members</p>{familyMembers.map(([name, relation, initial]) => <button key={name} className={`member ${name === 'Sunita' ? 'selected' : ''}`}><span className="avatar">{initial}</span><span><strong>{name}</strong><small>{relation}</small></span>{name === 'Sunita' && <span className="member-check"><Icon name="check" size={13} /></span>}</button>)}</div><div className="sidebar-profile"><span className="avatar avatar--profile">AS</span><span><strong>Avinandan</strong><small>Family admin</small></span><Icon name="more" /></div></aside><main className="main-content"><header className="top-header"><div className="header-title"><button className="icon-button" aria-label="Go back"><Icon name="arrow" /></button><div><h1>Medical Reports</h1><p>All your medical reports in one place</p></div></div><div className="header-actions"><button className="profile-switch"><span className="avatar">S</span>Switch Profile</button><button className="icon-button notification-button" onClick={() => setIsNotificationsOpen((current) => !current)} aria-label="Notifications"><Icon name="bell" />{isNotificationsOpen && <span className="notification-popover">You&apos;re all caught up.</span>}</button></div></header><DevelopmentTestBridge onMemberChange={handleDevelopmentMemberChange} /><section className="toolbar"><label className="search-box"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports" /></label><div className="toolbar-actions"><button className="toolbar-button" onClick={() => setFilter((current) => current === 'All' ? 'Analyzed' : current === 'Analyzed' ? 'Pending' : 'All')}><Icon name="filter" />Filter: {filter}</button><button className="toolbar-button"><Icon name="sort" />Newest</button><button className="primary-button upload-trigger" onClick={() => setIsUploadOpen(true)}><Icon name="upload" />Upload Report</button></div></section>{isRealDataMode && <p className="real-data-mode">Development/Test mode · showing only real reports for {developmentMember.name}.</p>}{recordsError && <p className="real-data-error" role="alert">{recordsError}</p>}{actionError && <p className="real-data-error" role="alert">{actionError}</p>}<div className="workspace"><section className="reports-column"><div className="reports-heading"><div><p className="eyebrow">{isRealDataMode ? `${developmentMember.name}'s records` : "Sunita's records"}</p><h2>All Reports <span>{isLoadingRecords ? '…' : visibleReports.length}</span></h2></div></div>{isLoadingRecords ? <div className="empty-state"><p>Loading medical reports…</p></div> : visibleReports.length ? <div className="report-list">{visibleReports.map((report) => { const displayStatus = getReportDisplayStatus(report); return <div className="report-item-wrapper" key={report.id}><button className={`report-item ${selectedReportId === report.id ? 'selected' : ''}`} onClick={() => { setSelectedReportId(report.id); if (!selectedReportId) setActiveTab('Report'); setIsActionMenuOpen(false); setReportItemMenuOpen(null) }}><span className="report-document"><Icon name="document" /></span><span className="report-meta"><strong>{report.name}</strong><small>{report.date}</small></span><span className={`status ${displayStatus.className}`}>{displayStatus.label === 'Analyzed' && <Icon name="check" size={12} />}{displayStatus.label}</span><span className="report-more" onClick={(e) => handleReportItemMenu(e, report.id)}><Icon name="more" /></span></button>{reportItemMenuOpen === report.id && <div className="report-item-menu" onMouseLeave={handleCloseReportItemMenu}><button type="button" onClick={(e) => { e.stopPropagation(); handleAnalyzeReport(report); setReportItemMenuOpen(null) }}>{getAnalysisState(report.id).status === 'analyzed' ? 'Re-analyze report' : 'Analyze report'}</button>{report.isRealRecord && <button type="button" onClick={(e) => { e.stopPropagation(); setReportItemMenuOpen(null); handleDeleteReport() }}>Delete report</button>}</div>}</div> })}</div> : <EmptyState />}</section><section className="detail-panel">{selectedReport ? <><div className="detail-heading"><div><p className="eyebrow">{selectedReport.type}</p><h2>{selectedReport.name}</h2><p>{selectedReport.date} <span>•</span> Uploaded by {selectedReport.uploadedBy}</p></div><div className="report-actions-wrap"><button className="icon-button" aria-label="Report actions" onClick={() => setIsActionMenuOpen((current) => !current)}><Icon name="more" /></button>{isActionMenuOpen && <div className="report-actions-menu">{selectedReport.isRealRecord && <button type="button" onClick={handleOpenReport}>Open private report</button>}{getAnalysisState(selectedReport.id).status !== 'analyzing' && <button type="button" onClick={() => { handleAnalyzeReport(selectedReport); setIsActionMenuOpen(false) }}>{getAnalysisState(selectedReport.id).status === 'analyzed' ? 'Re-analyze report' : 'Analyze report'}</button>}{selectedReport.isRealRecord && <button type="button" onClick={handleDeleteReport}>Delete report</button>}</div>}</div></div><div className="tabs" role="tablist">{['Report', 'AI Summary', 'Chart View', 'History'].map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><div className="tab-content">{activeTab === 'Report' && <>{getAnalysisState(selectedReport.id).status === 'not-analyzed' && <div className="analyze-action-bar"><button className="primary-button analyze-trigger" onClick={() => handleAnalyzeReport(selectedReport)}><Icon name="spark" />Analyze Report with AI</button></div>}{getAnalysisState(selectedReport.id).status === 'analyzing' && <div className="analyze-action-bar"><div className="analyze-status analyzing"><span className="analyze-spinner" />Analyzing report with AI...</div></div>}{getAnalysisState(selectedReport.id).status === 'analyzed' && <div className="analyze-action-bar"><div className="analyze-status analyzed"><Icon name="check" />Analysis complete. View in AI Summary tab.</div></div>}<ReportPreview /></>}{activeTab === 'AI Summary' && <AiSummary report={selectedReport} analysisState={getAnalysisState(selectedReport.id)} onAnalyze={handleAnalyzeReport} />}{activeTab === 'Chart View' && <ChartView />}{activeTab === 'History' && <div className="history-view"><h3>Report history</h3><div><span>{selectedReport.date}</span><p><strong>{selectedReport.name} uploaded</strong>{selectedReport.uploadedBy}&apos;s report was added to HealthHub.</p></div><div><span>{selectedReport.date}</span><p><strong>{selectedReport.isRealRecord ? 'Secure report available' : 'Analysis completed'}</strong>{selectedReport.isRealRecord ? 'The private report can be opened through a temporary signed link.' : 'A mock informational summary is available.'}</p></div></div>}</div></> : <EmptyState />}</section></div></main>{isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} onUploaded={addMockReport} onUpload={isRealDataMode ? handleRealUpload : undefined} isRealDataMode={isRealDataMode} />}</div>
}

export default App
