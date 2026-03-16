import { useMemo, useState } from 'react';
import Icon from './Icon';
import { contactRows } from '../constants/contacts';
import { demoStore } from '../store/demoStore';

function byName(name) {
  return contactRows.find((c) => c.name === name) || null;
}

function toDueIso(dateOnly) {
  if (!dateOnly) return null;
  const iso = new Date(`${dateOnly}T09:00:00`);
  if (Number.isNaN(iso.getTime())) return null;
  return iso.toISOString();
}

export default function CreateTouchpointTaskModal({ isOpen, onClose, preset }) {
  const presetContact = preset?.contactName ? byName(preset.contactName) : null;
  const [contactName, setContactName] = useState(presetContact?.name || contactRows[0]?.name || '');
  const [title, setTitle] = useState(preset?.title || 'Touchpoint follow-up');
  const [notes, setNotes] = useState(preset?.notes || '');
  const [dueDate, setDueDate] = useState(preset?.dueDate || '');

  const contact = useMemo(() => byName(contactName), [contactName]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Create Touchpoint</h2>
          <button className="modal-close" onClick={onClose} aria-label="close modal">
            x
          </button>
        </div>

        <form
          className="touchpoint-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!contactName.trim()) return;

            demoStore.actions.addTouchpointTask({
              contactName,
              company: preset?.company || contact?.company || '',
              role: preset?.role || contact?.role || '',
              title,
              notes,
              dueAt: toDueIso(dueDate),
              avatarUrl: contact?.avatarUrl || '',
              signalTone: contact?.signalTone || 'blue',
              relationshipStatus: contact?.relationship || preset?.relationshipStatus || 'Stable',
              relationshipScore: contact?.relationshipScore ?? preset?.relationshipScore ?? 50,
              lastInteracted: contact?.lastInteracted || '',
              source: preset?.source || 'create-touchpoint-modal',
            });

            onClose();
          }}
        >
          <label>
            Contact
            <select value={contactName} onChange={(e) => setContactName(e.target.value)}>
              {contactRows.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Subject
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the touchpoint" />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Context and talking points" />
          </label>

          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              <Icon name="send" className="btn-icon" />
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

