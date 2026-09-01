import React, { useState } from 'react';
import {
  User,
  Heart,
  Shield,
  Phone,
  Calendar,
  Droplet,
  AlertTriangle,
  Download,
  Share2,
  Activity,
  FileText,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function HealthCard() {
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'insurance', 'emergency', 'vitals'

  // Mock Patient Data (Local State)
  const [patientInfo] = useState({
    name: 'Vidushee Krishna',
    patientId: 'HC-2026-8891',
    dob: '12 Oct 2003',
    age: 22,
    gender: 'Female',
    bloodGroup: 'O+',
    height: '165 cm',
    weight: '58 kg',
    allergies: ['Penicillin', 'Dust / Pollen'],
    chronicConditions: ['Mild Asthma'],
    emergencyContact: {
      name: 'Rajesh Krishna',
      relation: 'Father',
      phone: '+91 98765 43210',
      address: 'Jaipur, Rajasthan'
    },
    insurance: {
      provider: 'Star Health Care',
      policyNumber: 'SH-99201-2026',
      validTill: 'Dec 2027',
      status: 'Active'
    },
    vitalsHistory: [
      { date: 'Feb 20, 2026', bp: '118/78 mmHg', pulse: '72 bpm', temp: '98.4 °F', spo2: '99%' },
      { date: 'Jan 10, 2026', bp: '120/80 mmHg', pulse: '75 bpm', temp: '98.6 °F', spo2: '98%' }
    ]
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Health Card</h1>
          <p className="text-sm text-gray-500">Official medical profile and emergency records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Downloading Health Card PDF...')}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            <Download size={16} />
            Export Card
          </button>
          <button
            onClick={() => alert('Shareable link copied to clipboard!')}
            className="flex items-center gap-2 bg-[#3b4e34] hover:bg-[#2d3c28] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Share2 size={16} />
            Share Profile
          </button>
        </div>
      </div>

      {/* Main Digital ID Card Graphic */}
      <div className="bg-gradient-to-r from-[#2c3b27] via-[#3b4e34] to-[#4c6343] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-20 -top-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* User Basic Info */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white font-bold text-2xl shadow-inner">
              {patientInfo.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Verified Patient
                </span>
                <span className="text-xs text-white/60">ID: {patientInfo.patientId}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{patientInfo.name}</h2>
              <p className="text-xs text-white/80">
                {patientInfo.age} Yrs • {patientInfo.gender} • DOB: {patientInfo.dob}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Blood Group</p>
              <p className="text-base font-bold text-emerald-300 mt-0.5">{patientInfo.bloodGroup}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Height / Weight</p>
              <p className="text-sm font-semibold text-white mt-0.5">{patientInfo.height} / {patientInfo.weight}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Insurance</p>
              <p className="text-sm font-semibold text-emerald-300 mt-0.5">{patientInfo.insurance.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 transition-all ${
            activeTab === 'general'
              ? 'border-b-2 border-[#3b4e34] text-[#3b4e34]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          General & Medical History
        </button>
        <button
          onClick={() => setActiveTab('insurance')}
          className={`pb-3 transition-all ${
            activeTab === 'insurance'
              ? 'border-b-2 border-[#3b4e34] text-[#3b4e34]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Insurance Details
        </button>
        <button
          onClick={() => setActiveTab('emergency')}
          className={`pb-3 transition-all ${
            activeTab === 'emergency'
              ? 'border-b-2 border-[#3b4e34] text-[#3b4e34]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Emergency Contacts
        </button>
        <button
          onClick={() => setActiveTab('vitals')}
          className={`pb-3 transition-all ${
            activeTab === 'vitals'
              ? 'border-b-2 border-[#3b4e34] text-[#3b4e34]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Recent Vitals
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        {/* TAB 1: General & Allergies */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Allergies */}
              <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                  <AlertTriangle size={18} />
                  Known Allergies
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {patientInfo.allergies.map((allergy, i) => (
                    <span key={i} className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-lg font-medium">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chronic Conditions */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <Heart size={18} />
                  Chronic Conditions
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {patientInfo.chronicConditions.map((cond, i) => (
                    <span key={i} className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-lg font-medium">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Insurance */}
        {activeTab === 'insurance' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-xs text-gray-500 font-medium">Insurance Provider</p>
              <p className="text-sm font-bold text-gray-900">{patientInfo.insurance.provider}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-xs text-gray-500 font-medium">Policy Number</p>
              <p className="text-sm font-bold text-gray-900">{patientInfo.insurance.policyNumber}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-xs text-gray-500 font-medium">Validity</p>
              <p className="text-sm font-bold text-gray-900">{patientInfo.insurance.validTill}</p>
            </div>
          </div>
        )}

        {/* TAB 3: Emergency Contact */}
        {activeTab === 'emergency' && (
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="p-3 bg-[#3b4e34]/10 text-[#3b4e34] rounded-xl">
              <Phone size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900">{patientInfo.emergencyContact.name}</h4>
              <p className="text-xs text-gray-500">{patientInfo.emergencyContact.relation}</p>
              <p className="text-xs text-gray-700 font-semibold pt-1">{patientInfo.emergencyContact.phone}</p>
              <p className="text-xs text-gray-400">{patientInfo.emergencyContact.address}</p>
            </div>
          </div>
        )}

        {/* TAB 4: Vitals History */}
        {activeTab === 'vitals' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Historical Logs</h4>
            <div className="divide-y divide-gray-100">
              {patientInfo.vitalsHistory.map((v, i) => (
                <div key={i} className="py-3 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <span className="font-semibold text-gray-900">{v.date}</span>
                  <span className="text-gray-600">BP: <strong>{v.bp}</strong></span>
                  <span className="text-gray-600">Pulse: <strong>{v.pulse}</strong></span>
                  <span className="text-gray-600">Temp: <strong>{v.temp}</strong></span>
                  <span className="text-gray-600">SpO2: <strong>{v.spo2}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}