import { useState, useEffect, useCallback } from 'react';
import AiThinkingIndicator from './AiThinkingIndicator';
import { demoStore } from '../store/demoStore';

const DRAFT_TEMPLATES = [
  { subject: 'Following up on our recent engagement', body: "Dear {name},\n\nI wanted to reach out following our recent engagement. I've been keeping an eye on developments in your sector and thought you might find the attached regulatory update relevant to your current initiatives.\n\nWould you have time for a brief call this week to discuss how these changes might impact your operations?\n\nBest regards,\nJohn Doe" },
  { subject: 'Congratulations and catching up', body: "Hi {name},\n\nI hope this message finds you well. I noticed some exciting developments at {company} recently and wanted to congratulate you.\n\nI'd love to catch up over coffee and discuss how we might support your team as you navigate these changes. Are you available next Tuesday or Wednesday?\n\nWarm regards,\nJohn Doe" },
  { subject: 'Great connecting at the recent event', body: "Dear {name},\n\nThank you for your time at our recent event. It was great connecting with you and learning more about {company}'s strategic priorities.\n\nAs discussed, I've attached a brief overview of our capabilities in the areas most relevant to your needs. I'd welcome the opportunity to explore how we can add value.\n\nBest,\nJohn Doe" },
  { subject: 'Sharing relevant industry insights', body: "Hi {name},\n\nI came across some recent developments in your industry that I thought you'd find valuable. Given {company}'s position in the market, these changes could present both opportunities and considerations worth discussing.\n\nI'd be happy to walk you through our analysis over a quick call. Let me know what works for your schedule.\n\nBest regards,\nJohn Doe" },
];

export default function AiDraftPanel({ contactName, contactEmail, companyName, isOpen, onClose }) {
  const [phase, setPhase] = useState('thinking'); // 'thinking' | 'compose' | 'sent'
  const [toField, setToField] = useState('');
  const [subjectField, setSubjectField] = useState('');
  const [bodyField, setBodyField] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPhase('thinking');
      setToField('');
      setSubjectField('');
      setBodyField('');
      return;
    }
    setPhase('thinking');
    setToField(contactEmail || `${(contactName || 'contact').toLowerCase().replace(/\s+/g, '.')}@example.com`);
  }, [isOpen, contactName, contactEmail, companyName]);

  const handleThinkingComplete = useCallback(() => {
    const template = DRAFT_TEMPLATES[Math.floor(Math.random() * DRAFT_TEMPLATES.length)];
    const name = contactName || 'Client';
    const company = companyName || 'your company';
    setSubjectField(template.subject.replace(/\{name\}/g, name).replace(/\{company\}/g, company));
    setBodyField(template.body.replace(/\{name\}/g, name).replace(/\{company\}/g, company));
    setPhase('compose');
  }, [contactName, companyName]);

  function handleSend() {
    // Log as interaction
    demoStore.actions.logInteraction({
      contactName: contactName || 'Unknown',
      company: companyName || '',
      interactionType: 'Email',
      title: `Email sent: ${subjectField}`,
      outcome: 'Email sent via AI draft',
      notes: bodyField.slice(0, 200),
      source: 'ai-draft',
    });
    setPhase('sent');
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  function handleCopyClose() {
    navigator.clipboard?.writeText(bodyField).catch(() => {});
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-head">
          <h2>Draft Outreach</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <div style={{ padding: 16 }}>
          {phase === 'thinking' && (
            <AiThinkingIndicator
              message="Generating personalized outreach"
              duration={1500}
              onComplete={handleThinkingComplete}
            />
          )}

          {phase === 'compose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, color: '#374151' }}>
                <strong>To</strong>
                <input
                  type="email"
                  value={toField}
                  onChange={(e) => setToField(e.target.value)}
                  style={{
                    width: '100%', marginTop: 4, padding: '8px 12px', fontSize: 14,
                    border: '1px solid #d4d4d4', borderRadius: 8, background: '#f9fafb',
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
                    width: '100%', marginTop: 4, padding: '8px 12px', fontSize: 14,
                    border: '1px solid #d4d4d4', borderRadius: 8,
                  }}
                />
              </label>
              <label style={{ fontSize: 13, color: '#374151' }}>
                <strong>Body</strong>
                <textarea
                  value={bodyField}
                  onChange={(e) => setBodyField(e.target.value)}
                  rows={10}
                  style={{
                    width: '100%', marginTop: 4, padding: '10px 12px', fontSize: 14,
                    border: '1px solid #d4d4d4', borderRadius: 8, lineHeight: 1.6,
                    fontFamily: 'Georgia, serif', resize: 'vertical',
                  }}
                />
              </label>
              <div className="modal-actions" style={{ marginTop: 4 }}>
                <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
                <button type="button" className="tool-btn" onClick={handleCopyClose}>Copy & Close</button>
                <button type="button" className="primary" onClick={handleSend}>Send</button>
              </div>
            </div>
          )}

          {phase === 'sent' && (
            <div style={{ textAlign: 'center', padding: 32, color: '#16a34a' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>&#10003;</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>Email sent successfully</p>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Interaction logged for {contactName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
