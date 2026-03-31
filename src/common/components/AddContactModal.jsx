import { useState } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';

export default function AddContactModal({ isOpen, onClose }) {
  const companies = useDemoStore((s) => s.companies || []);
  const { can, field } = usePersona();
  const showKeyContactCheckbox = field('keyContact.toggle');

  const [form, setForm] = useState({
    name: '',
    company: '',
    role: '',
    city: '',
    email: '',
    phone: '',
    isKeyContact: false,
    isAlumni: false,
  });

  if (!isOpen) return null;
  if (!can('contact.add')) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    // Enforce persona visibility: if key contacts aren't allowed, never submit the flag.
    const payload = {
      ...form,
      isKeyContact: showKeyContactCheckbox ? form.isKeyContact : false,
    };
    demoStore.actions.addContact(payload);
    setForm({
      name: '',
      company: '',
      role: '',
      city: '',
      email: '',
      phone: '',
      isKeyContact: false,
      isAlumni: false,
    });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add Contact</h2>
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
          {showKeyContactCheckbox && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.isKeyContact}
                onChange={(e) => setForm((p) => ({ ...p, isKeyContact: e.target.checked }))}
              /> Key Contact (VIP)
            </label>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.isAlumni} onChange={(e) => setForm((p) => ({ ...p, isAlumni: e.target.checked }))} /> Alumni
          </label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">Add Contact</button>
          </div>
        </form>
      </div>
    </div>
  );
}
