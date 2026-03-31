import { useEffect, useMemo, useState } from 'react';
import InsightCard from '../common/components/InsightCard';
import { generateInsightCards } from '../common/constants/insights';
import CreateTouchpointTaskModal from '../common/components/CreateTouchpointTaskModal';
import AddContactNoteModal from '../common/components/AddContactNoteModal';
import ManageContactTagsModal from '../common/components/ManageContactTagsModal';
import FirmConnectionsModal from '../common/components/FirmConnectionsModal';
import AiDraftPanel from '../common/components/AiDraftPanel';
import MeetingPrepPanel from '../common/components/MeetingPrepPanel';
import TripPlanningModal from '../common/components/TripPlanningModal';
import RecentInteractionsModal from '../common/components/RecentInteractionsModal';
import AlertBanner from '../common/components/AlertBanner';
import SubTabBar from '../common/components/SubTabBar';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import { resolveContactTaxonomyChips } from '../common/utils/tagTaxonomy';
import { usePersona } from '../common/hooks/usePersona';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import FilterViewButton from '../common/components/FilterViewButton';
import { buildRowSecurityScope } from '../common/utils/rowSecurityScope';

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
  const [showInteractionsFor, setShowInteractionsFor] = useState(null);
  const insightState = useDemoStore((s) => s.insightState || {});
  const contacts = useDemoStore((s) => s.contacts || []);
  const companies = useDemoStore((s) => s.companies || []);
  const notifications = useDemoStore((s) => s.notifications || []);
  const allTags = useDemoStore((s) => s.tags || []);
  const contactTagsMap = useDemoStore((s) => s.contactTags || {});

  const { depth, field } = usePersona();
  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');

  // AC-02 — BD Standard scoping used to filter insight cards.
  const bdAllowedCompanyNames = useMemo(() => {
    if (personaId !== 'bd-standard' && personaId !== 'non-equity-partner') return null;
    const assignedAccounts = companies.filter(
      (c) => (c.accountType === 'Client' || c.category1 === 'Client') && c.ownerId === 'current-user'
    );
    const sectorSet = new Set(assignedAccounts.map((c) => c.category2).filter(Boolean));
    const allowedCompanies = companies.filter(
      (c) => c.ownerId === 'current-user' || sectorSet.has(c.category2)
    );
    return new Set(allowedCompanies.map((c) => c.name));
  }, [companies, personaId]);

  // AC-03 — Legal Assistant scoping used to filter insight cards.
  const legalAssistantAllowedCompanyNames = useMemo(() => {
    if (personaId !== 'legal-assistant') return null;
    const allowedContacts = contacts.filter((c) => c.ownerId === 'other-user');
    return new Set(allowedContacts.map((c) => c.company).filter(Boolean));
  }, [contacts, personaId]);

  // AC-06 — Associate scoping used to filter insight cards.
  // Prototype: assigned lawyers' contacts => ownerId === 'current-user'.
  const associateAllowedCompanyNames = useMemo(() => {
    if (personaId !== 'associate') return null;
    const allowedContacts = contacts.filter((c) => c.ownerId === 'current-user');
    return new Set(allowedContacts.map((c) => c.company).filter(Boolean));
  }, [contacts, personaId]);

  const contactByName = useMemo(() => new Map(contacts.map((c) => [c.name, c])), [contacts]);
  const companyByName = useMemo(() => new Map(companies.map((c) => [c.name, c])), [companies]);
  const rowScope = useMemo(
    () => buildRowSecurityScope({ personaId, companies, contacts }),
    [personaId, companies, contacts]
  );

  useEffect(() => {
    setActiveTab(subPage || '');
  }, [subPage]);

  function findContact(subject) {
    return contacts.find((x) => x.name === subject) || contacts.find((x) => x.company === subject) || contacts[0] || null;
  }

  const allInsights = useMemo(() => generateInsightCards(), [contacts]);

  const filtered = useMemo(() => {
    let result = [...allInsights].filter((c) => !insightState?.[c.id]?.dismissed);

    // DT-07: apply shared row-security scoping to insight subjects before tab/persona filters.
    result = result.filter((card) => {
      const contact = contactByName.get(card.subject);
      if (contact) return rowScope.canSeeContact(contact);
      if (companyByName.has(card.subject)) return rowScope.canSeeCompanyName(card.subject);
      return true;
    });

    // Sub-tab filtering
    if (activeTab === 'Key Contacts') {
      result = result.filter((c) => {
        const contact = contacts.find((x) => x.name === c.subject);
        return contact?.isKeyContact;
      });
    } else if (activeTab === 'Referrals') {
      result = result.filter(
        (c) =>
          c.label === 'Introduction Opportunity' ||
          c.label === 'Internal Connection' ||
          c.label === 'Cross-Sell Opportunity'
      );
    } else if (activeTab === 'Visits') {
      result = result.filter((c) => {
        const label = String(c.label || '');
        const title = String(c.title || '').toLowerCase();
        const tags = (c.tags || []).map((t) => String(t).toLowerCase());
        return (
          label === 'Upcoming Meeting' ||
          label === 'Event Recommendation' ||
          title.includes('meeting') ||
          title.includes('visit') ||
          title.includes('trip') ||
          tags.includes('preparation') ||
          tags.includes('engagement')
        );
      });
    }

    // AC-02/AC-05 — Apply account+sector scoping for BD Standard + Non-Equity Partner cards.
    if (bdAllowedCompanyNames) {
      result = result.filter((card) => {
        const contact = contactByName.get(card.subject);
        if (contact) return bdAllowedCompanyNames.has(contact.company);
        if (companyByName.has(card.subject)) return bdAllowedCompanyNames.has(card.subject);
        // If we can't map the subject to either a contact or a company, keep the card.
        return true;
      });
    }

    // AC-03 — Apply persona scoping for Legal Assistant cards.
    if (personaId === 'legal-assistant' && legalAssistantAllowedCompanyNames) {
      result = result.filter((card) => {
        const contact = contactByName.get(card.subject);
        if (contact) return legalAssistantAllowedCompanyNames.has(contact.company);
        if (companyByName.has(card.subject)) return legalAssistantAllowedCompanyNames.has(card.subject);
        return true;
      });
    }

    // AC-06 — Apply persona scoping for Associate cards.
    if (personaId === 'associate' && associateAllowedCompanyNames) {
      result = result.filter((card) => {
        const contact = contactByName.get(card.subject);
        if (contact) return associateAllowedCompanyNames.has(contact.company);
        if (companyByName.has(card.subject)) return associateAllowedCompanyNames.has(card.subject);
        return true;
      });
    }

    if (highPriorityOnly) result = result.filter((c) => c.priority === 'High');
    if (!query.trim()) return result.slice(0, depth('insightCards'));
    const q = query.toLowerCase();
    return result.filter((c) => [c.label, c.title, c.description, c.subject, ...c.tags].some((s) => s.toLowerCase().includes(q))).slice(0, depth('insightCards'));
  }, [
    query,
    highPriorityOnly,
    insightState,
    activeTab,
    contacts,
    companies,
    personaId,
    bdAllowedCompanyNames,
    legalAssistantAllowedCompanyNames,
    associateAllowedCompanyNames,
    contactByName,
    companyByName,
    depth,
    allInsights,
    rowScope,
  ]);

  // Alerts from notifications
  const alerts = notifications
    .filter((n) => !n.read)
    .filter((n) => {
      const subject = String(n.title || n.message || '');
      const matchedContact = contacts.find((c) => subject.includes(c.name));
      if (matchedContact) return rowScope.canSeeContact(matchedContact);
      const matchedCompany = companies.find((c) => subject.includes(c.name));
      if (matchedCompany) return rowScope.canSeeCompanyName(matchedCompany.name);
      return true;
    })
    .slice(0, 3)
    .map((n) => ({
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

      <p className="taxonomy-map-hint">
        Tags use one canonical type across modules: <strong>Aderant</strong> practice codes, <strong>website</strong> industry/region
        categories, and <strong>marketing lists</strong> (Vuture-style) for initiatives — see tooltips in tag pickers.
      </p>

      <section className="card-list">
        {filtered.map((card) => (
          <InsightCard
            key={card.id}
            card={card}
            taxonomyChips={resolveContactTaxonomyChips(
              contacts.find((x) => x.name === card.subject),
              contactTagsMap,
              allTags
            )}
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
            onDraftOutreach={(c) => {
              if (field('aiDraft')) {
                const chosen = findContact(c.subject);
                setShowAiDraft(chosen);
              } else {
                const chosen = findContact(c.subject);
                if (!chosen) return;
                setTouchpointPreset({
                  contactName: chosen.name, company: chosen.company, role: chosen.role,
                  title: c.title || `Share content with ${chosen.name}`, notes: c.suggestion || '',
                  source: 'insights:draft-outreach',
                });
              }
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
            onViewRecentInteractions={(c) => {
              const chosen = findContact(c.subject);
              if (chosen) setShowInteractionsFor(chosen);
            }}
            onShareContent={(c) => {
              const chosen = findContact(c.subject);
              if (!chosen) return;
              if (field('aiDraft')) {
                setShowAiDraft(chosen);
              } else {
                setTouchpointPreset({
                  contactName: chosen.name, company: chosen.company, role: chosen.role,
                  title: c.title || `Share content with ${chosen.name}`, notes: c.suggestion || 'Share relevant content based on this insight.',
                  source: 'insights:share-content',
                });
              }
            }}
            onShareToTeams={(c) => {
              demoStore.actions.shareInsightToTeams({
                insightTitle: c.title || c.label || 'Insight',
                target: c.subject || 'client stakeholders',
                summary: c.suggestion || c.description || 'Shared from Touchpoints insights feed.',
                channel: 'client-intelligence',
              });
            }}
            onCreateOpportunityList={(c) => {
              const companyName = String(c.subject || '').trim();
              if (!companyByName.has(companyName)) return;
              const created = demoStore.actions.createCrossPracticeInitiativeList({
                companyName,
                maxMembers: 12,
              });
              if (created?.membersAdded) {
                window.alert(
                  `Created cross-practice opportunity list for ${companyName} with ${created.membersAdded} contact${created.membersAdded === 1 ? '' : 's'}.`
                );
                return;
              }
              window.alert(`No cross-practice opportunity list created for ${companyName} (no eligible candidates found).`);
            }}
          />
        ))}
      </section>

      <CreateTouchpointTaskModal isOpen={Boolean(touchpointPreset)} preset={touchpointPreset} onClose={() => setTouchpointPreset(null)} />
      <AddContactNoteModal contact={noteForContact} isOpen={Boolean(noteForContact)} onClose={() => setNoteForContact(null)} />
      <ManageContactTagsModal contact={tagsForContact} isOpen={Boolean(tagsForContact)} onClose={() => setTagsForContact(null)} />
      <FirmConnectionsModal contact={connectionsForContact} isOpen={Boolean(connectionsForContact)} onClose={() => setConnectionsForContact(null)} />
      <AiDraftPanel isOpen={Boolean(showAiDraft)} contact={showAiDraft} onClose={() => setShowAiDraft(null)} />
      <TripPlanningModal isOpen={showTripPlanning} onClose={() => setShowTripPlanning(false)} />
      <RecentInteractionsModal
        contact={showInteractionsFor}
        company={null}
        isOpen={Boolean(showInteractionsFor)}
        onClose={() => setShowInteractionsFor(null)}
      />
    </section>
  );
}
