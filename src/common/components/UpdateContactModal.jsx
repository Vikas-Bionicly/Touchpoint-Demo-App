import { useState, useEffect } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';

export default function UpdateContactModal({ contact, isOpen, onClose }) {
  const companies = useDemoStore((s) => s.companies || []);
  const [form, setForm] = useState({ name: '', company: '', role: '', city: '', email: '', phone: '' });
  const { can } = usePersona();

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name || '',
        company: contact.company || '',
        role: contact.role || '',
        city: contact.city || '',
        email: contact.email || '',
        phone: contact.phone || '',
      });
    }
  }, [contact]);

  if (!isOpen || !contact) return null;
  if (!can('contact.edit')) return null;

  function handleSubmit(e) {
    e.preventDefault();
    demoStore.actions.updateContact(contact.id, form);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Edit Contact</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <form className="touchpoint-form" onSubmit={handleSubmit}>
          <label>Name <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
          <label>Company
            <select value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}>
              <option value="">Select...</option>
              {companies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <label>Role <input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} /></label>
          <label>City <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></label>
          <label>Email <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></label>
          <label>Phone <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
