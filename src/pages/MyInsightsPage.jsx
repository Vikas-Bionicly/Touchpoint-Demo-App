import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import InsightCard from '../common/components/InsightCard';
import { insightCards } from '../common/constants/insights';
import { contactRows } from '../common/constants/contacts';
import CreateTouchpointTaskModal from '../common/components/CreateTouchpointTaskModal';
import AddContactNoteModal from '../common/components/AddContactNoteModal';
import ManageContactTagsModal from '../common/components/ManageContactTagsModal';
import FirmConnectionsModal from '../common/components/FirmConnectionsModal';
import { demoStore, useDemoStore } from '../common/store/demoStore';

function addDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export default function MyInsightsPage() {
  const [query, setQuery] = useState('');
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [touchpointPreset, setTouchpointPreset] = useState(null);
  const [noteForContact, setNoteForContact] = useState(null);
  const [tagsForContact, setTagsForContact] = useState(null);
  const [connectionsForContact, setConnectionsForContact] = useState(null);
  const insightState = useDemoStore((s) => s.insightState || {});

  const filtered = useMemo(() => {
    let result = [...insightCards].filter((c) => !insightState?.[c.id]?.dismissed);
    if (highPriorityOnly) {
      result = result.filter((c) => c.priority === 'High');
    }
    if (!query.trim()) return result;
    const q = query.toLowerCase();
    return result.filter((c) =>
      [c.label, c.title, c.description, c.subject, ...c.tags].some((s) => s.toLowerCase().includes(q))
    );
  }, [query, highPriorityOnly, insightState]);

  return (
    <section className="insights-view">
      <header className="headbar">
        <h1>My Insights</h1>
        <button className="context-btn" aria-label="more">
          <Icon name="more" />
        </button>
      </header>

      <section className="filterbar">
        <label className="search">
          <Icon name="search" />
          <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button className={`filter-btn ${highPriorityOnly ? 'active' : ''}`} onClick={() => setHighPriorityOnly((prev) => !prev)}>
          <Icon name="sliders" className="btn-icon" />
          {highPriorityOnly ? 'High Priority' : 'Filter View'}
        </button>
      </section>

      <section className="card-list">
        {filtered.map((card) => (
          <InsightCard
            key={card.id}
            card={card}
            state={insightState?.[card.id]}
            onLike={() => demoStore.actions.likeInsight(card.id)}
            onDismiss={() => demoStore.actions.dismissInsight(card.id)}
            onReminder={(c) => {
              const byContact = contactRows.find((x) => x.name === c.subject) || null;
              const fallback = contactRows.find((x) => x.company === c.subject) || null;
              const chosen = byContact || fallback || contactRows[0] || null;
              if (!chosen) return;

              demoStore.actions.addTouchpointTask({
                contactName: chosen.name,
                company: chosen.company,
                role: chosen.role,
                title: c.title || `Follow up: ${c.subject}`,
                notes: c.suggestion || '',
                dueAt: addDaysIso(3),
                avatarUrl: chosen.avatarUrl,
                signalTone: chosen.signalTone,
                relationshipStatus: chosen.relationship,
                relationshipScore: chosen.relationshipScore,
                lastInteracted: chosen.lastInteracted,
                source: 'insights:reminder',
              });
              demoStore.actions.dismissInsight(c.id);
            }}
            onCreateTouchpoint={(c) => {
              const byContact = contactRows.find((x) => x.name === c.subject) || null;
              const fallback = contactRows.find((x) => x.company === c.subject) || null;
              const chosen = byContact || fallback || contactRows[0] || null;

              setTouchpointPreset({
                contactName: chosen?.name || '',
                company: chosen?.company || '',
                role: chosen?.role || '',
                title: c.title || `Follow up: ${c.subject}`,
                notes: c.suggestion || '',
                source: 'insights',
              });
            }}
            onAddNote={(c) => {
              const byContact = contactRows.find((x) => x.name === c.subject) || null;
              const fallback = contactRows.find((x) => x.company === c.subject) || null;
              const chosen = byContact || fallback || contactRows[0] || null;
              if (!chosen) return;
              setNoteForContact(chosen);
            }}
            onAddTag={(c) => {
              const byContact = contactRows.find((x) => x.name === c.subject) || null;
              const fallback = contactRows.find((x) => x.company === c.subject) || null;
              const chosen = byContact || fallback || contactRows[0] || null;
              if (!chosen) return;
              setTagsForContact(chosen);
            }}
            onViewConnections={(c) => {
              const byContact = contactRows.find((x) => x.name === c.subject) || null;
              const fallback = contactRows.find((x) => x.company === c.subject) || null;
              const chosen = byContact || fallback || contactRows[0] || null;
              if (!chosen) return;
              setConnectionsForContact(chosen);
            }}
            onShareContent={(c) => {
              const byContact = contactRows.find((x) => x.name === c.subject) || null;
              const fallback = contactRows.find((x) => x.company === c.subject) || null;
              const chosen = byContact || fallback || contactRows[0] || null;
              if (!chosen) return;

              setTouchpointPreset({
                contactName: chosen.name,
                company: chosen.company,
                role: chosen.role,
                title: c.title || `Share content with ${chosen.name}`,
                notes: c.suggestion || 'Share relevant content based on this insight.',
                source: 'insights:share-content',
              });
            }}
          />
        ))}
      </section>

      <CreateTouchpointTaskModal
        isOpen={Boolean(touchpointPreset)}
        preset={touchpointPreset}
        onClose={() => setTouchpointPreset(null)}
      />

      <AddContactNoteModal contact={noteForContact} isOpen={Boolean(noteForContact)} onClose={() => setNoteForContact(null)} />
      <ManageContactTagsModal
        contact={tagsForContact}
        isOpen={Boolean(tagsForContact)}
        onClose={() => setTagsForContact(null)}
      />
      <FirmConnectionsModal
        contact={connectionsForContact}
        isOpen={Boolean(connectionsForContact)}
        onClose={() => setConnectionsForContact(null)}
      />
    </section>
  );
}
