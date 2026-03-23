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

export default function ListsPage() {
  const [query, setQuery] = useState('');
  const [checkedRows, setCheckedRows] = useState({});
  const [selectedListId, setSelectedListId] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [showCreateList, setShowCreateList] = useState(false);
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

  const { can, field, tier } = usePersona();

  const rows = useMemo(() => {
    let data = lists;

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
  }, [lists, query, tagFilter, typeFilter, visibilityFilter, ownerFilter, field]);

  const allChecked = rows.length > 0 && rows.every((row) => checkedRows[row.id]);
  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) || null : null;
  const selectedMembersRaw = selectedList ? contacts.filter((c) => Array.isArray(selectedList.memberIds) && selectedList.memberIds.includes(c.id)) : [];
  const selectedMembers = memberSearch.trim()
    ? selectedMembersRaw.filter((m) => [m.name, m.role, m.company, m.city].join(' ').toLowerCase().includes(memberSearch.toLowerCase()))
    : selectedMembersRaw;
  const selectedListNotes = selectedList ? listNotes.filter((n) => n.listId === selectedList.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) : [];
  const isDetailView = Boolean(selectedList);

  return (
    <section className="lists-view-v2">
      {!isDetailView && (
        <>
          <PageHeader title="Lists" showMore={false} right={
            can('list.create') ? <button className="primary" style={{ fontSize: 13 }} onClick={() => setShowCreateList(true)}>+ Create List</button> : null
          } />

          <FilterBar className="lists-filterbar-v2">
            <div className="search-with-filter">
              <SearchBar className="lists-search-v2" value={query} onChange={(value) => setQuery(value)} />
              <FilterViewButton />
            </div>
            <FilterControls>
              <FilterSelect value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="lists-tag-filter">
                <option value="">All Tags</option>
                {tags.map((t) => <option key={t.id} value={t.label}>{t.label}</option>)}
              </FilterSelect>
              <FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {[...new Set(lists.map((l) => l.type))].filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
              </FilterSelect>
              <FilterSelect value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
                <option value="">All Visibility</option>
                <option value="Firm-wide">Firm-wide</option>
                <option value="Shared">Shared</option>
                <option value="Personal">Personal</option>
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
                          {row.visibility || 'Firm-wide'}
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
                      <div className="list-card-meta">Visibility <strong>{row.visibility || 'Firm-wide'}</strong></div>
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
          ...(selectedList.type === 'Event-based' ? [{ label: 'Pull Through Follow-ups', icon: 'send', onClick: () => window.alert('Event pull-through: Creating follow-up touchpoints for all attendees...') }] : []),
          ...(can('list.create') ? [{ label: 'Edit', onClick: () => window.alert('Edit list coming soon') }] : []),
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
                  <div><p className="modal-label">Visibility</p><p className="modal-value">{selectedList.visibility || 'Firm-wide'}</p></div>
                </section>

                {field('marketingActivity') && selectedList.marketingActivity?.length > 0 && (
                  <section style={{ marginTop: 16 }}>
                    <p className="modal-label">Marketing Activity</p>
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
                          <div className="list-member-summary">Recent engagement summary placeholder</div>
                          <div className="list-member-actions">
                            <button aria-label="open contact"><Icon name="user" /></button>
                            <button aria-label="add touchpoint"><Icon name="docPlus" /></button>
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
    </section>
  );
}
