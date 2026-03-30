import { useEffect, useState } from 'react';
import { demoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';

const LAWYERS = ['M. Chen', 'A. Patel', 'R. Thompson', 'S. Nakamura', 'L. Martinez', 'J. Kim', 'D. Okafor', 'H. Singh'];

export default function AssignTaskModal({ touchpoint, isOpen, onClose }) {
  const { can } = usePersona();
  const [assignee, setAssignee] = useState('');
  const [principal, setPrincipal] = useState('');
  const [onBehalfOf, setOnBehalfOf] = useState('');
  const [deadline, setDeadline] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (!touchpoint) return;
    setAssignee(touchpoint.assignedTo || '');
    setPrincipal(touchpoint.principal || '');
    setOnBehalfOf(touchpoint.onBehalfOf || '');
    setDeadline(
      touchpoint.dueAt ? new Date(touchpoint.dueAt).toISOString().slice(0, 10) : ''
    );
  }, [touchpoint]);

  if (!isOpen || !touchpoint) return null;
  if (!can('touchpoint.assign')) return null;

  function handleAssign() {
    if (!assignee && !principal) return;

    const dueAtIso = deadline ? new Date(`${deadline}T09:00:00`).toISOString() : undefined;
    demoStore.actions.assignTouchpoint(touchpoint.id, {
      assignedTo: assignee,
      assignedBy: 'BD Team',
      principal,
      dueAt: dueAtIso,
      onBehalfOf,
    });

    if (instructions.trim()) {
      demoStore.actions.addTouchpointNote({
        touchpointId: touchpoint.id,
        text: `Assignment instructions: ${instructions}`,
        author: 'BD Team',
      });
    }
    setAssignee('');
    setPrincipal('');
    setOnBehalfOf('');
    setDeadline('');
    setInstructions('');
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Assign Task</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#374151' }}>
            Assigning: <strong>{touchpoint.title}</strong> for {touchpoint.contactName}
          </div>
          <label style={{ display: 'block' }}>
            Assign to
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }}>
              <option value="">Select lawyer...</option>
              {LAWYERS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label style={{ display: 'block' }}>
            Principal
            <select value={principal} onChange={(e) => setPrincipal(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }}>
              <option value="">Select principal...</option>
              {LAWYERS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label style={{ display: 'block' }}>
            On behalf of
            <input value={onBehalfOf} onChange={(e) => setOnBehalfOf(e.target.value)} placeholder="Lawyer/client team member" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block' }}>
            Deadline
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block' }}>
            Instructions
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }} />
          </label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="primary" onClick={handleAssign} disabled={!assignee && !principal}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
