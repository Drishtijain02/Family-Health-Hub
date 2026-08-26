import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Paperclip, 
  AlertCircle, 
  X, 
  ChevronRight, 
  FileText, 
  Download, 
  Eye, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export default function Prescriptions() {
  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Main Prescriptions Data State
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      doctor: 'Dr. R. Mehta',
      specialty: 'General Physician',
      degree: 'MBBS, MD',
      clinic: 'City Care Clinic, Jaipur',
      date: 'Feb 24, 2025',
      time: '10:30 AM',
      followUp: 'Mar 10, 2025',
      status: 'Active',
      medicines: [
        { name: 'Vitamin D3 2000 IU', dosage: '1 Tablet', frequency: 'Once daily', duration: '30 days', instructions: 'After food' },
        { name: 'Calcium Tablet', dosage: '1 Tablet', frequency: 'Once daily', duration: '30 days', instructions: 'After food' },
        { name: 'Montelukast 10mg', dosage: '1 Tablet', frequency: 'Once daily', duration: '15 days', instructions: 'At bedtime' },
        { name: 'Levocetirizine 5mg', dosage: '1 Tablet', frequency: 'Once daily', duration: '15 days', instructions: 'At bedtime' },
      ],
      uploadedFile: {
        name: 'Prescription_DrRMehta_Feb24_2025.jpg',
        date: 'Feb 24, 2025 • 10:31 AM',
        size: '365 KB'
      }
    },
    {
      id: 2,
      doctor: 'Dr. A. Sharma',
      specialty: 'Orthopedic',
      degree: 'MS',
      clinic: 'Apex Hospital, Jaipur',
      date: 'Feb 10, 2025',
      time: '04:15 PM',
      followUp: 'Feb 25, 2025',
      status: 'Active',
      medicines: []
    },
    {
      id: 3,
      doctor: 'Dr. P. Verma',
      specialty: 'Dermatologist',
      degree: 'MD',
      clinic: 'Skin Care Clinic',
      date: 'Jan 22, 2025',
      time: '11:00 AM',
      followUp: 'N/A',
      status: 'Completed',
      medicines: []
    }
  ]);

  // Track currently selected prescription for detail view
  const [selectedId, setSelectedId] = useState(1);
  const activePrescription = prescriptions.find(p => p.id === selectedId) || prescriptions[0];

  // Form State for Adding New Prescription
  const [formData, setFormData] = useState({
    doctor: '',
    specialty: '',
    degree: 'MBBS, MD',
    clinic: '',
    date: '',
    status: 'Active'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.doctor || !formData.specialty) return;

    const newPrescription = {
      id: Date.now(),
      doctor: formData.doctor.startsWith('Dr.') ? formData.doctor : `Dr. ${formData.doctor}`,
      specialty: formData.specialty,
      degree: formData.degree,
      clinic: formData.clinic || 'City Clinic',
      date: formData.date 
        ? new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Aug 27, 2026',
      time: '10:00 AM',
      followUp: 'N/A',
      status: formData.status,
      medicines: []
    };

    setPrescriptions([newPrescription, ...prescriptions]);
    setSelectedId(newPrescription.id);
    setFormData({ doctor: '', specialty: '', degree: 'MBBS, MD', clinic: '', date: '', status: 'Active' });
    setIsModalOpen(false);
  };

  return (
    <div className="w-full bg-[#f8f8f5] min-h-screen p-4 md:p-6 text-gray-800 font-sans">
      
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Paperclip className="w-6 h-6 text-[#3b4e34]" /> Prescriptions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">View all prescriptions and medication instructions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#3b4e34] hover:bg-[#2e3e29] text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" /> Add Prescription
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center justify-between mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search prescriptions..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4e34]/20"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <select className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
            <option>Sort by: Newest</option>
            <option>Sort by: Oldest</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of Prescriptions */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold tracking-wider text-gray-500 uppercase px-1">
            All Prescriptions ({prescriptions.length})
          </h2>
          
          <div className="space-y-3">
            {prescriptions.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-white border-[#3b4e34] ring-2 ring-[#3b4e34]/10 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{item.doctor}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.specialty} • {item.date}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isSelected ? 'text-[#3b4e34]' : 'text-gray-300'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          
          {/* Doctor Info Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Prescription By</span>
                <h2 className="text-xl font-bold text-gray-900">{activePrescription.doctor}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activePrescription.specialty} • {activePrescription.degree}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{activePrescription.clinic}</p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {activePrescription.date}</div>
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Follow-up: {activePrescription.followUp}</div>
              </div>
              <button className="flex items-center justify-center gap-2 px-3.5 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>

          {/* Medicines Table Section */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Prescribed Medicines</h3>
            
            {activePrescription.medicines && activePrescription.medicines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Medicine</th>
                      <th className="p-3">Dosage</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3 rounded-r-xl">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activePrescription.medicines.map((med, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-3 font-medium text-gray-900 flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-emerald-700" /> {med.name}
                        </td>
                        <td className="p-3">{med.dosage}</td>
                        <td className="p-3">{med.frequency}</td>
                        <td className="p-3">{med.duration}</td>
                        <td className="p-3 text-gray-500">{med.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic py-4">No detailed medicine list logged for this prescription.</p>
            )}
          </div>

          {/* Warning Banner */}
          <div className="mt-6 bg-amber-50/60 border border-amber-200/60 text-amber-900 p-3.5 rounded-xl flex items-center gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Please follow the instructions as prescribed by your doctor. Do not stop or change any medication without consulting your doctor.</span>
          </div>

          {/* Uploaded File Block */}
          {activePrescription.uploadedFile && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Uploaded Prescription</h3>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-xs text-gray-500">JPG</div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{activePrescription.uploadedFile.name}</p>
                    <p className="text-[10px] text-gray-400">Uploaded on {activePrescription.uploadedFile.date} • {activePrescription.uploadedFile.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Banner Footer */}
          <div className="mt-6 bg-purple-50 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-purple-950">Have questions about this prescription?</p>
                <p className="text-[11px] text-purple-700">Ask our Health AI for more information about your medications.</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-sm">
              <MessageSquare className="w-3.5 h-3.5" /> Ask Health AI
            </button>
          </div>

        </div>
      </div>

      {/* Interactive Add Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Add New Prescription</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  name="doctor"
                  placeholder="e.g. Dr. S. Nair"
                  value={formData.doctor}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b4e34]/20 focus:border-[#3b4e34]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Specialty</label>
                <input
                  type="text"
                  name="specialty"
                  placeholder="e.g. Cardiologist"
                  value={formData.specialty}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b4e34]/20 focus:border-[#3b4e34]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Clinic / Hospital Name</label>
                <input
                  type="text"
                  name="clinic"
                  placeholder="e.g. Fortis Hospital, Jaipur"
                  value={formData.clinic}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b4e34]/20 focus:border-[#3b4e34]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b4e34]/20 focus:border-[#3b4e34]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3b4e34]/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#3b4e34] hover:bg-[#2e3e29] rounded-xl font-medium shadow-sm"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}