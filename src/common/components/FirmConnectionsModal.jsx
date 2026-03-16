import Icon from './Icon';
import { firmConnectionsByContactId } from '../constants/connections';
import { demoStore } from '../store/demoStore';

export default function FirmConnectionsModal({ contact, isOpen, onClose }) {
  if (!isOpen || !contact) return null;

  const connections = firmConnectionsByContactId[contact.id] || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Firm connections for {contact.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="close firm connections">
            x
          </button>
        </div>

        <div className="modal-grid">
          <div>
            <p className="modal-label">Overall connection strength</p>
            <p className="modal-value">
              {connections.length > 0 ? 'Strong coverage' : 'No known connections'}
            </p>
          </div>
          <div>
            <p className="modal-label">Connections count</p>
            <p className="modal-value">{connections.length}</p>
          </div>
        </div>

        <div className="modal-stack">
          <div>
            <p className="modal-label">Colleagues who know this contact</p>
            <ul className="modal-list">
              {connections.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong> — {c.role}
                  <br />
                  <span>
                    Connection: {c.connectionType} · Strength: {c.strength} · Last interaction {c.lastInteraction}
                  </span>
                  {c.note && (
                    <div style={{ marginTop: 4, fontSize: 13 }}>
                      <em>{c.note}</em>
                    </div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <button
                      className="tool-btn"
                      type="button"
                      onClick={() => {
                        demoStore.actions.addTouchpointTask({
                          contactName: contact.name,
                          company: contact.company,
                          role: contact.role,
                          title: `Request intro from ${c.name} to ${contact.name}`,
                          notes: `Coordinate with ${c.name} (${c.role}) for a warm introduction to ${contact.name}.`,
                          source: 'firm-connections:request-intro',
                        });
                        onClose();
                      }}
                    >
                      <Icon name="send" className="btn-icon" />
                      Request intro
                    </button>
                  </div>
                </li>
              ))}
              {connections.length === 0 && <li>No firm connections found for this contact (demo data).</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

