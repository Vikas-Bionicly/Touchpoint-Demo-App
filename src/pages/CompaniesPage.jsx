import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import CreateTouchpointTaskModal from '../common/components/CreateTouchpointTaskModal';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import ManageCompanyTagsModal from '../common/components/ManageCompanyTagsModal';
import AddCompanyNoteModal from '../common/components/AddCompanyNoteModal';
import FirmConnectionsModal from '../common/components/FirmConnectionsModal';
import { CompanyHealthPanel } from '../common/components/CompanyHealthPanel';
import { OpportunityIdentificationPanel } from '../common/components/OpportunityIdentificationPanel';
import { CompanyMattersPanel } from '../common/components/CompanyMattersPanel';
import { CompanyOpportunitiesPanel } from '../common/components/CompanyOpportunitiesPanel';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterButton, FilterControls, FilterSelect } from '../common/components/FilterControls';
import DataTable from '../common/components/DataTable';

const companyAvatarUrls = import.meta.glob('../../demo-data/avatars/companies/*', {
  eager: true,
  import: 'default',
});

function resolveCompanyAvatarUrl(filename) {
  if (!filename) return null;
  const exactKey = `../../demo-data/avatars/companies/${filename}`;
  if (companyAvatarUrls[exactKey]) return companyAvatarUrls[exactKey];

  // Fallback: handle cases where the filename isn't an exact match (case differences).
  const matchKey = Object.keys(companyAvatarUrls).find((k) => k.toLowerCase().endsWith(`/${filename.toLowerCase()}`));
  return matchKey ? companyAvatarUrls[matchKey] : null;
}

function CompanyLogo({ type, avatarUrl, name }) {
  const resolvedAvatarUrl = resolveCompanyAvatarUrl(avatarUrl);
  if (resolvedAvatarUrl) {
    return (
      <div className="company-logo-v2">
        <img className="company-logo-image-v2" src={resolvedAvatarUrl} alt={name || 'Company logo'} />
      </div>
    );
  }

  if (type === 'uber') {
    return <div className="company-logo-v2 logo-uber">Uber</div>;
  }

  if (type === 'edgetech') {
    return (
      <div className="company-logo-v2 logo-edgetech" aria-hidden="true">
        <span />
      </div>
    );
  }

  if (type === 'zoom') {
    return (
      <div className="company-logo-v2 logo-zoom" aria-hidden="true">
        <div className="zoom-camera" />
      </div>
    );
  }

  return <div className="company-logo-v2">C</div>;
}

export default function CompaniesPage() {
  const [sort, setSort] = useState({ key: '', direction: '' });
  const [showColumns, setShowColumns] = useState({
    categories: true,
    recentEngagement: true,
    clientStatus: true,
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [touchpointPreset, setTouchpointPreset] = useState(null);
  const [tagsForCompany, setTagsForCompany] = useState(null);
  const [connectionsForContact, setConnectionsForContact] = useState(null);
  const [noteForCompany, setNoteForCompany] = useState(null);
  const rawCompanyTags = useDemoStore((s) => s.companyTags);
  const rawTags = useDemoStore((s) => s.tags);
  const rawCompanyFilters = useDemoStore((s) => s.companyFilters);
  const rawSavedViews = useDemoStore((s) => s.savedViews);
  const currentRole = useDemoStore((s) => s.currentRole || 'Partner');
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

  function guessContactForCompany(companyName) {
    return contacts.find((c) => c.company === companyName) || null;
  }

  const rows = useMemo(() => {
    let data = companies;

    if (companyFilters.text?.trim()) {
      const q = companyFilters.text.toLowerCase();
      data = data.filter((row) =>
        [row.name, row.category1, row.category2, row.engagementTitle, row.recentEngagement, row.clientStatus]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    if (companyFilters.relationshipTrend) {
      data = data.filter((row) => row.relationshipTrend === companyFilters.relationshipTrend);
    }

    if (companyFilters.tagId) {
      data = data.filter((row) => (companyTags[row.id] || []).includes(companyFilters.tagId));
    }

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
  }, [companies, companyFilters, companyTags, sort]);

  const nameParentOn = Boolean(showColumns.categories);
  const engagementParentOn = Boolean(showColumns.recentEngagement) || Boolean(showColumns.clientStatus);
  const engagementActiveChildren =
    (showColumns.recentEngagement ? 1 : 0) + (showColumns.clientStatus ? 1 : 0);
  const activeParentsCount = (nameParentOn ? 1 : 0) + (engagementParentOn ? 1 : 0);

  const engagementRows = useMemo(() => {
    if (!selectedCompany) return [];

    const rows = [];

    // Recent interactions from company seed data
    (selectedCompany.recentInteractions || []).forEach((text, index) => {
      const [datePart, rest] = String(text).split(':');
      const date = datePart ? datePart.trim() : '';
      const summary = rest ? rest.trim() : text;
      const lower = summary.toLowerCase();
      let type = 'Other';
      if (lower.includes('email')) type = 'Email';
      else if (lower.includes('meeting')) type = 'Meeting';
      else if (lower.includes('call')) type = 'Call';
      else if (lower.includes('event') || lower.includes('webinar')) type = 'Event';

      rows.push({
        id: `recent-${index}`,
        date,
        type,
        contact: (selectedCompany.keyContacts && selectedCompany.keyContacts[0]) || selectedCompany.name,
        internal: 'You',
        summary,
      });
    });

    // Touchpoints associated with this company
    touchpoints
      .filter((tp) => tp.company === selectedCompany.name)
      .forEach((tp) => {
        const isTask = tp.kind === 'task';
        const rawDate = isTask ? tp.dueAt : tp.completedAt || tp.createdAt;
        const dateObj = rawDate ? new Date(rawDate) : null;
        const date = dateObj
          ? dateObj.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' })
          : '';

        rows.push({
          id: tp.id,
          date,
          type: tp.interactionType || (isTask ? 'Task' : 'Interaction'),
          contact: tp.contactName || '',
          internal: 'You',
          summary: tp.title || tp.outcome || '',
        });
      });

    let filtered = rows;
    if (engagementTypeFilter !== 'All') {
      filtered = filtered.filter((r) => r.type === engagementTypeFilter);
    }
    if (engagementPersonFilter !== 'All') {
      filtered = filtered.filter((r) => r.internal === engagementPersonFilter);
    }

    return filtered;
  }, [selectedCompany, touchpoints, engagementTypeFilter, engagementPersonFilter]);

  const revenueLabel =
    selectedCompany && currentRole === 'Partner'
      ? (() => {
          const match = String(selectedCompany.revenue || '').match(/([\d.]+)/);
          const num = match ? parseFloat(match[1]) : null;
          if (!num || Number.isNaN(num)) return 'Revenue: $500K–$2M range';
          if (num < 0.8) return 'Revenue: <$1M range';
          if (num < 1.5) return 'Revenue: $1M–$2M range';
          return 'Revenue: $2M+ range';
        })()
      : selectedCompany?.revenue || '';

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: '', direction: '' };
      return { key, direction: 'asc' };
    });
  }

  function exportCsv() {
    if (!rows.length) return;
    const headers = ['Name'];
    if (showColumns.categories) headers.push('Category 1', 'Category 2');
    if (showColumns.recentEngagement) headers.push('Recent engagement');
    if (showColumns.clientStatus) headers.push('Client status');

    const lines = [headers.join(',')];
    rows.forEach((row) => {
      const cols = [JSON.stringify(row.name)];
      if (showColumns.categories) {
        cols.push(JSON.stringify(row.category1), JSON.stringify(row.category2));
      }
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
          <PageHeader title="Companies" showMore={false} />

          <FilterBar className="companies-filterbar-v2">
            <SearchBar
              className="companies-search-v2"
              value={companyFilters.text || ''}
              onChange={(value) => demoStore.actions.setCompanyFilters({ text: value })}
            />
            <FilterControls>
              <FilterSelect
                value={companyFilters.relationshipTrend || ''}
                onChange={(e) => demoStore.actions.setCompanyFilters({ relationshipTrend: e.target.value })}
              >
                <option value="">Relationship trend</option>
                <option value="Growing">Growing</option>
                <option value="Stable">Stable</option>
                <option value="Declining">Declining</option>
              </FilterSelect>

              <FilterSelect
                value={companyFilters.tagId || ''}
                onChange={(e) => demoStore.actions.setCompanyFilters({ tagId: e.target.value })}
              >
                <option value="">All Tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </FilterSelect>

              <FilterButton
                onClick={() => {
                  const name = window.prompt('Save current company filters as view name');
                  if (name) demoStore.actions.saveCompanyView(name);
                }}
              >
                Save View
              </FilterButton>

              <FilterSelect
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  demoStore.actions.applyCompanyView(value);
                }}
              >
                <option value="">Views</option>
                {savedViews
                  .filter((v) => v.scope === 'companies')
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </FilterSelect>

              <FilterButton onClick={exportCsv}>
                Export CSV
              </FilterButton>
            </FilterControls>
          </FilterBar>

          <DataTable
            className="companies-table-v2"
            tableClassName="companies-table-v2-table"
            renderHeader={() => (
              <tr>
                <th colSpan={3}>
                  <div className="companies-table-head-v2">
                    <button
                      type="button"
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: nameParentOn ? 'inline-flex' : 'none',
                      }}
                      onClick={() => toggleSort('name')}
                    >
                      Name
                    </button>

                    <button
                      type="button"
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: engagementParentOn ? 'inline-flex' : 'none',
                      }}
                      onClick={() => toggleSort('recentEngagement')}
                    >
                      Recent Engagement
                    </button>

                    <div style={{ position: 'relative', justifySelf: 'end' }}>
                      <button
                        className="contacts-table-settings"
                        aria-label="configure columns"
                        type="button"
                        onClick={() =>
                          setShowColumns((prev) => ({
                            ...prev,
                            _open: !prev._open,
                          }))
                        }
                      >
                        <Icon name="settings" />
                      </button>

                      {showColumns._open && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '110%',
                            right: 0,
                            background: '#fff',
                            border: '1px solid #e5e5e5',
                            borderRadius: 8,
                            padding: 8,
                            boxShadow: '0 10px 15px -5px rgba(0,0,0,0.1)',
                            zIndex: 20,
                            minWidth: 240,
                          }}
                        >
                          {/* Name parent + Categories child */}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 14,
                              marginBottom: 4,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={nameParentOn}
                              disabled={activeParentsCount === 1 && nameParentOn}
                              onChange={(e) =>
                                setShowColumns((prev) => ({
                                  ...prev,
                                  categories: e.target.checked,
                                }))
                              }
                            />
                            <span style={{ fontWeight: 600 }}>Name</span>
                          </label>

                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 14,
                              marginBottom: 4,
                              paddingLeft: 20,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(showColumns.categories)}
                              disabled={activeParentsCount === 1 && nameParentOn}
                              onChange={(e) =>
                                setShowColumns((prev) => ({
                                  ...prev,
                                  categories: e.target.checked,
                                }))
                              }
                            />
                            <span>Categories</span>
                          </label>

                          {/* Recent engagement parent + children */}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 14,
                              margin: '8px 0 4px',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={engagementParentOn}
                              disabled={activeParentsCount === 1 && engagementParentOn}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setShowColumns((prev) => ({
                                  ...prev,
                                  recentEngagement: checked,
                                  clientStatus: checked,
                                }));
                              }}
                            />
                            <span style={{ fontWeight: 600 }}>Recent Engagement</span>
                          </label>

                          {[
                            ['recentEngagement', 'Recent engagement'],
                            ['clientStatus', 'Client status'],
                          ].map(([key, label]) => {
                            const isLastActiveChild =
                              engagementParentOn && engagementActiveChildren === 1 && showColumns[key];

                            return (
                              <label
                                key={key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 14,
                                  marginBottom: 4,
                                  paddingLeft: 20,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(showColumns[key])}
                                  disabled={isLastActiveChild && activeParentsCount === 1}
                                  onChange={(e) =>
                                    setShowColumns((prev) => ({
                                      ...prev,
                                      [key]: e.target.checked,
                                    }))
                                  }
                                />
                                <span>{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </th>
              </tr>
            )}
            renderBody={() =>
              rows.map((row) => (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    if (event.target.closest('.company-actions-v2 button')) return;
                    setSelectedCompany(row);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedCompany(row);
                    }
                  }}
                >
                  <td style={{ width: '50%' }}>
                    <div className="company-name-col-v2">
                      <CompanyLogo type={row.logo} avatarUrl={row.avatarUrl} name={row.name} />
                      <div className="company-name-meta-v2">
                        <strong>{row.name}</strong>
                        {showColumns.categories && (
                          <>
                            <p>{row.category1}</p>
                            <p>{row.category2}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ width: '40%' }}>
                    <div className="company-engagement-col-v2">
                      <div className="company-note-pill-v2">
                        <Icon name="handshake" />
                      </div>
                      <div className="company-engagement-text-v2">
                        {showColumns.recentEngagement && (
                          <p className="company-engagement-title-v2">{row.engagementTitle}</p>
                        )}
                        {(showColumns.recentEngagement || showColumns.clientStatus) && (
                          <p className="company-engagement-sub-v2">
                            {showColumns.recentEngagement && (
                              <>
                                Recent engagement <strong>{row.recentEngagement}</strong>
                              </>
                            )}
                            {showColumns.clientStatus && (
                              <span>
                                Client status <strong>{row.clientStatus}</strong>
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ width: '10%' }}>
                    <div className="company-actions-v2">
                      <button
                        aria-label="new touchpoint"
                        onClick={() => {
                          const contact = guessContactForCompany(row.name);
                          setTouchpointPreset({
                            contactName: contact?.name || contacts[0]?.name || '',
                            company: row.name,
                            role: contact?.role || '',
                            title: `Touchpoint for ${row.name}`,
                            notes: '',
                            source: 'companies:row',
                          });
                        }}
                      >
                        <Icon name="docPlus" />
                      </button>
                      <button aria-label="relationship">
                        <Icon name="target" />
                      </button>
                      <button aria-label="analytics">
                        <Icon name="chart" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          />

          <section className="companies-cards">
            {rows.map((row) => (
              <article
                key={row.id}
                className="company-card"
                role="button"
                onClick={() => setSelectedCompany(row)}
              >
                <div className="company-card-header">
                  <CompanyLogo type={row.logo} avatarUrl={row.avatarUrl} name={row.name} />
                  <div className="company-card-main">
                    <strong>{row.name}</strong>
                    <div className="company-card-meta">
                      {[row.category1, row.category2].filter(Boolean).join(' • ')}
                    </div>
                    <div className="company-card-meta">
                      Recent engagement <strong>{row.recentEngagement}</strong>
                      {' · '}
                      Client status <strong>{row.clientStatus}</strong>
                    </div>
                    <div className="company-card-meta">
                      Relationship trend{' '}
                      <strong>
                        {row.relationshipTrend} (Score {row.relationshipScore})
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="company-card-actions">
                  <button
                    aria-label="new touchpoint"
                    onClick={(event) => {
                      event.stopPropagation();
                      const contact = guessContactForCompany(row.name);
                      setTouchpointPreset({
                        contactName: contact?.name || contacts[0]?.name || '',
                        company: row.name,
                        role: contact?.role || '',
                        title: `Touchpoint for ${row.name}`,
                        notes: '',
                        source: 'companies:card',
                      });
                    }}
                  >
                    <Icon name="docPlus" />
                  </button>
                  <button
                    aria-label="firm connections"
                    onClick={(event) => {
                      event.stopPropagation();
                      const contact = guessContactForCompany(row.name) || {
                        id: row.id,
                        name: row.name,
                        company: row.name,
                        role: 'Client contact',
                      };
                      setConnectionsForContact(contact);
                    }}
                  >
                    <Icon name="handshake" />
                  </button>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {isDetailView && selectedCompany && (
        <section className="company-detail-page">
          <header className="company-detail-header">
            <button
              type="button"
              className="filter-btn company-detail-back"
              onClick={() => setSelectedCompany(null)}
            >
              ← Back to companies
            </button>
            <div className="company-detail-title">
              <CompanyLogo
                type={selectedCompany.logo}
                avatarUrl={selectedCompany.avatarUrl}
                name={selectedCompany.name}
              />
              <div>
                <h1>{selectedCompany.name}</h1>
                <p className="company-detail-subtitle">
                  {selectedCompany.category1}
                  {selectedCompany.category2 ? ` • ${selectedCompany.category2}` : ''}
                </p>
              </div>
            </div>
            <div className="company-detail-header-actions">
              <button
                className="tool-btn"
                type="button"
                onClick={() => setNoteForCompany(selectedCompany)}
              >
                Add note
              </button>
              <button
                className="tool-btn"
                type="button"
                onClick={() => {
                  const contact = guessContactForCompany(selectedCompany.name);
                  const fallbackContact = {
                    id: selectedCompany.id,
                    name: selectedCompany.name,
                    company: selectedCompany.name,
                    role: 'Client contact',
                  };
                  setConnectionsForContact(contact || fallbackContact);
                }}
              >
                Firm connections
              </button>
              <button className="tool-btn" onClick={() => setTagsForCompany(selectedCompany)}>
                Manage tags
              </button>
              <button
                className="primary"
                onClick={() => {
                  const contact = guessContactForCompany(selectedCompany.name);
                  setTouchpointPreset({
                    contactName: contact?.name || contacts[0]?.name || '',
                    company: selectedCompany.name,
                    role: contact?.role || '',
                    title: `Touchpoint for ${selectedCompany.name}`,
                    notes: '',
                    source: 'companies:detail',
                  });
                }}
              >
                Create touchpoint
              </button>
            </div>
          </header>

          <div className="company-detail-grid">
            <section className="company-detail-summary">
              <div>
                <p className="modal-label">Client status</p>
                <p className="modal-value">{selectedCompany.clientStatus}</p>
              </div>
              <div>
                <p className="modal-label">Recent engagement</p>
                <p className="modal-value">{selectedCompany.recentEngagement}</p>
              </div>
              <div>
                <p className="modal-label">
                  Client revenue
                  {currentRole === 'Partner' && <span style={{ marginLeft: 6, fontSize: 12 }}>(range)</span>}
                </p>
                <p className="modal-value">{revenueLabel}</p>
              </div>
              <div>
                <p className="modal-label">Relationship trend</p>
                <p className="modal-value">
                  {selectedCompany.relationshipTrend} (Score {selectedCompany.relationshipScore})
                </p>
              </div>
              <div className="company-detail-hierarchy">
                <p className="modal-label">Company hierarchy</p>
                <p className="modal-value">{selectedCompany.hierarchy.join(' > ')}</p>
              </div>
            </section>

            <section className="company-detail-columns">
              <div className="company-detail-column">
                <p className="modal-label">Relationship history</p>
                <ul className="modal-list">
                  {(currentRole === 'Partner'
                    ? selectedCompany.relationshipHistory.slice(0, 2)
                    : selectedCompany.relationshipHistory
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {currentRole === 'Partner' &&
                    selectedCompany.relationshipHistory.length > 2 && (
                      <li style={{ opacity: 0.7 }}>+ more history (BD view)</li>
                    )}
                </ul>
              </div>
              <div className="company-detail-column">
                <p className="modal-label">Key internal connections</p>
                <ul className="modal-list">
                  {(currentRole === 'Partner'
                    ? selectedCompany.keyContacts.slice(0, 2)
                    : selectedCompany.keyContacts
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {currentRole === 'Partner' && selectedCompany.keyContacts.length > 2 && (
                    <li style={{ opacity: 0.7 }}>+ more colleagues (BD view)</li>
                  )}
                </ul>
              </div>
              <div className="company-detail-column">
                <p className="modal-label">Recent interactions</p>
                <ul className="modal-list">
                  {(currentRole === 'Partner'
                    ? selectedCompany.recentInteractions.slice(0, 2)
                    : selectedCompany.recentInteractions
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {currentRole === 'Partner' &&
                    selectedCompany.recentInteractions.length > 2 && (
                      <li style={{ opacity: 0.7 }}>+ more interactions (BD view)</li>
                    )}
                </ul>
              </div>
            </section>
          </div>

          <div className="company-detail-section">
            <div className="company-detail-section-heading">
              <p className="modal-label">Company notes</p>
            </div>
            <ul className="modal-list">
              {companyNotes
                .filter((n) => n.companyId === selectedCompany.id)
                .slice(0, currentRole === 'Partner' ? 2 : undefined)
                .map((note) => (
                  <li key={note.id}>
                    <strong>{note.type}</strong> ·{' '}
                    <span style={{ textTransform: 'capitalize' }}>{note.visibility}</span>{' '}
                    <span style={{ opacity: 0.7, fontSize: 12 }}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <div>{note.text}</div>
                  </li>
                ))}
              {companyNotes.filter((n) => n.companyId === selectedCompany.id).length === 0 && (
                <li>No notes yet for this company.</li>
              )}
              {currentRole === 'Partner' &&
                companyNotes.filter((n) => n.companyId === selectedCompany.id).length > 2 && (
                  <li style={{ opacity: 0.7 }}>+ more notes (BD view)</li>
                )}
            </ul>
          </div>

          <section className="company-engagement-section">
            <div className="company-engagement-header">
              <h3>Engagement</h3>
              <div className="company-engagement-filters">
                <select
                  value={engagementTypeFilter}
                  onChange={(e) => setEngagementTypeFilter(e.target.value)}
                >
                  <option value="All">All types</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Call">Call</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={engagementPersonFilter}
                  onChange={(e) => setEngagementPersonFilter(e.target.value)}
                >
                  <option value="All">All internal</option>
                  <option value="You">You</option>
                </select>
              </div>
            </div>
            <table className="company-engagement-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Internal</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {engagementRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.type}</td>
                    <td>{row.contact}</td>
                    <td>{row.internal}</td>
                    <td>{row.summary}</td>
                  </tr>
                ))}
                {engagementRows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>
                      No engagement found for the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="company-detail-section">
            <div className="company-detail-panels">
              <CompanyHealthPanel company={selectedCompany} />
              <OpportunityIdentificationPanel company={selectedCompany} />
            </div>
          </div>

          <div className="company-detail-section">
            <div className="company-detail-section-heading">
              <p className="modal-label">Matters</p>
            </div>
            {currentRole === 'Partner' ? (
              <p className="modal-value">
                {(selectedCompany.matters || []).length} matters total (
                {(selectedCompany.matters || []).filter((m) => m.status === 'Active').length} active)
              </p>
            ) : (
              <table className="company-matters-table">
                <thead>
                  <tr>
                    <th>Open date</th>
                    <th>Status</th>
                    <th>Matter name</th>
                    <th>Practice area</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedCompany.matters || []).map((matter) => (
                    <tr key={matter.id}>
                      <td>{matter.openDate}</td>
                      <td>{matter.status}</td>
                      <td>{matter.name}</td>
                      <td>{matter.practiceArea}</td>
                    </tr>
                  ))}
                  {(!selectedCompany.matters || selectedCompany.matters.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>
                        No matters yet for this company.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="company-detail-section">
            <div className="company-detail-section-heading">
              <p className="modal-label">Opportunities pipeline</p>
            </div>
            {currentRole === 'Partner' ? (
              <p className="modal-value">
                {(selectedCompany.opportunities || []).length} opportunities (
                {(selectedCompany.opportunities || []).filter((o) => o.status === 'Pending').length} pending,{' '}
                {(selectedCompany.opportunities || []).filter((o) => o.status === 'Won').length} won)
              </p>
            ) : (
              <table className="company-opportunities-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedCompany.opportunities || []).map((opp) => (
                    <tr key={opp.id}>
                      <td>{opp.date}</td>
                      <td>{opp.status}</td>
                      <td>{opp.name}</td>
                      <td>{opp.type}</td>
                    </tr>
                  ))}
                  {(!selectedCompany.opportunities || selectedCompany.opportunities.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 12, color: '#6b7280' }}>
                        No opportunities in the pipeline yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="company-detail-section">
            <div className="company-detail-section-heading">
              <p className="modal-label">Financial & BD trends</p>
            </div>
            <div className="company-detail-panels company-detail-panels-secondary">
              <CompanyMattersPanel company={selectedCompany} />
              <CompanyOpportunitiesPanel company={selectedCompany} />
            </div>
          </div>
        </section>
      )}

      <CreateTouchpointTaskModal
        isOpen={Boolean(touchpointPreset)}
        preset={touchpointPreset}
        onClose={() => setTouchpointPreset(null)}
      />
      <ManageCompanyTagsModal
        company={tagsForCompany}
        isOpen={Boolean(tagsForCompany)}
        onClose={() => setTagsForCompany(null)}
      />
      <AddCompanyNoteModal
        company={noteForCompany}
        isOpen={Boolean(noteForCompany)}
        onClose={() => setNoteForCompany(null)}
      />
      <FirmConnectionsModal
        contact={connectionsForContact}
        isOpen={Boolean(connectionsForContact)}
        onClose={() => setConnectionsForContact(null)}
      />
    </section>
  );
}
