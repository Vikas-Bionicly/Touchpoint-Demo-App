import { useMemo, useState } from 'react';
import { useDemoStore } from '../store/demoStore';

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((x) => x.length >= 3);
}

export default function OutlookLookupModal({ isOpen, onClose, onOpenContact }) {
  const contacts = useDemoStore((s) => s.contacts || []);
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('');

  const matches = useMemo(() => {
    const email = String(fromEmail || '').trim().toLowerCase();
    const domain = email.includes('@') ? email.split('@')[1] : '';
    const subjectTokens = new Set(tokenize(subject));

    return contacts
      .map((c) => {
        let score = 0;
        if (email && c.email && String(c.email).toLowerCase() === email) score += 10;
        if (domain && c.email && String(c.email).toLowerCase().endsWith(`@${domain}`)) score += 5;
        if (domain && c.company && String(c.company).toLowerCase().replace(/\s+/g, '').includes(domain.split('.')[0])) score += 2;
        const nameTokens = tokenize(c.name);
        nameTokens.forEach((t) => {
          if (subjectTokens.has(t)) score += 2;
        });
        return { contact: c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [contacts, fromEmail, subject]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Outlook Contact Lookup</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">
            x
          </button>
        </div>
        <div className="touchpoint-form">
          <label>
            From email
            <input
              placeholder="e.g. gc@clientco.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </label>
          <label>
            Email subject/context
            <input
              placeholder="e.g. follow-up on litigation roadmap"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <div>
            <p className="modal-label">Matched contacts</p>
            {matches.length === 0 ? (
              <p className="modal-value">No likely contact match yet. Add sender email or more context.</p>
            ) : (
              <ul className="modal-list">
                {matches.map(({ contact, score }) => (
                  <li key={contact.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>
                      <strong>{contact.name}</strong> — {contact.role} ({contact.company})
                    </span>
                    <button
                      type="button"
                      className="tool-btn"
                      onClick={() => onOpenContact?.(contact)}
                      title={`Match score ${score}`}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

