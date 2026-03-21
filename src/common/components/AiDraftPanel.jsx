import { useState, useEffect, useRef } from 'react';

const DRAFT_TEMPLATES = [
  "Dear {name},\n\nI wanted to reach out following our recent engagement. I've been keeping an eye on developments in your sector and thought you might find the attached regulatory update relevant to your current initiatives.\n\nWould you have time for a brief call this week to discuss how these changes might impact your operations?\n\nBest regards,\nJohn Doe",
  "Hi {name},\n\nI hope this message finds you well. I noticed some exciting developments at {company} recently and wanted to congratulate you.\n\nI'd love to catch up over coffee and discuss how we might support your team as you navigate these changes. Are you available next Tuesday or Wednesday?\n\nWarm regards,\nJohn Doe",
  "Dear {name},\n\nThank you for your time at our recent event. It was great connecting with you and learning more about {company}'s strategic priorities.\n\nAs discussed, I've attached a brief overview of our capabilities in the areas most relevant to your needs. I'd welcome the opportunity to explore how we can add value.\n\nBest,\nJohn Doe",
];

export default function AiDraftPanel({ contactName, companyName, isOpen, onClose }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    const template = DRAFT_TEMPLATES[Math.floor(Math.random() * DRAFT_TEMPLATES.length)];
    const fullText = template
      .replace(/\{name\}/g, contactName || 'Client')
      .replace(/\{company\}/g, companyName || 'your company');

    setIsTyping(true);
    setDisplayedText('');
    let i = 0;

    intervalRef.current = setInterval(() => {
      i += 2;
      if (i >= fullText.length) {
        setDisplayedText(fullText);
        setIsTyping(false);
        clearInterval(intervalRef.current);
      } else {
        setDisplayedText(fullText.slice(0, i));
      }
    }, 15);

    return () => clearInterval(intervalRef.current);
  }, [isOpen, contactName, companyName]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>AI Draft Outreach</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            Generating personalized outreach for <strong>{contactName}</strong>...
            {isTyping && <span style={{ marginLeft: 4, animation: 'pulse 1s infinite' }}>|</span>}
          </div>
          <div style={{
            background: '#f9fafb', borderRadius: 10, padding: 16, fontSize: 14,
            lineHeight: 1.6, whiteSpace: 'pre-wrap', minHeight: 150, border: '1px solid #e5e7eb',
            fontFamily: 'Georgia, serif',
          }}>
            {displayedText}
          </div>
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button type="button" className="tool-btn" onClick={onClose}>Close</button>
            <button type="button" className="primary" disabled={isTyping} onClick={() => {
              navigator.clipboard?.writeText(displayedText).catch(() => {});
              onClose();
            }}>
              Copy & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
