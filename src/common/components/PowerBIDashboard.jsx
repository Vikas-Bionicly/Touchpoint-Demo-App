import { useState } from 'react';

const TABS = ['Overview', 'Revenue', 'Relationships', 'Pipeline'];

export default function PowerBIDashboard({ company }) {
  const [activeTab, setActiveTab] = useState('Overview');

  if (!company) return null;

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', background: '#f9fafb',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              background: activeTab === tab ? '#fff' : 'transparent',
              border: 'none', borderBottom: activeTab === tab ? '2px solid #b91c1c' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div style={{ padding: 24, minHeight: 180, textAlign: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
          Power BI Dashboard — {activeTab}
        </div>
        <div style={{
          background: '#f3f4f6', borderRadius: 8, padding: 32, border: '2px dashed #d1d5db',
          color: '#9ca3af', fontSize: 14,
        }}>
          {activeTab === 'Overview' && `${company.name} — Client overview dashboard placeholder. Revenue: ${company.revenue}, Matters: ${company.matters?.length || 0}, Score: ${company.relationshipScore}`}
          {activeTab === 'Revenue' && `Revenue trend visualization for ${company.name}. Historical: ${(company.revenueHistory || []).map((r) => `${r.period}: $${r.value.toFixed(1)}M`).join(', ')}`}
          {activeTab === 'Relationships' && `Relationship analytics for ${company.name}. Key contacts: ${(company.keyContacts || []).join(', ')}. Trend: ${company.relationshipTrend}`}
          {activeTab === 'Pipeline' && `Pipeline analytics for ${company.name}. Opportunities: ${(company.opportunities || []).map((o) => `${o.name} (${o.status})`).join(', ')}`}
        </div>
      </div>
    </div>
  );
}
