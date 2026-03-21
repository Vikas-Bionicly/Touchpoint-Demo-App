import { useState, useEffect } from 'react';
import { demoStore } from '../store/demoStore';

const ACCOUNT_TYPES = ['Client', 'Prospective', 'Former Client', 'Target'];

export default function UpdateCompanyModal({ company, isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', accountType: '', catCode: '', clientCode: '', gics: '', billingLawyer: '' });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        accountType: company.accountType || company.category1 || '',
        catCode: company.catCode || '',
        clientCode: company.clientCode || '',
        gics: company.gics || '',
        billingLawyer: company.billingLawyer || '',
      });
    }
  }, [company]);

  if (!isOpen || !company) return null;

  function handleSubmit(e) {
    e.preventDefault();
    demoStore.actions.updateCompany(company.id, { ...form, category1: form.accountType });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Edit Company</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <form className="touchpoint-form" onSubmit={handleSubmit}>
          <label>Name <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
          <label>Account Type
            <select value={form.accountType} onChange={(e) => setForm((p) => ({ ...p, accountType: e.target.value }))}>
              {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Cat Code <input value={form.catCode} onChange={(e) => setForm((p) => ({ ...p, catCode: e.target.value }))} /></label>
          <label>Client Code <input value={form.clientCode} onChange={(e) => setForm((p) => ({ ...p, clientCode: e.target.value }))} /></label>
          <label>GICs <input value={form.gics} onChange={(e) => setForm((p) => ({ ...p, gics: e.target.value }))} /></label>
          <label>Billing Lawyer <input value={form.billingLawyer} onChange={(e) => setForm((p) => ({ ...p, billingLawyer: e.target.value }))} /></label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
