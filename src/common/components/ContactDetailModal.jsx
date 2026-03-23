import { useState, useMemo } from 'react';
import Icon from './Icon';
import RelationshipScoreGauge from './RelationshipScoreGauge';
import { demoStore, useDemoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';
import { BADGE_MAP } from '../constants/badges';
import { resolveContactAvatarUrl } from '../utils/avatars';

export default function ContactDetailModal({
  contact,
  isOpen,
  onClose,
  onCreateTouchpoint,
  onAddNote,
  onAddToList,
  onManageTags,
  onFirmConnections,
  onDraftOutreach,
  onAiSummary,
  onEdit,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const notes = useDemoStore((s) => s.notes || []);
  const activities = useDemoStore((s) => s.activities || []);
  const { can, field, depth } = usePersona();

  if (!isOpen || !contact) return null;

  const contactNotes = notes.filter((n) => n.contactId === contact.id);
  const contactActivities = activities.filter(
    (a) => a.entityId === contact.id || a.entityName === contact.name
  );
  const avatarSrc = resolveContactAvatarUrl(contact.avatarUrl) || contact.avatarUrl;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'notes', label: 'Notes' },
  ];

  function renderBadges() {
    if (!field('contactBadges') || !contact.contactBadges?.length) return null;
    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
        {contact.contactBadges.map((bid) => {
          const badge = BADGE_MAP[bid];
          if (!badge) return null;
          return (
            <span key={bid} title={badge.label} style={{
              display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
              borderRadius: 10, fontSize: 11, fontWeight: 600,
              background: `${badge.color}20`, color: badge.color, border: `1px solid ${badge.color}40`,
            }}>
              {badge.label}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal contact-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="modal-head" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={avatarSrc}
            alt={contact.name}
            className={`contact-avatar-v2 tone-${contact.signalTone}`}
            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              {contact.name}
              {contact.isKeyContact && <span title="Key Contact" style={{ color: '#f59e0b', fontSize: 16 }}>★</span>}
              {contact.isAlumni && field('alumni.flag') && (
                <span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#dbeafe', color: '#2563eb' }}>Alumni</span>
              )}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{contact.role}</p>
            <p style={{ margin: '1px 0 0', fontSize: 13, color: '#6b7280' }}>{contact.company}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="close modal">x</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 16px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                all: 'unset', cursor: 'pointer', padding: '10px 16px', fontSize: 13, fontWeight: 500,
                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === tab.id ? '#6366f1' : '#6b7280',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 16, maxHeight: 400, overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <div>
              {field('relationshipScore') && (
                <div style={{ marginBottom: 16 }}>
                  <p className="modal-label">Relationship Score</p>
                  <RelationshipScoreGauge metricsCurrent={contact.metricsCurrent} metricsPrevious={contact.metricsPrevious} />
                </div>
              )}
              {field('internalConnections') && (
                <div style={{ marginBottom: 12 }}>
                  <p className="modal-label">Internal connections</p>
                  <p className="modal-value">{contact.internalConnections?.join(', ') || 'None'}</p>
                </div>
              )}
              {field('specialDates') && contact.specialDates?.birthday && (
                <div style={{ marginBottom: 12 }}>
                  <p className="modal-label">Birthday</p>
                  <p className="modal-value">{contact.specialDates.birthday}</p>
                </div>
              )}
              {contact.city && (
                <div style={{ marginBottom: 12 }}>
                  <p className="modal-label">Location</p>
                  <p className="modal-value">{[contact.city, contact.region].filter(Boolean).join(', ')}</p>
                </div>
              )}
              {contact.email && (
                <div style={{ marginBottom: 12 }}>
                  <p className="modal-label">Email</p>
                  <p className="modal-value">{contact.email}</p>
                </div>
              )}
              {renderBadges()}
              {field('relationshipHistory') && (
                <div style={{ marginTop: 12 }}>
                  <p className="modal-label">Relationship history</p>
                  <ul className="modal-list">
                    {contact.relationshipHistory?.slice(0, depth('relationshipHistory')).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <p className="modal-label">Recent interactions</p>
                <ul className="modal-list">
                  {contact.recentInteractions?.slice(0, depth('recentInteractions')).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              {contactActivities.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: 13 }}>No activity recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contactActivities.slice(0, 50).map((act) => (
                    <div key={act.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                      <span style={{ color: '#6b7280', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>{act.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {contactNotes.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: 13 }}>No notes yet.</p>
              ) : (
                <ul className="modal-list">
                  {contactNotes.slice(0, depth('contactNotes')).map((n) => (
                    <li key={n.id}><strong>{n.type}</strong> ({n.visibility}) — {n.text}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Quick action icon bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
          <button className="tool-btn" onClick={() => onFirmConnections?.(contact)}>Firm Connections</button>
          <button className="tool-btn" onClick={() => onAddToList?.(contact)}>Add to List</button>
          <span style={{ width: 1, background: '#e5e7eb', margin: '0 2px' }} />
          <button className="tool-btn" onClick={() => onAddNote?.(contact)}>Add Note</button>
          <button className="tool-btn" onClick={() => onCreateTouchpoint?.(contact)}>Create Touchpoint</button>
          <span style={{ width: 1, background: '#e5e7eb', margin: '0 2px' }} />
          {field('aiDraft') && <button className="tool-btn" onClick={() => onDraftOutreach?.(contact)}>Draft Outreach</button>}
          {field('aiSummary') && <button className="tool-btn" onClick={() => onAiSummary?.(contact)}>AI Summary</button>}
          <span style={{ width: 1, background: '#e5e7eb', margin: '0 2px' }} />
          {can('tag.manage') && <button className="tool-btn" onClick={() => onManageTags?.(contact)}>Tags</button>}
          {can('contact.edit') && <button className="tool-btn" onClick={() => { onEdit?.(contact); onClose(); }}>Edit</button>}
        </div>
      </div>
    </div>
  );
}
