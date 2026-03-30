import { useState, useEffect, useCallback, useMemo } from 'react';
import AiThinkingIndicator from './AiThinkingIndicator';
import { demoStore, useDemoStore } from '../store/demoStore';
import { buildOutreachDraftEmail, buildOutreachTalkingPoints } from '../utils/outreachDraftContext';

export default function AiDraftPanel({ contact, isOpen, onClose }) {
  const companies = useDemoStore((s) => s.companies || []);
  const [phase, setPhase] = useState('thinking');
  const [toField, setToField] = useState('');
  const [subjectField, setSubjectField] = useState('');
  const [bodyField, setBodyField] = useState('');

  const company = useMemo(() => {
    if (!contact?.company) return null;
    return companies.find((c) => c.name === contact.company) || null;
  }, [companies, contact?.company]);

  const talkingPoints = useMemo(
    () => buildOutreachTalkingPoints(contact, company),
    [contact, company]
  );

  useEffect(() => {
    if (!isOpen) {
      setPhase('thinking');
      setToField('');
      setSubjectField('');
      setBodyField('');
      return;
    }
    setPhase('thinking');
    const name = contact?.name || 'contact';
    setToField(
      contact?.email || `${String(name).toLowerCase().replace(/\s+/g, '.')}@example.com`
    );
  }, [isOpen, contact]);

  const handleThinkingComplete = useCallback(() => {
    const { subject, body } = buildOutreachDraftEmail(contact, company, talkingPoints);
    setSubjectField(subject);
    setBodyField(body);
    setPhase('compose');
    demoStore.actions.logActivity({
      type: 'ai.draft.generated',
      entityType: 'contact',
      entityId: contact.id || '',
      entityName: contact.name || '',
      description: 'Generated AI outreach draft with news and talking points',
    });
  }, [contact, company, talkingPoints]);

  function handleSend() {
    demoStore.actions.logInteraction({
      contactName: contact?.name || 'Unknown',
      company: contact?.company || '',
      role: contact?.role || '',
      interactionType: 'Email',
      title: `Email sent: ${subjectField}`,
      outcome: 'Email sent via AI draft',
      notes: bodyField.slice(0, 200),
      source: 'ai-draft',
      avatarUrl: contact?.avatarUrl || '',
      signalTone: contact?.signalTone || 'blue',
      relationshipStatus: contact?.relationship || 'Stable',
      relationshipScore: contact?.relationshipScore ?? 50,
      lastInteracted: contact?.lastInteracted || '',
    });
    setPhase('sent');
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  function handleCopyClose() {
    const block = `Subject: ${subjectField}\n\n${bodyField}`;
    navigator.clipboard?.writeText(block).catch(() => {});
    onClose();
  }

  if (!isOpen) return null;

  if (!contact) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="company-modal company-modal--xs" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h2>Draft outreach</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="close">
              x
            </button>
          </div>
          <p style={{ padding: 16, fontSize: 14, color: '#4b5563', margin: 0 }}>
            Open Draft Outreach from a contact or from an insight whose subject is a person.
          </p>
          <div className="modal-actions" style={{ padding: '0 16px 16px' }}>
            <button type="button" className="primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = contact.name || 'this contact';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal company-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Draft outreach</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="close">
            x
          </button>
        </div>
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 12px' }}>
            Draft is assembled from this contact&apos;s relationship signals and{' '}
            {company ? `${company.name}'s` : 'available'} company news (prototype — no external model).
          </p>

          {phase === 'thinking' && (
            <AiThinkingIndicator
              message="Gathering news and talking points"
              duration={1500}
              onComplete={handleThinkingComplete}
            />
          )}

          {phase === 'compose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {talkingPoints.length > 0 && (
                <section className="ai-draft-talking-points">
                  <p className="modal-label" style={{ marginBottom: 8 }}>
                    Relevant news &amp; talking points
                  </p>
                  <ul className="modal-list" style={{ margin: 0 }}>
                    {talkingPoints.map((p, i) => (
                      <li key={i} style={{ fontSize: 13 }}>
                        <strong style={{ color: '#4338ca' }}>{p.label}</strong>
                        {' — '}
                        {p.text}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <label style={{ fontSize: 13, color: '#374151' }}>
                <strong>To</strong>
                <input
                  type="email"
                  value={toField}
                  onChange={(e) => setToField(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    fontSize: 14,
                    border: '1px solid #d4d4d4',
                    borderRadius: 8,
                    background: '#f9fafb',
                  }}
                />
              </label>
              <label style={{ fontSize: 13, color: '#374151' }}>
                <strong>Subject</strong>
                <input
                  type="text"
                  value={subjectField}
                  onChange={(e) => setSubjectField(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    fontSize: 14,
                    border: '1px solid #d4d4d4',
                    borderRadius: 8,
                  }}
                />
              </label>
              <label style={{ fontSize: 13, color: '#374151' }}>
                <strong>Body</strong>
                <textarea
                  value={bodyField}
                  onChange={(e) => setBodyField(e.target.value)}
                  rows={12}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '10px 12px',
                    fontSize: 14,
                    border: '1px solid #d4d4d4',
                    borderRadius: 8,
                    lineHeight: 1.6,
                    fontFamily: 'Georgia, serif',
                    resize: 'vertical',
                  }}
                />
              </label>
              <div className="modal-actions" style={{ marginTop: 4 }}>
                <button type="button" className="tool-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="tool-btn" onClick={handleCopyClose}>
                  Copy &amp; Close
                </button>
                <button type="button" className="primary" onClick={handleSend}>
                  Send
                </button>
              </div>
            </div>
          )}

          {phase === 'sent' && (
            <div style={{ textAlign: 'center', padding: 32, color: '#16a34a' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>&#10003;</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>Email sent successfully</p>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                Interaction logged for {displayName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
