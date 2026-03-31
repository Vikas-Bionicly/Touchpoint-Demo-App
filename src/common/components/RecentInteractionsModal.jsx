import { useMemo, useState } from 'react';
import { useDemoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';

function formatDateLabel(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' });
}

export default function RecentInteractionsModal({ company, contact, isOpen, onClose }) {
  const [tab, setTab] = useState('yours');
  const touchpoints = useDemoStore((s) => s.touchpoints || []);
  const notes = useDemoStore((s) => s.notes || []);
  const companyNotes = useDemoStore((s) => s.companyNotes || []);
  const lists = useDemoStore((s) => s.lists || []);
  const companies = useDemoStore((s) => s.companies || []);
  const personaCompany = company || (contact ? companies.find((c) => c.name === contact.company) : null);
  const { field, tier } = usePersona({ company: personaCompany || undefined });
  const showDetail = field('recentInteractions.detail');
  const showAbstractSummary = showDetail && tier === 2;

  const targetName = contact?.name || company?.name || '';
  const targetCompany = contact?.company || company?.name || '';
  if (!isOpen || (!company && !contact)) return null;

  const yourInteractions = useMemo(() => {
    const scopedTouchpoints = touchpoints
      .filter((tp) => (targetName && tp.contactName === targetName) || (targetCompany && tp.company === targetCompany))
      .slice(0, 8)
      .map((tp, i) => ({
        id: `your-tp-${tp.id}-${i}`,
        who: 'You',
        text: `${tp.interactionType || 'Interaction'} — ${tp.title || tp.notes || tp.outcome || 'Interaction logged'}`,
        date: formatDateLabel(tp.completedAt || tp.createdAt || tp.dueAt),
      }));

    const scopedNotes = notes
      .filter((n) => !contact || n.contactId === contact.id)
      .slice(0, 4)
      .map((n, i) => ({
        id: `your-note-${n.id}-${i}`,
        who: 'You',
        text: `Note (${n.type || 'General'}) — ${n.text}`,
        date: formatDateLabel(n.createdAt),
      }));

    return [...scopedTouchpoints, ...scopedNotes].slice(0, 12);
  }, [touchpoints, notes, contact, targetName, targetCompany]);

  const firmInteractions = useMemo(() => {
    const teamRows = touchpoints
      .filter((tp) => (targetName && tp.contactName === targetName) || (targetCompany && tp.company === targetCompany))
      .filter((tp) => tp.assignedBy || tp.assignedTo)
      .slice(0, 8)
      .map((tp, i) => ({
        id: `firm-assigned-${tp.id}-${i}`,
        who: tp.assignedBy || tp.assignedTo || 'Colleague',
        text: `${tp.interactionType || 'Interaction'} — ${tp.title || 'Follow-up activity'}`,
        date: formatDateLabel(tp.createdAt || tp.dueAt),
      }));

    const scopedCompanyNotes = companyNotes
      .filter((n) => company && n.companyId === company.id)
      .slice(0, 4)
      .map((n, i) => ({
        id: `firm-cnote-${n.id}-${i}`,
        who: 'Firm',
        text: `Company note (${n.type || 'General'}) — ${n.text}`,
        date: formatDateLabel(n.createdAt),
      }));

    return [...teamRows, ...scopedCompanyNotes].slice(0, 12);
  }, [touchpoints, companyNotes, targetName, targetCompany, company]);

  const marketingBdInteractions = useMemo(() => {
    const listRows = lists
      .filter((list) => {
        const memberHit = contact ? (list.memberIds || []).includes(contact.id) : false;
        const companyHit = company ? String(list.tag || '').toLowerCase().includes(String(company.tag || company.name || '').toLowerCase()) : false;
        return memberHit || companyHit || list.type === 'Event-based';
      })
      .flatMap((list) =>
        (list.marketingActivity || []).map((ma, idx) => ({
          id: `mkt-${list.id}-${idx}`,
          who: list.owner || 'Marketing/BD',
          text: `${ma.type || 'Marketing activity'} — ${ma.description || list.name}`,
          date: ma.date || '',
        }))
      )
      .slice(0, 12);

    return listRows;
  }, [lists, contact, company]);

  const rows = tab === 'yours' ? yourInteractions : tab === 'firm' ? firmInteractions : marketingBdInteractions;

  function summarizeText(value) {
    const v = String(value || '');
    const [head] = v.split('—');
    return head.trim() || v.slice(0, 64);
  }

  if (!showDetail) {
    const lastDate = rows[0]?.date || '';
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="company-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h2>Recent Interactions — {targetName || targetCompany}</h2>
            <button className="modal-close" onClick={onClose} aria-label="close">x</button>
          </div>
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
              At your transparency tier, only recency and volume are shown (not interaction narrative).
            </p>
            <p className="modal-label">Last recorded activity</p>
            <p className="modal-value">{lastDate || '—'}</p>
            <p className="modal-label" style={{ marginTop: 12 }}>Logged rows (visible count)</p>
            <p className="modal-value">{rows.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Recent Interactions — {targetName || targetCompany}</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <div style={{ padding: 16 }}>
          {showAbstractSummary && (
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px' }}>
              Abstract tier view: names and activity summaries are shown; full interaction narrative is hidden.
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className={tab === 'yours' ? 'primary' : 'tool-btn'}
              onClick={() => setTab('yours')}
              style={{ fontSize: 13 }}
            >
              Your Interactions
            </button>
            <button
              type="button"
              className={tab === 'firm' ? 'primary' : 'tool-btn'}
              onClick={() => setTab('firm')}
              style={{ fontSize: 13 }}
            >
              Firm-wide
            </button>
            <button
              type="button"
              className={tab === 'marketing' ? 'primary' : 'tool-btn'}
              onClick={() => setTab('marketing')}
              style={{ fontSize: 13 }}
            >
              Marketing/BD
            </button>
          </div>

          {rows.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: 13 }}>No interactions found.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r) => (
              <div key={r.id} style={{
                background: '#f9fafb', borderRadius: 8, padding: '8px 14px',
                border: '1px solid #e5e7eb', fontSize: 13,
              }}>
                <strong>{r.who}</strong> — {showAbstractSummary ? summarizeText(r.text) : r.text}
                {r.date ? <div style={{ marginTop: 2, color: '#6b7280', fontSize: 12 }}>{r.date}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
