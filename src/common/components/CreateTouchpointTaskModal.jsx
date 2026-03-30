import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { contactRows } from '../constants/contacts';
import { demoStore, useDemoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';
import { VISIT_WORKFLOW_STAGES } from '../constants/visitWorkflow';

const INTERACTION_TYPES = ['Email', 'Meeting', 'Event', 'Call', 'Visit', 'Follow-up'];

function toDueIso(dateOnly) {
  if (!dateOnly) return null;
  const iso = new Date(`${dateOnly}T09:00:00`);
  if (Number.isNaN(iso.getTime())) return null;
  return iso.toISOString();
}

export default function CreateTouchpointTaskModal({ isOpen, onClose, preset }) {
  const { can, persona } = usePersona();
  const storeContacts = useDemoStore((s) => s.contacts || []);
  const contactOptions = storeContacts.length ? storeContacts : contactRows;

  const [contactName, setContactName] = useState('');
  const [title, setTitle] = useState('Touchpoint follow-up');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [onBehalfOf, setOnBehalfOf] = useState('');
  const [interactionType, setInteractionType] = useState('Call');
  const [visitStage, setVisitStage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const list = storeContacts.length ? storeContacts : contactRows;
    const next =
      (preset?.contactName && list.find((c) => c.name === preset.contactName)) || list[0] || null;
    setContactName(next?.name || '');
    setTitle(preset?.title ?? 'Touchpoint follow-up');
    setNotes(preset?.notes ?? '');
    setDueDate(preset?.dueDate ?? '');
    setOnBehalfOf(preset?.onBehalfOf ?? '');
    const nextType = preset?.interactionType || 'Call';
    setInteractionType(nextType);
    setVisitStage(
      preset?.visitStage || (String(nextType).toLowerCase() === 'visit' ? VISIT_WORKFLOW_STAGES[0] : '')
    );
  }, [
    isOpen,
    storeContacts,
    preset?.contactName,
    preset?.title,
    preset?.notes,
    preset?.dueDate,
    preset?.onBehalfOf,
    preset?.interactionType,
    preset?.visitStage,
    preset?.source,
  ]);

  const contact = useMemo(
    () => contactOptions.find((c) => c.name === contactName) || null,
    [contactOptions, contactName]
  );

  if (!isOpen) return null;
  if (!can('touchpoint.create')) return null;

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
              onBehalfOf,
              interactionType,
              visitStage: String(interactionType).toLowerCase() === 'visit' ? visitStage || VISIT_WORKFLOW_STAGES[0] : '',
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
              {contactOptions.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Type
            <select
              value={interactionType}
              onChange={(e) => {
                const v = e.target.value;
                setInteractionType(v);
                if (String(v).toLowerCase() === 'visit') setVisitStage((s) => s || VISIT_WORKFLOW_STAGES[0]);
                else setVisitStage('');
              }}
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {String(interactionType).toLowerCase() === 'visit' && (
            <label>
              Visit stage
              <select value={visitStage || VISIT_WORKFLOW_STAGES[0]} onChange={(e) => setVisitStage(e.target.value)}>
                {VISIT_WORKFLOW_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}

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

          {(persona?.id === 'legal-assistant' || onBehalfOf || preset?.onBehalfOf) && (
            <label style={{ gridColumn: '1 / -1' }}>
              On behalf of
              <input
                value={onBehalfOf}
                onChange={(e) => setOnBehalfOf(e.target.value)}
                placeholder="Assigned lawyer or client team member"
              />
            </label>
          )}

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
