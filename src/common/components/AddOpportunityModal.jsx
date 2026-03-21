import { useState } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';

const OPP_TYPES = ['Pitch', 'RFP', 'Panel', 'Proposal'];
const OPP_STATUSES = ['Pending', 'Won', 'Lost'];

export default function AddOpportunityModal({ isOpen, onClose, preselectedCompanyId }) {
  const companies = useDemoStore((s) => s.companies || []);
  const [form, setForm] = useState({ companyId: preselectedCompanyId || '', name: '', type: 'Pitch', status: 'Pending' });

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.companyId || !form.name.trim()) return;
    demoStore.actions.addOpportunity(form);
    setForm({ companyId: preselectedCompanyId || '', name: '', type: 'Pitch', status: 'Pending' });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add Opportunity</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <form className="touchpoint-form" onSubmit={handleSubmit}>
          <label>Company
            <select value={form.companyId} onChange={(e) => setForm((p) => ({ ...p, companyId: e.target.value }))} required>
              <option value="">Select...</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Opportunity Name <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
          <label>Type
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {OPP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Status
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              {OPP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">Add Opportunity</button>
          </div>
        </form>
      </div>
    </div>
  );
}
