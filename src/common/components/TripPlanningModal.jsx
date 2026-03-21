import { useState, useMemo } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';

export default function TripPlanningModal({ isOpen, onClose }) {
  const contacts = useDemoStore((s) => s.contacts || []);
  const [cityFilter, setCityFilter] = useState('');
  const [selected, setSelected] = useState({});
  const [tripName, setTripName] = useState('');

  const cities = useMemo(() => {
    const set = new Set(contacts.map((c) => c.city).filter(Boolean));
    return Array.from(set).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    if (!cityFilter) return contacts;
    return contacts.filter((c) => (c.city || '').toLowerCase().includes(cityFilter.toLowerCase()));
  }, [contacts, cityFilter]);

  if (!isOpen) return null;

  function handleCreate() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length || !tripName.trim()) return;
    demoStore.actions.createList({
      name: tripName,
      type: 'Trip Planning',
      visibility: 'Personal',
      memberIds: ids,
      tag: cityFilter || 'Travel',
    });
    setSelected({});
    setTripName('');
    setCityFilter('');
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <h2>Plan a Trip</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <div style={{ padding: 16 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            City / Region
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }}>
              <option value="">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #e5e5e5', borderRadius: 8, marginBottom: 12 }}>
            {filtered.map((c) => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', fontSize: 13, borderBottom: '1px solid #f9fafb' }}>
                <input type="checkbox" checked={!!selected[c.id]} onChange={(e) => setSelected((p) => ({ ...p, [c.id]: e.target.checked }))} />
                <strong>{c.name}</strong> — {c.company} ({c.city || 'N/A'})
              </label>
            ))}
          </div>

          <label style={{ display: 'block', marginBottom: 12 }}>
            Trip List Name
            <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="e.g., Calgary Trip – March 2026" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }} />
          </label>

          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="primary" onClick={handleCreate} disabled={!tripName.trim() || !Object.values(selected).some(Boolean)}>
              Create Trip List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
