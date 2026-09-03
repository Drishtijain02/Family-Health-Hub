/*import React from 'react';
import HealthCard from './components/HealthCard';

export default function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-primary, #f7f7f2)', 
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <HealthCard />
      </div>
    </div>
  ); 
}*/



/*import React from 'react';
import Prescriptions from './components/Prescriptions'; // 1. Import Prescriptions instead of HealthCard

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary, #f7f7f2)',
      padding: '20px' // adjusted padding to fit full dashboard page width nicely
    }}>
      <Prescriptions /> 
    </div>
  );
}*/


import React, { useState } from 'react';
import Prescriptions from './components/Prescriptions';
import HealthCard from './components/HealthCard';
import { Pill, CreditCard } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('prescriptions');

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#3b4e34] flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">HealthHub</span>
          </div>

          {/* Tab Navigation Buttons */}
          <nav className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'prescriptions'
                  ? 'bg-white text-[#3b4e34] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Pill size={16} />
              Prescriptions
            </button>

            <button
              onClick={() => setActiveTab('healthCard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'healthCard'
                  ? 'bg-white text-[#3b4e34] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard size={16} />
              Health Card
            </button>
          </nav>
        </div>
      </header>

      {/* Main Dynamic View */}
      <main className="py-4">
        {activeTab === 'prescriptions' ? <Prescriptions /> : <HealthCard />}
      </main>
    </div>
  );
}