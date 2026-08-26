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

import React from 'react';
import Prescriptions from './components/Prescriptions'; // 1. Import Prescriptions instead of HealthCard

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary, #f7f7f2)',
      padding: '20px' // adjusted padding to fit full dashboard page width nicely
    }}>
      <Prescriptions /> {/* 2. Render Prescriptions component here */}
    </div>
  );
}