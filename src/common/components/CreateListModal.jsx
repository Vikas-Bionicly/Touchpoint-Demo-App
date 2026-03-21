import { useState } from 'react';
import { demoStore } from '../store/demoStore';

const LIST_TYPES = ['Practice-based', 'Initiative-based', 'Event-based', 'Referral', 'Personal', 'Trip Planning'];
const LIST_VISIBILITIES = ['Firm-wide', 'Shared', 'Personal'];
const LIST_COLORS = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange', 'bg-cyan', 'bg-rose', 'bg-amber', 'bg-indigo'];

export default function CreateListModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', type: 'Personal', owner: 'You', tag: '', visibility: 'Personal', color: 'bg-blue' });

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    demoStore.actions.createList(form);
    setForm({ name: '', type: 'Personal', owner: 'You', tag: '', visibility: 'Personal', color: 'bg-blue' });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Create List</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <form className="touchpoint-form" onSubmit={handleSubmit}>
          <label>List Name <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
          <label>Type
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {LIST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Owner <input value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} /></label>
          <label>Tag <input value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} placeholder="e.g., Privacy & Security" /></label>
          <label>Visibility
            <select value={form.visibility} onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value }))}>
              {LIST_VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Color
            <select value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}>
              {LIST_COLORS.map((c) => <option key={c} value={c}>{c.replace('bg-', '')}</option>)}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">Create List</button>
          </div>
        </form>
      </div>
    </div>
  );
}
