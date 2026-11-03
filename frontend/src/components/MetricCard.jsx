import React from 'react';

export default function MetricCard({ label, count, icon, isSelected, onClick, color = '#432177' }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: isSelected ? '#f5f0ff' : '#ffffff',
        border: `1px solid ${isSelected ? '#432177' : '#e6e6e9'}`,
        borderRadius: '13px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isSelected ? '0 0 0 1px #432177' : '0 1px 3px rgba(0,0,0,0.03)'
      }}
    >
      <div>
        <div style={{ fontSize: '13px', color: '#73767b', fontWeight: '500', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#242424', fontFamily: 'JetBrains Mono, monospace' }}>
          {count}
        </div>
      </div>
      {icon && (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: `${color}15`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
