import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterButton, FilterControls, FilterSelect } from '../common/components/FilterControls';
import FilterViewButton from '../common/components/FilterViewButton';

export default function ListsPage() {
  const [query, setQuery] = useState('');
  const [checkedRows, setCheckedRows] = useState({});
  const [selectedListId, setSelectedListId] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [showColumns, setShowColumns] = useState({
    name: true,
    owner: true,
    tag: true,
    visibility: true,
  });
  const lists = useDemoStore((s) => s.lists || []);
  const rawTags = useDemoStore((s) => s.tags);
  const contacts = useDemoStore((s) => s.contacts || []);
  const listNotes = useDemoStore((s) => s.listNotes || []);
  const touchpoints = useDemoStore((s) => s.touchpoints || []);
  const currentRole = useDemoStore((s) => s.currentRole || 'Partner');
  const [tagFilter, setTagFilter] = useState('');
  const tags = rawTags || [];
  const actions = demoStore.actions;

  const rows = useMemo(() => {
    const roleFiltered =
      currentRole === 'Partner'
        ? lists.filter((row) => (row.visibility || 'Firm-wide') !== 'Personal')
        : lists;

    const tagFiltered = tagFilter ? roleFiltered.filter((row) => row.tag === tagFilter) : roleFiltered;

    if (!query.trim()) return tagFiltered;
    const q = query.toLowerCase();
    return tagFiltered.filter((row) =>
      [row.name, row.owner, row.tag, row.lastEngagement].join(' ').toLowerCase().includes(q)
    );
  }, [currentRole, lists, query, tagFilter]);

  const allChecked = rows.length > 0 && rows.every((row) => checkedRows[row.id]);

  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) || null : null;
  const selectedMembers = selectedList
    ? contacts.filter((c) => Array.isArray(selectedList.memberIds) && selectedList.memberIds.includes(c.id))
    : [];
  const selectedListNotes = selectedList
    ? listNotes.filter((n) => n.listId === selectedList.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    : [];

  const isDetailView = Boolean(selectedList);

  return (
    <section className="lists-view-v2">
      {!isDetailView && (
        <>
          <PageHeader title="Lists" showMore={false} />

          <FilterBar className="lists-filterbar-v2">
            <div className="search-with-filter">
              <SearchBar
                className="lists-search-v2"
                value={query}
                onChange={(value) => setQuery(value)}
              />
              <FilterViewButton />
            </div>
            <FilterControls>
              <FilterSelect
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="lists-tag-filter"
              >
                <option value="">All Tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </FilterSelect>
            </FilterControls>
          </FilterBar>

          <section className="lists-table-v2">
            <div className="lists-table-head-v2">
              <label className="checkbox-cell-v2" aria-label="Select all lists">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(event) => {
                    const next = {};
                    rows.forEach((row) => {
                      next[row.id] = event.target.checked;
                    });
                    setCheckedRows(next);
                  }}
                />
              </label>
              <span>List</span>
              <span>Owner</span>
              <span>Tag</span>
              <span>Visibility</span>
              <span>Actions</span>
              <div style={{ position: 'relative' }}>
                <button
                  className="contacts-table-settings"
                  aria-label="settings"
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
                      minWidth: 200,
                    }}
                  >
                    {[
                      ['name', 'Name'],
                      ['owner', 'Owner'],
                      ['tag', 'Tag'],
                      ['visibility', 'Visibility'],
                    ].map(([key, label]) => {
                      const visibleCount =
                        (showColumns.name ? 1 : 0) +
                        (showColumns.owner ? 1 : 0) +
                        (showColumns.tag ? 1 : 0) +
                        (showColumns.visibility ? 1 : 0);
                      const isLastVisible = visibleCount === 1 && showColumns[key];
                      return (
                        <label
                          key={key}
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
                            checked={Boolean(showColumns[key])}
                            disabled={isLastVisible}
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

            <div className="lists-table-body-v2">
              {rows.map((row) => {
                const memberCount =
                  Array.isArray(row.memberIds) && row.memberIds.length ? row.memberIds.length : row.members || 0;
                return (
                  <div
                    className="list-row-v2"
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      if (event.target.closest('input') || event.target.closest('.list-actions-v2 button')) return;
                      setSelectedListId(row.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedListId(row.id);
                      }
                    }}
                  >
                    <label className="checkbox-cell-v2" aria-label={`Select ${row.name}`}>
                      <input
                        type="checkbox"
                        checked={Boolean(checkedRows[row.id])}
                        onChange={(event) =>
                          setCheckedRows((prev) => ({
                            ...prev,
                            [row.id]: event.target.checked,
                          }))
                        }
                      />
                    </label>

                    {showColumns.name && (
                      <div className="list-main-col-v2">
                        <div className={`list-avatar-v2 ${row.color}`}>{row.initials}</div>
                        <div className="list-main-meta-v2">
                          <strong>{row.name}</strong>
                          <p>
                            Members <strong>{memberCount}</strong>
                            <span>
                              Last engagement <strong>{row.lastEngagement}</strong>
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {showColumns.owner && <div className="list-owner-v2">{row.owner}</div>}

                    {showColumns.tag && (
                      <div className="list-tag-v2">
                        <span>{row.tag}</span>
                      </div>
                    )}

                    {showColumns.visibility && (
                      <div className="list-visibility-v2">
                        <span>{row.visibility || 'Firm-wide'}</span>
                      </div>
                    )}

                    <div className="list-actions-v2">
                      <button aria-label="relationship">
                        <Icon name="target" />
                      </button>
                      <button aria-label="more actions">
                        <Icon name="listPlus" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lists-cards">
            {rows.map((row) => {
              const memberCount =
                Array.isArray(row.memberIds) && row.memberIds.length ? row.memberIds.length : row.members || 0;

              return (
                <article
                  key={row.id}
                  className="list-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedListId(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedListId(row.id);
                    }
                  }}
                >
                  <div className="list-card-header">
                    <div className={`list-avatar-v2 ${row.color}`}>{row.initials}</div>
                    <div className="list-card-main">
                      <strong>{row.name}</strong>
                      <div className="list-card-meta">
                        <span>{row.owner}</span>
                        {' • '}
                        <span>{row.tag}</span>
                      </div>
                      <div className="list-card-meta">
                        Members <strong>{memberCount}</strong>
                        {' • '}
                        Last engagement <strong>{row.lastEngagement}</strong>
                      </div>
                      <div className="list-card-meta">
                        Visibility <strong>{row.visibility || 'Firm-wide'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="list-card-actions">
                    <button
                      aria-label="open list"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedListId(row.id);
                      }}
                    >
                      <Icon name="target" />
                    </button>
                    <button
                      aria-label="add note"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedListId(row.id);
                      }}
                    >
                      <Icon name="listPlus" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {isDetailView && selectedList && (
        <section className="list-detail-page">
          <header className="list-detail-header">
            <button type="button" className="filter-btn list-detail-back" onClick={() => setSelectedListId(null)}>
              ← Back to lists
            </button>
            <div className="list-detail-title">
              <div className={`list-avatar-v2 ${selectedList.color}`}>{selectedList.initials}</div>
              <div>
                <h1>{selectedList.name}</h1>
                <p className="list-detail-subtitle">
                  {selectedMembers.length} members • Last engagement {selectedList.lastEngagement}
                </p>
              </div>
            </div>
            <div className="list-detail-header-meta">
              <div>
                <p className="modal-label">Primary tag</p>
                <p className="modal-value">{selectedList.tag}</p>
              </div>
              <div>
                <p className="modal-label">Visibility</p>
                <p className="modal-value">{selectedList.visibility || 'Firm-wide'}</p>
              </div>
            </div>
          </header>

          <div className="list-detail-grid">
            <section className="list-detail-summary">
              <div>
                <p className="modal-label">List owner</p>
                <p className="modal-value">{selectedList.owner}</p>
              </div>
              <div>
                <p className="modal-label">List type</p>
                <p className="modal-value">{selectedList.type}</p>
              </div>
              <div>
                <p className="modal-label">Date created</p>
                <p className="modal-value">{selectedList.createdAt}</p>
              </div>
            </section>

            <section className="list-detail-members">
              <p className="modal-label">Members</p>
              <div className="list-members-table">
                <div className="list-members-head">
                  <span>Contact</span>
                  <span>Status</span>
                  <span>Summary</span>
                  <span>Actions</span>
                </div>
                <div className="list-members-body">
                  {selectedMembers.map((member) => {
                    const memberTouchpoints = touchpoints.filter((tp) => tp.contactName === member.name);
                    const hasOpenTask = memberTouchpoints.some(
                      (tp) => tp.kind === 'task' && tp.status === 'open'
                    );
                    const hasCompletedInteraction = memberTouchpoints.some((tp) => tp.kind === 'interaction');
                    const hasEventCompleted = memberTouchpoints.some(
                      (tp) => tp.kind === 'interaction' && tp.interactionType === 'Event'
                    );

                    let status = 'Invited';
                    if (hasEventCompleted) {
                      status = 'Attended';
                    } else if (hasCompletedInteraction) {
                      status = 'Confirmed';
                    } else if (hasOpenTask) {
                      status = 'Invited';
                    }

                    return (
                      <div className="list-member-row" key={member.id}>
                        <div className="list-member-contact">
                          <div className="avatar">
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div className="list-member-meta">
                            <strong>{member.name}</strong>
                            <p>
                              {member.title} • {member.company}
                            </p>
                          </div>
                        </div>
                        <div className="list-member-status">{status}</div>
                        <div className="list-member-summary">Recent engagement summary placeholder</div>
                        <div className="list-member-actions">
                          <button aria-label="open contact">
                            <Icon name="user" />
                          </button>
                          <button aria-label="add touchpoint">
                            <Icon name="docPlus" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="list-detail-notes">
              <p className="modal-label">List notes</p>
              {selectedListNotes.length === 0 ? (
                <p className="modal-value">No notes yet for this list.</p>
              ) : (
                <ul className="modal-list">
                  {selectedListNotes.map((note) => (
                    <li key={note.id}>
                      <strong>{note.author}</strong> — {new Date(note.createdAt).toLocaleDateString()} <br />
                      {note.text}
                    </li>
                  ))}
                </ul>
              )}
              <div className="list-note-add">
                <textarea
                  rows={3}
                  className="list-note-textarea"
                  placeholder="Add a shared note about this list or event..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                />
                <button
                  type="button"
                  className="filter-btn"
                  disabled={!newNoteText.trim()}
                  onClick={() => {
                    const text = newNoteText.trim();
                    if (!text) return;
                    actions.addListNote({ listId: selectedList.id, text });
                    setNewNoteText('');
                  }}
                >
                  Add note
                </button>
              </div>
            </section>
          </div>
        </section>
      )}
    </section>
  );
}
