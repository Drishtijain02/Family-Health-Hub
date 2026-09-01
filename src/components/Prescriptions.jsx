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
  Sparkles,
  Trash2
} from 'lucide-react';

export default function Prescriptions() {
  // --- STATE MANAGEMENT ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Initial Sample Prescriptions Data
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      doctor: 'Dr. R. Mehta',
      specialty: 'General Physician',
      degree: 'MBBS, MD',
      clinic: 'City Care Clinic, Jaipur',
      date: 'Feb 24, 2026',
      time: '10:30 AM',
      followUp: 'Mar 10, 2026',
      status: 'Active',
      medicines: [
        { name: 'Vitamin D3 2000 IU', dosage: '1 Tablet', frequency: 'Once daily', duration: '30 days', instructions: 'After food' },
        { name: 'Calcium Tablet', dosage: '1 Tablet', frequency: 'Once daily', duration: '30 days', instructions: 'After food' },
        { name: 'Montelukast 10mg', dosage: '1 Tablet', frequency: 'Once daily', duration: '15 days', instructions: 'At bedtime' }
      ]
    }
  ]);

  // Form State for "Add Prescription" Modal
  const [formData, setFormData] = useState({
    doctor: '',
    specialty: '',
    degree: '',
    clinic: '',
    date: '',
    time: '',
    followUp: '',
    status: 'Active',
    medicines: [
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]
  });

  // --- DYNAMIC MEDICINE HANDLERS ---
  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index][field] = value;
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const addMedicineRow = () => {
    setFormData({
      ...formData,
      medicines: [
        ...formData.medicines,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    });
  };

  const removeMedicineRow = (index) => {
    if (formData.medicines.length === 1) return; // Keep at least one row
    const updatedMedicines = formData.medicines.filter((_, i) => i !== index);
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  // --- SUBMIT NEW PRESCRIPTION ---
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newPrescription = {
      ...formData,
      id: Date.now()
    };
    setPrescriptions([newPrescription, ...prescriptions]);
    setIsModalOpen(false);

    // Reset Form
    setFormData({
      doctor: '',
      specialty: '',
      degree: '',
      clinic: '',
      date: '',
      time: '',
      followUp: '',
      status: 'Active',
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  // --- DELETE PRESCRIPTION ---
  const handleDelete = (id) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
    if (selectedPrescription?.id === id) {
      setSelectedPrescription(null);
    }
  };

  // --- FILTERED PRESCRIPTIONS ---
  const filteredPrescriptions = prescriptions.filter((item) => {
    const matchesSearch =
      item.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.medicines.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      filterStatus === 'All' || item.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-sm text-gray-500">Manage and track your medical prescriptions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#3b4e34] hover:bg-[#2d3c28] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Plus size={18} />
          Add Prescription
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search doctor, clinic, or medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4e34]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescriptions List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredPrescriptions.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-gray-200 text-gray-500">
              No prescriptions found.
            </div>
          ) : (
            filteredPrescriptions.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedPrescription(item)}
                className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
                  selectedPrescription?.id === item.id
                    ? 'border-[#3b4e34] ring-1 ring-[#3b4e34]'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.doctor}</h3>
                    <p className="text-xs text-gray-500">{item.specialty} • {item.clinic}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        item.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.medicines.map((med, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-md">
                      {med.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Prescription Details View */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 h-fit">
          {selectedPrescription ? (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">{selectedPrescription.doctor}</h2>
                <p className="text-xs text-gray-500">{selectedPrescription.degree}</p>
                <p className="text-xs text-gray-500">{selectedPrescription.clinic}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Prescribed Medicines
                </h4>
                <div className="space-y-2">
                  {selectedPrescription.medicines.map((m, i) => (
                    <div key={i} className="p-2.5 bg-gray-50 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-gray-800">{m.name}</p>
                      <p className="text-gray-600">{m.dosage} — {m.frequency}</p>
                      {m.instructions && <p className="text-gray-400 italic">{m.instructions}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              Select a prescription to view details
            </div>
          )}
        </div>
      </div>

      {/* --- ADD PRESCRIPTION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Add New Prescription</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Doctor Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Doctor Name*"
                  required
                  value={formData.doctor}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                  className="p-2.5 border rounded-xl text-sm"
                />
                <input
                  type="text"
                  placeholder="Specialty (e.g. Cardiologist)"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="p-2.5 border rounded-xl text-sm"
                />
                <input
                  type="text"
                  placeholder="Clinic / Hospital Name"
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  className="p-2.5 border rounded-xl text-sm sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Date (e.g. Mar 01, 2026)"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="p-2.5 border rounded-xl text-sm"
                />
                <input
                  type="text"
                  placeholder="Follow-up Date"
                  value={formData.followUp}
                  onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
                  className="p-2.5 border rounded-xl text-sm"
                />
              </div>

              {/* Dynamic Medicine Inputs Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-700">Medicines</h3>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="text-xs font-semibold text-[#3b4e34] hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Medicine
                  </button>
                </div>

                {formData.medicines.map((med, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500">Medicine #{index + 1}</span>
                      {formData.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(index)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Medicine Name*"
                        required
                        value={med.name}
                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                        className="p-2 bg-white border rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1 Tablet)"
                        value={med.dosage}
                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        className="p-2 bg-white border rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. Twice daily)"
                        value={med.frequency}
                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        className="p-2 bg-white border rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Instructions (e.g. After food)"
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                        className="p-2 bg-white border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3b4e34] text-white rounded-xl text-sm font-semibold hover:bg-[#2d3c28]"
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