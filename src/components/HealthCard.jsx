import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Heart, 
  Phone, 
  User, 
  AlertTriangle 
} from 'lucide-react';

export default function HealthCard({ memberData }) {
  const [isEmergencyView, setIsEmergencyView] = useState(false);

  // Fallback defaults if Supabase data is loading or missing
  const data = memberData || {
    name: "Jane Doe",
    relation: "Self",
    bloodGroup: "B+",
    allergies: "Penicillin",
    conditions: "Diabetes",
    medications: "Metformin 500mg",
    emergencyContact: {
      name: "Rakesh Jain",
      relation: "Father",
      phone: "+91 9876543210"
    }
  };

  // 1. QUICK EMERGENCY VIEW MODE
  if (isEmergencyView) {
    return (
      <div style={{
        backgroundColor: 'var(--accent-red-bg)',
        border: '2px solid var(--accent-red)',
        borderRadius: '12px',
        padding: '24px',
        color: 'var(--text-main)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontWeight: 'bold', fontSize: '1.25rem' }}>
            <ShieldAlert size={24} />
            <span>CRITICAL EMERGENCY VIEW</span>
          </div>
          <button 
            onClick={() => setIsEmergencyView(false)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--text-muted)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Exit Emergency View
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{data.name}</h2>
          <div style={{ 
            display: 'inline-block',
            backgroundColor: 'var(--accent-red)',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: '6px',
            fontWeight: 'bold',
            width: 'fit-content'
          }}>
            Blood Group: {data.bloodGroup || 'Not specified'}
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--accent-red)', fontWeight: '600', margin: '0 0 4px 0' }}>⚠️ Allergies:</p>
            <p style={{ margin: 0 }}>{data.allergies || 'None recorded'}</p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: '600', margin: '0 0 4px 0' }}>Medical Conditions:</p>
            <p style={{ margin: 0 }}>{data.conditions || 'None recorded'}</p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: '600', margin: '0 0 4px 0' }}>Current Medications:</p>
            <p style={{ margin: 0 }}>{data.medications || 'None recorded'}</p>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 4px 0' }}>Emergency Contact:</p>
            <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>{data.emergencyContact?.name} ({data.emergencyContact?.relation})</p>
            {data.emergencyContact?.phone ? (
              <a 
                href={`tel:${data.emergencyContact.phone}`} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--accent-red)',
                  color: '#ffffff',
                  padding: '10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                <Phone size={18} /> Call {data.emergencyContact.phone}
              </a>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No contact provided</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. STANDARD CARD VIEW
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '24px',
      color: 'var(--text-main)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heart style={{ color: 'var(--accent-red)' }} size={24} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Emergency Health Card</h2>
        </div>
        <button 
          onClick={() => setIsEmergencyView(true)} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--accent-red)',
            color: '#ffffff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          <AlertTriangle size={16} /> Quick Emergency View
        </button>
      </div>

      {/* Member Profile Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
        <User size={32} style={{ color: 'var(--text-muted)' }} />
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>{data.name}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.relation}</span>
        </div>
      </div>

      {/* Medical Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Blood Group</span>
          <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--accent-red)' }}>{data.bloodGroup || 'Not specified'}</span>
        </div>

        <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Known Allergies</span>
          <span style={{ fontWeight: '500' }}>{data.allergies || 'None recorded'}</span>
        </div>

        <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Medical Conditions</span>
          <span style={{ fontWeight: '500' }}>{data.conditions || 'No conditions recorded'}</span>
        </div>

        <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Active Medications</span>
          <span style={{ fontWeight: '500' }}>{data.medications || 'None recorded'}</span>
        </div>
      </div>

      {/* Emergency Contact Block */}
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '600' }}>
          <Phone size={18} />
          <span>Emergency Contact</span>
        </div>
        {data.emergencyContact?.phone ? (
          <div>
            <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{data.emergencyContact.name} ({data.emergencyContact.relation})</p>
            <a href={`tel:${data.emergencyContact.phone}`} style={{ color: 'var(--accent-red)', fontWeight: 'bold', textDecoration: 'none' }}>
              {data.emergencyContact.phone}
            </a>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Not available</p>
        )}
      </div>

      {/* Health Overview Summary */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>Health Status Indicators</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
          <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: data.allergies ? 'var(--status-warning)' : 'var(--bg-primary)', color: data.allergies ? '#000' : 'var(--text-muted)' }}>
            {data.allergies ? '⚠️ Allergy Alert' : '✓ No Allergies'}
          </span>
          <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: data.conditions ? 'var(--status-warning)' : 'var(--bg-primary)', color: data.conditions ? '#000' : 'var(--text-muted)' }}>
            {data.conditions ? '📋 Condition Recorded' : '✓ Clear Conditions'}
          </span>
        </div>
      </div>
    </div>
  );
}