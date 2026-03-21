import { useState } from 'react';

export default function RecentInteractionsModal({ company, isOpen, onClose }) {
  const [tab, setTab] = useState('yours');

  if (!isOpen || !company) return null;

  const yourInteractions = (company.recentInteractions || []).map((text, i) => ({
    id: `your-${i}`,
    text,
    who: 'You',
  }));

  const firmInteractions = [
    { id: 'firm-1', text: `${company.keyContacts?.[0] || 'Colleague'} sent regulatory briefing`, who: company.keyContacts?.[0] || 'Colleague' },
    { id: 'firm-2', text: 'BD team sent event invitation to 3 contacts', who: 'BD Team' },
    { id: 'firm-3', text: 'Marketing sent quarterly newsletter', who: 'Marketing' },
  ];

  const rows = tab === 'yours' ? yourInteractions : firmInteractions;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Recent Interactions — {company.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className={tab === 'yours' ? 'primary' : 'tool-btn'}
              onClick={() => setTab('yours')}
              style={{ fontSize: 13 }}
            >
              Your Interactions
            </button>
            <button
              type="button"
              className={tab === 'firm' ? 'primary' : 'tool-btn'}
              onClick={() => setTab('firm')}
              style={{ fontSize: 13 }}
            >
              Firm-wide
            </button>
          </div>

          {rows.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: 13 }}>No interactions found.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r) => (
              <div key={r.id} style={{
                background: '#f9fafb', borderRadius: 8, padding: '8px 14px',
                border: '1px solid #e5e7eb', fontSize: 13,
              }}>
                <strong>{r.who}</strong> — {r.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
