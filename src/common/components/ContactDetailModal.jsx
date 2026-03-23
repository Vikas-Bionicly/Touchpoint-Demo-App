import { useState, useMemo } from 'react';
import Icon from './Icon';
import DetailActionBar from './DetailActionBar';
import DetailTabBar from './DetailTabBar';
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
    { id: 'activity', label: 'Activity', count: contactActivities.length },
    { id: 'notes', label: 'Notes', count: contactNotes.length },
  ];

  const actions = [
    { label: 'Firm Connections', onClick: () => onFirmConnections?.(contact) },
    { label: 'Add to List', onClick: () => onAddToList?.(contact) },
    { divider: true },
    { label: 'Add Note', onClick: () => onAddNote?.(contact) },
    { label: 'Create Touchpoint', onClick: () => onCreateTouchpoint?.(contact) },
    { divider: true },
    ...(field('aiDraft') ? [{ label: 'Draft Outreach', onClick: () => onDraftOutreach?.(contact) }] : []),
    ...(field('aiSummary') ? [{ label: 'AI Summary', onClick: () => onAiSummary?.(contact) }] : []),
    ...((field('aiDraft') || field('aiSummary')) ? [{ divider: true }] : []),
    ...(can('tag.manage') ? [{ label: 'Tags', onClick: () => onManageTags?.(contact) }] : []),
    ...(can('contact.edit') ? [{ label: 'Edit', onClick: () => { onEdit?.(contact); onClose(); } }] : []),
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
        <div className="detail-header" style={{ padding: '16px 16px 0' }}>
          <img src={avatarSrc} alt={contact.name} className={`detail-header-avatar tone-${contact.signalTone}`} />
          <div className="detail-header-info">
            <h2>
              {contact.name}
              {contact.isKeyContact && <span title="Key Contact" style={{ color: '#f59e0b', fontSize: 16 }}>★</span>}
              {contact.isAlumni && field('alumni.flag') && (
                <span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#dbeafe', color: '#2563eb' }}>Alumni</span>
              )}
            </h2>
            <p>{contact.role}</p>
            <p>{contact.company}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="close modal">x</button>
        </div>

        {/* Action bar */}
        <div style={{ padding: '0 16px' }}>
          <DetailActionBar actions={actions} />
        </div>

        {/* Tab bar */}
        <div style={{ padding: '0 16px' }}>
          <DetailTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
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
      </div>
    </div>
  );
}
