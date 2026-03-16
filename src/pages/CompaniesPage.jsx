import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import { companyRows } from '../common/constants/companies';
import { contactRows } from '../common/constants/contacts';
import CreateTouchpointTaskModal from '../common/components/CreateTouchpointTaskModal';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import ManageCompanyTagsModal from '../common/components/ManageCompanyTagsModal';

function CompanyLogo({ type }) {
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
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: '', direction: '' });
  const [showColumns, setShowColumns] = useState({
    categories: true,
    recentEngagement: true,
    clientStatus: true,
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [touchpointPreset, setTouchpointPreset] = useState(null);
  const [tagsForCompany, setTagsForCompany] = useState(null);
  const companyTags = useDemoStore((s) => s.companyTags || {});
  const tags = useDemoStore((s) => s.tags || []);

  function guessContactForCompany(companyName) {
    return contactRows.find((c) => c.company === companyName) || null;
  }

  const rows = useMemo(() => {
    let data = companyRows;
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((row) =>
        [row.name, row.category1, row.category2, row.engagementTitle, row.recentEngagement, row.clientStatus]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
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
  }, [query, sort]);

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

  return (
    <section className="companies-view-v2">
      <header className="headbar">
        <h1>Companies</h1>
        <button className="context-btn" aria-label="more">
          <Icon name="more" />
        </button>
      </header>

      <section className="filterbar companies-filterbar-v2">
        <label className="search companies-search-v2">
          <Icon name="search" />
          <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="filter-btn" onClick={exportCsv}>
            Export CSV
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="filter-btn"
              onClick={() =>
                setShowColumns((prev) => ({
                  ...prev,
                  _open: !prev._open,
                }))
              }
            >
              Columns
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
                  minWidth: 180,
                }}
              >
                {[
                  ['categories', 'Categories'],
                  ['recentEngagement', 'Recent engagement'],
                  ['clientStatus', 'Client status'],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4 }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(showColumns[key])}
                      onChange={(e) =>
                        setShowColumns((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="companies-table-v2">
        <div className="companies-table-head-v2">
          <button type="button" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => toggleSort('name')}>
            Name
          </button>
          <button
            type="button"
            style={{ all: 'unset', cursor: 'pointer' }}
            onClick={() => toggleSort('recentEngagement')}
          >
            Recent Engagement
          </button>
          <button className="contacts-table-settings" aria-label="settings">
            <Icon name="settings" />
          </button>
        </div>

        <div className="companies-table-body-v2">
          {rows.map((row) => (
            <div
              className="company-row-v2"
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
              <div className="company-name-col-v2">
                <CompanyLogo type={row.logo} />
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

              <div className="company-actions-v2">
                <button
                  aria-label="new touchpoint"
                  onClick={() => {
                    const contact = guessContactForCompany(row.name);
                    setTouchpointPreset({
                      contactName: contact?.name || contactRows[0]?.name || '',
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
            </div>
          ))}
        </div>
      </section>

      {selectedCompany && (
        <div className="modal-backdrop" onClick={() => setSelectedCompany(null)}>
          <div className="company-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>{selectedCompany.name}</h2>
              <button className="modal-close" onClick={() => setSelectedCompany(null)} aria-label="close modal">
                x
              </button>
            </div>

            <div className="modal-grid">
              <div>
                <p className="modal-label">Category</p>
                <p className="modal-value">{selectedCompany.category1}</p>
              </div>
              <div>
                <p className="modal-label">Client Status</p>
                <p className="modal-value">{selectedCompany.clientStatus}</p>
              </div>
              <div>
                <p className="modal-label">Recent engagement</p>
                <p className="modal-value">{selectedCompany.recentEngagement}</p>
              </div>
              <div>
                <p className="modal-label">Client revenue</p>
                <p className="modal-value">{selectedCompany.revenue}</p>
              </div>
              <div>
                <p className="modal-label">Relationship trend</p>
                <p className="modal-value">
                  {selectedCompany.relationshipTrend} (Score {selectedCompany.relationshipScore})
                </p>
              </div>
              <div>
                <p className="modal-label">Company hierarchy</p>
                <p className="modal-value">{selectedCompany.hierarchy.join(' > ')}</p>
              </div>
            </div>

            <div className="modal-stack">
              <div>
                <p className="modal-label">Relationship history</p>
                <ul className="modal-list">
                  {selectedCompany.relationshipHistory.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="modal-label">Key internal connections</p>
                <ul className="modal-list">
                  {selectedCompany.keyContacts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="modal-label">Recent interactions</p>
                <ul className="modal-list">
                  {selectedCompany.recentInteractions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="modal-actions">
              <button className="tool-btn">Open profile</button>
              <button className="tool-btn" onClick={() => setTagsForCompany(selectedCompany)}>
                Manage tags
              </button>
              <button
                className="primary"
                onClick={() => {
                  const contact = guessContactForCompany(selectedCompany.name);
                  setTouchpointPreset({
                    contactName: contact?.name || contactRows[0]?.name || '',
                    company: selectedCompany.name,
                    role: contact?.role || '',
                    title: `Touchpoint for ${selectedCompany.name}`,
                    notes: '',
                    source: 'companies:modal',
                  });
                }}
              >
                Create touchpoint
              </button>
            </div>
          </div>
        </div>
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
    </section>
  );
}
