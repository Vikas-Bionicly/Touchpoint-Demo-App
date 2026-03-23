import { useState, useCallback } from 'react';
import AiThinkingIndicator from './AiThinkingIndicator';
import { demoStore } from '../store/demoStore';

const MOCK_SUMMARIES = [
  "Key themes across recent notes: regulatory compliance concerns, interest in expanding litigation support, positive relationship momentum. Recommended next step: schedule a strategic review meeting.",
  "Summary: Contact has been engaged on privacy matters over the past quarter. Two meetings held, one follow-up pending. Sentiment is positive. Consider cross-selling opportunity in M&A advisory.",
  "Digest: Recent notes indicate growing interest in AI governance. Contact mentioned upcoming board review. Internal connections suggest warm intro path through the Toronto office.",
  "Analysis: Strong engagement pattern with consistent two-way communication. Key topics include data privacy regulations, cross-border compliance, and strategic litigation preparation. Next step: propose quarterly review cadence.",
];

export default function AiNoteSummaryPanel({ isOpen, onClose, contactName, contactId }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleThinkingComplete = useCallback(() => {
    const text = MOCK_SUMMARIES[Math.floor(Math.random() * MOCK_SUMMARIES.length)];
    setSummary(text);
    setLoading(false);
    demoStore.actions.logActivity({
      type: 'ai.summary.generated',
      entityType: 'contact',
      entityId: contactId || '',
      entityName: contactName || '',
      description: `Generated AI summary for ${contactName || 'contact'}`,
    });
  }, [contactName, contactId]);

  function handleSummarize() {
    setLoading(true);
    setSummary('');
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <h2>AI Note Summary</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
            Generate an AI summary of recent notes for <strong>{contactName || 'this contact'}</strong>.
          </p>
          {!summary && !loading && (
            <button type="button" className="primary" onClick={handleSummarize}>
              Summarize with AI
            </button>
          )}
          {loading && !summary && (
            <AiThinkingIndicator
              message="Analyzing notes"
              duration={1500}
              onComplete={handleThinkingComplete}
            />
          )}
          {summary && (
            <div style={{
              background: '#f0fdf4', borderRadius: 8, padding: 12, fontSize: 14,
              lineHeight: 1.6, border: '1px solid #bbf7d0', marginTop: 8,
            }}>
              {summary}
            </div>
          )}
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button type="button" className="tool-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
