import { useMemo, useState } from 'react';
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
import TripPlanningModal from '../common/components/TripPlanningModal';
import ContactDetailModal from '../common/components/ContactDetailModal';
import SubTabBar from '../common/components/SubTabBar';
import RelationshipScoreGauge from '../common/components/RelationshipScoreGauge';
import { usePersona } from '../common/hooks/usePersona';
import { BADGE_MAP } from '../common/constants/badges';
import { resolveContactAvatarUrl } from '../common/utils/avatars';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterButton, FilterControls, FilterSelect } from '../common/components/FilterControls';
import DataTable from '../common/components/DataTable';

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
  const [showTripPlanning, setShowTripPlanning] = useState(false);
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

  const { can, field, depth } = usePersona();

  function avatarSrc(row) {
    return resolveContactAvatarUrl(row.avatarUrl) || row.avatarUrl;
  }

  const rows = useMemo(() => {
    let data = contacts;

    // Sub-tab filtering
    if (activeTab === 'My Contacts') {
      data = data.filter((c) => c.ownerId === 'current-user');
    } else if (activeTab === 'Key Contacts') {
      data = data.filter((c) => c.isKeyContact);
    }
    // 'Firm Contacts' shows all

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
  }, [contacts, filters, lists, contactTags, sort, activeTab, lastInteractedFilter]);

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
    return (
      <span style={{ display: 'inline-flex', gap: 4, marginLeft: 6 }}>
        {contact.isKeyContact && (
          <span title="Key Contact" style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
        )}
        {contact.isAlumni && field('alumni.flag') && (
          <span style={{
            display: 'inline-flex', padding: '1px 6px', borderRadius: 10,
            fontSize: 10, fontWeight: 600, background: '#dbeafe', color: '#2563eb',
          }}>Alumni</span>
        )}
      </span>
    );
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
            {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </FilterSelect>
          <FilterSelect
            className="contacts-filter-select"
            value={filters.tagId || ''}
            onChange={(e) => demoStore.actions.setContactFilters({ tagId: e.target.value })}
          >
            <option value="">All Tags</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
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
                      </div>
                    </div>
                  </div>

                  <div className="contact-actions-v2">
                    <button aria-label="new touchpoint" onClick={() => setTouchpointPreset({ contactName: row.name, company: row.company, role: row.role, title: `Follow up with ${row.name}`, notes: '', source: 'contacts:row' })}>
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
                {renderBadges(row)}
              </div>
            </div>
            <div className="contact-card-actions">
              <button aria-label="new touchpoint" onClick={(e) => { e.stopPropagation(); setTouchpointPreset({ contactName: row.name, company: row.company, role: row.role, title: `Follow up with ${row.name}`, notes: '', source: 'contacts:card' }); }}>
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
        onCreateTouchpoint={(c) => setTouchpointPreset({ contactName: c.name, company: c.company, role: c.role, title: `Follow up with ${c.name}`, notes: '', source: 'contacts:modal' })}
        onAddNote={(c) => setNoteForContact(c)}
        onAddToList={(c) => setListForContact(c)}
        onManageTags={(c) => setTagsForContact(c)}
        onFirmConnections={(c) => setConnectionsForContact(c)}
        onDraftOutreach={(c) => setShowAiDraft(c)}
        onAiSummary={(c) => setShowAiSummary(c)}
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
      <AiDraftPanel isOpen={Boolean(showAiDraft)} contactName={showAiDraft?.name} contactEmail={showAiDraft?.email} companyName={showAiDraft?.company} onClose={() => setShowAiDraft(null)} />
      <AiNoteSummaryPanel isOpen={Boolean(showAiSummary)} contactName={showAiSummary?.name} contactId={showAiSummary?.id} onClose={() => setShowAiSummary(null)} />
    </section>
  );
}
