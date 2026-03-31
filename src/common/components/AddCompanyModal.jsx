import { useState } from 'react';
import { demoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';

const ACCOUNT_TYPES = ['Client', 'Prospective', 'Former Client', 'Target'];
const INDUSTRIES = ['Technology', 'Financial Services', 'Healthcare', 'Energy', 'Real Estate', 'Retail', 'Manufacturing'];

export default function AddCompanyModal({ isOpen, onClose }) {
  const { can, field } = usePersona();
  const [form, setForm] = useState({
    name: '',
    accountType: 'Prospective',
    industry: '',
    catCode: '',
    clientCode: '',
    gics: '',
    billingLawyer: '',
  });

  if (!isOpen) return null;
  if (!can('company.add')) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    demoStore.actions.addCompany(form);
    setForm({ name: '', accountType: 'Prospective', industry: '', catCode: '', clientCode: '', gics: '', billingLawyer: '' });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add Company</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <form className="touchpoint-form" onSubmit={handleSubmit}>
          <label>Name <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
          <label>Account Type
            <select value={form.accountType} onChange={(e) => setForm((p) => ({ ...p, accountType: e.target.value }))}>
              {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Industry
            <select value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}>
              <option value="">Select...</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          {field('catCode') && (
            <label>
              Cat Code <input value={form.catCode} onChange={(e) => setForm((p) => ({ ...p, catCode: e.target.value }))} />
            </label>
          )}
          {field('clientCode') && (
            <label>
              Client Code <input value={form.clientCode} onChange={(e) => setForm((p) => ({ ...p, clientCode: e.target.value }))} />
            </label>
          )}
          {field('gics') && (
            <label>
              GICs <input value={form.gics} onChange={(e) => setForm((p) => ({ ...p, gics: e.target.value }))} />
            </label>
          )}
          {field('billingLawyer') && (
            <label>
              Billing Lawyer <input value={form.billingLawyer} onChange={(e) => setForm((p) => ({ ...p, billingLawyer: e.target.value }))} />
            </label>
          )}
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">Add Company</button>
          </div>
        </form>
      </div>
    </div>
  );
}
