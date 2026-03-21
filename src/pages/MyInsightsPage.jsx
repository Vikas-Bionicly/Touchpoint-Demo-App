import { useMemo, useState } from 'react';
import InsightCard from '../common/components/InsightCard';
import { insightCards } from '../common/constants/insights';
import CreateTouchpointTaskModal from '../common/components/CreateTouchpointTaskModal';
import AddContactNoteModal from '../common/components/AddContactNoteModal';
import ManageContactTagsModal from '../common/components/ManageContactTagsModal';
import FirmConnectionsModal from '../common/components/FirmConnectionsModal';
import AiDraftPanel from '../common/components/AiDraftPanel';
import MeetingPrepPanel from '../common/components/MeetingPrepPanel';
import TripPlanningModal from '../common/components/TripPlanningModal';
import AlertBanner from '../common/components/AlertBanner';
import SubTabBar from '../common/components/SubTabBar';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import { usePersona } from '../common/hooks/usePersona';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import FilterViewButton from '../common/components/FilterViewButton';

const SUB_TABS = ['Key Contacts', 'Referrals', 'Visits'];

function addDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export default function MyInsightsPage({ subPage }) {
  const [activeTab, setActiveTab] = useState(subPage || '');
  const [query, setQuery] = useState('');
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [touchpointPreset, setTouchpointPreset] = useState(null);
  const [noteForContact, setNoteForContact] = useState(null);
  const [tagsForContact, setTagsForContact] = useState(null);
  const [connectionsForContact, setConnectionsForContact] = useState(null);
  const [showAiDraft, setShowAiDraft] = useState(null);
  const [showTripPlanning, setShowTripPlanning] = useState(false);
  const insightState = useDemoStore((s) => s.insightState || {});
  const contacts = useDemoStore((s) => s.contacts || []);
  const notifications = useDemoStore((s) => s.notifications || []);

  const { depth, field } = usePersona();

  function findContact(subject) {
    return contacts.find((x) => x.name === subject) || contacts.find((x) => x.company === subject) || contacts[0] || null;
  }

  const filtered = useMemo(() => {
    let result = [...insightCards].filter((c) => !insightState?.[c.id]?.dismissed);

    // Sub-tab filtering
    if (activeTab === 'Key Contacts') {
      result = result.filter((c) => {
        const contact = contacts.find((x) => x.name === c.subject);
        return contact?.isKeyContact;
      });
    } else if (activeTab === 'Referrals') {
      result = result.filter((c) => c.label === 'Internal Connection' || c.label === 'Cross-Sell Opportunity');
    } else if (activeTab === 'Visits') {
      result = result.filter((c) => c.label === 'Fading Relationship' || c.label === 'Client Engagement Trend');
    }

    if (highPriorityOnly) result = result.filter((c) => c.priority === 'High');
    if (!query.trim()) return result.slice(0, depth('insightCards'));
    const q = query.toLowerCase();
    return result.filter((c) => [c.label, c.title, c.description, c.subject, ...c.tags].some((s) => s.toLowerCase().includes(q))).slice(0, depth('insightCards'));
  }, [query, highPriorityOnly, insightState, activeTab, contacts, depth]);

  // Alerts from notifications
  const alerts = notifications.filter((n) => !n.read).slice(0, 3).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
  }));

  return (
    <section className="insights-view">
      <PageHeader title="My Insights" showMore={false} />

      <SubTabBar tabs={SUB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AlertBanner alerts={alerts} />

      <FilterBar className="mb-4">
        <div className="search-with-filter">
          <SearchBar value={query} onChange={(value) => setQuery(value)} />
          <FilterViewButton active={highPriorityOnly} onClick={() => setHighPriorityOnly((prev) => !prev)} />
        </div>
      </FilterBar>

      {/* Meeting Prep for Visits sub-tab */}
      {activeTab === 'Visits' && <MeetingPrepPanel />}

      {/* Trip planning button */}
      {activeTab === 'Visits' && (
        <div style={{ marginBottom: 16 }}>
          <button className="tool-btn" onClick={() => setShowTripPlanning(true)}>Plan a Trip</button>
        </div>
      )}

      <section className="card-list">
        {filtered.map((card) => (
          <InsightCard
            key={card.id}
            card={card}
            state={insightState?.[card.id]}
            onLike={() => demoStore.actions.likeInsight(card.id)}
            onDismiss={() => demoStore.actions.dismissInsight(card.id)}
            onReminder={(c) => {
              const chosen = findContact(c.subject);
              if (!chosen) return;
              demoStore.actions.addTouchpointTask({
                contactName: chosen.name, company: chosen.company, role: chosen.role,
                title: c.title || `Follow up: ${c.subject}`, notes: c.suggestion || '',
                dueAt: addDaysIso(3), avatarUrl: chosen.avatarUrl, signalTone: chosen.signalTone,
                relationshipStatus: chosen.relationship, relationshipScore: chosen.relationshipScore,
                lastInteracted: chosen.lastInteracted, source: 'insights:reminder',
              });
              demoStore.actions.dismissInsight(c.id);
            }}
            onCreateTouchpoint={(c) => {
              const chosen = findContact(c.subject);
              setTouchpointPreset({
                contactName: chosen?.name || '', company: chosen?.company || '', role: chosen?.role || '',
                title: c.title || `Follow up: ${c.subject}`, notes: c.suggestion || '', source: 'insights',
              });
            }}
            onAddNote={(c) => {
              const chosen = findContact(c.subject);
              if (chosen) setNoteForContact(chosen);
            }}
            onAddTag={(c) => {
              const chosen = findContact(c.subject);
              if (chosen) setTagsForContact(chosen);
            }}
            onViewConnections={(c) => {
              const chosen = findContact(c.subject);
              if (chosen) setConnectionsForContact(chosen);
            }}
            onShareContent={(c) => {
              if (field('aiDraft') && c.cta === 'Draft Outreach') {
                const chosen = findContact(c.subject);
                setShowAiDraft(chosen);
                return;
              }
              const chosen = findContact(c.subject);
              if (!chosen) return;
              setTouchpointPreset({
                contactName: chosen.name, company: chosen.company, role: chosen.role,
                title: c.title || `Share content with ${chosen.name}`, notes: c.suggestion || 'Share relevant content based on this insight.',
                source: 'insights:share-content',
              });
            }}
          />
        ))}
      </section>

      <CreateTouchpointTaskModal isOpen={Boolean(touchpointPreset)} preset={touchpointPreset} onClose={() => setTouchpointPreset(null)} />
      <AddContactNoteModal contact={noteForContact} isOpen={Boolean(noteForContact)} onClose={() => setNoteForContact(null)} />
      <ManageContactTagsModal contact={tagsForContact} isOpen={Boolean(tagsForContact)} onClose={() => setTagsForContact(null)} />
      <FirmConnectionsModal contact={connectionsForContact} isOpen={Boolean(connectionsForContact)} onClose={() => setConnectionsForContact(null)} />
      <AiDraftPanel isOpen={Boolean(showAiDraft)} contactName={showAiDraft?.name} companyName={showAiDraft?.company} onClose={() => setShowAiDraft(null)} />
      <TripPlanningModal isOpen={showTripPlanning} onClose={() => setShowTripPlanning(false)} />
    </section>
  );
}
