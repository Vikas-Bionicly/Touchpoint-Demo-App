import { useState, useCallback, useMemo } from 'react';
import AiThinkingIndicator from './AiThinkingIndicator';
import { demoStore, useDemoStore } from '../store/demoStore';
import {
  noteDigestSourceLines,
  buildAiNoteDigestNarrative,
} from '../utils/noteDigest';

export default function AiNoteSummaryPanel({ isOpen, onClose, contactName, contactId }) {
  const allNotes = useDemoStore((s) => s.notes || []);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const contactNotes = useMemo(
    () => allNotes.filter((n) => n.contactId === contactId),
    [allNotes, contactId]
  );

  const sourceLines = useMemo(() => noteDigestSourceLines(contactNotes), [contactNotes]);

  const handleThinkingComplete = useCallback(() => {
    const narrative = buildAiNoteDigestNarrative(contactNotes, contactName);
    setSummary(narrative || '');
    setLoading(false);
    demoStore.actions.logActivity({
      type: 'ai.summary.generated',
      entityType: 'contact',
      entityId: contactId || '',
      entityName: contactName || '',
      description: `Generated AI note digest for ${contactName || 'contact'}`,
    });
  }, [contactName, contactId, contactNotes]);

  function handleSummarize() {
    setLoading(true);
    setSummary('');
  }

  if (!isOpen) return null;

  const hasNotes = contactNotes.length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal company-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>AI note digest</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
            Synthesized view of notes for <strong>{contactName || 'this contact'}</strong>.
            This demo builds the digest from your stored notes (no external model call).
          </p>

          {!hasNotes && (
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
              No notes on file yet. Add notes from the contact record, then generate a digest.
            </p>
          )}

          {hasNotes && (
            <div style={{ marginBottom: 14 }}>
              <p className="modal-label" style={{ marginBottom: 6 }}>Source notes</p>
              <ul className="modal-list" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {sourceLines.map((line) => (
                  <li key={line.id} style={{ fontSize: 13 }}>
                    <strong>{line.type}</strong>
                    <span style={{ color: '#6b7280' }}> ({line.visibility})</span>
                    {' — '}
                    {line.excerpt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!summary && !loading && hasNotes && (
            <button type="button" className="primary" onClick={handleSummarize}>
              Summarize with AI
            </button>
          )}
          {loading && !summary && hasNotes && (
            <AiThinkingIndicator
              message="Synthesizing notes"
              duration={1500}
              onComplete={handleThinkingComplete}
            />
          )}
          {summary && (
            <div
              className="ai-note-digest-output"
              style={{
                whiteSpace: 'pre-wrap',
                background: '#f0fdf4',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                lineHeight: 1.6,
                border: '1px solid #bbf7d0',
                marginTop: 8,
              }}
            >
              {summary}
            </div>
          )}
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button type="button" className="tool-btn" onClick={onClose}>Close</button>
            {summary && hasNotes && (
              <button
                type="button"
                className="tool-btn"
                onClick={() => { setSummary(''); }}
              >
                Clear result
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
