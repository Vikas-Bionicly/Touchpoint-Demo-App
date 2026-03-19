import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import { contactRows } from '../common/constants/contacts';
import CreateTouchpointTaskModal from '../common/components/CreateTouchpointTaskModal';
import AddContactNoteModal from '../common/components/AddContactNoteModal';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import AddContactToListModal from '../common/components/AddContactToListModal';
import ManageContactTagsModal from '../common/components/ManageContactTagsModal';
import FirmConnectionsModal from '../common/components/FirmConnectionsModal';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterButton, FilterControls, FilterSelect } from '../common/components/FilterControls';
import DataTable from '../common/components/DataTable';

export default function ContactsPage() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [touchpointPreset, setTouchpointPreset] = useState(null);
  const [noteForContact, setNoteForContact] = useState(null);
  const [listForContact, setListForContact] = useState(null);
  const [tagsForContact, setTagsForContact] = useState(null);
  const [connectionsForContact, setConnectionsForContact] = useState(null);
  const [sort, setSort] = useState({ key: '', direction: '' });
  const [showColumns, setShowColumns] = useState({
    role: true,
    company: true,
    lastInteraction: true,
    relationship: true,
  });
  const notes = useDemoStore((s) => s.notes || []);
  const filters = useDemoStore((s) => s.contactFilters || {});
  const lists = useDemoStore((s) => s.lists || []);
  const contactTags = useDemoStore((s) => s.contactTags || {});
  const tags = useDemoStore((s) => s.tags || []);
  const savedViews = useDemoStore((s) => s.savedViews || []);

  const rows = useMemo(() => {
    let data = contactRows;

    if (filters.text?.trim()) {
      const q = filters.text.toLowerCase();
      data = data.filter((row) =>
        [row.name, row.role, row.company, row.lastInteraction, row.relationship].some((field) =>
          field.toLowerCase().includes(q)
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

    if (sort.key && sort.direction) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      data = [...data].sort((a, b) => {
        if (sort.key === 'name') {
          return a.name.localeCompare(b.name) * dir;
        }
        if (sort.key === 'lastInteracted') {
          // lastInteracted is like "12 days ago" – sort numerically on the number
          const getDays = (v) => {
            const match = String(v).match(/(\d+)/);
            return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
          };
          return (getDays(a.lastInteracted) - getDays(b.lastInteracted)) * dir;
        }
        if (sort.key === 'relationship') {
          return a.relationship.localeCompare(b.relationship) * dir;
        }
        return 0;
      });
    }

    return data;
  }, [filters, lists, contactTags, sort]);

  const nameParentOn = Boolean(showColumns.role) || Boolean(showColumns.company);
  const engagementParentOn = Boolean(showColumns.lastInteraction) || Boolean(showColumns.relationship);
  const activeParents = (nameParentOn ? 1 : 0) + (engagementParentOn ? 1 : 0);
  const nameActiveChildren = (showColumns.role ? 1 : 0) + (showColumns.company ? 1 : 0);
  const engagementActiveChildren =
    (showColumns.lastInteraction ? 1 : 0) + (showColumns.relationship ? 1 : 0);


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
    if (showColumns.role) headers.push('Role');
    if (showColumns.company) headers.push('Company');
    if (showColumns.lastInteraction) headers.push('Last interaction');
    if (showColumns.lastInteraction) headers.push('Last interacted (days ago)');
    if (showColumns.relationship) headers.push('Relationship');

    const lines = [headers.join(',')];
    rows.forEach((row) => {
      const cols = [JSON.stringify(row.name)];
      if (showColumns.role) cols.push(JSON.stringify(row.role));
      if (showColumns.company) cols.push(JSON.stringify(row.company));
      if (showColumns.lastInteraction) cols.push(JSON.stringify(row.lastInteraction));
      if (showColumns.lastInteraction) cols.push(JSON.stringify(row.lastInteracted));
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

  return (
    <section className="contacts-view">
      <PageHeader title="Contacts" showMore={false} />

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
            value={filters.listId || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ listId: e.target.value })}
          >
            <option value="">All Lists</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            className="contacts-filter-select"
            value={filters.tagId || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ tagId: e.target.value })}
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
              const name = window.prompt('Save current filters as view name');
              if (name) demoStore.actions.saveContactView(name);
            }}
          >
            Save View
          </FilterButton>

          <FilterSelect
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              if (value.startsWith('del:')) {
                demoStore.actions.deleteContactView(value.slice(4));
              } else {
                demoStore.actions.applyContactView(value);
              }
            }}
          >
            <option value="">Views</option>
            {savedViews
              .filter((v) => v.scope === 'contacts')
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            {savedViews
              .filter((v) => v.scope === 'contacts')
              .map((v) => (
                <option key={`${v.id}-del`} value={`del:${v.id}`}>
                  Delete: {v.name}
                </option>
              ))}
          </FilterSelect>

          <FilterButton onClick={exportCsv}>
            Export CSV
          </FilterButton>
        </FilterControls>
      </FilterBar>

      <DataTable
        className="contacts-table-v2"
        tableClassName="contacts-table-v2-table"
        renderHeader={() => (
          <tr>
            <th>
              <div className="contacts-table-head-v2">
                <button
                  type="button"
                  style={{ all: 'unset', cursor: 'pointer', display: nameParentOn ? 'inline-flex' : 'none' }}
                  onClick={() => toggleSort('name')}
                >
                  {nameParentOn && 'Name'}
                </button>
                <button
                  type="button"
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: engagementParentOn ? 'inline-flex' : 'none',
                  }}
                  onClick={() => toggleSort('lastInteracted')}
                >
                  {engagementParentOn && 'Last interaction | Relationship status'}
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
                      className="contacts-columns-popover"
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
                        minWidth: 260,
                      }}
                    >
                      {/* Name column + children */}
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
                          disabled={activeParents === 1 && nameParentOn}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setShowColumns((prev) => ({
                              ...prev,
                              role: checked,
                              company: checked,
                            }));
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>Name</span>
                      </label>

                      {[
                        ['role', 'Role'],
                        ['company', 'Company'],
                      ].map(([key, label]) => (
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
                            disabled={
                              activeParents === 1 &&
                              nameParentOn &&
                              nameActiveChildren === 1 &&
                              showColumns[key]
                            }
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

                      {/* Last interaction | Relationship Status column + children */}
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
                          disabled={activeParents === 1 && engagementParentOn}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setShowColumns((prev) => ({
                              ...prev,
                              lastInteraction: checked,
                              relationship: checked,
                            }));
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>Last interaction | Relationship status</span>
                      </label>

                      {[
                        ['lastInteraction', 'Last interaction'],
                        ['relationship', 'Relationship status'],
                      ].map(([key, label]) => (
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
                            disabled={
                              activeParents === 1 &&
                              engagementParentOn &&
                              engagementActiveChildren === 1 &&
                              showColumns[key]
                            }
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
            </th>
          </tr>
        )}
        renderBody={() =>
          rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div
                  className="contact-row-v2 is-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    if (event.target.closest('.contact-actions-v2 button')) return;
                    setSelectedContact(row);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedContact(row);
                    }
                  }}
                >
                  <div className="contact-name-col-v2">
                    <div style={{ display: nameParentOn ? 'flex' : 'none', alignItems: 'center', gap: 16 }}>
                      <img
                        src={row.avatarUrl}
                        alt={row.name}
                        className={`contact-avatar-v2 tone-${row.signalTone}`}
                      />
                      <div className="contact-name-meta-v2">
                        <div className="contact-title-line-v2">
                          <strong>{row.name}</strong>
                          <Icon name="signal" className={`network-icon tone-${row.signalTone}`} />
                        </div>
                        {showColumns.role && <p>{row.role}</p>}
                        {showColumns.company && <p>{row.company}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="contact-interaction-col-v2">
                    <div
                      style={{
                        display: engagementParentOn ? 'flex' : 'none',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div className="contact-note-pill-v2">
                        <Icon name="note" />
                      </div>
                      <div className="contact-interaction-text-v2">
                        {showColumns.lastInteraction && (
                          <p className="contact-interaction-title-v2">{row.lastInteraction}</p>
                        )}
                        {(showColumns.lastInteraction || showColumns.relationship) && (
                          <p className="contact-interaction-sub-v2">
                            {showColumns.lastInteraction && (
                              <>
                                Last interacted <strong>{row.lastInteracted}</strong>
                              </>
                            )}
                            {showColumns.relationship && (
                              <span>
                                Relationship status <strong>{row.relationship}</strong>
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="contact-actions-v2">
                    <button
                      aria-label="new touchpoint"
                      onClick={() =>
                        setTouchpointPreset({
                          contactName: row.name,
                          company: row.company,
                          role: row.role,
                          title: `Follow up with ${row.name}`,
                          notes: '',
                          source: 'contacts:row',
                        })
                      }
                    >
                      <Icon name="docPlus" />
                    </button>
                    <button aria-label="relationship">
                      <Icon name="target" />
                    </button>
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
          <article
            key={row.id}
            className="contact-card"
            onClick={() => setSelectedContact(row)}
            role="button"
          >
            <div className="contact-card-header">
              <img
                src={row.avatarUrl}
                alt={row.name}
                className={`contact-avatar-v2 tone-${row.signalTone}`}
              />
              <div className="contact-card-main">
                <strong>{row.name}</strong>
                <div className="contact-card-meta">
                  <span>{row.role}</span>
                  {' • '}
                  <span>{row.company}</span>
                </div>
                <div className="contact-card-meta">
                  Last interacted <strong>{row.lastInteracted}</strong> · Relationship{' '}
                  <strong>{row.relationship}</strong>
                </div>
              </div>
            </div>
            <div className="contact-card-actions">
              <button
                aria-label="new touchpoint"
                onClick={(event) => {
                  event.stopPropagation();
                  setTouchpointPreset({
                    contactName: row.name,
                    company: row.company,
                    role: row.role,
                    title: `Follow up with ${row.name}`,
                    notes: '',
                    source: 'contacts:card',
                  });
                }}
              >
                <Icon name="docPlus" />
              </button>
              <button
                aria-label="relationship"
                onClick={(event) => {
                  event.stopPropagation();
                  setNoteForContact(row);
                }}
              >
                <Icon name="listPlus" />
              </button>
            </div>
          </article>
        ))}
      </section>

      {selectedContact && (
        <div className="modal-backdrop" onClick={() => setSelectedContact(null)}>
          <div className="company-modal contact-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>{selectedContact.name}</h2>
              <button className="modal-close" onClick={() => setSelectedContact(null)} aria-label="close modal">
                x
              </button>
            </div>

            <div className="modal-grid">
              <div>
                <p className="modal-label">Contact role</p>
                <p className="modal-value">{selectedContact.role}</p>
              </div>
              <div>
                <p className="modal-label">Company</p>
                <p className="modal-value">{selectedContact.company}</p>
              </div>
              <div>
                <p className="modal-label">Relationship strength</p>
                <p className="modal-value">
                  {selectedContact.relationship} (Score {selectedContact.relationshipScore})
                </p>
              </div>
              <div>
                <p className="modal-label">Internal connections</p>
                <p className="modal-value">{selectedContact.internalConnections.join(', ')}</p>
              </div>
            </div>

            <div className="modal-stack">
              <div>
                <p className="modal-label">Relationship history</p>
                <ul className="modal-list">
                  {selectedContact.relationshipHistory.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="modal-label">Recent interactions</p>
                <ul className="modal-list">
                  {selectedContact.recentInteractions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="modal-label">Notes</p>
                <ul className="modal-list">
                  {notes
                    .filter((n) => n.contactId === selectedContact.id)
                    .map((n) => (
                      <li key={n.id}>
                        <strong>{n.type}</strong> ({n.visibility}) — {n.text}
                      </li>
                    ))}
                  {notes.filter((n) => n.contactId === selectedContact.id).length === 0 && (
                    <li>No notes yet.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="modal-actions">
              <button className="tool-btn" onClick={() => setConnectionsForContact(selectedContact)}>
                Firm connections
              </button>
              <button className="tool-btn" onClick={() => setListForContact(selectedContact)}>
                Add to list
              </button>
              <button className="tool-btn" onClick={() => setNoteForContact(selectedContact)}>
                Add note
              </button>
              <button className="tool-btn" onClick={() => setTagsForContact(selectedContact)}>
                Manage tags
              </button>
              <button
                className="primary"
                onClick={() =>
                  setTouchpointPreset({
                    contactName: selectedContact.name,
                    company: selectedContact.company,
                    role: selectedContact.role,
                    title: `Follow up with ${selectedContact.name}`,
                    notes: '',
                    source: 'contacts:modal',
                  })
                }
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

      <AddContactNoteModal contact={noteForContact} isOpen={Boolean(noteForContact)} onClose={() => setNoteForContact(null)} />
      <AddContactToListModal contact={listForContact} isOpen={Boolean(listForContact)} onClose={() => setListForContact(null)} />
      <ManageContactTagsModal contact={tagsForContact} isOpen={Boolean(tagsForContact)} onClose={() => setTagsForContact(null)} />
      <FirmConnectionsModal
        contact={connectionsForContact}
        isOpen={Boolean(connectionsForContact)}
        onClose={() => setConnectionsForContact(null)}
      />
    </section>
  );
}
