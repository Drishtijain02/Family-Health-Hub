import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Upload,
  Search,
  Filter,
  X,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  ScanLine,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';



export default function Prescriptions({ selectedMember }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // OCR Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);

  // Helper function to format date dynamically to DD-MM-YYYY
  const getFormattedTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper function for HTML <input type="date"> (YYYY-MM-DD)
  const getIsoTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const initialFormState = {
    title: '',
    doctor: '',
    recordType: 'Prescription',
    category: 'General',
    dateIso: getIsoTodayDate(),
    description: '',
    file: null,
    fileName: '',
    imageUrl: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Clean up Object URLs on unmount or reset to avoid memory leaks
  useEffect(() => {
    return () => {
      if (formData.imageUrl && formData.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imageUrl);
      }
    };
  }, [formData.imageUrl]);

  // --- 1. FETCH REPORTS FROM SUPABASE ON MOUNT ---
  useEffect(() => {
    fetchReports();
  }, [selectedMember?.id]);

  async function fetchReports() {
    setLoading(true);
    if (!selectedMember?.id) {
      setReports([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('family_member_id', selectedMember.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedData = data.map((item) => ({
        ...item,
        recordType: item.record_type,
        imageUrl: item.image_url
      }));
      setReports(formattedData);
    }
    setLoading(false);
  }

  // --- OCR SCANNING & IMAGE URL GENERATION ---
  const triggerOcrScan = (file, tempUrl) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanComplete(true);

          setFormData((prevData) => ({
            ...prevData,
            title: prevData.title || file.name.replace(/\.[^/.]+$/, ''),
            recordType: 'Prescription',
            category: 'General',
            imageUrl: tempUrl
          }));
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (formData.imageUrl && formData.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imageUrl);
      }
      const tempUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        file,
        fileName: file.name,
        imageUrl: tempUrl
      }));
      triggerOcrScan(file, tempUrl);
    }
  };

  // --- 2. SUBMIT REPORT & UPLOAD IMAGE TO SUPABASE ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    let uploadedStoragePath = null;

    try {
      let formattedDate = getFormattedTodayDate();
      if (formData.dateIso) {
        const [year, month, day] = formData.dateIso.split('-');
        formattedDate = `${day}-${month}-${year}`;
      }

      let publicImageUrl = null;

      // Upload image to Supabase Storage if present
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop().toLowerCase();
        const sanitizedFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        uploadedStoragePath = sanitizedFileName;

        const { error: uploadError } = await supabase.storage
          .from('prescriptions')
          .upload(sanitizedFileName, formData.file, {
            upsert: false,
            contentType: formData.file.type || undefined
          });

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('prescriptions')
          .getPublicUrl(sanitizedFileName);
        publicImageUrl = urlData.publicUrl;
      }

      const newRecord = {
        family_member_id: selectedMember.id,
        title: formData.title.trim() || 'Uploaded Prescription',
        doctor: formData.doctor.trim() || 'Not Specified',
        category: formData.category.trim() || 'General',
        record_type: formData.recordType,
        date: formattedDate,
        description: formData.description.trim() || 'User uploaded prescription photo.',
        status: 'Uploaded',
        image_url: publicImageUrl
      };

      const { data, error } = await supabase
        .from('prescriptions')
        .insert([newRecord])
        .select();

      if (error) {
        throw new Error(`Prescription could not be saved: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Prescription was uploaded but no saved record was returned.');
      }

      const createdItem = {
        ...data[0],
        recordType: data[0].record_type,
        imageUrl: data[0].image_url
      };

      setReports((prev) => [createdItem, ...prev]);
      setSelectedReport(createdItem);
      resetModal();
    } catch (err) {
      console.error('Form submit error:', err);
      if (uploadedStoragePath) {
        await supabase.storage.from('prescriptions').remove([uploadedStoragePath]);
      }
      setSubmitError(err.message || 'Unable to upload prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    if (formData.imageUrl && formData.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.imageUrl);
    }
    setIsModalOpen(false);
    setIsScanning(false);
    setScanProgress(0);
    setScanComplete(false);
    setSubmitError('');
    setFormData(initialFormState);
  };

  // --- 3. DELETE FROM SUPABASE ---
  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', id)
      .eq('family_member_id', selectedMember.id);

    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    }
  };

  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterCategory === 'All' || item.category.toLowerCase() === filterCategory.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-sm text-gray-500">All your medical documents in one place</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#3b4e34] hover:bg-[#2d3c28] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Upload size={18} />
          Upload Report
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search reports, doctors, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
          >
            <option value="All">All Categories</option>
            <option value="Blood Work">Blood Work</option>
            <option value="Radiology">Radiology</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List Column */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            All Reports ({filteredReports.length})
          </h2>
          {loading ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-gray-200 text-gray-400 text-sm flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              Loading records...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-gray-200 text-gray-400 text-sm">
              No reports uploaded yet.
            </div>
          ) : (
            filteredReports.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedReport(item)}
                className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
                  selectedReport?.id === item.id
                    ? 'border-[#3b4e34] ring-1 ring-[#3b4e34]'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-gray-100 rounded-xl text-gray-600 mt-0.5">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{item.date}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-gray-50">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                    {item.category}
                  </span>
                  <span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-md">
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Preview Box */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 min-h-[400px]">
          {selectedReport ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Doctor: <strong>{selectedReport.doctor}</strong> • Date: <strong>{selectedReport.date}</strong>
                  </p>
                </div>
                <span className="bg-[#3b4e34]/10 text-[#3b4e34] text-xs px-3 py-1 rounded-full font-semibold">
                  {selectedReport.recordType}
                </span>
              </div>

              {selectedReport.description && (
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {selectedReport.description}
                </p>
              )}

              {/* Uploaded Image Preview Frame */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 p-6 flex justify-center items-center min-h-[350px]">
                {selectedReport.imageUrl ? (
                  <img
                    src={selectedReport.imageUrl}
                    alt={selectedReport.title}
                    className="max-h-[500px] w-auto object-contain rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="text-center p-8 text-gray-400 space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                      <ImageIcon size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">No Image File Attached</p>
                      <p className="text-xs text-gray-400 mt-1">Upload a prescription photo to preview it here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-24 text-gray-400 space-y-2">
              <Eye size={40} className="text-gray-300" />
              <p className="text-sm font-medium">Select a report from the list to view preview</p>
            </div>
          )}
        </div>
      </div>

      {/* --- UPLOAD REPORT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Upload Report</h2>
                <p className="text-xs text-gray-500">Upload prescription photo or lab report</p>
              </div>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {submitError}
                </div>
              )}

              {/* File Upload / OCR Scan Box */}
              <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#3b4e34] transition-all bg-gray-50/50 overflow-hidden">
                {isScanning ? (
                  <div className="space-y-3 py-2">
                    <div className="flex items-center justify-center gap-2 text-[#3b4e34] font-semibold text-sm animate-pulse">
                      <ScanLine className="animate-spin" size={20} />
                      Scanning uploaded photo...
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#3b4e34] h-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">{scanProgress}% completed</p>
                  </div>
                ) : scanComplete ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs font-semibold bg-blue-50 py-1.5 px-3 rounded-full w-fit mx-auto border border-blue-200">
                      <CheckCircle2 size={14} /> Photo Processed
                    </div>
                    <p className="text-xs font-semibold text-gray-800">{formData.fileName}</p>
                    {formData.imageUrl && (
                      <img
                        src={formData.imageUrl}
                        alt="Thumbnail"
                        className="h-16 w-16 object-cover mx-auto rounded-lg border border-gray-200 shadow-sm mt-1"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto text-[#3b4e34]">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Drag & drop prescription photo here</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">or browse from your device</p>
                    </div>
                    <label className="inline-block mt-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-50 text-gray-700 shadow-sm">
                      Browse Files
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-3">Supported formats: JPG, PNG, WEBP, PDF</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Report Title (e.g. Doctor's Prescription)*"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formData.recordType}
                    onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}
                    className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
                  >
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Scan / X-Ray">Scan / X-Ray</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Category (e.g. Radiology)"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Doctor Name (Optional)"
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
                  />

                  <input
                    type="date"
                    value={formData.dateIso}
                    onChange={(e) => setFormData({ ...formData, dateIso: e.target.value })}
                    className="p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
                  />
                </div>

                <textarea
                  placeholder="Optional description..."
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={resetModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScanning || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3b4e34] text-white rounded-xl text-xs font-semibold hover:bg-[#2d3c28] disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                  {isSubmitting ? 'Uploading...' : 'Upload Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}