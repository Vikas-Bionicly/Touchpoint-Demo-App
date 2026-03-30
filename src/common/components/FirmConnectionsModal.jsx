import Icon from './Icon';
import { firmConnectionsByContactId } from '../constants/connections';
import { demoStore, useDemoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';

export default function FirmConnectionsModal({ contact, isOpen, onClose }) {
  if (!isOpen || !contact) return null;

  const { field, can } = usePersona();
  const contacts = useDemoStore((s) => s.contacts || []);
  const connections = firmConnectionsByContactId[contact.id] || [];
  const showColleagueRole = field('firmConnections.colleagueRole');
  const showActivityDetail = field('firmConnections.activityDetail');
  const canSeeAlumniFlag = field('alumni.flag');
  const alumniByName = new Map(
    contacts.map((c) => [String(c.name || '').toLowerCase(), Boolean(c.isAlumni)])
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>
            Firm connections for {contact.name}
            {canSeeAlumniFlag && contact.isAlumni ? (
              <span className="contact-badge contact-flag-alumni" style={{ marginLeft: 8 }}>
                Alumni
              </span>
            ) : null}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="close firm connections">
            x
          </button>
        </div>

        <div className="modal-body">
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

          <div className="modal-stack" style={{ marginTop: 0 }}>
          <div>
            <p className="modal-label">Colleagues who know this contact</p>
            {!showColleagueRole && !showActivityDetail && connections.length > 0 ? (
              <p className="modal-hint" style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                Names only at your access level (Who Knows Whom).
              </p>
            ) : null}
            <ul className="modal-list">
              {connections.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong>
                  {canSeeAlumniFlag && alumniByName.get(String(c.name || '').toLowerCase()) ? (
                    <span className="contact-badge contact-flag-alumni" style={{ marginLeft: 6 }}>
                      Alumni
                    </span>
                  ) : null}
                  {showColleagueRole && (
                    <>
                      {' '}
                      — {c.role}
                    </>
                  )}
                  {showActivityDetail && (
                    <>
                      <br />
                      <span>
                        Connection: {c.connectionType} · Strength: {c.strength} · Last interaction {c.lastInteraction}
                      </span>
                      {c.note && (
                        <div style={{ marginTop: 4, fontSize: 13 }}>
                          <em>{c.note}</em>
                        </div>
                      )}
                      {can('touchpoint.create') && (
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
                      )}
                    </>
                  )}
                </li>
              ))}
              {connections.length === 0 && <li>No firm connections found for this contact (demo data).</li>}
            </ul>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

