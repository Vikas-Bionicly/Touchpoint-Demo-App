import { useMemo, useState } from 'react';
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
import RelationshipScoreGauge from '../common/components/RelationshipScoreGauge';
import PowerBIDashboard from '../common/components/PowerBIDashboard';
import SubTabBar from '../common/components/SubTabBar';
import { CompanyHealthPanel } from '../common/components/CompanyHealthPanel';
import { OpportunityIdentificationPanel } from '../common/components/OpportunityIdentificationPanel';
import { CompanyMattersPanel } from '../common/components/CompanyMattersPanel';
import { CompanyOpportunitiesPanel } from '../common/components/CompanyOpportunitiesPanel';
import { usePersona } from '../common/hooks/usePersona';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterButton, FilterControls, FilterSelect } from '../common/components/FilterControls';
import DataTable from '../common/components/DataTable';

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
  const rawCompanyTags = useDemoStore((s) => s.companyTags);
  const rawTags = useDemoStore((s) => s.tags);
  const rawCompanyFilters = useDemoStore((s) => s.companyFilters);
  const rawSavedViews = useDemoStore((s) => s.savedViews);
  const rawTouchpoints = useDemoStore((s) => s.touchpoints);
  const rawCompanyNotes = useDemoStore((s) => s.companyNotes);
  const contacts = useDemoStore((s) => s.contacts || []);
  const companies = useDemoStore((s) => s.companies || []);
  const companyTags = rawCompanyTags || {};
  const tags = rawTags || [];
  const companyFilters = rawCompanyFilters || {};
  const savedViews = rawSavedViews || [];
  const touchpoints = rawTouchpoints || [];
  const companyNotes = rawCompanyNotes || [];
  const [engagementTypeFilter, setEngagementTypeFilter] = useState('All');
  const [engagementPersonFilter, setEngagementPersonFilter] = useState('All');

  const { can, field, depth, tier } = usePersona();

  function guessContactForCompany(companyName) {
    return contacts.find((c) => c.company === companyName) || null;
  }

  const rows = useMemo(() => {
    let data = companies;

    // Sub-tab filtering
    if (activeTab === 'My Clients') {
      data = data.filter((c) => c.accountType === 'Client' || c.category1 === 'Client');
    } else if (activeTab === 'Prospective Clients') {
      data = data.filter((c) => c.accountType === 'Prospective' || c.category1 === 'Prospective');
    }

    if (companyFilters.text?.trim()) {
      const q = companyFilters.text.toLowerCase();
      data = data.filter((row) => [row.name, row.category1, row.category2, row.engagementTitle, row.recentEngagement, row.clientStatus].join(' ').toLowerCase().includes(q));
    }
    if (companyFilters.relationshipTrend) data = data.filter((row) => row.relationshipTrend === companyFilters.relationshipTrend);
    if (companyFilters.tagId) data = data.filter((row) => (companyTags[row.id] || []).includes(companyFilters.tagId));

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
  }, [companies, companyFilters, companyTags, sort, activeTab]);

  const nameParentOn = Boolean(showColumns.categories);
  const engagementParentOn = Boolean(showColumns.recentEngagement) || Boolean(showColumns.clientStatus);
  const engagementActiveChildren = (showColumns.recentEngagement ? 1 : 0) + (showColumns.clientStatus ? 1 : 0);
  const activeParentsCount = (nameParentOn ? 1 : 0) + (engagementParentOn ? 1 : 0);

  const engagementRows = useMemo(() => {
    if (!selectedCompany) return [];
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
      eRows.push({ id: `recent-${index}`, date: datePart?.trim() || '', type, contact: selectedCompany.keyContacts?.[0] || selectedCompany.name, internal: 'You', summary });
    });
    touchpoints.filter((tp) => tp.company === selectedCompany.name).forEach((tp) => {
      const isTask = tp.kind === 'task';
      const rawDate = isTask ? tp.dueAt : tp.completedAt || tp.createdAt;
      const dateObj = rawDate ? new Date(rawDate) : null;
      const date = dateObj ? dateObj.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }) : '';
      eRows.push({ id: tp.id, date, type: tp.interactionType || (isTask ? 'Task' : 'Interaction'), contact: tp.contactName || '', internal: 'You', summary: tp.title || tp.outcome || '' });
    });
    let filtered = eRows;
    if (engagementTypeFilter !== 'All') filtered = filtered.filter((r) => r.type === engagementTypeFilter);
    if (engagementPersonFilter !== 'All') filtered = filtered.filter((r) => r.internal === engagementPersonFilter);
    return filtered.slice(0, depth('engagementRows'));
  }, [selectedCompany, touchpoints, engagementTypeFilter, engagementPersonFilter, depth]);

  const revenueLabel = selectedCompany
    ? field('revenue.exact')
      ? selectedCompany.revenue
      : field('revenue.range')
        ? (() => { const m = String(selectedCompany.revenue || '').match(/([\d.]+)/); const n = m ? parseFloat(m[1]) : null; if (!n) return 'Revenue: $500K–$2M range'; if (n < 0.8) return 'Revenue: <$1M range'; if (n < 1.5) return 'Revenue: $1M–$2M range'; return 'Revenue: $2M+ range'; })()
        : 'Revenue data restricted'
    : '';

  function toggleSort(key) {
    setSort((prev) => { if (prev.key !== key) return { key, direction: 'asc' }; if (prev.direction === 'asc') return { key, direction: 'desc' }; return { key: '', direction: '' }; });
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
                {tags.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </FilterSelect>
              <FilterButton onClick={() => { const name = window.prompt('Save current company filters as view name'); if (name) demoStore.actions.saveCompanyView(name); }}>Save View</FilterButton>
              <FilterSelect onChange={(e) => { const v = e.target.value; if (v) demoStore.actions.applyCompanyView(v); }}>
                <option value="">Views</option>
                {savedViews.filter((v) => v.scope === 'companies').map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </FilterSelect>
              {can('export.csv') && <FilterButton onClick={exportCsv}>Export CSV</FilterButton>}
            </FilterControls>
          </FilterBar>

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
                    <div className="company-card-meta">Relationship trend <strong>{row.relationshipTrend} (Score {row.relationshipScore})</strong></div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {isDetailView && selectedCompany && (
        <section className="company-detail-page">
          <header className="company-detail-header">
            <button type="button" className="filter-btn company-detail-back" onClick={() => setSelectedCompany(null)}>← Back to companies</button>
            <div className="company-detail-title">
              <CompanyLogo type={selectedCompany.logo} avatarUrl={selectedCompany.avatarUrl} name={selectedCompany.name} />
              <div>
                <h1>{selectedCompany.name}</h1>
                <p className="company-detail-subtitle">{selectedCompany.category1}{selectedCompany.category2 ? ` • ${selectedCompany.category2}` : ''}</p>
              </div>
            </div>
            <div className="company-detail-header-actions">
              <button className="tool-btn" onClick={() => setNoteForCompany(selectedCompany)}>Add note</button>
              <button className="tool-btn" onClick={() => { const c = guessContactForCompany(selectedCompany.name) || { id: selectedCompany.id, name: selectedCompany.name, company: selectedCompany.name, role: 'Client contact' }; setConnectionsForContact(c); }}>Firm connections</button>
              {can('tag.manage') && <button className="tool-btn" onClick={() => setTagsForCompany(selectedCompany)}>Manage tags</button>}
              {can('company.edit') && <button className="tool-btn" onClick={() => { setEditCompany(selectedCompany); }}>Edit</button>}
              <button className="tool-btn" onClick={() => setShowInteractions(selectedCompany)}>Recent Interactions</button>
              {can('opportunity.add') && <button className="tool-btn" onClick={() => setShowAddOpp(selectedCompany)}>+ Opportunity</button>}
              <button className="primary" onClick={() => { const c = guessContactForCompany(selectedCompany.name); setTouchpointPreset({ contactName: c?.name || contacts[0]?.name || '', company: selectedCompany.name, role: c?.role || '', title: `Touchpoint for ${selectedCompany.name}`, notes: '', source: 'companies:detail' }); }}>Create touchpoint</button>
            </div>
          </header>

          <div className="company-detail-grid">
            <section className="company-detail-summary">
              <div><p className="modal-label">Client status</p><p className="modal-value">{selectedCompany.clientStatus}</p></div>
              <div><p className="modal-label">Recent engagement</p><p className="modal-value">{selectedCompany.recentEngagement}</p></div>
              <div>
                <p className="modal-label">Client revenue{!field('revenue.exact') && field('revenue.range') && <span style={{ marginLeft: 6, fontSize: 12 }}>(range)</span>}</p>
                <p className="modal-value">{revenueLabel}</p>
              </div>
              <div>
                <p className="modal-label">Relationship</p>
                {field('relationshipScore') ? (
                  <RelationshipScoreGauge metricsCurrent={selectedCompany.metricsCurrent} metricsPrevious={selectedCompany.metricsPrevious} compact />
                ) : (
                  <p className="modal-value">{selectedCompany.relationshipTrend}</p>
                )}
              </div>
              {field('companyHierarchy') && (
                <div className="company-detail-hierarchy"><p className="modal-label">Company hierarchy</p><p className="modal-value">{selectedCompany.hierarchy.join(' > ')}</p></div>
              )}
              {field('catCode') && selectedCompany.catCode && (
                <div><p className="modal-label">Cat Code</p><p className="modal-value">{selectedCompany.catCode}</p></div>
              )}
              {field('clientCode') && selectedCompany.clientCode && (
                <div><p className="modal-label">Client Code</p><p className="modal-value">{selectedCompany.clientCode}</p></div>
              )}
              {field('gics') && selectedCompany.gics && (
                <div><p className="modal-label">GICs</p><p className="modal-value">{selectedCompany.gics}</p></div>
              )}
              {field('billingLawyer') && selectedCompany.billingLawyer && (
                <div><p className="modal-label">Billing Lawyer</p><p className="modal-value">{selectedCompany.billingLawyer}</p></div>
              )}
            </section>

            {field('companyNews') && <CompanyNewsPanel newsItems={selectedCompany.newsItems} />}

            <section className="company-detail-columns">
              {field('relationshipHistory') && (
                <div className="company-detail-column">
                  <p className="modal-label">Relationship history</p>
                  <ul className="modal-list">
                    {selectedCompany.relationshipHistory.slice(0, depth('relationshipHistory')).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
              {field('internalConnections') && (
                <div className="company-detail-column">
                  <p className="modal-label">Key internal connections</p>
                  <ul className="modal-list">
                    {selectedCompany.keyContacts.slice(0, depth('keyContacts')).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}
              <div className="company-detail-column">
                <p className="modal-label">Recent interactions</p>
                <ul className="modal-list">
                  {selectedCompany.recentInteractions.slice(0, depth('recentInteractions')).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </section>
          </div>

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

          <section className="company-engagement-section">
            <div className="company-engagement-header">
              <h3>Engagement</h3>
              <div className="company-engagement-filters">
                <select value={engagementTypeFilter} onChange={(e) => setEngagementTypeFilter(e.target.value)}>
                  <option value="All">All types</option>
                  <option value="Email">Email</option><option value="Meeting">Meeting</option><option value="Call">Call</option><option value="Event">Event</option><option value="Other">Other</option>
                </select>
                <select value={engagementPersonFilter} onChange={(e) => setEngagementPersonFilter(e.target.value)}>
                  <option value="All">All internal</option><option value="You">You</option>
                </select>
              </div>
            </div>
            <table className="company-engagement-table">
              <thead><tr><th>Date</th><th>Type</th><th>Contact</th><th>Internal</th><th>Summary</th></tr></thead>
              <tbody>
                {engagementRows.map((row) => <tr key={row.id}><td>{row.date}</td><td>{row.type}</td><td>{row.contact}</td><td>{row.internal}</td><td>{row.summary}</td></tr>)}
                {engagementRows.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>No engagement found for the current filters.</td></tr>}
              </tbody>
            </table>
          </section>

          {field('companyHealth') && (
            <div className="company-detail-section">
              <div className="company-detail-panels">
                <CompanyHealthPanel company={selectedCompany} />
                <OpportunityIdentificationPanel company={selectedCompany} />
              </div>
            </div>
          )}

          <div className="company-detail-section">
            <div className="company-detail-section-heading"><p className="modal-label">Matters</p></div>
            {field('matters.table') ? (
              <table className="company-matters-table">
                <thead><tr><th>Open date</th><th>Status</th><th>Matter name</th><th>Practice area</th>{field('matterRank') && <th>Rank</th>}{field('wip') && <th>WIP</th>}<th>Lead Lawyer</th></tr></thead>
                <tbody>
                  {(selectedCompany.matters || []).map((m) => (
                    <tr key={m.id}><td>{m.openDate}</td><td>{m.status}</td><td>{m.name}</td><td>{m.practiceArea}</td>{field('matterRank') && <td>{m.matterRank}</td>}{field('wip') && <td>${(m.wip || 0).toLocaleString()}</td>}<td>{m.leadLawyer || '—'}</td></tr>
                  ))}
                  {(!selectedCompany.matters || selectedCompany.matters.length === 0) && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>No matters yet.</td></tr>}
                </tbody>
              </table>
            ) : field('matters.summary') ? (
              <p className="modal-value">{(selectedCompany.matters || []).length} matters total ({(selectedCompany.matters || []).filter((m) => m.status === 'Active').length} active)</p>
            ) : null}
          </div>

          <div className="company-detail-section">
            <div className="company-detail-section-heading"><p className="modal-label">Opportunities pipeline</p></div>
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
        </section>
      )}

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
