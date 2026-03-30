import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import CreateListModal from '../common/components/CreateListModal';
import { usePersona } from '../common/hooks/usePersona';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterControls, FilterSelect } from '../common/components/FilterControls';
import FilterViewButton from '../common/components/FilterViewButton';
import DetailActionBar from '../common/components/DetailActionBar';
import DetailTabBar from '../common/components/DetailTabBar';
import UpdateListModal from '../common/components/UpdateListModal';
import MarketingEngagementModal from '../common/components/MarketingEngagementModal';
import { formatTagTaxonomyTitleAttr } from '../common/utils/tagTaxonomy';
import { buildRowSecurityScope } from '../common/utils/rowSecurityScope';

export default function ListsPage() {
  const [query, setQuery] = useState('');
  const [checkedRows, setCheckedRows] = useState({});
  const [selectedListId, setSelectedListId] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [showCreateList, setShowCreateList] = useState(false);
  const [editList, setEditList] = useState(null);
  const [marketingTarget, setMarketingTarget] = useState(null);
  const [pullThroughMessage, setPullThroughMessage] = useState('');
  const [targetingMessage, setTargetingMessage] = useState('');
  const [crossPracticeMessage, setCrossPracticeMessage] = useState('');
  const [showColumns, setShowColumns] = useState({ name: true, owner: true, tag: true, visibility: true });
  const lists = useDemoStore((s) => s.lists || []);
  const rawTags = useDemoStore((s) => s.tags);
  const contacts = useDemoStore((s) => s.contacts || []);
  const listNotes = useDemoStore((s) => s.listNotes || []);
  const touchpoints = useDemoStore((s) => s.touchpoints || []);
  const [tagFilter, setTagFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [listDetailTab, setListDetailTab] = useState('members');
  const tags = rawTags || [];
  const actions = demoStore.actions;
  const companies = useDemoStore((s) => s.companies || []);
  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');

  const { can, field, tier } = usePersona();
  const rowScope = useMemo(
    () => buildRowSecurityScope({ personaId, companies, contacts }),
    [personaId, companies, contacts]
  );
  const contactsById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  const rows = useMemo(() => {
    let data = lists.filter((row) => rowScope.canSeeList(row, contactsById));

    // Tier 3 can't see personal lists
    if (!field('personalLists')) {
      data = data.filter((row) => (row.visibility || 'Firm-wide') !== 'Personal');
    }

    if (tagFilter) data = data.filter((row) => row.tag === tagFilter);
    if (typeFilter) data = data.filter((row) => row.type === typeFilter);
    if (visibilityFilter) data = data.filter((row) => (row.visibility || 'Firm-wide') === visibilityFilter);
    if (ownerFilter) data = data.filter((row) => row.owner === ownerFilter);
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) => [row.name, row.owner, row.tag, row.lastEngagement].join(' ').toLowerCase().includes(q));
  }, [lists, query, tagFilter, typeFilter, visibilityFilter, ownerFilter, field, rowScope, contactsById]);

  const allChecked = rows.length > 0 && rows.every((row) => checkedRows[row.id]);
  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) || null : null;
  const selectedMembersRaw = selectedList ? contacts.filter((c) => rowScope.canSeeContact(c) && Array.isArray(selectedList.memberIds) && selectedList.memberIds.includes(c.id)) : [];
  const selectedMembers = memberSearch.trim()
    ? selectedMembersRaw.filter((m) => [m.name, m.role, m.company, m.city].join(' ').toLowerCase().includes(memberSearch.toLowerCase()))
    : selectedMembersRaw;
  const selectedListNotes = selectedList ? listNotes.filter((n) => n.listId === selectedList.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) : [];
  const selectedMarketingSummary = selectedList ? getMarketingSummary(selectedList) : { count: 0, recipients: 0, latestType: '', latestDate: '' };
  const isDetailView = Boolean(selectedList);
  const selectedListMembers = selectedList && Array.isArray(selectedList.memberIds) ? selectedList.memberIds : [];
  const existingOpenFollowUpByMemberId = useMemo(() => {
    if (!selectedList || selectedList.type !== 'Event-based') return new Set();
    const set = new Set();
    (touchpoints || []).forEach((tp) => {
      if (tp.kind !== 'task' || tp.status !== 'open') return;
      const source = String(tp.source || '');
      if (!source.startsWith('lists:event-followup')) return;
      if (!source.includes(`:${selectedList.id}:`)) return;
      const maybeMemberId = source.split(':').pop();
      if (maybeMemberId) set.add(maybeMemberId);
    });
    return set;
  }, [touchpoints, selectedList]);
  const selectedListEventEligibleCount =
    selectedList?.type === 'Event-based'
      ? selectedListMembers.filter((id) => !existingOpenFollowUpByMemberId.has(id)).length
      : 0;
  const selectedListEventExistingCount =
    selectedList?.type === 'Event-based'
      ? selectedListMembers.length - selectedListEventEligibleCount
      : 0;
  const companiesByName = useMemo(() => new Map(companies.map((c) => [c.name, c])), [companies]);

  function getMarketingSummary(list) {
    const items = Array.isArray(list.marketingActivity) ? list.marketingActivity : [];
    if (!items.length) return { count: 0, recipients: 0, latestType: '', latestDate: '' };
    const last = items[0];
    const recipients = items.reduce((sum, item) => sum + Number(item?.recipients || 0), 0);
    return {
      count: items.length,
      recipients,
      latestType: last?.type || '',
      latestDate: last?.date || '',
    };
  }

  function renderMarketingSummary(list) {
    const summary = getMarketingSummary(list);
    if (!summary.count) return null;
    return (
      <p style={{ marginTop: 2, fontSize: 11, color: '#6b7280' }}>
        Marketing: <strong>{summary.count}</strong> activities
        {summary.latestType ? ` · Last ${summary.latestType}` : ''}
        {summary.latestDate ? ` (${summary.latestDate})` : ''}
        {summary.recipients ? ` · Reach ${summary.recipients}` : ''}
      </p>
    );
  }

  function getTargetingReason(contact) {
    const company = companiesByName.get(contact.company);
    const staleDays = Number(contact.metricsCurrent?.daysSinceLastInteraction || 0);
    const score = Number(contact.relationshipScore ?? 50);
    const reasons = [];
    if (company?.isStrategicAccount) reasons.push('strategic account');
    if (staleDays >= 35) reasons.push(`${staleDays} days since last interaction`);
    if (score <= 62) reasons.push(`relationship score ${score}`);
    return reasons.length ? reasons.join(' · ') : 'targeting signal';
  }

  const selectedTargetingMetrics = useMemo(() => {
    if (!selectedList || selectedList.type !== 'Targeting') return null;
    const members = selectedMembersRaw;
    const strategic = members.filter((m) => Boolean(companiesByName.get(m.company)?.isStrategicAccount)).length;
    const stale = members.filter((m) => Number(m.metricsCurrent?.daysSinceLastInteraction || 0) >= 35).length;
    const avgScore = members.length
      ? Math.round(members.reduce((sum, m) => sum + Number(m.relationshipScore ?? 50), 0) / members.length)
      : 0;
    return { strategic, stale, avgScore };
  }, [selectedList, selectedMembersRaw, companiesByName]);
  const selectedCrossPracticeMetrics = useMemo(() => {
    if (!selectedList?.crossPracticeMeta) return null;
    return {
      practiceCount: Number(selectedList.crossPracticeMeta.gapPracticeCount || 0),
      topGapPractices: selectedList.crossPracticeMeta.topGapPractices || [],
    };
  }, [selectedList]);

  return (
    <section className="lists-view-v2">
      {!isDetailView && (
        <>
          <PageHeader
            title="Lists"
            showMore={false}
            right={
              can('list.create') ? (
                <>
                  <button
                    className="tool-btn"
                    style={{ fontSize: 13 }}
                    onClick={() => actions.syncMarketingEventLists()}
                  >
                    Sync Event Lists
                  </button>
                  <button
                    className="tool-btn"
                    style={{ fontSize: 13 }}
                    onClick={() => {
                      const created = actions.createTargetingList({ maxMembers: 15 });
                      setTargetingMessage(
                        created?.membersAdded
                          ? `Created firm-wide targeting list with ${created.membersAdded} contacts.`
                          : 'No targeting list created: no eligible candidates were found.'
                      );
                    }}
                  >
                    Build Targeting List
                  </button>
                  <button
                    className="tool-btn"
                    style={{ fontSize: 13 }}
                    onClick={() => {
                      const created = actions.createCrossPracticeInitiativeList({ maxMembers: 18 });
                      setCrossPracticeMessage(
                        created?.membersAdded
                          ? `Created cross-practice initiative list with ${created.membersAdded} contacts across ${created.gapPractices} gap practice area(s).`
                          : 'No cross-practice list created: no coverage-gap candidates found.'
                      );
                    }}
                  >
                    Build Cross-Practice Initiative
                  </button>
                  <button className="primary" style={{ fontSize: 13 }} onClick={() => setShowCreateList(true)}>
                    + Create List
                  </button>
                </>
              ) : null
            }
          />
          {targetingMessage && (
            <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#4b5563', padding: '0 16px' }}>{targetingMessage}</p>
          )}
          {crossPracticeMessage && (
            <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#4b5563', padding: '0 16px' }}>{crossPracticeMessage}</p>
          )}

          <FilterBar className="lists-filterbar-v2">
            <div className="search-with-filter">
              <SearchBar className="lists-search-v2" value={query} onChange={(value) => setQuery(value)} />
              <FilterViewButton />
            </div>
            <FilterControls>
              <FilterSelect value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="lists-tag-filter">
                <option value="">All Tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.label} title={formatTagTaxonomyTitleAttr(t)}>{t.label}</option>
                ))}
              </FilterSelect>
              <FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {[...new Set(lists.map((l) => l.type))].filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
              </FilterSelect>
              <FilterSelect value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
                <option value="">All Visibility</option>
                <option value="Firm-wide">Firm-wide</option>
                <option value="Shared">Shared</option>
                {field('personalLists') && <option value="Personal">Personal</option>}
              </FilterSelect>
              <FilterSelect value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                <option value="">All Owners</option>
                {[...new Set(lists.map((l) => l.owner))].filter(Boolean).sort().map((o) => <option key={o} value={o}>{o}</option>)}
              </FilterSelect>
            </FilterControls>
          </FilterBar>

          <section className="lists-table-v2">
            <div className="lists-table-head-v2">
              <label className="checkbox-cell-v2" aria-label="Select all lists">
                <input type="checkbox" checked={allChecked} onChange={(event) => { const next = {}; rows.forEach((row) => { next[row.id] = event.target.checked; }); setCheckedRows(next); }} />
              </label>
              <span>List</span>
              <span>Owner</span>
              <span>Tag</span>
              <span>Visibility</span>
              <span>Actions</span>
              <div style={{ position: 'relative' }}>
                <button className="contacts-table-settings" aria-label="settings" type="button" onClick={() => setShowColumns((prev) => ({ ...prev, _open: !prev._open }))}>
                  <Icon name="settings" />
                </button>
                {showColumns._open && (
                  <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 8, boxShadow: '0 10px 15px -5px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 200 }}>
                    {[['name', 'Name'], ['owner', 'Owner'], ['tag', 'Tag'], ['visibility', 'Visibility']].map(([key, label]) => {
                      const visibleCount = (showColumns.name ? 1 : 0) + (showColumns.owner ? 1 : 0) + (showColumns.tag ? 1 : 0) + (showColumns.visibility ? 1 : 0);
                      return (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4 }}>
                          <input type="checkbox" checked={Boolean(showColumns[key])} disabled={visibleCount === 1 && showColumns[key]} onChange={(e) => setShowColumns((prev) => ({ ...prev, [key]: e.target.checked }))} />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lists-table-body-v2">
              {rows.map((row) => {
                const memberCount = Array.isArray(row.memberIds) && row.memberIds.length ? row.memberIds.length : row.members || 0;
                return (
                  <div className="list-row-v2" key={row.id} role="button" tabIndex={0}
                    onClick={(event) => { if (event.target.closest('input') || event.target.closest('.list-actions-v2 button')) return; setSelectedListId(row.id); }}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedListId(row.id); } }}
                  >
                    <label className="checkbox-cell-v2" aria-label={`Select ${row.name}`}>
                      <input type="checkbox" checked={Boolean(checkedRows[row.id])} onChange={(event) => setCheckedRows((prev) => ({ ...prev, [row.id]: event.target.checked }))} />
                    </label>
                    {showColumns.name && (
                      <div className="list-main-col-v2">
                        <div className={`list-avatar-v2 ${row.color}`}>{row.initials}</div>
                        <div className="list-main-meta-v2">
                          <strong>{row.name}</strong>
                          <p>Members <strong>{memberCount}</strong><span>Last engagement <strong>{row.lastEngagement}</strong></span></p>
                          {row.type && <div className="list-type-pill-v2">{row.type}</div>}
                          {field('marketingActivity') && renderMarketingSummary(row)}
                        </div>
                      </div>
                    )}
                    {showColumns.owner && <div className="list-owner-v2">{row.owner}</div>}
                    {showColumns.tag && <div className="list-tag-v2"><span>{row.tag}</span></div>}
                    {showColumns.visibility && (
                      <div className="list-visibility-v2">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {row.visibility === 'Personal' && <span style={{ fontSize: 10 }}>🔒</span>}
                          {row.visibility === 'Shared' && <span style={{ fontSize: 10 }}>👥</span>}
                          {row.visibility === 'Shared' ? (
                            row.sharedPracticeGroup ? `Shared · Practice group: ${row.sharedPracticeGroup}` : (
                              (row.sharedWithUserIds && row.sharedWithUserIds.length)
                                ? (() => {
                                    const shown = row.sharedWithUserIds.slice(0, 2).join(', ');
                                    const extra = row.sharedWithUserIds.length - 2;
                                    return extra > 0 ? `Shared · ${shown} +${extra}` : `Shared · ${shown}`;
                                  })()
                                : 'Shared'
                            )
                          ) : row.visibility === 'Personal' ? 'Private' : (row.visibility || 'Firm-wide')}
                        </span>
                      </div>
                    )}
                    <div className="list-actions-v2">
                      <button aria-label="relationship"><Icon name="target" /></button>
                      <button aria-label="more actions"><Icon name="listPlus" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lists-cards">
            {rows.map((row) => {
              const memberCount = Array.isArray(row.memberIds) && row.memberIds.length ? row.memberIds.length : row.members || 0;
              return (
                <article key={row.id} className="list-card" role="button" tabIndex={0} onClick={() => setSelectedListId(row.id)}>
                  <div className="list-card-header">
                    <div className={`list-avatar-v2 ${row.color}`}>{row.initials}</div>
                    <div className="list-card-main">
                      <strong>{row.name}</strong>
                      <div className="list-card-meta"><span>{row.owner}</span>{' • '}<span>{row.tag}</span></div>
                      <div className="list-card-meta">Members <strong>{memberCount}</strong>{' • '}Last engagement <strong>{row.lastEngagement}</strong></div>
                      <div className="list-card-meta">
                        Visibility{' '}
                        <strong>
                          {row.visibility === 'Shared'
                            ? (row.sharedPracticeGroup
                              ? `Shared · ${row.sharedPracticeGroup}`
                              : (row.sharedWithUserIds && row.sharedWithUserIds.length
                                ? (() => {
                                    const shown = row.sharedWithUserIds.slice(0, 2).join(', ');
                                    const extra = row.sharedWithUserIds.length - 2;
                                    return extra > 0 ? `Shared · ${shown} +${extra}` : `Shared · ${shown}`;
                                  })()
                                : 'Shared'))
                            : (row.visibility === 'Personal' ? 'Private' : (row.visibility || 'Firm-wide'))}
                        </strong>
                      </div>
                    {row.type && <div className="list-card-meta">Type <strong>{row.type}</strong></div>}
                      {field('marketingActivity') && renderMarketingSummary(row)}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {isDetailView && selectedList && (() => {
        const listTabs = [
          { id: 'overview', label: 'Overview' },
          { id: 'members', label: 'Members', count: selectedMembersRaw.length },
          { id: 'notes', label: 'Notes', count: selectedListNotes.length },
        ];
        const listActions = [
          { label: 'Add Note', onClick: () => setListDetailTab('notes') },
          { divider: true },
          ...(selectedList.type === 'Event-based'
            ? [
                {
                  label: 'Pull Through Follow-ups',
                  icon: 'send',
                  onClick: () => {
                    const eligibleBefore = selectedListEventEligibleCount;
                    const existingBefore = selectedListEventExistingCount;
                    setPullThroughMessage('');
                    const created = actions.pullThroughEventFollowUps(selectedList.id);
                    setPullThroughMessage(
                      created > 0
                        ? `Created ${created} event follow-up touchpoint${created === 1 ? '' : 's'} (${existingBefore} member${existingBefore === 1 ? '' : 's'} already had open pull-through tasks).`
                        : (eligibleBefore === 0
                          ? 'No new follow-ups created. All members already have open pull-through follow-up tasks (or list has no members).'
                          : 'No new follow-ups created due to validation constraints.')
                    );
                  },
                },
              ]
            : []),
          ...(can('list.create')
            ? [
                { label: 'Edit', onClick: () => setEditList(selectedList) },
                {
                  label: 'Delete',
                  onClick: () => {
                    const confirmed = window.confirm(`Delete list "${selectedList.name}"?`);
                    if (!confirmed) return;
                    actions.deleteList(selectedList.id);
                    setSelectedListId(null);
                    setListDetailTab('members');
                  },
                },
              ]
            : []),
        ];
        return (
          <section className="list-detail-page">
            <header className="list-detail-header">
              <button type="button" className="filter-btn list-detail-back" onClick={() => { setSelectedListId(null); setListDetailTab('members'); }}>← Back to lists</button>
              <div className="list-detail-title">
                <div className={`list-avatar-v2 ${selectedList.color}`}>{selectedList.initials}</div>
                <div>
                  <h1>{selectedList.name}</h1>
                  <p className="list-detail-subtitle">{selectedMembersRaw.length} members • Last engagement {selectedList.lastEngagement}</p>
                </div>
              </div>
              <DetailActionBar actions={listActions} />
              <DetailTabBar tabs={listTabs} activeTab={listDetailTab} onTabChange={setListDetailTab} />
            </header>

            {listDetailTab === 'overview' && (
              <div className="list-detail-grid">
                <section className="list-detail-summary">
                  <div><p className="modal-label">List owner</p><p className="modal-value">{selectedList.owner}</p></div>
                  <div><p className="modal-label">List type</p><p className="modal-value">{selectedList.type}</p></div>
                  <div><p className="modal-label">Date created</p><p className="modal-value">{selectedList.createdAt}</p></div>
                  <div><p className="modal-label">Primary tag</p><p className="modal-value">{selectedList.tag}</p></div>
                  <div>
                    <p className="modal-label">Visibility</p>
                    <p className="modal-value">
                      {selectedList.visibility === 'Shared'
                        ? (selectedList.sharedPracticeGroup
                          ? `Shared · Practice group: ${selectedList.sharedPracticeGroup}`
                          : ((selectedList.sharedWithUserIds && selectedList.sharedWithUserIds.length)
                            ? (() => {
                                const shown = selectedList.sharedWithUserIds.slice(0, 3).join(', ');
                                const extra = selectedList.sharedWithUserIds.length - 3;
                                return extra > 0 ? `Shared · Users: ${shown} +${extra}` : `Shared · Users: ${shown}`;
                              })()
                            : 'Shared'))
                        : (selectedList.visibility === 'Personal' ? 'Private' : (selectedList.visibility || 'Firm-wide'))}
                    </p>
                  </div>
                  {selectedList.type === 'Event-based' && (
                    <>
                      <div>
                        <p className="modal-label">Eligible for pull-through</p>
                        <p className="modal-value">{selectedListEventEligibleCount}</p>
                      </div>
                      <div>
                        <p className="modal-label">Already assigned follow-ups</p>
                        <p className="modal-value">{selectedListEventExistingCount}</p>
                      </div>
                    </>
                  )}
                  {selectedList.type === 'Targeting' && selectedTargetingMetrics && (
                    <>
                      <div>
                        <p className="modal-label">Strategic-account targets</p>
                        <p className="modal-value">{selectedTargetingMetrics.strategic}</p>
                      </div>
                      <div>
                        <p className="modal-label">Stale relationships (35+ days)</p>
                        <p className="modal-value">{selectedTargetingMetrics.stale}</p>
                      </div>
                      <div>
                        <p className="modal-label">Average relationship score</p>
                        <p className="modal-value">{selectedTargetingMetrics.avgScore}</p>
                      </div>
                    </>
                  )}
                </section>
                {selectedList.type === 'Event-based' && (
                  <div style={{ marginTop: 10 }}>
                    <p className="modal-label">Event list pull-through status</p>
                    <p className="modal-value">
                      {selectedListMembers.length === 0
                        ? 'No members available for pull-through.'
                        : `${selectedListEventEligibleCount} member(s) eligible, ${selectedListEventExistingCount} already have open follow-up tasks.`}
                    </p>
                    {pullThroughMessage && (
                      <p className="modal-value" style={{ marginTop: 6 }}>{pullThroughMessage}</p>
                    )}
                  </div>
                )}
                {selectedList.type === 'Targeting' && selectedTargetingMetrics && (
                  <div style={{ marginTop: 10 }}>
                    <p className="modal-label">Targeting summary</p>
                    <p className="modal-value">
                      {selectedMembersRaw.length} contacts prioritized. {selectedTargetingMetrics.strategic} are strategic-account
                      contacts and {selectedTargetingMetrics.stale} have stale relationship coverage.
                    </p>
                  </div>
                )}
                {selectedCrossPracticeMetrics && (
                  <div style={{ marginTop: 10 }}>
                    <p className="modal-label">Cross-practice coverage gaps</p>
                    <p className="modal-value">
                      Gap practices identified: {selectedCrossPracticeMetrics.practiceCount}
                      {selectedCrossPracticeMetrics.topGapPractices.length
                        ? ` (${selectedCrossPracticeMetrics.topGapPractices.join(', ')})`
                        : ''}
                    </p>
                  </div>
                )}

                {field('marketingActivity') && selectedList.marketingActivity?.length > 0 && (
                  <section style={{ marginTop: 16 }}>
                    <p className="modal-label">Marketing Activity</p>
                    <div className="list-stats-row" style={{ marginTop: 8, marginBottom: 10 }}>
                      <article className="list-stat-card">
                        <p>Total activities</p>
                        <strong>{selectedMarketingSummary.count}</strong>
                        <small>Campaigns and event actions</small>
                      </article>
                      <article className="list-stat-card">
                        <p>Total recipients</p>
                        <strong>{selectedMarketingSummary.recipients.toLocaleString()}</strong>
                        <small>Estimated marketing reach</small>
                      </article>
                      <article className="list-stat-card">
                        <p>Latest activity</p>
                        <strong>{selectedMarketingSummary.latestType || '—'}</strong>
                        <small>{selectedMarketingSummary.latestDate || 'No recent date'}</small>
                      </article>
                    </div>
                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginTop: 8 }}>
                      <thead><tr><th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>Date</th><th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>Type</th><th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>Description</th><th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>Recipients</th></tr></thead>
                      <tbody>
                        {selectedList.marketingActivity.map((ma, i) => (
                          <tr key={i}><td style={{ padding: '6px 8px' }}>{ma.date}</td><td style={{ padding: '6px 8px' }}>{ma.type}</td><td style={{ padding: '6px 8px' }}>{ma.description}</td><td style={{ padding: '6px 8px', textAlign: 'center' }}>{ma.recipients}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}
              </div>
            )}

            {listDetailTab === 'members' && (
              <section className="list-detail-members" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p className="modal-label">Members ({selectedMembers.length})</p>
                  <input
                    placeholder="Filter members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    style={{ border: '1px solid #d4d4d4', borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 200 }}
                  />
                </div>
                <div className="list-members-table">
                  <div className="list-members-head"><span>Contact</span><span>Status</span><span>Summary</span><span>Actions</span></div>
                  <div className="list-members-body">
                    {selectedMembers.map((member) => {
                      const memberTouchpoints = touchpoints.filter((tp) => tp.contactName === member.name);
                      const hasEventCompleted = memberTouchpoints.some((tp) => tp.kind === 'interaction' && tp.interactionType === 'Event');
                      const hasCompletedInteraction = memberTouchpoints.some((tp) => tp.kind === 'interaction');
                      let status = 'Invited';
                      if (hasEventCompleted) status = 'Attended';
                      else if (hasCompletedInteraction) status = 'Confirmed';
                      return (
                        <div className="list-member-row" key={member.id}>
                          <div className="list-member-contact">
                            <div className="avatar">{member.name.split(' ').map((n) => n[0]).join('')}</div>
                            <div className="list-member-meta"><strong>{member.name}</strong><p>{member.title} • {member.company}</p></div>
                          </div>
                          <div className="list-member-status">{status}</div>
                          <div className="list-member-summary">
                            {selectedList.type === 'Targeting'
                              ? getTargetingReason(member)
                              : 'Recent engagement summary placeholder'}
                          </div>
                          <div className="list-member-actions">
                            <button aria-label="open contact"><Icon name="user" /></button>
                            <button
                              aria-label="log marketing engagement"
                              onClick={() => setMarketingTarget(member)}
                              title="Log marketing engagement"
                            >
                              <Icon name="docPlus" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {listDetailTab === 'notes' && (
              <section className="list-detail-notes" style={{ marginTop: 16 }}>
                <p className="modal-label">List notes</p>
                {selectedListNotes.length === 0 ? <p className="modal-value">No notes yet for this list.</p> : (
                  <ul className="modal-list">
                    {selectedListNotes.map((note) => (
                      <li key={note.id}><strong>{note.author}</strong> — {new Date(note.createdAt).toLocaleDateString()} <br />{note.text}</li>
                    ))}
                  </ul>
                )}
                <div className="list-note-add">
                  <textarea rows={3} className="list-note-textarea" placeholder="Add a shared note about this list or event..." value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} />
                  <button type="button" className="detail-action-btn primary" disabled={!newNoteText.trim()} onClick={() => { const text = newNoteText.trim(); if (!text) return; actions.addListNote({ listId: selectedList.id, text }); setNewNoteText(''); }}>Add note</button>
                </div>
              </section>
            )}
          </section>
        );
      })()}

      <CreateListModal isOpen={showCreateList} onClose={() => setShowCreateList(false)} />
      <UpdateListModal list={editList} isOpen={Boolean(editList)} onClose={() => setEditList(null)} />
      <MarketingEngagementModal
        isOpen={Boolean(marketingTarget) && Boolean(selectedList)}
        onClose={() => setMarketingTarget(null)}
        list={selectedList}
        contact={marketingTarget}
      />
    </section>
  );
}
