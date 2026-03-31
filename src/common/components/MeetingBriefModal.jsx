import { useEffect, useMemo } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';
import { formatLastTouchSourceLine } from '../utils/lastInteractionAttribution';
import {
  buildMeetingPrepAiNarrative,
  pickCompanyNewsForPrep,
  topHighlightedTalkingPoints,
} from '../utils/meetingPrepSummary';
import { usePersona } from '../hooks/usePersona';

function buildTalkingPoints(contact, openTasks, newsItems, referralMeta) {
  const pts = [];
  pts.push(
    `Open by referencing recent context (${contact.lastInteraction || 'last logged activity'}) and confirm objectives for this meeting.`
  );
  if (contact.relationship === 'Fading' || contact.relationship === 'Cold') {
    pts.push('Relationship trend is softening — agree on a specific next step and owner before you wrap.');
  } else if (contact.relationship === 'Good') {
    pts.push('Momentum is positive — reinforce value delivered and explore one expansion thread (practice or geography).');
  }
  if (openTasks.length) {
    pts.push(
      `Cover open follow-up: “${openTasks[0].title}”` +
        (openTasks.length > 1 ? ` (+${openTasks.length - 1} other open touchpoint${openTasks.length > 2 ? 's' : ''})` : '') +
        '.'
    );
  }
  newsItems.forEach((n) => {
    pts.push(
      `Company talking point: ${n.title}${n.type ? ` (${n.type})` : ''} — connect firm strengths to this development if it fits the agenda.`
    );
  });
  if (contact.internalConnections?.length) {
    pts.push(
      `If alignment issues appear, loop in ${contact.internalConnections[0]} for a coordinated firm message.`
    );
  }
  if (referralMeta?.referralListCount) {
    pts.push(
      `Referral relationship: on ${referralMeta.referralListCount} firm referral list${referralMeta.referralListCount > 1 ? 's' : ''}` +
        (referralMeta.referralListPreview ? ` (${referralMeta.referralListPreview})` : '') +
        ' — reinforce trust and any introductions already made.'
    );
  }
  if (referralMeta?.referredMatterCount) {
    pts.push(
      `Matter attribution: ${referralMeta.referredMatterCount} matter record${referralMeta.referredMatterCount > 1 ? 's' : ''} credit this contact as referral source — acknowledge impact and explore organic follow-on.`
    );
  }
  return pts.slice(0, 8);
}

export default function MeetingBriefModal({ contact, isOpen, onClose }) {
  const notes = useDemoStore((s) => s.notes || []);
  const touchpoints = useDemoStore((s) => s.touchpoints || []);
  const companies = useDemoStore((s) => s.companies || []);
  const lists = useDemoStore((s) => s.lists || []);
  const { field, depth } = usePersona();
  const contactNotesDepth = depth('contactNotes');

  const company = useMemo(
    () => companies.find((c) => c.name === contact?.company),
    [companies, contact?.company]
  );

  const contactNotes = useMemo(() => {
    if (!contact) return [];
    return notes
      .filter((n) => n.contactId === contact.id || n.contactName === contact.name)
      .slice(0, contactNotesDepth);
  }, [notes, contact, contactNotesDepth]);

  const openTasks = useMemo(() => {
    if (!contact) return [];
    return touchpoints.filter(
      (tp) =>
        tp.contactName === contact.name &&
        tp.status === 'open' &&
        tp.kind === 'task'
    );
  }, [touchpoints, contact]);

  const newsItems = useMemo(() => {
    if (!field('companyNews') || !company?.newsItems?.length) return [];
    return pickCompanyNewsForPrep(company.newsItems, 2);
  }, [company, field]);

  const referralMeta = useMemo(() => {
    if (!contact) return null;
    const refLists = lists.filter(
      (l) => l.type === 'Referral' && (l.memberIds || []).includes(contact.id)
    );
    const co = companies.find((c) => c.name === contact.company);
    const referredMatterCount = (co?.matters || []).filter(
      (m) => m.referralSourceContactId === contact.id
    ).length;
    return {
      referralListCount: refLists.length,
      referralListPreview: refLists
        .slice(0, 2)
        .map((l) => l.name)
        .join(', '),
      referredMatterCount,
    };
  }, [lists, companies, contact]);

  const talkingPoints = useMemo(
    () => (contact ? buildTalkingPoints(contact, openTasks, newsItems, referralMeta) : []),
    [contact, openTasks, newsItems, referralMeta]
  );

  const aiPrepNarrative = useMemo(
    () =>
      contact
        ? buildMeetingPrepAiNarrative(contact, company, {
            openTasks,
            newsItems,
            contactNotes,
            referralMeta,
          })
        : '',
    [contact, company, openTasks, newsItems, contactNotes, referralMeta]
  );

  const highlightedTalkingPoints = useMemo(
    () => topHighlightedTalkingPoints(talkingPoints, 3),
    [talkingPoints]
  );

  const additionalTalkingPoints = useMemo(
    () => talkingPoints.slice(highlightedTalkingPoints.length),
    [talkingPoints, highlightedTalkingPoints.length]
  );

  useEffect(() => {
    if (!isOpen || !contact) return;
    demoStore.actions.logActivity({
      type: 'meeting_brief.viewed',
      entityType: 'contact',
      entityId: contact.id || '',
      entityName: contact.name,
      description: `Opened meeting brief (with AI prep summary) for ${contact.name}`,
    });
  }, [isOpen, contact]);

  if (!isOpen || !contact) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="company-modal meeting-brief-modal company-modal--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Meeting brief</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="close">
            x
          </button>
        </div>

        <div style={{ padding: '0 16px 8px', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{contact.name}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4b5563' }}>
            {contact.role} · {contact.company}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>
            Last interaction: {contact.lastInteraction || '—'} · Relationship:{' '}
            <strong>{contact.relationship}</strong>
          </p>
          {contact.lastInteractionAttribution && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
              Source: {formatLastTouchSourceLine(contact.lastInteractionAttribution)}
            </p>
          )}
        </div>

        <div style={{ padding: 16, maxHeight: 'min(70vh, 520px)', overflowY: 'auto' }}>
          <section className="meeting-brief-section meeting-brief-ai-prep">
            <p className="modal-label">AI prep summary</p>
            <div className="meeting-brief-ai-prep-narrative">{aiPrepNarrative}</div>
            {highlightedTalkingPoints.length > 0 && (
              <>
                <p className="modal-label" style={{ marginTop: 14 }}>
                  Highlighted talking points
                </p>
                <ol className="meeting-brief-highlight-list">
                  {highlightedTalkingPoints.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </>
            )}
            {additionalTalkingPoints.length > 0 && (
              <>
                <p className="modal-label" style={{ marginTop: 14 }}>
                  Additional angles
                </p>
                <ul className="modal-list meeting-brief-talking-points">
                  {additionalTalkingPoints.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="meeting-brief-section">
            <p className="modal-label">Open touchpoints</p>
            {openTasks.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>No open touchpoint tasks for this contact.</p>
            ) : (
              <ul className="modal-list">
                {openTasks.slice(0, 8).map((tp) => (
                  <li key={tp.id}>
                    <strong>[{tp.interactionType || 'Task'}]</strong> {tp.title}
                    {tp.dueAt && (
                      <span style={{ color: '#6b7280', fontSize: 12 }}>
                        {' '}
                        · Due {new Date(tp.dueAt).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {field('contactNotes') && (
            <section className="meeting-brief-section">
              <p className="modal-label">Recent notes</p>
              {contactNotes.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>No notes on file.</p>
              ) : (
                <ul className="modal-list">
                  {contactNotes.map((n) => (
                    <li key={n.id}>
                      <strong>{n.type}</strong> ({n.visibility}) — {n.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {field('companyNews') && company && (
            <section className="meeting-brief-section">
              <p className="modal-label">Company intelligence</p>
              {newsItems.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                  No prioritized news items for {company.name}.
                </p>
              ) : (
                <ul className="modal-list">
                  {newsItems.map((n, i) => (
                    <li key={i}>
                      <strong>{n.type || 'News'}</strong> — {n.title}
                      {n.summary && (
                        <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>{n.summary}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <button type="button" className="tool-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
