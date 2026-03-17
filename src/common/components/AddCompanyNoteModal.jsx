import { useState } from 'react';
import { demoStore } from '../store/demoStore';

const NOTE_TYPES = [
  'General',
  'Meeting Notes',
  'Client Preferences',
  'Relationship Context',
  'Special Dates',
  'Personal Interests',
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private (only you)' },
  { value: 'shared', label: 'Shared (specific colleagues)' },
  { value: 'firm', label: 'Firm-wide' },
];

export default function AddCompanyNoteModal({ company, isOpen, onClose }) {
  const [noteType, setNoteType] = useState('General');
  const [visibility, setVisibility] = useState('private');
  const [text, setText] = useState('');
  const [shareWith, setShareWith] = useState('');

  if (!isOpen || !company) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add Note for {company.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="close modal">
            x
          </button>
        </div>

        <form
          className="touchpoint-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            demoStore.actions.addCompanyNote({
              companyId: company.id,
              companyName: company.name,
              type: noteType,
              visibility,
              text,
              shareWith,
            });
            setText('');
            setShareWith('');
            setNoteType('General');
            setVisibility('private');
            onClose();
          }}
        >
          <label>
            Note type
            <select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
              {NOTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            Visibility
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Share with (for shared notes)
            <input
              value={shareWith}
              onChange={(e) => setShareWith(e.target.value)}
              placeholder="Names or group (optional)"
            />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Details
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Rich description, preferences, context..."
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

