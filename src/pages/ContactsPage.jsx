import { useEffect, useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import CreateTouchpointTaskModal from '../common/components/CreateTouchpointTaskModal';
import AddContactNoteModal from '../common/components/AddContactNoteModal';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import AddContactToListModal from '../common/components/AddContactToListModal';
import ManageContactTagsModal from '../common/components/ManageContactTagsModal';
import FirmConnectionsModal from '../common/components/FirmConnectionsModal';
import AddContactModal from '../common/components/AddContactModal';
import UpdateContactModal from '../common/components/UpdateContactModal';
import AiDraftPanel from '../common/components/AiDraftPanel';
import AiNoteSummaryPanel from '../common/components/AiNoteSummaryPanel';
import MeetingBriefModal from '../common/components/MeetingBriefModal';
import TripPlanningModal from '../common/components/TripPlanningModal';
import ContactDetailModal from '../common/components/ContactDetailModal';
import OutlookLookupModal from '../common/components/OutlookLookupModal';
import SubTabBar from '../common/components/SubTabBar';
import RelationshipScoreGauge from '../common/components/RelationshipScoreGauge';
import { usePersona } from '../common/hooks/usePersona';
import { BADGE_MAP } from '../common/constants/badges';
import { resolveContactAvatarUrl } from '../common/utils/avatars';
import {
  formatLastTouchSourceLine,
  lastInteractionSystemClass,
} from '../common/utils/lastInteractionAttribution';
import { formatTagTaxonomyTitleAttr } from '../common/utils/tagTaxonomy';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterButton, FilterControls, FilterSelect } from '../common/components/FilterControls';
import DataTable from '../common/components/DataTable';
import { buildRowSecurityScope } from '../common/utils/rowSecurityScope';

const SUB_TABS = ['My Contacts', 'Firm Contacts', 'Key Contacts'];

export default function ContactsPage({ subPage }) {
  const [activeTab, setActiveTab] = useState(subPage || '');
  const [selectedContact, setSelectedContact] = useState(null);
  const [touchpointPreset, setTouchpointPreset] = useState(null);
  const [noteForContact, setNoteForContact] = useState(null);
  const [listForContact, setListForContact] = useState(null);
  const [tagsForContact, setTagsForContact] = useState(null);
  const [connectionsForContact, setConnectionsForContact] = useState(null);
  const [editContact, setEditContact] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAiDraft, setShowAiDraft] = useState(null);
  const [showAiSummary, setShowAiSummary] = useState(null);
  const [meetingBriefContact, setMeetingBriefContact] = useState(null);
  const [showTripPlanning, setShowTripPlanning] = useState(false);
  const [showOutlookLookup, setShowOutlookLookup] = useState(false);
  const [lastInteractedFilter, setLastInteractedFilter] = useState('');
  const [sort, setSort] = useState({ key: '', direction: '' });
  const [showColumns, setShowColumns] = useState({
    role: true,
    company: true,
    lastInteraction: true,
    relationship: true,
  });
  const notes = useDemoStore((s) => s.notes || []);
  const contacts = useDemoStore((s) => s.contacts || []);
  const filters = useDemoStore((s) => s.contactFilters || {});
  const lists = useDemoStore((s) => s.lists || []);
  const contactTags = useDemoStore((s) => s.contactTags || {});
  const tags = useDemoStore((s) => s.tags || []);
  const savedViews = useDemoStore((s) => s.savedViews || []);
  const companies = useDemoStore((s) => s.companies || []);

  const { can, field, depth } = usePersona();

  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');
  const rowScope = useMemo(
    () => buildRowSecurityScope({ personaId, companies, contacts }),
    [personaId, companies, contacts]
  );

  // AC-02 — BD Standard scoping:
  // Allowed companies => owned by current-user OR within the assigned sectors derived from those accounts.
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

  const hasLocationSearch = Boolean((filters.city || '').trim() || (filters.region || '').trim());
  const tripPlanningLists = useMemo(
    () => lists.filter((l) => l.type === 'Trip Planning'),
    [lists]
  );

  useEffect(() => {
    setActiveTab(subPage || '');
  }, [subPage]);

  const regions = useMemo(() => {
    const set = new Set(contacts.map((c) => c.region).filter(Boolean));
    return Array.from(set).sort();
  }, [contacts]);

  const industries = useMemo(() => {
    const set = new Set(companies.map((c) => c.category2).filter(Boolean));
    return Array.from(set).sort();
  }, [companies]);

  const companiesByName = useMemo(() => {
    return new Map(companies.map((c) => [c.name, c]));
  }, [companies]);

  const colleagueListsByContactId = useMemo(() => {
    const map = new Map();
    lists.forEach((list) => {
      const isColleagueOwned = String(list.owner || '').trim().toLowerCase() !== 'you';
      if (!isColleagueOwned) return;
      (list.memberIds || []).forEach((contactId) => {
        if (!map.has(contactId)) map.set(contactId, []);
        map.get(contactId).push(list);
      });
    });
    return map;
  }, [lists]);

  /** BH-08: referral lists + matters where this contact is recorded as referral source */
  const referralContextByContactId = useMemo(() => {
    const map = new Map();
    lists
      .filter((l) => l.type === 'Referral')
      .forEach((list) => {
        (list.memberIds || []).forEach((contactId) => {
          if (!map.has(contactId)) map.set(contactId, { lists: [], matterCount: 0 });
          map.get(contactId).lists.push(list);
        });
      });
    companies.forEach((co) => {
      (co.matters || []).forEach((m) => {
        const id = m.referralSourceContactId;
        if (!id) return;
        if (!map.has(id)) map.set(id, { lists: [], matterCount: 0 });
        map.get(id).matterCount += 1;
      });
    });
    return map;
  }, [lists, companies]);

  function buildTouchpointPresetFromContact(contact) {
    if (!contact) return null;
    const days = contact.metricsCurrent?.daysSinceLastInteraction ?? 999;
    const isKey = contact.isKeyContact;
    const relationship = contact.relationship || 'Stable';
    const badges = contact.contactBadges || [];
    let title = `Follow up with ${contact.name}`;
    let notes = '';

    if (days > 90 || relationship === 'Cold') {
      title = `Re-engage with ${contact.name}`;
      notes = `It has been ${contact.lastInteracted || `${days} days`} since last interaction. Consider a warm check-in to restart momentum.`;
    } else if (isKey && days > 30) {
      title = `Check in with key contact ${contact.name}`;
      notes = `High-priority relationship. Plan a touchpoint in the next 1–2 weeks to stay ahead of any fading signals.`;
    } else if (relationship === 'Fading') {
      notes = `Relationship is trending as Fading. Use a targeted update or recent firm activity to add value.`;
    }

    let interactionType = 'Call';
    if (badges.includes('visit')) interactionType = 'Visit';
    else if (badges.includes('event-match')) interactionType = 'Event';
    else if (badges.includes('digital-engagement') && days < 21) interactionType = 'Email';
    else if (days > 75 || relationship === 'Cold' || relationship === 'Fading') interactionType = 'Meeting';

    const eventLists = lists.filter(
      (l) => l.type === 'Event-based' && (l.memberIds || []).includes(contact.id)
    );
    const aiFlagLines = [];
    if (badges.includes('digital-engagement')) {
      aiFlagLines.push('Suggested angle: strong digital engagement — convert to a direct 1:1 touchpoint.');
    }
    if (badges.includes('pertinent-content')) {
      aiFlagLines.push('Suggested angle: content match — tie outreach to a relevant firm bulletin or publication.');
    }
    if (badges.includes('event-match')) {
      aiFlagLines.push('Suggested angle: event match — reference an upcoming or recent firm program in your invite.');
    }
    if (badges.includes('visit')) {
      aiFlagLines.push('Suggested type: visit touchpoint — align with travel, client site, or in-person forum.');
    }
    if (eventLists.length) {
      const names = eventLists.slice(0, 3).map((l) => l.name).join(', ');
      const more = eventLists.length > 3 ? ` (+${eventLists.length - 3} more)` : '';
      aiFlagLines.push(`Marketing / BD context: on event list(s): ${names}${more}.`);
    }
    if (aiFlagLines.length) {
      notes = [notes, aiFlagLines.join('\n')].filter(Boolean).join('\n\n');
    }

    const today = new Date();
    const target = new Date(today);
    target.setDate(target.getDate() + (days > 90 ? 3 : days > 30 ? 5 : 7));
    const dueDate = target.toISOString().slice(0, 10);

    return {
      contactName: contact.name,
      company: contact.company,
      role: contact.role,
      title,
      notes,
      dueDate,
      interactionType,
      relationshipStatus: relationship,
      relationshipScore: contact.relationshipScore,
      source: 'contacts-ai-preset',
    };
  }

  function avatarSrc(row) {
    return resolveContactAvatarUrl(row.avatarUrl) || row.avatarUrl;
  }

  const rows = useMemo(() => {
    let data = contacts;

    // Sub-tab filtering
    const isLegalAssistant = personaId === 'legal-assistant';
    const isAssociate = personaId === 'associate';
    if (isAssociate) {
      // AC-06 — Associate is scoped to assigned lawyers' contacts (prototype):
      // we treat "assigned" as the ownerId bucket for current-user.
      data = data.filter((c) => c.ownerId === 'current-user');
      if (activeTab === 'Key Contacts') data = data.filter((c) => c.isKeyContact);
    } else if (isLegalAssistant) {
      // AC-03 — Legal Assistant is scoped to assigned lawyers' contacts (prototype):
      // use ownerId === 'other-user' as the "assigned lawyers" bucket.
      data = data.filter((c) => c.ownerId === 'other-user');
      if (activeTab === 'Key Contacts') data = data.filter((c) => c.isKeyContact);
    } else if (activeTab === 'My Contacts') {
      data = data.filter((c) => c.ownerId === 'current-user');
    } else if (activeTab === 'Firm Contacts') {
      data = data.filter((c) => c.ownerId !== 'current-user');
    } else if (activeTab === 'Key Contacts') {
      data = data.filter((c) => c.isKeyContact);
    }

    // AC-02 — Apply BD Standard scoping after sub-tab selection.
    if (bdAllowedCompanyNames) {
      data = data.filter((c) => bdAllowedCompanyNames.has(c.company));
    }

    // AC-06/DT-07 consistency: enforce centralized row-level scope on contacts.
    data = data.filter((c) => rowScope.canSeeContact(c));

    if (filters.text?.trim()) {
      const q = filters.text.toLowerCase();
      data = data.filter((row) =>
        [row.name, row.role, row.company, row.lastInteraction, row.relationship].some((f) =>
          f?.toLowerCase().includes(q)
        )
      );
    }

    if (filters.city?.trim()) {
      const c = filters.city.toLowerCase();
      data = data.filter((row) => String(row.city || '').toLowerCase().includes(c));
    }

    if (filters.region?.trim()) {
      const r = filters.region.toLowerCase();
      data = data.filter((row) => String(row.region || '').toLowerCase().includes(r));
    }

    if (filters.industry?.trim()) {
      const ind = filters.industry.toLowerCase();
      data = data.filter((row) => {
        const company = companiesByName.get(row.company);
        return company && String(company.category2 || '').toLowerCase() === ind;
      });
    }

    // CO-14: advanced "type" filtering
    if (filters.contactType) {
      data = data.filter((row) => {
        const company = companiesByName.get(row.company);
        const accountType = String(company?.accountType || company?.category1 || '').toLowerCase();

        if (filters.contactType === 'contact') return true;
        if (filters.contactType === 'key-contact') return Boolean(row.isKeyContact);
        if (filters.contactType === 'key-client') return accountType === 'client';
        if (filters.contactType === 'target') return accountType === 'target' || accountType === 'prospective';
        if (filters.contactType === 'location') return Boolean(row.city || row.region);
        if (filters.contactType === 'company') return Boolean(row.company);
        if (filters.contactType === 'insight') return Boolean((row.contactBadges || []).length);
        return true;
      });
    }

    if (filters.relationship) {
      data = data.filter((row) => row.relationship === filters.relationship);
    }

    if (filters.listId) {
      const list = lists.find((l) => l.id === filters.listId);
      const memberIds = new Set(list?.memberIds || []);
      data = data.filter((row) => memberIds.has(row.id));
    }

    if (filters.tagId) {
      data = data.filter((row) => (contactTags[row.id] || []).includes(filters.tagId));
    }

    // CO-07: focused VIP/Key Contact sets (10–30 style workflow)
    if (filters.prioritySet) {
      const rankedKeyContacts = [...contacts]
        .filter((c) => c.isKeyContact)
        .sort((a, b) => (b.relationshipScore || 0) - (a.relationshipScore || 0));

      if (filters.prioritySet === 'key') {
        const keyIds = new Set(rankedKeyContacts.map((c) => c.id));
        data = data.filter((row) => keyIds.has(row.id));
      } else if (filters.prioritySet === 'top10') {
        const topIds = new Set(rankedKeyContacts.slice(0, 10).map((c) => c.id));
        data = data.filter((row) => topIds.has(row.id));
      } else if (filters.prioritySet === 'top30') {
        const topIds = new Set(rankedKeyContacts.slice(0, 30).map((c) => c.id));
        data = data.filter((row) => topIds.has(row.id));
      }
    }

    if (lastInteractedFilter) {
      data = data.filter((row) => {
        const days = row.metricsCurrent?.daysSinceLastInteraction ?? 999;
        if (lastInteractedFilter === '30d') return days <= 30;
        if (lastInteractedFilter === '30-90d') return days > 30 && days <= 90;
        if (lastInteractedFilter === '90d+') return days > 90;
        return true;
      });
    }

    if (sort.key && sort.direction) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      data = [...data].sort((a, b) => {
        if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
        if (sort.key === 'lastInteracted') {
          const getDays = (v) => { const m = String(v).match(/(\d+)/); return m ? parseInt(m[1], 10) : 9999; };
          return (getDays(a.lastInteracted) - getDays(b.lastInteracted)) * dir;
        }
        if (sort.key === 'relationship') return (a.relationship || '').localeCompare(b.relationship || '') * dir;
        return 0;
      });
    }

    return data;
  }, [
    contacts,
    filters,
    lists,
    contactTags,
    sort,
    activeTab,
    lastInteractedFilter,
    companiesByName,
    referralContextByContactId,
    personaId,
    bdAllowedCompanyNames,
    rowScope,
  ]);

  const nameParentOn = Boolean(showColumns.role) || Boolean(showColumns.company);
  const engagementParentOn = Boolean(showColumns.lastInteraction) || Boolean(showColumns.relationship);
  const activeParents = (nameParentOn ? 1 : 0) + (engagementParentOn ? 1 : 0);
  const nameActiveChildren = (showColumns.role ? 1 : 0) + (showColumns.company ? 1 : 0);
  const engagementActiveChildren = (showColumns.lastInteraction ? 1 : 0) + (showColumns.relationship ? 1 : 0);

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: '', direction: '' };
    });
  }

  function exportCsv() {
    if (!rows.length || !can('export.csv')) return;
    const headers = ['Name'];
    if (showColumns.role) headers.push('Role');
    if (showColumns.company) headers.push('Company');
    if (showColumns.lastInteraction) headers.push('Last interaction', 'Last interacted (days ago)');
    if (showColumns.relationship) headers.push('Relationship');
    const lines = [headers.join(',')];
    rows.forEach((row) => {
      const cols = [JSON.stringify(row.name)];
      if (showColumns.role) cols.push(JSON.stringify(row.role));
      if (showColumns.company) cols.push(JSON.stringify(row.company));
      if (showColumns.lastInteraction) { cols.push(JSON.stringify(row.lastInteraction)); cols.push(JSON.stringify(row.lastInteracted)); }
      if (showColumns.relationship) cols.push(JSON.stringify(row.relationship));
      lines.push(cols.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'contacts-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function addCurrentResultsToTripList() {
    const candidateIds = rows.map((r) => r.id);
    if (!candidateIds.length) {
      window.alert('No filtered contacts to add.');
      return;
    }

    const existing = tripPlanningLists;
    const defaultName = `${(filters.city || filters.region || 'Targeted').trim()} Trip — ${new Date().toLocaleDateString()}`;

    let targetListId = '';
    if (existing.length) {
      const options = existing.map((l, idx) => `${idx + 1}. ${l.name}`).join('\n');
      const choice = window.prompt(
        `Add ${candidateIds.length} contact(s) to a trip planning list.\nChoose list number, or type NEW to create a new list:\n\n${options}`,
        '1'
      );
      if (!choice) return;
      if (choice.trim().toUpperCase() === 'NEW') {
        const newName = window.prompt('New trip list name', defaultName);
        if (!newName?.trim()) return;
        targetListId = demoStore.actions.createList({
          name: newName.trim(),
          type: 'Trip Planning',
          visibility: 'Personal',
          tag: (filters.city || filters.region || 'Travel').trim() || 'Travel',
          color: 'bg-amber',
          memberIds: [],
        });
      } else {
        const idx = Number(choice) - 1;
        if (Number.isNaN(idx) || idx < 0 || idx >= existing.length) {
          window.alert('Invalid selection.');
          return;
        }
        targetListId = existing[idx].id;
      }
    } else {
      const newName = window.prompt('No trip planning list exists yet. Enter a name to create one:', defaultName);
      if (!newName?.trim()) return;
      targetListId = demoStore.actions.createList({
        name: newName.trim(),
        type: 'Trip Planning',
        visibility: 'Personal',
        tag: (filters.city || filters.region || 'Travel').trim() || 'Travel',
        color: 'bg-amber',
        memberIds: [],
      });
    }

    if (!targetListId) return;
    const added = demoStore.actions.addContactsToList(targetListId, candidateIds);
    window.alert(
      added > 0
        ? `Added ${added} contact${added === 1 ? '' : 's'} to the selected trip planning list.`
        : 'All filtered contacts were already in the selected trip planning list.'
    );
  }

  function renderBadges(contact) {
    if (!field('contactBadges') || !contact.contactBadges?.length) return null;
    return (
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        {contact.contactBadges.map((bid) => {
          const badge = BADGE_MAP[bid];
          if (!badge) return null;
          return (
            <span key={bid} title={badge.label} style={{
              display: 'inline-flex', alignItems: 'center', padding: '1px 6px',
              borderRadius: 10, fontSize: 10, fontWeight: 600,
              background: `${badge.color}20`, color: badge.color, border: `1px solid ${badge.color}40`,
            }}>
              {badge.label}
            </span>
          );
        })}
      </div>
    );
  }

  function renderFlags(contact) {
    const showVip = contact.isKeyContact && field('keyContact.toggle');
    const showAlumni = contact.isAlumni && field('alumni.flag');
    if (!showVip && !showAlumni) return null;
    return (
      <span className="contact-flags">
        {showVip && (
          <span className="contact-badge contact-flag-vip" title="VIP / Key Contact">
            ★ VIP
          </span>
        )}
        {showAlumni && (
          <span className="contact-badge contact-flag-alumni" title="Alumni">
            Alumni
          </span>
        )}
      </span>
    );
  }

  function renderColleagueListIndicator(contact) {
    const colleagueLists = colleagueListsByContactId.get(contact.id) || [];
    if (!colleagueLists.length) return null;
    const preview = colleagueLists.slice(0, 2).map((l) => l.name).join(', ');
    return (
      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
        In {colleagueLists.length} colleague list{colleagueLists.length > 1 ? 's' : ''}: {preview}
        {colleagueLists.length > 2 ? '...' : ''}
      </p>
    );
  }

  function renderReferralContext(contact) {
    const ctx = referralContextByContactId.get(contact.id);
    if (!ctx || (!ctx.lists.length && !ctx.matterCount)) return null;
    const parts = [];
    if (ctx.lists.length) parts.push(`Referral list${ctx.lists.length > 1 ? 's' : ''} (${ctx.lists.length})`);
    if (ctx.matterCount) parts.push(`${ctx.matterCount} attributed matter${ctx.matterCount > 1 ? 's' : ''}`);
    return (
      <p className="contact-referral-hint" title={ctx.lists.map((l) => l.name).join(', ')}>
        {parts.join(' · ')}
      </p>
    );
  }

  function openTouchpointForContact(contact) {
    const preset = buildTouchpointPresetFromContact(contact) || { contactName: contact.name };
    setTouchpointPreset(preset);
  }

  return (
    <section className="contacts-view">
      <PageHeader title="Contacts" showMore={false} right={<>
        {can('contact.add') && (
          <button className="primary" style={{ fontSize: 13 }} onClick={() => setShowAddContact(true)}>+ Add Contact</button>
        )}
        {can('tripPlan.create') && (
          <button className="tool-btn" style={{ fontSize: 13 }} onClick={() => setShowTripPlanning(true)}>Plan Trip</button>
        )}
        {can('tripPlan.create') && hasLocationSearch && (
          <button className="tool-btn" style={{ fontSize: 13 }} onClick={addCurrentResultsToTripList}>
            Add Results to Trip List
          </button>
        )}
        <button className="tool-btn" style={{ fontSize: 13 }} onClick={() => setShowOutlookLookup(true)}>
          Outlook Lookup
        </button>
      </>} />

      <SubTabBar tabs={SUB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <FilterBar className="contacts-filterbar">
        <SearchBar
          className="contacts-search"
          value={filters.text || ''}
          onChange={(value) => demoStore.actions.setContactFilters({ text: value })}
        />
        <FilterControls className="contacts-filter-actions">
          <input
            placeholder="City"
            className="contacts-filter-input"
            value={filters.city || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ city: e.target.value })}
          />
          <FilterSelect
            className="contacts-filter-select"
            value={filters.region || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ region: e.target.value })}
          >
            <option value="">Region</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            className="contacts-filter-select"
            value={filters.industry || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ industry: e.target.value })}
          >
            <option value="">Industry</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            className="contacts-filter-select"
            value={filters.relationship || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ relationship: e.target.value })}
          >
            <option value="">Relationship</option>
            <option value="Good">Good</option>
            <option value="Fading">Fading</option>
            <option value="Cold">Cold</option>
          </FilterSelect>
          <FilterSelect
            className="contacts-filter-select"
            value={filters.contactType || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ contactType: e.target.value })}
          >
            <option value="">Type</option>
            <option value="contact">Contact</option>
            <option value="company">Company</option>
            <option value="key-contact">Key Contact</option>
            <option value="key-client">Key Client</option>
            <option value="target">Target</option>
            <option value="location">Location</option>
            <option value="insight">Insight</option>
          </FilterSelect>
          <FilterSelect
            className="contacts-filter-select"
            value={filters.listId || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ listId: e.target.value })}
          >
            <option value="">All Lists</option>
            {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </FilterSelect>
          <FilterSelect
            className="contacts-filter-select"
            value={filters.tagId || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ tagId: e.target.value })}
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id} title={formatTagTaxonomyTitleAttr(t)}>{t.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            className="contacts-filter-select"
            value={filters.prioritySet || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ prioritySet: e.target.value })}
          >
            <option value="">Priority Set</option>
            <option value="key">Key Contacts (All)</option>
            <option value="top10">Top 10 Key Contacts</option>
            <option value="top30">Top 30 Key Contacts</option>
          </FilterSelect>
          <FilterSelect
            className="contacts-filter-select"
            value={lastInteractedFilter}
            onChange={(e) => setLastInteractedFilter(e.target.value)}
          >
            <option value="">Last Interacted</option>
            <option value="30d">Last 30 days</option>
            <option value="30-90d">30–90 days</option>
            <option value="90d+">90+ days</option>
          </FilterSelect>
          <FilterButton onClick={() => { const name = window.prompt('Save current filters as view name'); if (name) demoStore.actions.saveContactView(name); }}>Save View</FilterButton>
          <FilterSelect onChange={(e) => { const v = e.target.value; if (!v) return; if (v.startsWith('del:')) demoStore.actions.deleteContactView(v.slice(4)); else demoStore.actions.applyContactView(v); }}>
            <option value="">Views</option>
            {savedViews.filter((v) => v.scope === 'contacts').map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            {savedViews.filter((v) => v.scope === 'contacts').map((v) => <option key={`${v.id}-del`} value={`del:${v.id}`}>Delete: {v.name}</option>)}
          </FilterSelect>
          {can('export.csv') && <FilterButton onClick={exportCsv}>Export CSV</FilterButton>}
        </FilterControls>
      </FilterBar>

      <DataTable
        className="contacts-table-v2"
        tableClassName="contacts-table-v2-table"
        renderHeader={() => (
          <tr>
            <th>
              <div className="contacts-table-head-v2">
                <button type="button" style={{ all: 'unset', cursor: 'pointer', display: nameParentOn ? 'inline-flex' : 'none' }} onClick={() => toggleSort('name')}>
                  {nameParentOn && 'Name'}
                </button>
                <button type="button" style={{ all: 'unset', cursor: 'pointer', display: engagementParentOn ? 'inline-flex' : 'none' }} onClick={() => toggleSort('lastInteracted')}>
                  {engagementParentOn && 'Last interaction | Relationship status'}
                </button>
                <div style={{ position: 'relative', justifySelf: 'end' }}>
                  <button className="contacts-table-settings" aria-label="configure columns" type="button" onClick={() => setShowColumns((prev) => ({ ...prev, _open: !prev._open }))}>
                    <Icon name="settings" />
                  </button>
                  {showColumns._open && (
                    <div className="contacts-columns-popover" style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 8, boxShadow: '0 10px 15px -5px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 260 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4 }}>
                        <input type="checkbox" checked={nameParentOn} disabled={activeParents === 1 && nameParentOn} onChange={(e) => setShowColumns((prev) => ({ ...prev, role: e.target.checked, company: e.target.checked }))} />
                        <span style={{ fontWeight: 600 }}>Name</span>
                      </label>
                      {[['role', 'Role'], ['company', 'Company']].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4, paddingLeft: 20 }}>
                          <input type="checkbox" checked={Boolean(showColumns[key])} disabled={activeParents === 1 && nameParentOn && nameActiveChildren === 1 && showColumns[key]} onChange={(e) => setShowColumns((prev) => ({ ...prev, [key]: e.target.checked }))} />
                          <span>{label}</span>
                        </label>
                      ))}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, margin: '8px 0 4px' }}>
                        <input type="checkbox" checked={engagementParentOn} disabled={activeParents === 1 && engagementParentOn} onChange={(e) => setShowColumns((prev) => ({ ...prev, lastInteraction: e.target.checked, relationship: e.target.checked }))} />
                        <span style={{ fontWeight: 600 }}>Last interaction | Relationship status</span>
                      </label>
                      {[['lastInteraction', 'Last interaction'], ['relationship', 'Relationship status']].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4, paddingLeft: 20 }}>
                          <input type="checkbox" checked={Boolean(showColumns[key])} disabled={activeParents === 1 && engagementParentOn && engagementActiveChildren === 1 && showColumns[key]} onChange={(e) => setShowColumns((prev) => ({ ...prev, [key]: e.target.checked }))} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </th>
          </tr>
        )}
        renderBody={() =>
          rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="contact-row-v2 is-clickable" role="button" tabIndex={0}
                  onClick={(event) => { if (event.target.closest('.contact-actions-v2 button')) return; setSelectedContact(row); }}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedContact(row); } }}
                >
                  <div className="contact-name-col-v2">
                    <div style={{ display: nameParentOn ? 'flex' : 'none', alignItems: 'center', gap: 16 }}>
                      <img src={avatarSrc(row)} alt={row.name} className={`contact-avatar-v2 tone-${row.signalTone}`} />
                      <div className="contact-name-meta-v2">
                        <div className="contact-title-line-v2">
                          <strong>{row.name}</strong>
                          {renderFlags(row)}
                          <Icon name="signal" className={`network-icon tone-${row.signalTone}`} />
                        </div>
                        {showColumns.role && <p>{row.role}</p>}
                        {showColumns.company && <p>{row.company}</p>}
                        {renderBadges(row)}
                        {renderReferralContext(row)}
                        {renderColleagueListIndicator(row)}
                      </div>
                    </div>
                  </div>

                  <div className="contact-interaction-col-v2">
                    <div style={{ display: engagementParentOn ? 'flex' : 'none', alignItems: 'center', gap: 12 }}>
                      <div className="contact-note-pill-v2"><Icon name="note" /></div>
                      <div className="contact-interaction-text-v2">
                        {showColumns.lastInteraction && <p className="contact-interaction-title-v2">{row.lastInteraction}</p>}
                        {(showColumns.lastInteraction || showColumns.relationship) && (
                          <p className="contact-interaction-sub-v2">
                            {showColumns.lastInteraction && <>Last interacted <strong>{row.lastInteracted}</strong></>}
                            {showColumns.relationship && <span>Relationship status <strong>{row.relationship}</strong></span>}
                          </p>
                        )}
                        {showColumns.lastInteraction && row.lastInteractionAttribution && (
                          <p className="contact-last-touch-source-v2">
                            <span
                              className={`last-touch-source ${lastInteractionSystemClass(row.lastInteractionAttribution)}`}
                            >
                              {formatLastTouchSourceLine(row.lastInteractionAttribution)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="contact-actions-v2">
                    <button aria-label="new touchpoint" onClick={() => openTouchpointForContact(row)}>
                      <Icon name="docPlus" />
                    </button>
                    {can('contact.markKey') && (
                      <button aria-label="toggle key contact" onClick={() => demoStore.actions.toggleKeyContact(row.id)} title={row.isKeyContact ? 'Remove Key Contact' : 'Mark as Key Contact'}>
                        <span style={{ color: row.isKeyContact ? '#f59e0b' : '#9ca3af' }}>★</span>
                      </button>
                    )}
                    <button aria-label="more actions" onClick={() => setNoteForContact(row)}>
                      <Icon name="listPlus" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))
        }
      />

      <section className="contacts-cards">
        {rows.map((row) => (
          <article key={row.id} className="contact-card" onClick={() => setSelectedContact(row)} role="button">
            <div className="contact-card-header">
              <img src={avatarSrc(row)} alt={row.name} className={`contact-avatar-v2 tone-${row.signalTone}`} />
              <div className="contact-card-main">
                <strong>{row.name}</strong>{renderFlags(row)}
                <div className="contact-card-meta"><span>{row.role}</span>{' • '}<span>{row.company}</span></div>
                <div className="contact-card-meta">Last interacted <strong>{row.lastInteracted}</strong> · Relationship <strong>{row.relationship}</strong></div>
                {row.lastInteraction && (
                  <p className="contact-card-snippet" style={{ fontSize: 12, color: '#4b5563', margin: '6px 0 0', lineHeight: 1.4 }}>{row.lastInteraction}</p>
                )}
                {row.lastInteractionAttribution && (
                  <p style={{ margin: '4px 0 0' }}>
                    <span className={`last-touch-source ${lastInteractionSystemClass(row.lastInteractionAttribution)}`} style={{ fontSize: 11 }}>
                      {formatLastTouchSourceLine(row.lastInteractionAttribution)}
                    </span>
                  </p>
                )}
                {renderBadges(row)}
                {renderReferralContext(row)}
                {renderColleagueListIndicator(row)}
              </div>
            </div>
            <div className="contact-card-actions">
              <button aria-label="new touchpoint" onClick={(e) => { e.stopPropagation(); openTouchpointForContact(row); }}>
                <Icon name="docPlus" />
              </button>
              <button aria-label="add note" onClick={(e) => { e.stopPropagation(); setNoteForContact(row); }}>
                <Icon name="listPlus" />
              </button>
            </div>
          </article>
        ))}
      </section>

      <ContactDetailModal
        contact={selectedContact}
        isOpen={Boolean(selectedContact)}
        onClose={() => setSelectedContact(null)}
        onCreateTouchpoint={(c) => openTouchpointForContact(c)}
        onAddNote={(c) => setNoteForContact(c)}
        onAddToList={(c) => setListForContact(c)}
        onManageTags={(c) => setTagsForContact(c)}
        onFirmConnections={(c) => setConnectionsForContact(c)}
        onDraftOutreach={(c) => setShowAiDraft(c)}
        onAiSummary={(c) => setShowAiSummary(c)}
        onMeetingBrief={(c) => {
          setSelectedContact(null);
          setMeetingBriefContact(c);
        }}
        onEdit={(c) => setEditContact(c)}
      />

      <CreateTouchpointTaskModal isOpen={Boolean(touchpointPreset)} preset={touchpointPreset} onClose={() => setTouchpointPreset(null)} />
      <AddContactNoteModal contact={noteForContact} isOpen={Boolean(noteForContact)} onClose={() => setNoteForContact(null)} />
      <AddContactToListModal contact={listForContact} isOpen={Boolean(listForContact)} onClose={() => setListForContact(null)} />
      <ManageContactTagsModal contact={tagsForContact} isOpen={Boolean(tagsForContact)} onClose={() => setTagsForContact(null)} />
      <FirmConnectionsModal contact={connectionsForContact} isOpen={Boolean(connectionsForContact)} onClose={() => setConnectionsForContact(null)} />
      <AddContactModal isOpen={showAddContact} onClose={() => setShowAddContact(false)} />
      <UpdateContactModal contact={editContact} isOpen={Boolean(editContact)} onClose={() => setEditContact(null)} />
      <TripPlanningModal isOpen={showTripPlanning} onClose={() => setShowTripPlanning(false)} />
      <AiDraftPanel isOpen={Boolean(showAiDraft)} contact={showAiDraft} onClose={() => setShowAiDraft(null)} />
      <AiNoteSummaryPanel isOpen={Boolean(showAiSummary)} contactName={showAiSummary?.name} contactId={showAiSummary?.id} onClose={() => setShowAiSummary(null)} />
      <MeetingBriefModal
        contact={meetingBriefContact}
        isOpen={Boolean(meetingBriefContact)}
        onClose={() => setMeetingBriefContact(null)}
      />
      <OutlookLookupModal
        isOpen={showOutlookLookup}
        onClose={() => setShowOutlookLookup(false)}
        onOpenContact={(c) => {
          setShowOutlookLookup(false);
          setSelectedContact(c);
        }}
      />
    </section>
  );
}
