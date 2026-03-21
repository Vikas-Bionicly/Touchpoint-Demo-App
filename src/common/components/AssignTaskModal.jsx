import { useState } from 'react';
import { demoStore } from '../store/demoStore';

const LAWYERS = ['M. Chen', 'A. Patel', 'R. Thompson', 'S. Nakamura', 'L. Martinez', 'J. Kim', 'D. Okafor', 'H. Singh'];

export default function AssignTaskModal({ touchpoint, isOpen, onClose }) {
  const [assignee, setAssignee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [instructions, setInstructions] = useState('');

  if (!isOpen || !touchpoint) return null;

  function handleAssign() {
    if (!assignee) return;
    demoStore.actions.assignTouchpoint(touchpoint.id, assignee, 'BD Team');
    if (instructions.trim()) {
      demoStore.actions.addTouchpointNote({
        touchpointId: touchpoint.id,
        text: `Assignment instructions: ${instructions}`,
        author: 'BD Team',
      });
    }
    setAssignee('');
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
            Deadline
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }} />
          </label>
          <label style={{ display: 'block' }}>
            Instructions
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d4d4d4', marginTop: 4 }} />
          </label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="primary" onClick={handleAssign} disabled={!assignee}>Assign</button>
          </div>
        </div>
      </div>
    </div>
  );
}
