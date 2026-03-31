import { useEffect, useState } from 'react';
import { demoStore } from '../store/demoStore';

const TYPES = ['Email Campaign', 'Event Invite', 'Attendance', 'Bulletin Distribution', 'Webinar Engagement'];

export default function MarketingEngagementModal({ isOpen, onClose, list, contact }) {
  const [form, setForm] = useState({
    type: 'Email Campaign',
    date: new Date().toISOString().slice(0, 10),
    title: '',
    outcome: 'Engaged',
    description: '',
  });

  useEffect(() => {
    if (!isOpen || !list || !contact) return;
    setForm({
      type: 'Email Campaign',
      date: new Date().toISOString().slice(0, 10),
      title: `Campaign touch: ${contact.name}`,
      outcome: 'Engaged',
      description: `Contact-level marketing activity in ${list.name}`,
    });
  }, [isOpen, list, contact]);

  if (!isOpen || !list || !contact) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Log Marketing Engagement</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">
            x
          </button>
        </div>
        <form
          className="touchpoint-form"
          onSubmit={(e) => {
            e.preventDefault();
            demoStore.actions.logMarketingEngagement({
              listId: list.id,
              contactId: contact.id,
              ...form,
            });
            onClose();
          }}
        >
          <label>
            Contact
            <input value={`${contact.name} (${contact.company || 'Company'})`} disabled />
          </label>
          <label>
            Activity Type
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Title
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </label>
          <label>
            Outcome
            <select value={form.outcome} onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))}>
              <option value="Engaged">Engaged</option>
              <option value="Responded">Responded</option>
              <option value="Attended">Attended</option>
              <option value="No response">No response</option>
            </select>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Description
            <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Save Marketing Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

