import { useEffect, useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import CreateTouchpointTaskModal from '../common/components/CreateTouchpointTaskModal';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import ManageCompanyTagsModal from '../common/components/ManageCompanyTagsModal';
import AddCompanyNoteModal from '../common/components/AddCompanyNoteModal';
import FirmConnectionsModal from '../common/components/FirmConnectionsModal';
import AddCompanyModal from '../common/components/AddCompanyModal';
import UpdateCompanyModal from '../common/components/UpdateCompanyModal';
import AddOpportunityModal from '../common/components/AddOpportunityModal';
import RecentInteractionsModal from '../common/components/RecentInteractionsModal';
import CompanyNewsPanel from '../common/components/CompanyNewsPanel';
import PowerBIDashboard from '../common/components/PowerBIDashboard';
import SubTabBar from '../common/components/SubTabBar';
import { CompanyHealthPanel } from '../common/components/CompanyHealthPanel';
import { OpportunityIdentificationPanel } from '../common/components/OpportunityIdentificationPanel';
import { CompanyMattersPanel } from '../common/components/CompanyMattersPanel';
import { CompanyOpportunitiesPanel } from '../common/components/CompanyOpportunitiesPanel';
import CrossPracticeCoordination from '../common/components/CrossPracticeCoordination';
import { usePersona } from '../common/hooks/usePersona';
import { buildPersonaHelper } from '../common/constants/personas';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterButton, FilterControls, FilterSelect } from '../common/components/FilterControls';
import DataTable from '../common/components/DataTable';
import { formatTagTaxonomyTitleAttr } from '../common/utils/tagTaxonomy';
import ActivityFeed from '../common/components/ActivityFeed';
import DetailActionBar from '../common/components/DetailActionBar';
import DetailTabBar from '../common/components/DetailTabBar';
import { buildRowSecurityScope } from '../common/utils/rowSecurityScope';

const companyAvatarUrls = import.meta.glob('../../demo-data/avatars/companies/*', { eager: true, import: 'default' });

function resolveCompanyAvatarUrl(filename) {
  if (!filename) return null;
  const exactKey = `../../demo-data/avatars/companies/${filename}`;
  if (companyAvatarUrls[exactKey]) return companyAvatarUrls[exactKey];
  const matchKey = Object.keys(companyAvatarUrls).find((k) => k.toLowerCase().endsWith(`/${filename.toLowerCase()}`));
  return matchKey ? companyAvatarUrls[matchKey] : null;
}

function CompanyLogo({ type, avatarUrl, name }) {
  const resolvedAvatarUrl = resolveCompanyAvatarUrl(avatarUrl);
  if (resolvedAvatarUrl) {
    return <div className="company-logo-v2"><img className="company-logo-image-v2" src={resolvedAvatarUrl} alt={name || 'Company logo'} /></div>;
  }
  if (type === 'uber') return <div className="company-logo-v2 logo-uber">Uber</div>;
  if (type === 'edgetech') return <div className="company-logo-v2 logo-edgetech" aria-hidden="true"><span /></div>;
  if (type === 'zoom') return <div className="company-logo-v2 logo-zoom" aria-hidden="true"><div className="zoom-camera" /></div>;
  return <div className="company-logo-v2">C</div>;
}

const SUB_TABS = ['My Clients', 'Firm Clients', 'Prospective Clients'];

export default function CompaniesPage({ subPage }) {
  const [activeTab, setActiveTab] = useState(subPage || '');
  const [sort, setSort] = useState({ key: '', direction: '' });
  const [showColumns, setShowColumns] = useState({ categories: true, recentEngagement: true, clientStatus: true });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [touchpointPreset, setTouchpointPreset] = useState(null);
  const [tagsForCompany, setTagsForCompany] = useState(null);
  const [connectionsForContact, setConnectionsForContact] = useState(null);
  const [noteForCompany, setNoteForCompany] = useState(null);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [showAddOpp, setShowAddOpp] = useState(null);
  const [showInteractions, setShowInteractions] = useState(null);
  const [companyDetailTab, setCompanyDetailTab] = useState('overview');
  const rawCompanyTags = useDemoStore((s) => s.companyTags);
  const rawTags = useDemoStore((s) => s.tags);
  const rawCompanyFilters = useDemoStore((s) => s.companyFilters);
  const rawSavedViews = useDemoStore((s) => s.savedViews);
  const rawTouchpoints = useDemoStore((s) => s.touchpoints);
  const rawCompanyNotes = useDemoStore((s) => s.companyNotes);
  const contacts = useDemoStore((s) => s.contacts || []);
  const companies = useDemoStore((s) => s.companies || []);
  const activities = useDemoStore((s) => s.activities || []);
  const companyTags = rawCompanyTags || {};
  const tags = rawTags || [];
  const companyFilters = rawCompanyFilters || {};
  const savedViews = rawSavedViews || [];
  const touchpoints = rawTouchpoints || [];
  const companyNotes = rawCompanyNotes || [];
  const [engagementTypeFilter, setEngagementTypeFilter] = useState('All');
  const [engagementPersonFilter, setEngagementPersonFilter] = useState('All');
  const [engagementClientJobLevelFilter, setEngagementClientJobLevelFilter] = useState('All');
  const [engagementEventTypeFilter, setEngagementEventTypeFilter] = useState('All');
  const [engagementRelationshipStrengthFilter, setEngagementRelationshipStrengthFilter] = useState('All');
  const [matterLeadFilter, setMatterLeadFilter] = useState('All');
  const [matterHierarchyFilter, setMatterHierarchyFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('');

  const { can, field, depth } = usePersona({ company: selectedCompany });
  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');
  const rowScope = useMemo(
    () => buildRowSecurityScope({ personaId, companies, contacts }),
    [personaId, companies, contacts]
  );

  // AC-02 — BD Standard scoping:
  // - Assigned accounts => companies owned by "current-user" (client accounts)
  // - Assigned sectors => distinct industries (category2) from those assigned accounts
  // - Visible => either assigned account OR within one of the assigned sectors
  const bdAssignedSectors = useMemo(() => {
    const assignedAccounts = companies.filter(
      (c) => (c.accountType === 'Client' || c.category1 === 'Client') && c.ownerId === 'current-user'
    );
    return new Set(assignedAccounts.map((c) => c.category2).filter(Boolean));
  }, [companies]);

  const isAccountSectorScoped = personaId === 'bd-standard' || personaId === 'non-equity-partner';

  // AC-03 — Legal Assistant scoping:
  // Prototype: assigned lawyers' contacts => contacts where ownerId === 'other-user'.
  const isLegalAssistant = personaId === 'legal-assistant';
  const legalAssistantAllowedCompanyNames = useMemo(() => {
    if (!isLegalAssistant) return null;
    const allowedContacts = contacts.filter((c) => c.ownerId === 'other-user');
    return new Set(allowedContacts.map((c) => c.company).filter(Boolean));
  }, [contacts, isLegalAssistant]);

  // AC-06 — Associate scoping:
  // Prototype: assigned lawyers' contacts => ownerId === 'current-user'.
  const isAssociate = personaId === 'associate';
  const associateAllowedCompanyNames = useMemo(() => {
    if (!isAssociate) return null;
    const allowedContacts = contacts.filter((c) => c.ownerId === 'current-user');
    return new Set(allowedContacts.map((c) => c.company).filter(Boolean));
  }, [contacts, isAssociate]);

  // AC-08 — Group Lead: derive in-practice-group set (prototype).
  const groupLeadPracticeGroup = 'Corporate';
  const groupLeadCompaniesInPracticeGroup = useMemo(() => {
    if (personaId !== 'group-lead') return [];
    const dominantPractice = (co) => {
      const ps = co?.practiceShare || [];
      if (!Array.isArray(ps) || ps.length === 0) return null;
      return ps.reduce((acc, row) => (row?.value > (acc?.value ?? -1) ? row : acc), ps[0])?.practice || null;
    };
    return companies
      .filter((co) => dominantPractice(co) === groupLeadPracticeGroup)
      .slice(0, 8);
  }, [companies, personaId]);

  useEffect(() => {
    setActiveTab(subPage || '');
  }, [subPage]);

  useEffect(() => {
    setMatterLeadFilter('All');
    setMatterHierarchyFilter('All');
  }, [selectedCompany?.id]);

  useEffect(() => {
    setCompanyDetailTab((tab) => {
      if (tab !== 'ci-reports') return tab;
      return buildPersonaHelper(personaId, { company: selectedCompany }).field('ciReports')
        ? tab
        : 'overview';
    });
  }, [personaId, selectedCompany?.id]);

  function guessContactForCompany(companyName) {
    return contacts.find((c) => c.company === companyName) || null;
  }

  const rows = useMemo(() => {
    let data = companies;

    // Sub-tab filtering
    if (isAssociate) {
      data = data.filter((c) => associateAllowedCompanyNames?.has(c.name));
    } else if (isLegalAssistant) {
      data = data.filter((c) => legalAssistantAllowedCompanyNames?.has(c.name));
    } else if (activeTab === 'My Clients') {
      data = data.filter(
        (c) => (c.accountType === 'Client' || c.category1 === 'Client') && c.ownerId === 'current-user'
      );
    } else if (activeTab === 'Firm Clients') {
      data = data.filter(
        (c) => (c.accountType === 'Client' || c.category1 === 'Client') && c.ownerId !== 'current-user'
      );
    } else if (activeTab === 'Prospective Clients') {
      data = data.filter((c) => c.accountType === 'Prospective' || c.category1 === 'Prospective');
    }

    // AC-02 — Apply persona-based scoping after sub-tab selection.
    if (isAccountSectorScoped) {
      data = data.filter((c) => c.ownerId === 'current-user' || bdAssignedSectors.has(c.category2));
    }

    // AC-06/DT-07 consistency: enforce centralized row-level scope on companies.
    data = data.filter((c) => rowScope.canSeeCompanyName(c.name));

    if (companyFilters.text?.trim()) {
      const q = companyFilters.text.toLowerCase();
      data = data.filter((row) => [row.name, row.category1, row.category2, row.engagementTitle, row.recentEngagement, row.clientStatus].join(' ').toLowerCase().includes(q));
    }
    if (companyFilters.relationshipTrend) data = data.filter((row) => row.relationshipTrend === companyFilters.relationshipTrend);
    if (companyFilters.tagId) data = data.filter((row) => (companyTags[row.id] || []).includes(companyFilters.tagId));
    if (industryFilter) data = data.filter((row) => row.category2 === industryFilter);
    if (clientStatusFilter) data = data.filter((row) => row.clientStatus === clientStatusFilter);

    if (sort.key && sort.direction) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      data = [...data].sort((a, b) => {
        if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
        if (sort.key === 'recentEngagement') return a.recentEngagement.localeCompare(b.recentEngagement) * dir;
        if (sort.key === 'clientStatus') return a.clientStatus.localeCompare(b.clientStatus) * dir;
        return 0;
      });
    }
    return data;
  }, [
    companies,
    companyFilters,
    companyTags,
    sort,
    activeTab,
    industryFilter,
    clientStatusFilter,
    isAccountSectorScoped,
    bdAssignedSectors,
    isLegalAssistant,
    legalAssistantAllowedCompanyNames,
    isAssociate,
    associateAllowedCompanyNames,
    rowScope,
  ]);

  const nameParentOn = Boolean(showColumns.categories);
  const engagementParentOn = Boolean(showColumns.recentEngagement) || Boolean(showColumns.clientStatus);
  const engagementActiveChildren = (showColumns.recentEngagement ? 1 : 0) + (showColumns.clientStatus ? 1 : 0);
  const activeParentsCount = (nameParentOn ? 1 : 0) + (engagementParentOn ? 1 : 0);

  const engagementRows = useMemo(() => {
    if (!selectedCompany) return [];
    const companyContacts = contacts.filter((c) => c.company === selectedCompany.name);
    const contactByName = new Map(companyContacts.map((c) => [c.name, c]));
    const classifyJobLevel = (role = '') => {
      const value = String(role).toLowerCase();
      if (value.includes('chief') || value.includes('general counsel') || value.includes('vp') || value.includes('vice president') || value.includes('president') || value.includes('director')) return 'Executive';
      if (value.includes('manager') || value.includes('head')) return 'Manager';
      if (value.includes('counsel') || value.includes('lawyer') || value.includes('associate') || value.includes('analyst')) return 'Professional';
      return 'Other';
    };
    const inferEventType = (text = '') => {
      const value = String(text).toLowerCase();
      if (value.includes('bulletin') || value.includes('newsletter') || value.includes('digest')) return 'Content';
      if (value.includes('webinar')) return 'Webinar';
      if (value.includes('conference')) return 'Conference';
      if (value.includes('dinner') || value.includes('breakfast') || value.includes('lunch')) return 'Hospitality';
      if (value.includes('summit') || value.includes('roundtable') || value.includes('forum')) return 'Roundtable';
      if (value.includes('workshop') || value.includes('training')) return 'Workshop';
      if (value.includes('event')) return 'Client Event';
      return 'N/A';
    };
    const inferImportance = (text = '', type = '') => {
      const value = String(text).toLowerCase();
      if (type === 'Meeting' || type === 'Event') return 'High';
      if (value.includes('rfp') || value.includes('acquisition') || value.includes('regulatory') || value.includes('critical')) return 'High';
      if (type === 'Call' || value.includes('follow-up')) return 'Medium';
      return 'Low';
    };
    const inferActivitySource = (text = '', type = '') => {
      const value = String(text).toLowerCase();
      if (
        type === 'Event' ||
        value.includes('webinar') ||
        value.includes('campaign') ||
        value.includes('newsletter') ||
        value.includes('bulletin') ||
        value.includes('event') ||
        value.includes('invite')
      ) return 'Marketing';
      if (value.includes('pitch') || value.includes('rfp') || value.includes('opportunity')) return 'BD';
      return 'Relationship';
    };
    const eRows = [];
    (selectedCompany.recentInteractions || []).forEach((text, index) => {
      const [datePart, rest] = String(text).split(':');
      const summary = rest ? rest.trim() : text;
      const lower = summary.toLowerCase();
      let type = 'Other';
      if (lower.includes('email')) type = 'Email';
      else if (lower.includes('meeting')) type = 'Meeting';
      else if (lower.includes('call')) type = 'Call';
      else if (lower.includes('event') || lower.includes('webinar')) type = 'Event';
      const contactName = selectedCompany.keyContacts?.[0] || selectedCompany.name;
      const contactMeta = contactByName.get(contactName);
      eRows.push({
        id: `recent-${index}`,
        date: datePart?.trim() || '',
        type,
        contact: contactName,
        internal: 'You',
        summary,
        eventType: type === 'Event' ? inferEventType(summary) : 'N/A',
        clientJobLevel: classifyJobLevel(contactMeta?.role),
        relationshipStrength: contactMeta?.relationship || selectedCompany.relationshipTrend || 'Stable',
        importance: inferImportance(summary, type),
        sourceType: inferActivitySource(summary, type),
      });
    });
    touchpoints.filter((tp) => tp.company === selectedCompany.name).forEach((tp) => {
      const isTask = tp.kind === 'task';
      const rawDate = isTask ? tp.dueAt : tp.completedAt || tp.createdAt;
      const dateObj = rawDate ? new Date(rawDate) : null;
      const date = dateObj ? dateObj.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }) : '';
      const type = tp.interactionType || (isTask ? 'Task' : 'Interaction');
      const contactName = tp.contactName || '';
      const contactMeta = contactByName.get(contactName);
      const summary = tp.title || tp.outcome || '';
      eRows.push({
        id: tp.id,
        date,
        type,
        contact: contactName,
        internal: tp.assignedTo || 'You',
        summary,
        eventType: type === 'Event' ? inferEventType(summary) : 'N/A',
        clientJobLevel: classifyJobLevel(contactMeta?.role),
        relationshipStrength: contactMeta?.relationship || tp.relationshipStatus || selectedCompany.relationshipTrend || 'Stable',
        importance: inferImportance(summary, type),
        sourceType: inferActivitySource(summary, type),
      });
    });
    let filtered = eRows;
    if (engagementTypeFilter !== 'All') filtered = filtered.filter((r) => r.type === engagementTypeFilter);
    if (engagementPersonFilter !== 'All') filtered = filtered.filter((r) => r.internal === engagementPersonFilter);
    if (engagementClientJobLevelFilter !== 'All') filtered = filtered.filter((r) => r.clientJobLevel === engagementClientJobLevelFilter);
    if (engagementEventTypeFilter !== 'All') filtered = filtered.filter((r) => r.eventType === engagementEventTypeFilter);
    if (engagementRelationshipStrengthFilter !== 'All') filtered = filtered.filter((r) => r.relationshipStrength === engagementRelationshipStrengthFilter);
    return filtered.slice(0, depth('engagementRows'));
  }, [
    selectedCompany,
    contacts,
    touchpoints,
    engagementTypeFilter,
    engagementPersonFilter,
    engagementClientJobLevelFilter,
    engagementEventTypeFilter,
    engagementRelationshipStrengthFilter,
    depth,
  ]);

  const engagementFilterOptions = useMemo(() => {
    const uniqueSorted = (values) => Array.from(new Set(values.filter(Boolean))).sort();
    return {
      internalPeople: uniqueSorted(engagementRows.map((r) => r.internal)),
      jobLevels: uniqueSorted(engagementRows.map((r) => r.clientJobLevel)),
      eventTypes: uniqueSorted(engagementRows.map((r) => r.eventType)).filter((v) => v !== 'N/A'),
      relationshipStrengths: uniqueSorted(engagementRows.map((r) => r.relationshipStrength)),
    };
  }, [engagementRows]);

  const engagementBreakdown = useMemo(() => {
    const rows = engagementRows;
    const bySource = rows.reduce((acc, row) => {
      const key = row.sourceType || 'Relationship';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const total = rows.length || 1;
    const pct = (count) => `${Math.round((count / total) * 100)}%`;
    return {
      total: rows.length,
      marketing: bySource.Marketing || 0,
      bd: bySource.BD || 0,
      relationship: bySource.Relationship || 0,
      marketingPct: pct(bySource.Marketing || 0),
      bdPct: pct(bySource.BD || 0),
      relationshipPct: pct(bySource.Relationship || 0),
    };
  }, [engagementRows]);

  const matterRows = useMemo(() => {
    if (!selectedCompany) return [];
    const hierarchy = Array.isArray(selectedCompany.hierarchy) && selectedCompany.hierarchy.length
      ? selectedCompany.hierarchy
      : [selectedCompany.name || 'Company'];
    const source = Array.isArray(selectedCompany.matters) ? selectedCompany.matters : [];
    const withHierarchy = source.map((matter, idx) => ({
      ...matter,
      hierarchyNode: hierarchy[idx % hierarchy.length],
    }));
    let filtered = withHierarchy;
    if (matterLeadFilter !== 'All') filtered = filtered.filter((m) => (m.leadLawyer || '—') === matterLeadFilter);
    if (matterHierarchyFilter !== 'All') filtered = filtered.filter((m) => (m.hierarchyNode || '—') === matterHierarchyFilter);
    return filtered;
  }, [selectedCompany, matterLeadFilter, matterHierarchyFilter]);

  const matterFilterOptions = useMemo(() => {
    const uniqueSorted = (values) => Array.from(new Set(values.filter(Boolean))).sort();
    return {
      leadLawyers: uniqueSorted(matterRows.map((m) => m.leadLawyer)).filter((v) => v !== '—'),
      hierarchyNodes: uniqueSorted(matterRows.map((m) => m.hierarchyNode)).filter((v) => v !== '—'),
    };
  }, [matterRows]);

  const matterLeadSummaryRows = useMemo(() => {
    const byLead = new Map();
    matterRows.forEach((m) => {
      const key = m.leadLawyer || 'Unassigned';
      const existing = byLead.get(key) || { lead: key, total: 0, active: 0, wip: 0 };
      existing.total += 1;
      if (m.status === 'Active') existing.active += 1;
      existing.wip += Number(m.wip || 0);
      byLead.set(key, existing);
    });
    return Array.from(byLead.values()).sort((a, b) => b.wip - a.wip);
  }, [matterRows]);

  const ciReports = useMemo(() => {
    if (!selectedCompany) return [];
    const now = new Date();
    const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
    const daysAgo = (n) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return fmt(d);
    };
    const activeMatters = (selectedCompany.matters || []).filter((m) => m.status === 'Active').length;
    const pendingOpps = (selectedCompany.opportunities || []).filter((o) => o.status === 'Pending').length;
    const latestNews = (selectedCompany.newsItems || [])[0];
    return [
      {
        id: `${selectedCompany.id}-ci-1`,
        name: 'Account Risk Brief',
        type: 'Risk',
        status: selectedCompany.relationshipTrend === 'Declining' ? 'Needs Review' : 'Current',
        lastUpdated: daysAgo(2),
        owner: 'BD Intelligence',
        summary: `Trend ${selectedCompany.relationshipTrend}; active matters ${activeMatters}.`,
      },
      {
        id: `${selectedCompany.id}-ci-2`,
        name: 'Opportunity Pulse',
        type: 'Growth',
        status: pendingOpps > 0 ? 'Current' : 'Draft',
        lastUpdated: daysAgo(6),
        owner: 'Client Team',
        summary: `${pendingOpps} pending opportunities with pipeline watchlist.`,
      },
      {
        id: `${selectedCompany.id}-ci-3`,
        name: 'Market & News Snapshot',
        type: 'Market',
        status: latestNews ? 'Current' : 'Draft',
        lastUpdated: daysAgo(10),
        owner: 'Research',
        summary: latestNews ? `${latestNews.type}: ${latestNews.title}` : 'No recent company news attached.',
      },
    ];
  }, [selectedCompany]);

  const opportunityAnalytics = useMemo(() => {
    const opportunities = selectedCompany?.opportunities || [];
    const stageByType = {
      RFP: 'Qualification',
      Pitch: 'Proposal',
      Panel: 'Negotiation',
    };
    const weightByType = {
      RFP: 1.2,
      Pitch: 1,
      Panel: 0.8,
    };

    const base = {
      stages: { Qualification: 0, Proposal: 0, Negotiation: 0 },
      statuses: { Pending: 0, Won: 0, Lost: 0 },
      weightedValue: 0,
    };

    const scored = opportunities.reduce((acc, opp, idx) => {
      const stage = stageByType[opp.type] || 'Qualification';
      const status = opp.status || 'Pending';
      const typeWeight = weightByType[opp.type] || 1;
      const amount = Math.round((40_000 + (idx + 1) * 15_000) * typeWeight);

      if (acc.stages[stage] === undefined) acc.stages[stage] = 0;
      if (acc.statuses[status] === undefined) acc.statuses[status] = 0;
      acc.stages[stage] += 1;
      acc.statuses[status] += 1;
      if (status === 'Pending') acc.weightedValue += amount;
      return acc;
    }, base);

    const totalClosed = scored.statuses.Won + scored.statuses.Lost;
    const winRate = totalClosed ? Math.round((scored.statuses.Won / totalClosed) * 100) : 0;
    const lossRate = totalClosed ? Math.round((scored.statuses.Lost / totalClosed) * 100) : 0;

    return {
      ...scored,
      total: opportunities.length,
      totalClosed,
      winRate,
      lossRate,
    };
  }, [selectedCompany]);

  const revenueLabel = selectedCompany
    ? field('revenue.exact')
      ? selectedCompany.revenue
      : field('revenue.range')
        ? (() => { const m = String(selectedCompany.revenue || '').match(/([\d.]+)/); const n = m ? parseFloat(m[1]) : null; if (!n) return 'Revenue: $500K–$2M range'; if (n < 0.8) return 'Revenue: <$1M range'; if (n < 1.5) return 'Revenue: $1M–$2M range'; return 'Revenue: $2M+ range'; })()
        : null
    : '';

  function toggleSort(key) {
    setSort((prev) => { if (prev.key !== key) return { key, direction: 'asc' }; if (prev.direction === 'asc') return { key, direction: 'desc' }; return { key: '', direction: '' }; });
  }

  function createCompanyOpportunityList(company) {
    if (!company?.name) return;
    const created = demoStore.actions.createCrossPracticeInitiativeList({
      companyName: company.name,
      maxMembers: 12,
    });
    if (created?.membersAdded) {
      window.alert(
        `Created cross-practice opportunity list for ${company.name} with ${created.membersAdded} contact${created.membersAdded === 1 ? '' : 's'}.`
      );
      return;
    }
    window.alert(`No cross-practice opportunity list created for ${company.name} (no coverage-gap candidates found).`);
  }

  function exportCsv() {
    if (!rows.length || !can('export.csv')) return;
    const headers = ['Name'];
    if (showColumns.categories) headers.push('Category 1', 'Category 2');
    if (showColumns.recentEngagement) headers.push('Recent engagement');
    if (showColumns.clientStatus) headers.push('Client status');
    const lines = [headers.join(',')];
    rows.forEach((row) => {
      const cols = [JSON.stringify(row.name)];
      if (showColumns.categories) { cols.push(JSON.stringify(row.category1), JSON.stringify(row.category2)); }
      if (showColumns.recentEngagement) cols.push(JSON.stringify(row.recentEngagement));
      if (showColumns.clientStatus) cols.push(JSON.stringify(row.clientStatus));
      lines.push(cols.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'companies-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const isDetailView = Boolean(selectedCompany);

  return (
    <section className={`companies-view-v2 ${isDetailView ? 'companies-detail-view' : ''}`}>
      {!isDetailView && (
        <>
          <PageHeader title="Companies" showMore={false} right={<>
            {can('company.add') && <button className="primary" style={{ fontSize: 13 }} onClick={() => setShowAddCompany(true)}>+ Add Company</button>}
            {can('opportunity.add') && <button className="tool-btn" style={{ fontSize: 13 }} onClick={() => setShowAddOpp({})}>+ Add Opportunity</button>}
          </>} />

          <SubTabBar tabs={SUB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          <FilterBar className="companies-filterbar-v2">
            <SearchBar className="companies-search-v2" value={companyFilters.text || ''} onChange={(value) => demoStore.actions.setCompanyFilters({ text: value })} />
            <FilterControls>
              <FilterSelect value={companyFilters.relationshipTrend || ''} onChange={(e) => demoStore.actions.setCompanyFilters({ relationshipTrend: e.target.value })}>
                <option value="">Relationship trend</option>
                <option value="Growing">Growing</option>
                <option value="Stable">Stable</option>
                <option value="Declining">Declining</option>
              </FilterSelect>
              <FilterSelect value={companyFilters.tagId || ''} onChange={(e) => demoStore.actions.setCompanyFilters({ tagId: e.target.value })}>
                <option value="">All Tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id} title={formatTagTaxonomyTitleAttr(t)}>
                    {t.label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
                <option value="">Industry</option>
                {[...new Set(companies.map((c) => c.category2).filter(Boolean))].sort().map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </FilterSelect>
              <FilterSelect value={clientStatusFilter} onChange={(e) => setClientStatusFilter(e.target.value)}>
                <option value="">Client Status</option>
                {['Good', 'At Risk', 'Needs Attention', 'Improving', 'New'].map((s) => <option key={s} value={s}>{s}</option>)}
              </FilterSelect>
              <FilterButton onClick={() => { const name = window.prompt('Save current company filters as view name'); if (name) demoStore.actions.saveCompanyView(name); }}>Save View</FilterButton>
              <FilterSelect onChange={(e) => { const v = e.target.value; if (v) demoStore.actions.applyCompanyView(v); }}>
                <option value="">Views</option>
                {savedViews.filter((v) => v.scope === 'companies').map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </FilterSelect>
              {can('export.csv') && <FilterButton onClick={exportCsv}>Export CSV</FilterButton>}
            </FilterControls>
          </FilterBar>

          {personaId === 'group-lead' && (
            <div style={{ marginBottom: 14 }}>
              <CrossPracticeCoordination companies={groupLeadCompaniesInPracticeGroup} />
            </div>
          )}

          <DataTable
            className="companies-table-v2"
            tableClassName="companies-table-v2-table"
            renderHeader={() => (
              <tr>
                <th colSpan={3}>
                  <div className="companies-table-head-v2">
                    <button type="button" style={{ all: 'unset', cursor: 'pointer', display: nameParentOn ? 'inline-flex' : 'none' }} onClick={() => toggleSort('name')}>Name</button>
                    <button type="button" style={{ all: 'unset', cursor: 'pointer', display: engagementParentOn ? 'inline-flex' : 'none' }} onClick={() => toggleSort('recentEngagement')}>Recent Engagement</button>
                    <div style={{ position: 'relative', justifySelf: 'end' }}>
                      <button className="contacts-table-settings" aria-label="configure columns" type="button" onClick={() => setShowColumns((prev) => ({ ...prev, _open: !prev._open }))}>
                        <Icon name="settings" />
                      </button>
                      {showColumns._open && (
                        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 8, boxShadow: '0 10px 15px -5px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 240 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4 }}>
                            <input type="checkbox" checked={nameParentOn} disabled={activeParentsCount === 1 && nameParentOn} onChange={(e) => setShowColumns((p) => ({ ...p, categories: e.target.checked }))} />
                            <span style={{ fontWeight: 600 }}>Name</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, margin: '8px 0 4px' }}>
                            <input type="checkbox" checked={engagementParentOn} disabled={activeParentsCount === 1 && engagementParentOn} onChange={(e) => { const c = e.target.checked; setShowColumns((p) => ({ ...p, recentEngagement: c, clientStatus: c })); }} />
                            <span style={{ fontWeight: 600 }}>Recent Engagement</span>
                          </label>
                          {[['recentEngagement', 'Recent engagement'], ['clientStatus', 'Client status']].map(([key, label]) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4, paddingLeft: 20 }}>
                              <input type="checkbox" checked={Boolean(showColumns[key])} disabled={engagementParentOn && engagementActiveChildren === 1 && showColumns[key] && activeParentsCount === 1} onChange={(e) => setShowColumns((p) => ({ ...p, [key]: e.target.checked }))} />
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
                <tr key={row.id} role="button" tabIndex={0} onClick={(e) => { if (e.target.closest('.company-actions-v2 button')) return; setSelectedCompany(row); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCompany(row); } }}>
                  <td style={{ width: '50%' }}>
                    <div className="company-name-col-v2">
                      <CompanyLogo type={row.logo} avatarUrl={row.avatarUrl} name={row.name} />
                      <div className="company-name-meta-v2">
                        <strong>{row.name}</strong>
                        {showColumns.categories && <><p>{row.category1}</p><p>{row.category2}</p></>}
                      </div>
                    </div>
                  </td>
                  <td style={{ width: '40%' }}>
                    <div className="company-engagement-col-v2">
                      <div className="company-note-pill-v2"><Icon name="handshake" /></div>
                      <div className="company-engagement-text-v2">
                        {showColumns.recentEngagement && <p className="company-engagement-title-v2">{row.engagementTitle}</p>}
                        {(showColumns.recentEngagement || showColumns.clientStatus) && (
                          <p className="company-engagement-sub-v2">
                            {showColumns.recentEngagement && <>Recent engagement <strong>{row.recentEngagement}</strong></>}
                            {showColumns.clientStatus && <span>Client status <strong>{row.clientStatus}</strong></span>}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ width: '10%' }}>
                    <div className="company-actions-v2">
                      <button aria-label="new touchpoint" onClick={() => { const c = guessContactForCompany(row.name); setTouchpointPreset({ contactName: c?.name || contacts[0]?.name || '', company: row.name, role: c?.role || '', title: `Touchpoint for ${row.name}`, notes: '', source: 'companies:row' }); }}><Icon name="docPlus" /></button>
                      <button aria-label="relationship"><Icon name="target" /></button>
                      <button aria-label="analytics"><Icon name="chart" /></button>
                    </div>
                  </td>
                </tr>
              ))
            }
          />

          <section className="companies-cards">
            {rows.map((row) => (
              <article key={row.id} className="company-card" role="button" onClick={() => setSelectedCompany(row)}>
                <div className="company-card-header">
                  <CompanyLogo type={row.logo} avatarUrl={row.avatarUrl} name={row.name} />
                  <div className="company-card-main">
                    <strong>{row.name}</strong>
                    <div className="company-card-meta">{[row.category1, row.category2].filter(Boolean).join(' • ')}</div>
                    <div className="company-card-meta">Recent engagement <strong>{row.recentEngagement}</strong>{' · '}Client status <strong>{row.clientStatus}</strong></div>
                    <div className="company-card-meta">Relationship trend <strong>{row.relationshipTrend}</strong></div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {isDetailView && selectedCompany && (() => {
        const companyDetailTabs = [
          { id: 'overview', label: 'Overview' },
          { id: 'engagement', label: 'Engagement', count: engagementRows.length },
          { id: 'matters', label: 'Matters & Opportunities' },
          ...(field('ciReports') ? [{ id: 'ci-reports', label: 'CI Reports', count: ciReports.length }] : []),
          { id: 'activity', label: 'Activity & Notes' },
        ];
        const companyDetailActions = [
          { label: 'Add Note', onClick: () => setNoteForCompany(selectedCompany) },
          { label: 'Firm Connections', icon: 'target', onClick: () => { const c = guessContactForCompany(selectedCompany.name) || { id: selectedCompany.id, name: selectedCompany.name, company: selectedCompany.name, role: 'Client contact' }; setConnectionsForContact(c); } },
          { divider: true },
          ...(can('tag.manage') ? [{ label: 'Tags', onClick: () => setTagsForCompany(selectedCompany) }] : []),
          ...(can('company.edit') ? [{ label: 'Edit', onClick: () => setEditCompany(selectedCompany) }] : []),
          { label: 'Recent Interactions', onClick: () => setShowInteractions(selectedCompany) },
          { divider: true },
          ...(can('opportunity.add') ? [{ label: '+ Opportunity', onClick: () => setShowAddOpp(selectedCompany) }] : []),
          { label: 'Create Touchpoint', primary: true, onClick: () => { const c = guessContactForCompany(selectedCompany.name); setTouchpointPreset({ contactName: c?.name || contacts[0]?.name || '', company: selectedCompany.name, role: c?.role || '', title: `Touchpoint for ${selectedCompany.name}`, notes: '', source: 'companies:detail' }); } },
        ];
        return (
          <section className="company-detail-page">
            <header className="company-detail-header">
              <button type="button" className="filter-btn company-detail-back" onClick={() => { setSelectedCompany(null); setCompanyDetailTab('overview'); }}>← Back to companies</button>
              <div className="company-detail-title">
                <CompanyLogo type={selectedCompany.logo} avatarUrl={selectedCompany.avatarUrl} name={selectedCompany.name} />
                <div>
                  <h1>{selectedCompany.name}</h1>
                  <p className="company-detail-subtitle">{selectedCompany.category1}{selectedCompany.category2 ? ` • ${selectedCompany.category2}` : ''}</p>
                </div>
              </div>
              <DetailActionBar actions={companyDetailActions} />
              <DetailTabBar tabs={companyDetailTabs} activeTab={companyDetailTab} onTabChange={setCompanyDetailTab} />
            </header>

            {companyDetailTab === 'overview' && (
              <>
                <div className="company-detail-grid">
                  <section className="company-detail-summary">
                    <div><p className="modal-label">Client status</p><p className="modal-value">{selectedCompany.clientStatus}</p></div>
                    <div><p className="modal-label">Recent engagement</p><p className="modal-value">{selectedCompany.recentEngagement}</p></div>
                    {(field('revenue.exact') || field('revenue.range')) && (
                      <div>
                        <p className="modal-label">Client revenue{!field('revenue.exact') && field('revenue.range') && <span style={{ marginLeft: 6, fontSize: 12 }}>(range)</span>}</p>
                        <p className="modal-value">{revenueLabel}</p>
                      </div>
                    )}
                    <div>
                      <p className="modal-label">Relationship</p>
                      <p className="modal-value">{selectedCompany.relationshipTrend}</p>
                    </div>
                    {field('companyHierarchy') && (
                      <div className="company-detail-hierarchy"><p className="modal-label">Company hierarchy</p><p className="modal-value">{selectedCompany.hierarchy.join(' > ')}</p></div>
                    )}
                    <div><p className="modal-label">Industry</p><p className="modal-value">{selectedCompany.industry || selectedCompany.category2 || '—'}</p></div>
                    <div><p className="modal-label">Sector</p><p className="modal-value">{selectedCompany.sector || selectedCompany.gics || selectedCompany.category2 || '—'}</p></div>
                    <div><p className="modal-label">Company Type</p><p className="modal-value">{selectedCompany.companyType || selectedCompany.accountType || selectedCompany.category1 || '—'}</p></div>
                    {field('catCode') && selectedCompany.catCode && <div><p className="modal-label">Cat Code</p><p className="modal-value">{selectedCompany.catCode}</p></div>}
                    {field('clientCode') && selectedCompany.clientCode && <div><p className="modal-label">Client Code</p><p className="modal-value">{selectedCompany.clientCode}</p></div>}
                    {field('gics') && (
                      <div>
                        <p className="modal-label">GICs 1-3</p>
                        <p className="modal-value">
                          {(selectedCompany.gicsLevels && selectedCompany.gicsLevels.length
                            ? selectedCompany.gicsLevels
                            : [selectedCompany.gics]
                          )
                            .filter(Boolean)
                            .join(' / ') || '—'}
                        </p>
                      </div>
                    )}
                    {field('relationship.aggregate') ? (
                      <>
                        <div>
                          <p className="modal-label">Relationship lawyers (count)</p>
                          <p className="modal-value">{(selectedCompany.relationshipLawyers || []).filter(Boolean).length}</p>
                        </div>
                        <div>
                          <p className="modal-label">Billing lawyer (assigned)</p>
                          <p className="modal-value">{selectedCompany.billingLawyer ? 'Yes (1)' : 'None'}</p>
                        </div>
                        <div>
                          <p className="modal-label">Key contacts tracked</p>
                          <p className="modal-value">{(selectedCompany.keyContacts || []).filter(Boolean).length}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="modal-label">Relationship Lawyer(s)</p>
                          <p className="modal-value">
                            {(selectedCompany.relationshipLawyers || []).filter(Boolean).join(', ') || '—'}
                          </p>
                        </div>
                        {field('billingLawyer') && selectedCompany.billingLawyer && (
                          <div>
                            <p className="modal-label">Billing Lawyer</p>
                            <p className="modal-value">{selectedCompany.billingLawyer}</p>
                          </div>
                        )}
                      </>
                    )}
                    <div><p className="modal-label">Website</p><p className="modal-value">{selectedCompany.website || '—'}</p></div>
                    <div><p className="modal-label">Domain</p><p className="modal-value">{selectedCompany.domain || '—'}</p></div>
                    <div><p className="modal-label">Headquarters</p><p className="modal-value">{selectedCompany.headquarters || '—'}</p></div>
                  </section>

                  {field('companyNews') && <CompanyNewsPanel newsItems={selectedCompany.newsItems} />}

                  <section className="company-detail-columns">
                    {field('relationshipHistory') && (
                      <div className="company-detail-column">
                        <p className="modal-label">Relationship history</p>
                        <ul className="modal-list">{selectedCompany.relationshipHistory.slice(0, depth('relationshipHistory')).map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}
                    {field('internalConnections') && (
                      <div className="company-detail-column">
                        <p className="modal-label">Key internal connections</p>
                        <ul className="modal-list">{selectedCompany.keyContacts.slice(0, depth('keyContacts')).map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    )}
                    <div className="company-detail-column">
                      <p className="modal-label">{field('recentInteractions.detail') ? 'Recent interactions' : 'Interaction recency'}</p>
                      {field('recentInteractions.detail') ? (
                        <ul className="modal-list">{selectedCompany.recentInteractions.slice(0, depth('recentInteractions')).map((item) => <li key={item}>{item}</li>)}</ul>
                      ) : (
                        <p className="modal-value" style={{ fontSize: 13, lineHeight: 1.5 }}>
                          {selectedCompany.metricsCurrent?.daysSinceLastInteraction != null
                            ? `${selectedCompany.metricsCurrent.daysSinceLastInteraction} days since last recorded activity`
                            : '—'}
                          <br />
                          Interactions (last 90d): {selectedCompany.metricsCurrent?.interactionsLast90d ?? '—'}
                          <br />
                          Active matters (high level): {selectedCompany.metricsCurrent?.mattersActive ?? '—'}
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                {field('companyHealth') && (
                  <div className="company-detail-section">
                    <div className="company-detail-panels">
                      <CompanyHealthPanel company={selectedCompany} />
                      {field('companyHealth.charts') && (
                        <OpportunityIdentificationPanel
                          company={selectedCompany}
                          onCreateOpportunityList={createCompanyOpportunityList}
                        />
                      )}
                    </div>
                  </div>
                )}

                {field('financialTrends') && (
                  <div className="company-detail-section">
                    <div className="company-detail-section-heading"><p className="modal-label">Financial & BD trends</p></div>
                    <div className="company-detail-panels company-detail-panels-secondary">
                      <CompanyMattersPanel company={selectedCompany} />
                      <CompanyOpportunitiesPanel company={selectedCompany} />
                    </div>
                  </div>
                )}

                {field('powerBIDashboard') && (
                  <div className="company-detail-section">
                    <div className="company-detail-section-heading"><p className="modal-label">Analytics Dashboard</p></div>
                    <PowerBIDashboard company={selectedCompany} />
                  </div>
                )}
              </>
            )}

            {companyDetailTab === 'engagement' && (
              <section className="company-engagement-section">
                <div className="company-engagement-header">
                  <h3>Engagement</h3>
                  <div className="company-engagement-filters">
                    <select value={engagementTypeFilter} onChange={(e) => setEngagementTypeFilter(e.target.value)}>
                      <option value="All">All types</option>
                      <option value="Email">Email</option><option value="Meeting">Meeting</option><option value="Call">Call</option><option value="Event">Event</option><option value="Other">Other</option>
                    </select>
                    <select value={engagementPersonFilter} onChange={(e) => setEngagementPersonFilter(e.target.value)}>
                      <option value="All">All internal</option>
                      {engagementFilterOptions.internalPeople.map((person) => <option key={person} value={person}>{person}</option>)}
                    </select>
                    <select value={engagementClientJobLevelFilter} onChange={(e) => setEngagementClientJobLevelFilter(e.target.value)}>
                      <option value="All">Client job level</option>
                      {engagementFilterOptions.jobLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                    </select>
                    <select value={engagementEventTypeFilter} onChange={(e) => setEngagementEventTypeFilter(e.target.value)}>
                      <option value="All">Event type</option>
                      {engagementFilterOptions.eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}
                    </select>
                    <select value={engagementRelationshipStrengthFilter} onChange={(e) => setEngagementRelationshipStrengthFilter(e.target.value)}>
                      <option value="All">Relationship strength</option>
                      {engagementFilterOptions.relationshipStrengths.map((strength) => <option key={strength} value={strength}>{strength}</option>)}
                    </select>
                  </div>
                </div>
                <div className="company-engagement-breakdown">
                  <article className="company-engagement-breakdown-card">
                    <p>Total touchpoints</p>
                    <strong>{engagementBreakdown.total}</strong>
                  </article>
                  <article className="company-engagement-breakdown-card">
                    <p>Marketing activities</p>
                    <strong>{engagementBreakdown.marketing}</strong>
                    <span>{engagementBreakdown.marketingPct}</span>
                  </article>
                  <article className="company-engagement-breakdown-card">
                    <p>BD activities</p>
                    <strong>{engagementBreakdown.bd}</strong>
                    <span>{engagementBreakdown.bdPct}</span>
                  </article>
                  <article className="company-engagement-breakdown-card">
                    <p>Relationship activities</p>
                    <strong>{engagementBreakdown.relationship}</strong>
                    <span>{engagementBreakdown.relationshipPct}</span>
                  </article>
                </div>
                <table className="company-engagement-table">
                  <thead><tr><th>When</th><th>What</th><th>Who</th><th>Client Job Level</th><th>Relationship</th><th>Event Type</th><th>Importance</th><th>Source</th><th>Summary</th></tr></thead>
                  <tbody>
                    {engagementRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>{row.type}</td>
                        <td>{row.contact || '—'}<br /><span style={{ color: '#6b7280', fontSize: 12 }}>{row.internal}</span></td>
                        <td>{row.clientJobLevel}</td>
                        <td>{row.relationshipStrength}</td>
                        <td>{row.eventType}</td>
                        <td>
                          <span className={`engagement-pill importance-${String(row.importance || '').toLowerCase()}`}>
                            {row.importance}
                          </span>
                        </td>
                        <td>
                          <span className={`engagement-pill source-${String(row.sourceType || '').toLowerCase()}`}>
                            {row.sourceType}
                          </span>
                        </td>
                        <td>{row.summary}</td>
                      </tr>
                    ))}
                    {engagementRows.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>No engagement found for the current filters.</td></tr>}
                  </tbody>
                </table>
              </section>
            )}

            {companyDetailTab === 'matters' && (
              <>
                <div className="company-detail-section">
                  <div className="company-detail-section-heading"><p className="modal-label">Matters</p></div>
                  <div className="matter-lead-drill-grid">
                    {matterLeadSummaryRows.map((row) => (
                      <article
                        key={row.lead}
                        className={`matter-lead-drill-card ${matterLeadFilter === row.lead ? 'active' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setMatterLeadFilter(row.lead)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setMatterLeadFilter(row.lead);
                          }
                        }}
                      >
                        <p>{row.lead}</p>
                        <strong>{row.total} matters</strong>
                        <span>
                          {row.active} active
                          {field('wip') ? ` · WIP $${row.wip.toLocaleString()}` : ''}
                        </span>
                      </article>
                    ))}
                    {matterLeadSummaryRows.length === 0 && (
                      <article className="matter-lead-drill-card">
                        <p>No lead lawyer data</p>
                        <strong>0 matters</strong>
                        <span>Add matters to see drill-down summary.</span>
                      </article>
                    )}
                  </div>
                  <div className="company-engagement-filters" style={{ marginBottom: 10 }}>
                    <select value={matterLeadFilter} onChange={(e) => setMatterLeadFilter(e.target.value)}>
                      <option value="All">Lead lawyer</option>
                      {matterFilterOptions.leadLawyers.map((lawyer) => <option key={lawyer} value={lawyer}>{lawyer}</option>)}
                    </select>
                    <select value={matterHierarchyFilter} onChange={(e) => setMatterHierarchyFilter(e.target.value)}>
                      <option value="All">Hierarchy node</option>
                      {matterFilterOptions.hierarchyNodes.map((node) => <option key={node} value={node}>{node}</option>)}
                    </select>
                    {(matterLeadFilter !== 'All' || matterHierarchyFilter !== 'All') && (
                      <button type="button" className="filter-btn" onClick={() => { setMatterLeadFilter('All'); setMatterHierarchyFilter('All'); }}>
                        Clear
                      </button>
                    )}
                  </div>
                  <div style={{ marginBottom: 10, fontSize: 12, color: '#6b7280' }}>
                    Showing {matterRows.length} matter(s)
                    {field('matterRank') ? ' with rank visibility' : ''}
                    {field('wip') ? ' and WIP visibility' : ''}
                    {field('matters.table') ? ' · Referral source shown when attributed' : ''}
                    {field('matters.table') ? ' · Practice area includes Aderant taxonomy code' : ''}.
                  </div>
                  {field('matters.table') ? (
                    <table className="company-matters-table">
                      <thead>
                        <tr>
                          <th>Open date</th>
                          <th>Status</th>
                          <th>Matter name</th>
                          <th>Practice area (taxonomy)</th>
                          <th>Hierarchy</th>
                          {field('matterRank') && <th>Rank</th>}
                          {field('wip') && <th>WIP</th>}
                          <th>Lead Lawyer</th>
                          <th>Referral source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matterRows.map((m) => (
                          <tr key={m.id}>
                            <td>{m.openDate}</td>
                            <td>{m.status}</td>
                            <td>{m.name}</td>
                            <td>
                              {m.practiceArea}
                              {m.aderantPracticeCode && (
                                <div className="matter-practice-taxonomy-code">{m.aderantPracticeCode}</div>
                              )}
                            </td>
                            <td>{m.hierarchyNode || '—'}</td>
                            {field('matterRank') && <td>{m.matterRank}</td>}
                            {field('wip') && <td>${(m.wip || 0).toLocaleString()}</td>}
                            <td>
                              {m.leadLawyer ? (
                                <button
                                  type="button"
                                  className="filter-btn"
                                  style={{ padding: '4px 8px', fontSize: 12 }}
                                  onClick={() => setMatterLeadFilter(m.leadLawyer)}
                                >
                                  {m.leadLawyer}
                                </button>
                              ) : '—'}
                            </td>
                            <td style={{ fontSize: 13, color: m.referralSourceContactName ? '#166534' : '#9ca3af' }}>
                              {m.referralSourceContactName || '—'}
                            </td>
                          </tr>
                        ))}
                        {matterRows.length === 0 && (
                          <tr>
                            <td
                              colSpan={5 + (field('matterRank') ? 1 : 0) + (field('wip') ? 1 : 0) + 2}
                              style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}
                            >
                              No matters found for the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : field('matters.summary') ? (
                    <p className="modal-value">{matterRows.length} matters total ({matterRows.filter((m) => m.status === 'Active').length} active)</p>
                  ) : null}
                </div>

                <div className="company-detail-section">
                  <div className="company-detail-section-heading"><p className="modal-label">Opportunities pipeline</p></div>
                  <div className="opportunity-analytics-grid">
                    {field('revenue.exact') && (
                      <article className="opportunity-analytics-card">
                        <p>Open pipeline value (proxy)</p>
                        <strong>${opportunityAnalytics.weightedValue.toLocaleString()}</strong>
                        <span>{opportunityAnalytics.statuses.Pending} pending opportunity(ies)</span>
                      </article>
                    )}
                    <article className="opportunity-analytics-card">
                      <p>Pipeline stages</p>
                      <strong>{opportunityAnalytics.total}</strong>
                      <span>
                        Qualification {opportunityAnalytics.stages.Qualification || 0} · Proposal {opportunityAnalytics.stages.Proposal || 0} · Negotiation {opportunityAnalytics.stages.Negotiation || 0}
                      </span>
                    </article>
                    <article className="opportunity-analytics-card">
                      <p>Win/Loss analysis</p>
                      <strong>{opportunityAnalytics.winRate}% / {opportunityAnalytics.lossRate}%</strong>
                      <span>{opportunityAnalytics.statuses.Won} won · {opportunityAnalytics.statuses.Lost} lost</span>
                    </article>
                  </div>
                  {field('opportunities.table') ? (
                    <table className="company-opportunities-table">
                      <thead><tr><th>Date</th><th>Status</th><th>Name</th><th>Type</th></tr></thead>
                      <tbody>
                        {(selectedCompany.opportunities || []).map((opp) => <tr key={opp.id}><td>{opp.date}</td><td>{opp.status}</td><td>{opp.name}</td><td>{opp.type}</td></tr>)}
                        {(!selectedCompany.opportunities || selectedCompany.opportunities.length === 0) && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>No opportunities in the pipeline yet.</td></tr>}
                      </tbody>
                    </table>
                  ) : field('opportunities.summary') ? (
                    <p className="modal-value">{(selectedCompany.opportunities || []).length} opportunities ({(selectedCompany.opportunities || []).filter((o) => o.status === 'Pending').length} pending, {(selectedCompany.opportunities || []).filter((o) => o.status === 'Won').length} won)</p>
                  ) : null}
                </div>
              </>
            )}

            {companyDetailTab === 'activity' && (
              <>
                <div className="company-detail-section">
                  <div className="company-detail-section-heading"><p className="modal-label">Company notes</p></div>
                  <ul className="modal-list">
                    {companyNotes.filter((n) => n.companyId === selectedCompany.id).slice(0, depth('companyNotes')).map((note) => (
                      <li key={note.id}>
                        <strong>{note.type}</strong> · <span style={{ textTransform: 'capitalize' }}>{note.visibility}</span>{' '}
                        <span style={{ opacity: 0.7, fontSize: 12 }}>{new Date(note.createdAt).toLocaleDateString()}</span>
                        <div>{note.text}</div>
                      </li>
                    ))}
                    {companyNotes.filter((n) => n.companyId === selectedCompany.id).length === 0 && <li>No notes yet for this company.</li>}
                  </ul>
                </div>

                <div className="company-detail-section">
                  <div className="company-detail-section-heading"><p className="modal-label">Activity</p></div>
                  <ActivityFeed activities={activities} entityFilter={selectedCompany.name} limit={10} />
                </div>
              </>
            )}

            {companyDetailTab === 'ci-reports' && (
              <section className="company-detail-section">
                <div className="company-detail-section-heading">
                  <p className="modal-label">CI Reports</p>
                </div>
                <div className="ci-reports-header">
                  <p className="modal-value">Embedded analytics scaffold for company intelligence snapshots.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="tool-btn">Open Dashboard</button>
                    <button type="button" className="primary">Generate Snapshot</button>
                  </div>
                </div>
                <table className="company-opportunities-table">
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                      <th>Owner</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ciReports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.name}</td>
                        <td>{report.type}</td>
                        <td>{report.status}</td>
                        <td>{report.lastUpdated}</td>
                        <td>{report.owner}</td>
                        <td>{report.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </section>
        );
      })()}

      <CreateTouchpointTaskModal isOpen={Boolean(touchpointPreset)} preset={touchpointPreset} onClose={() => setTouchpointPreset(null)} />
      <ManageCompanyTagsModal company={tagsForCompany} isOpen={Boolean(tagsForCompany)} onClose={() => setTagsForCompany(null)} />
      <AddCompanyNoteModal company={noteForCompany} isOpen={Boolean(noteForCompany)} onClose={() => setNoteForCompany(null)} />
      <FirmConnectionsModal contact={connectionsForContact} isOpen={Boolean(connectionsForContact)} onClose={() => setConnectionsForContact(null)} />
      <AddCompanyModal isOpen={showAddCompany} onClose={() => setShowAddCompany(false)} />
      <UpdateCompanyModal company={editCompany} isOpen={Boolean(editCompany)} onClose={() => setEditCompany(null)} />
      <AddOpportunityModal isOpen={Boolean(showAddOpp)} preselectedCompanyId={showAddOpp?.id} onClose={() => setShowAddOpp(null)} />
      <RecentInteractionsModal company={showInteractions} isOpen={Boolean(showInteractions)} onClose={() => setShowInteractions(null)} />
    </section>
  );
}
