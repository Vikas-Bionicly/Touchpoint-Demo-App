import { useState, useMemo } from 'react';
import DetailActionBar from './DetailActionBar';
import DetailTabBar from './DetailTabBar';
import RelationshipScoreGauge from './RelationshipScoreGauge';
import { demoStore, useDemoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';
import { BADGE_MAP } from '../constants/badges';
import { resolveContactAvatarUrl } from '../utils/avatars';
import { noteDigestSourceLines } from '../utils/noteDigest';

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
  onMeetingBrief,
  onEdit,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const notes = useDemoStore((s) => s.notes || []);
  const activities = useDemoStore((s) => s.activities || []);
  const lists = useDemoStore((s) => s.lists || []);
  const companies = useDemoStore((s) => s.companies || []);
  const companyForPersona = useMemo(
    () => (contact ? companies.find((c) => c.name === contact.company) : null),
    [companies, contact]
  );
  const { can, field, depth, tier } = usePersona({ company: companyForPersona || undefined });

  const referralListsOnContact = useMemo(() => {
    if (!contact) return [];
    return lists.filter((l) => l.type === 'Referral' && (l.memberIds || []).includes(contact.id));
  }, [lists, contact]);

  const mattersAttributedToReferral = useMemo(() => {
    if (!contact) return [];
    const co = companies.find((c) => c.name === contact.company);
    return (co?.matters || []).filter(
      (m) =>
        m.referralSourceContactId === contact.id ||
        (m.referralSourceContactName && m.referralSourceContactName === contact.name)
    );
  }, [companies, contact]);

  const noteDigestPreviewLines = useMemo(() => {
    if (!contact) return [];
    const cn = notes.filter((n) => n.contactId === contact.id);
    return noteDigestSourceLines(cn).slice(0, 2);
  }, [contact, notes]);

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
    ...(onMeetingBrief ? [{ label: 'Meeting brief', onClick: () => onMeetingBrief(contact) }] : []),
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
      <div className="company-modal contact-modal company-modal--md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-header" style={{ padding: '16px 16px 0' }}>
          <img src={avatarSrc} alt={contact.name} className={`detail-header-avatar tone-${contact.signalTone}`} />
          <div className="detail-header-info">
            <h2>
              {contact.name}
              {contact.isKeyContact && field('keyContact.toggle') && (
                <span title="Key Contact" style={{ color: '#f59e0b', fontSize: 16 }}>★</span>
              )}
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
        <div className="modal-body" style={{ padding: 16 }}>
          {activeTab === 'overview' && (
            <div>
              {field('relationshipScore') && (
                <div style={{ marginBottom: 16 }}>
                  <p className="modal-label">Relationship Score</p>
                  <RelationshipScoreGauge metricsCurrent={contact.metricsCurrent} metricsPrevious={contact.metricsPrevious} />
                </div>
              )}
              {field('relationship.aggregate') && (
                <div style={{ marginBottom: 12 }}>
                  <p className="modal-label">Internal pathways (aggregate)</p>
                  <p className="modal-value">
                    Internal connections: {contact.internalConnections?.length ?? 0}
                    {(contact.coordinationPeers?.length ?? 0) > 0
                      ? ` · Parallel outreach signals: ${contact.coordinationPeers.length}`
                      : ''}
                  </p>
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
              {(referralListsOnContact.length > 0 || mattersAttributedToReferral.length > 0) && (
                <div style={{ marginTop: 14, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <p className="modal-label" style={{ marginBottom: 6 }}>Referral context</p>
                  {referralListsOnContact.length > 0 && (
                    <p className="modal-value" style={{ fontSize: 13, marginBottom: 8 }}>
                      On referral list{referralListsOnContact.length > 1 ? 's' : ''}:{' '}
                      {referralListsOnContact.map((l) => l.name).join(', ')}
                    </p>
                  )}
                  {mattersAttributedToReferral.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, color: '#166534', fontWeight: 600, margin: '0 0 4px' }}>Matter attribution (referred by this contact)</p>
                      <ul className="modal-list" style={{ margin: 0 }}>
                        {mattersAttributedToReferral.map((m) => (
                          <li key={m.id} style={{ fontSize: 13 }}>
                            <strong>{m.name}</strong>
                            {m.status ? <span style={{ color: '#6b7280' }}> · {m.status}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {field('relationshipHistory') && (
                <div style={{ marginTop: 12 }}>
                  <p className="modal-label">Relationship history</p>
                  <ul className="modal-list">
                    {contact.relationshipHistory?.slice(0, depth('relationshipHistory')).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <p className="modal-label">{field('recentInteractions.detail') ? 'Recent interactions' : 'Interaction recency'}</p>
                {field('recentInteractions.detail') ? (
                  <ul className="modal-list">
                    {contact.recentInteractions?.slice(0, depth('recentInteractions')).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="modal-value" style={{ fontSize: 13, lineHeight: 1.5 }}>
                    Last touch: {contact.lastInteracted || '—'}
                    <br />
                    Days since last interaction: {contact.metricsCurrent?.daysSinceLastInteraction ?? '—'}
                    <br />
                    Interactions (90d): {contact.metricsCurrent?.interactionsLast90d ?? '—'}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              {field('recentInteractions.detail') && tier === 2 && (
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  Abstract tier view: interaction summaries shown without full narrative detail.
                </p>
              )}
              {contactActivities.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: 13 }}>No activity recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contactActivities.slice(0, 50).map((act) => (
                    <div key={act.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                      <span style={{ color: '#6b7280', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {new Date(act.createdAt).toLocaleDateString()} {field('recentInteractions.detail') ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {field('recentInteractions.detail') ? (
                        <span>
                          {tier === 2
                            ? String(act.description || '').split(':')[0] || 'Activity summary'
                            : act.description}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {field('aiSummary') && contactNotes.length > 0 && (
                <div className="note-digest-preview">
                  <p className="modal-label">AI note digest</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
                    Snapshot from your notes (open for full AI-style summary).
                  </p>
                  <ul className="modal-list" style={{ marginBottom: 10 }}>
                    {noteDigestPreviewLines.map((line) => (
                      <li key={line.id} style={{ fontSize: 13 }}>
                        <strong>{line.type}</strong>
                        <span style={{ color: '#6b7280' }}> ({line.visibility})</span>
                        {' — '}
                        {line.excerpt}
                      </li>
                    ))}
                  </ul>
                  {contactNotes.length > noteDigestPreviewLines.length && (
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>
                      +{contactNotes.length - noteDigestPreviewLines.length} more in list below
                    </p>
                  )}
                  <button
                    type="button"
                    className="detail-action-btn"
                    onClick={() => onAiSummary?.(contact)}
                  >
                    Open full digest
                  </button>
                </div>
              )}
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
