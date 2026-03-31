import { useEffect, useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import PageHeader from '../common/components/PageHeader';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import SearchBar from '../common/components/SearchBar';
import { FilterControls, FilterSelect } from '../common/components/FilterControls';
import AssignTaskModal from '../common/components/AssignTaskModal';
import MeetingBriefModal from '../common/components/MeetingBriefModal';
import { usePersona } from '../common/hooks/usePersona';
import { resolveContactAvatarUrl } from '../common/utils/avatars';
import { formatTagTaxonomyTitleAttr } from '../common/utils/tagTaxonomy';
import { buildRowSecurityScope } from '../common/utils/rowSecurityScope';
import DetailActionBar from '../common/components/DetailActionBar';
import DetailTabBar from '../common/components/DetailTabBar';
import VisitWorkflowPanel from '../common/components/VisitWorkflowPanel';

const interactionTypes = ['Email', 'Meeting', 'Event', 'Call', 'Visit'];

function avatarSrc(url) {
  return resolveContactAvatarUrl(url) || url || '';
}

function contactByName(contacts, name) {
  return contacts.find((contact) => contact.name === name);
}

function formatDueLabel(dueAtIso) {
  if (!dueAtIso) return 'Not set';
  const due = new Date(dueAtIso);
  if (Number.isNaN(due.getTime())) return 'Not set';
  return due.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' });
}

function isOverdue(touchpoint) {
  if (touchpoint.status !== 'open') return false;
  if (!touchpoint.dueAt) return false;
  const due = new Date(touchpoint.dueAt);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}

export default function TouchpointsPage({ view = '' }) {
  const [query, setQuery] = useState('');
  const [checkedRows, setCheckedRows] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [rescheduleDueAt, setRescheduleDueAt] = useState('');
  const [detailTab, setDetailTab] = useState('details');
  const [sort, setSort] = useState({ key: '', direction: '' });
  const [showColumns, setShowColumns] = useState({ contact: true, interaction: true, status: true, relationship: true });
  const contacts = useDemoStore((s) => s.contacts || []);
  const [form, setForm] = useState({ contactName: contacts[0]?.name || '', interactionType: 'Email', date: '', outcome: '', followUpDate: '', notes: '', onBehalfOf: '' });
  const rawTouchpoints = useDemoStore((s) => s.touchpoints);
  const rawTags = useDemoStore((s) => s.tags);
  const rawContactTags = useDemoStore((s) => s.contactTags);
  const touchpoints = rawTouchpoints || [];
  const tags = rawTags || [];
  const contactTags = rawContactTags || {};
  const companies = useDemoStore((s) => s.companies || []);
  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');
  const rawTouchpointNotes = useDemoStore((s) => s.touchpointNotes);
  const touchpointNotes = rawTouchpointNotes || [];
  const [newNoteText, setNewNoteText] = useState('');
  const [meetingBriefContact, setMeetingBriefContact] = useState(null);
  const [tagFilter, setTagFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('');
  const [principalFilter, setPrincipalFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');

  const { can, persona } = usePersona();
  const contactsByName = useMemo(() => new Map(contacts.map((c) => [c.name, c])), [contacts]);
  const rowScope = useMemo(
    () => buildRowSecurityScope({ personaId, companies, contacts }),
    [personaId, companies, contacts]
  );

  const principalOptions = useMemo(() => {
    const set = new Set(touchpoints.map((tp) => tp.principal).filter(Boolean));
    return Array.from(set).sort();
  }, [touchpoints]);

  const viewLower = String(view).toLowerCase();
  const isMissedView = viewLower.includes('missed');
  const isKeyContactsView = viewLower.includes('key contacts');
  const isReferralsView = viewLower.includes('referral');
  const isVisitsView = viewLower.includes('visit');

  const headerTitle = isMissedView
    ? 'Missed Touchpoints'
    : isKeyContactsView
      ? 'Key Contacts'
      : isReferralsView
        ? 'Referrals'
        : isVisitsView
          ? 'Visits'
          : 'Touchpoints';

  useEffect(() => {
    if (!contacts.length) return;
    setForm((prev) => (prev.contactName ? prev : { ...prev, contactName: contacts[0].name }));
  }, [contacts]);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    let data = touchpoints;

    // DT-07 prototype: row-level scoping aligned with persona/company/contact rules.
    data = data.filter((tp) => rowScope.canSeeTouchpoint(tp, contactsByName));

    // Sub-views (P0: Key Contacts / Referrals / Visits)
    if (isMissedView) data = data.filter(isOverdue);
    if (isKeyContactsView) {
      data = data.filter((tp) => {
        const contact = contactByName(contacts, tp.contactName);
        return Boolean(contact?.isKeyContact);
      });
    }
    if (isReferralsView) {
      data = data.filter((tp) => {
        const src = String(tp.source || '').toLowerCase();
        const title = String(tp.title || '').toLowerCase();
        return src.includes('firm-connections:request-intro') || title.includes('request intro');
      });
    }
    if (isVisitsView) {
      data = data.filter(
        (tp) =>
          Boolean(tp.visitStage) ||
          tp.interactionType === 'Visit' ||
          String(tp.title || '').toLowerCase().includes('visit') ||
          String(tp.interactionType || '').toLowerCase().includes('visit')
      );
    }

    data = data.filter((row) => {
        if (!query.trim()) return true;
        return [row.contactName, row.role, row.company, row.title, row.lastInteracted, row.relationshipStatus, row.dueAt ? formatDueLabel(row.dueAt) : '', row.interactionType, row.outcome, row.status].join(' ').toLowerCase().includes(q);
      });
    if (tagFilter) {
      data = data.filter((row) => {
        const contact = contacts.find((c) => c.name === row.contactName);
        return contact ? (contactTags[contact.id] || []).includes(tagFilter) : false;
      });
    }
    if (typeFilter) {
      data = data.filter((row) => row.interactionType === typeFilter);
    }
    if (statusFilter) {
      data = data.filter((row) => row.status === statusFilter);
    }
    if (principalFilter) {
      data = data.filter((row) => String(row.principal || '') === principalFilter);
    }
    if (assignmentFilter) {
      data = data.filter((row) =>
        assignmentFilter === 'assigned' ? Boolean(row.assignedTo) : !row.assignedTo
      );
    }
    if (dateRangeFilter) {
      const now = Date.now();
      const msPerDay = 86400000;
      data = data.filter((row) => {
        const dateStr = row.kind === 'task' ? row.dueAt : row.completedAt || row.createdAt;
        if (!dateStr) return false;
        const d = new Date(dateStr).getTime();
        if (Number.isNaN(d)) return false;
        const daysAgo = (now - d) / msPerDay;
        if (dateRangeFilter === '7d') return daysAgo <= 7;
        if (dateRangeFilter === '30d') return daysAgo <= 30;
        if (dateRangeFilter === '90d') return daysAgo <= 90;
        return true;
      });
    }
    if (sort.key && sort.direction) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      data = [...data].sort((a, b) => {
        if (sort.key === 'date') { const va = new Date(a.kind === 'task' ? a.dueAt : a.completedAt).getTime() || 0; const vb = new Date(b.kind === 'task' ? b.dueAt : b.completedAt).getTime() || 0; return (va - vb) * dir; }
        if (sort.key === 'status') return a.status.localeCompare(b.status) * dir;
        if (sort.key === 'contact') return a.contactName.localeCompare(b.contactName) * dir;
        return 0;
      });
    }
    return data;
  }, [
    query,
    touchpoints,
    view,
    sort,
    tagFilter,
    typeFilter,
    statusFilter,
    dateRangeFilter,
    principalFilter,
    assignmentFilter,
    contacts,
    contactTags,
    isMissedView,
    isKeyContactsView,
    isReferralsView,
    isVisitsView,
    rowScope,
    contactsByName,
  ]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let open = 0, overdue = 0, completedThisMonth = 0;

    let data = touchpoints;
    data = data.filter((tp) => rowScope.canSeeTouchpoint(tp, contactsByName));
    if (isMissedView) data = data.filter(isOverdue);
    if (isKeyContactsView) {
      data = data.filter((tp) => {
        const contact = contactByName(contacts, tp.contactName);
        return Boolean(contact?.isKeyContact);
      });
    }
    if (isReferralsView) {
      data = data.filter((tp) => {
        const src = String(tp.source || '').toLowerCase();
        const title = String(tp.title || '').toLowerCase();
        return src.includes('firm-connections:request-intro') || title.includes('request intro');
      });
    }
    if (isVisitsView) {
      data = data.filter(
        (tp) =>
          Boolean(tp.visitStage) ||
          tp.interactionType === 'Visit' ||
          String(tp.title || '').toLowerCase().includes('visit') ||
          String(tp.interactionType || '').toLowerCase().includes('visit')
      );
    }

    data.forEach((t) => {
      if (t.status === 'open') { open += 1; if (isOverdue(t)) overdue += 1; }
      else if (t.status === 'completed' && t.completedAt) { const d = new Date(t.completedAt); if (!Number.isNaN(d.getTime()) && d >= monthStart && d <= now) completedThisMonth += 1; }
    });
    return { open, overdue, completedThisMonth };
  }, [touchpoints, contacts, isMissedView, isKeyContactsView, isReferralsView, isVisitsView, rowScope, contactsByName]);

  const overdueTrendLabel = stats.overdue === 0 ? 'No overdue touchpoints' : stats.overdue <= 2 ? 'Light overdue load' : 'High overdue load';
  const contactParentOn = Boolean(showColumns.contact);
  const interactionParentOn = Boolean(showColumns.interaction);
  const statusParentOn = Boolean(showColumns.status) || Boolean(showColumns.relationship);
  const activeParentsCount = (contactParentOn ? 1 : 0) + (interactionParentOn ? 1 : 0) + (statusParentOn ? 1 : 0);

  function toggleSort(key) {
    setSort((prev) => { if (prev.key !== key) return { key, direction: 'asc' }; if (prev.direction === 'asc') return { key, direction: 'desc' }; return { key: '', direction: '' }; });
  }

  function exportCsv() {
    if (!rows.length || !can('export.csv')) return;
    const headers = ['Date'];
    if (showColumns.contact) headers.push('Contact', 'Role', 'Company', 'Principal', 'Assigned To');
    if (showColumns.interaction) headers.push('Interaction type', 'Title');
    if (showColumns.status) headers.push('Status', 'Relationship status');
    const lines = [headers.join(',')];
    rows.forEach((row) => {
      const dateLabel = row.kind === 'task' ? formatDueLabel(row.dueAt) : row.completedAt ? formatDueLabel(row.completedAt) : '';
      const cols = [JSON.stringify(dateLabel)];
      if (showColumns.contact) {
        cols.push(
          JSON.stringify(row.contactName),
          JSON.stringify(row.role),
          JSON.stringify(row.company),
          JSON.stringify(row.principal || ''),
          JSON.stringify(row.assignedTo || '')
        );
      }
      if (showColumns.interaction) { cols.push(JSON.stringify(row.interactionType), JSON.stringify(row.title)); }
      if (showColumns.status) { cols.push(JSON.stringify(row.status), JSON.stringify(row.relationshipStatus)); }
      lines.push(cols.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'touchpoints-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const allChecked = rows.length > 0 && rows.every((row) => checkedRows[row.id]);

  function onCreateInteraction(event) {
    event.preventDefault();
    if (!form.contactName || !form.date || !form.outcome) return;
    const selectedContact = contactByName(contacts, form.contactName);
    demoStore.actions.logInteraction({
      contactName: form.contactName, interactionType: form.interactionType,
      title: `${form.interactionType} logged for ${form.contactName}`,
      company: selectedContact?.company || 'Unknown Company', role: selectedContact?.role || 'Client Contact',
      outcome: form.outcome, notes: form.notes || 'No notes provided.', followUpDate: form.followUpDate || '',
      history: [`${form.date}: ${form.interactionType} logged - Outcome: ${form.outcome}`, ...(selectedContact?.recentInteractions || [])],
      avatarUrl: selectedContact?.avatarUrl || '', signalTone: selectedContact?.signalTone || 'blue',
      relationshipStatus: selectedContact?.relationship || 'Stable', relationshipScore: selectedContact?.relationshipScore || 50,
      lastInteracted: '0 days ago', source: 'touchpoints:log-interaction',
      onBehalfOf: form.onBehalfOf || '',
    });
    setIsLogOpen(false);
    setForm({ contactName: contacts[0]?.name || '', interactionType: 'Email', date: '', outcome: '', followUpDate: '', notes: '', onBehalfOf: '' });
  }

  return (
    <section className="touchpoints-view-v2">
      <PageHeader title={headerTitle} showMore={false} />

      <section className="filterbar touchpoints-filterbar-v2">
        <SearchBar className="touchpoints-search-v2" value={query} onChange={(value) => setQuery(value)} />
        <FilterControls className="touchpoints-toolbar-v2">
          <button className="tool-btn" onClick={() => setIsLogOpen(true)}>Log Interaction</button>
          {can('export.csv') && <button className="filter-btn" type="button" onClick={exportCsv}>Export CSV</button>}
          <FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {interactionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            <option value="Follow-up">Follow-up</option>
          </FilterSelect>
          <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </FilterSelect>
          <FilterSelect value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)}>
            <option value="">Assignment</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </FilterSelect>
          <FilterSelect value={principalFilter} onChange={(e) => setPrincipalFilter(e.target.value)}>
            <option value="">Principal</option>
            {principalOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={dateRangeFilter} onChange={(e) => setDateRangeFilter(e.target.value)}>
            <option value="">All Dates</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </FilterSelect>
          <FilterSelect value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id} title={formatTagTaxonomyTitleAttr(t)}>{t.label}</option>
            ))}
          </FilterSelect>
        </FilterControls>
      </section>

      {!isMissedView && (
        <section className="touchpoints-summary">
          <div className="touchpoints-summary-item"><p className="touchpoints-summary-label">Open</p><p className="touchpoints-summary-value">{stats.open}</p></div>
          <div className="touchpoints-summary-item"><p className="touchpoints-summary-label">Overdue</p><p className="touchpoints-summary-value">{stats.overdue}</p></div>
          <div className="touchpoints-summary-item"><p className="touchpoints-summary-label">Completed this month</p><p className="touchpoints-summary-value">{stats.completedThisMonth}</p></div>
          <div className="touchpoints-summary-item touchpoints-summary-trend"><p className="touchpoints-summary-label">Status</p><p className="touchpoints-summary-trend-text">{overdueTrendLabel}</p></div>
        </section>
      )}

      <section className="touchpoints-table-v2">
        <div className="touchpoints-table-head-v2">
          <label className="checkbox-cell-v2" aria-label="Select all touchpoints">
            <input type="checkbox" checked={allChecked} onChange={(event) => { const next = {}; rows.forEach((row) => { next[row.id] = event.target.checked; }); setCheckedRows(next); }} />
          </label>
          <button type="button" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => toggleSort('date')}>
            {String(view).toLowerCase().includes('missed') ? 'Due' : 'Date'}
          </button>
          <button type="button" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => toggleSort('contact')}>Contact</button>
          <span>Interaction | Status</span>
          <div style={{ position: 'relative' }}>
            <button className="contacts-table-settings" type="button" aria-label="settings" onClick={() => setShowColumns((prev) => ({ ...prev, _open: !prev._open }))}>
              <Icon name="settings" />
            </button>
            {showColumns._open && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 8, boxShadow: '0 10px 15px -5px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 220 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4 }}>
                  <input type="checkbox" checked={contactParentOn} disabled={activeParentsCount === 1 && contactParentOn} onChange={(e) => setShowColumns((p) => ({ ...p, contact: e.target.checked }))} />
                  <span style={{ fontWeight: 600 }}>Contact</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, margin: '8px 0 4px' }}>
                  <input type="checkbox" checked={interactionParentOn} disabled={activeParentsCount === 1 && interactionParentOn} onChange={(e) => setShowColumns((p) => ({ ...p, interaction: e.target.checked }))} />
                  <span style={{ fontWeight: 600 }}>Interaction</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, margin: '8px 0 4px' }}>
                  <input type="checkbox" checked={statusParentOn} disabled={activeParentsCount === 1 && statusParentOn} onChange={(e) => { const c = e.target.checked; setShowColumns((p) => ({ ...p, status: c, relationship: c })); }} />
                  <span style={{ fontWeight: 600 }}>Status | Relationship</span>
                </label>
                {[['status', 'Status'], ['relationship', 'Relationship status']].map(([key, label]) => {
                  const activeStatusChildren = (showColumns.status ? 1 : 0) + (showColumns.relationship ? 1 : 0);
                  return (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 4, paddingLeft: 20 }}>
                      <input type="checkbox" checked={Boolean(showColumns[key])} disabled={statusParentOn && activeStatusChildren === 1 && showColumns[key] && activeParentsCount === 1} onChange={(e) => setShowColumns((p) => ({ ...p, [key]: e.target.checked }))} />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="touchpoints-table-body-v2">
          {rows.map((row) => (
            <div className="touchpoint-row-v2 is-clickable" key={row.id} onClick={() => setSelectedRow(row)} role="button" tabIndex={0}>
              <label className="checkbox-cell-v2" aria-label={`Select ${row.contactName}`} onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={Boolean(checkedRows[row.id])} onChange={(event) => setCheckedRows((prev) => ({ ...prev, [row.id]: event.target.checked }))} />
              </label>
              <div className="touchpoint-date-v2">
                <span>{row.kind === 'task' ? formatDueLabel(row.dueAt) : row.completedAt ? formatDueLabel(row.completedAt) : '—'}</span>
                {isOverdue(row) && <span className="tp-pill tp-pill-overdue" aria-label="Overdue touchpoint">Overdue</span>}
              </div>
              {showColumns.contact && (
                <div className="touchpoint-contact-col-v2">
                  <img src={avatarSrc(row.avatarUrl)} alt={row.contactName} className={`contact-avatar-v2 tone-${row.signalTone}`} />
                  <div className="touchpoint-contact-meta-v2">
                    <div className="contact-title-line-v2"><strong>{row.contactName}</strong><Icon name="signal" className={`network-icon tone-${row.signalTone}`} /></div>
                    <p>{row.role}</p>
                    <p>{row.company}</p>
                    {row.principal && <p style={{ fontSize: 11, color: '#6b7280' }}>Principal: <strong>{row.principal}</strong></p>}
                    {row.assignedTo && <p style={{ fontSize: 11, color: '#6b7280' }}>Assigned to: <strong>{row.assignedTo}</strong></p>}
                    {row.onBehalfOf && <p style={{ fontSize: 11, color: '#6b7280' }}>On behalf of: <strong>{row.onBehalfOf}</strong></p>}
                  </div>
                </div>
              )}
              {showColumns.interaction || showColumns.status || showColumns.relationship ? (
                <div className="touchpoint-interaction-col-v2">
                  <div className="touchpoint-note-pill-v2"><Icon name="note" /></div>
                  <div className="touchpoint-interaction-text-v2">
                    {showColumns.interaction && <p className="touchpoint-interaction-title-v2">[{row.interactionType}] {row.title}</p>}
                    {(showColumns.status || showColumns.relationship) && (
                      <p className="touchpoint-interaction-sub-v2">
                        {showColumns.status && <span className="tp-pill tp-pill-status" data-status={row.status}>{row.status === 'open' ? 'Open' : row.status === 'completed' ? 'Completed' : row.status === 'cancelled' ? 'Cancelled' : row.status}</span>}
                        {showColumns.relationship && <span className="tp-pill tp-pill-relationship">Relationship <strong>{row.relationshipStatus}</strong></span>}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="touchpoints-cards">
        {rows.map((row) => (
          <article key={row.id} className="touchpoint-card" role="button" tabIndex={0} onClick={() => setSelectedRow(row)}>
            <header className="touchpoint-card-header">
              <div className="touchpoint-card-date">
                <span className="touchpoint-card-date-label">{row.kind === 'task' ? 'Due' : 'Date'}</span>
                <span className="touchpoint-card-date-value">{row.kind === 'task' ? formatDueLabel(row.dueAt) : row.completedAt ? formatDueLabel(row.completedAt) : '—'}</span>
                {isOverdue(row) && <span className="tp-pill tp-pill-overdue">Overdue</span>}
              </div>
              <div className="touchpoint-card-contact">
                <img src={avatarSrc(row.avatarUrl)} alt={row.contactName} className={`contact-avatar-v2 tone-${row.signalTone}`} />
                <div className="touchpoint-card-contact-meta">
                  <strong>{row.contactName}</strong>
                  <p>{row.role}</p><p>{row.company}</p>
                  {row.principal && <p style={{ fontSize: 11, color: '#6b7280' }}>Principal: {row.principal}</p>}
                  {row.assignedTo && <p style={{ fontSize: 11, color: '#6b7280' }}>Assigned to: {row.assignedTo}</p>}
                </div>
              </div>
            </header>
            <div className="touchpoint-card-body">
              <p className="touchpoint-card-title">[{row.interactionType}] {row.title}</p>
              <p className="touchpoint-card-status-row">
                <span className="tp-pill tp-pill-status" data-status={row.status}>{row.status === 'open' ? 'Open' : row.status === 'completed' ? 'Completed' : row.status === 'cancelled' ? 'Cancelled' : row.status}</span>
                <span className="tp-pill tp-pill-relationship">Relationship <strong>{row.relationshipStatus}</strong></span>
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Touchpoint Detail Modal */}
      {selectedRow && (() => {
        const tpNotes = touchpointNotes.filter((n) => n.touchpointId === selectedRow.id);
        const detailTabs = [
          { id: 'details', label: 'Details' },
          { id: 'history', label: 'History', count: (selectedRow.history || []).length },
          { id: 'notes', label: 'Notes', count: tpNotes.length + (selectedRow.notes ? 1 : 0) },
        ];
        const detailActions = [
          ...(selectedRow.kind === 'task' ? [
            { label: 'Complete', icon: 'check', onClick: () => { demoStore.actions.completeTouchpoint(selectedRow.id); setSelectedRow((p) => p ? { ...p, status: 'completed' } : p); }, disabled: selectedRow.status !== 'open' },
            { label: 'Cancel', icon: 'x', onClick: () => { demoStore.actions.cancelTouchpoint(selectedRow.id); setSelectedRow((p) => p ? { ...p, status: 'cancelled' } : p); }, disabled: selectedRow.status !== 'open' },
          ] : []),
          ...(can('touchpoint.assign') ? [
            { divider: true },
            { label: 'Assign / Principal', icon: 'user', onClick: () => { setAssignTarget(selectedRow); setSelectedRow(null); } },
            {
              label: 'Clear Assignment',
              icon: 'x',
              disabled: !selectedRow.assignedTo && !selectedRow.principal && !selectedRow.onBehalfOf,
              onClick: () => {
                demoStore.actions.assignTouchpoint(selectedRow.id, {
                  assignedTo: '',
                  assignedBy: '',
                  principal: '',
                  onBehalfOf: '',
                });
                setSelectedRow((p) =>
                  p
                    ? { ...p, assignedTo: '', assignedBy: '', principal: '', onBehalfOf: '' }
                    : p
                );
              },
            },
          ] : []),
          { divider: true },
          {
            label: 'Meeting brief',
            icon: 'note',
            onClick: () => {
              const c = contacts.find((x) => x.name === selectedRow.contactName);
              setMeetingBriefContact(
                c || {
                  id: '',
                  name: selectedRow.contactName,
                  role: selectedRow.role || '',
                  company: selectedRow.company || '',
                  lastInteraction:
                    selectedRow.kind === 'task'
                      ? `Open task: ${selectedRow.title}`
                      : selectedRow.title || '',
                  relationship: selectedRow.relationshipStatus || 'Stable',
                  internalConnections: [],
                }
              );
              setSelectedRow(null);
            },
          },
          { label: 'Add Note', icon: 'note', onClick: () => setDetailTab('notes') },
        ];
        return (
          <div className="modal-backdrop" onClick={() => setSelectedRow(null)}>
            <div className="company-modal company-modal--md" onClick={(event) => event.stopPropagation()}>
              {/* Header */}
              <div className="detail-header" style={{ padding: '16px 16px 0' }}>
                <img src={avatarSrc(selectedRow.avatarUrl)} alt={selectedRow.contactName} className={`detail-header-avatar tone-${selectedRow.signalTone}`} />
                <div className="detail-header-info">
                  <h2>{selectedRow.contactName}</h2>
                  <p>{selectedRow.role} • {selectedRow.company}</p>
                  <p style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span className="tp-pill tp-pill-status" data-status={selectedRow.status}>{selectedRow.status}</span>
                    <span className="tp-pill tp-pill-relationship">Relationship <strong>{selectedRow.relationshipStatus}</strong></span>
                    {selectedRow.principal && (
                      <span className="tp-pill tp-pill-relationship">
                        Principal <strong>{selectedRow.principal}</strong>
                      </span>
                    )}
                    {selectedRow.assignedTo && (
                      <span className="tp-pill tp-pill-status">
                        Assigned <strong>{selectedRow.assignedTo}</strong>
                      </span>
                    )}
                  </p>
                </div>
                <button className="modal-close" onClick={() => setSelectedRow(null)} aria-label="close modal">x</button>
              </div>

              {/* Action bar */}
              <div style={{ padding: '0 16px' }}>
                <DetailActionBar actions={detailActions} />
              </div>

              {/* Tab bar */}
              <div style={{ padding: '0 16px' }}>
                <DetailTabBar tabs={detailTabs} activeTab={detailTab} onTabChange={setDetailTab} />
              </div>

              {/* Tab content */}
              <div style={{ padding: 16, maxHeight: 400, overflowY: 'auto' }}>
                {detailTab === 'details' && (
                  <div className="modal-grid">
                    <div><p className="modal-label">Interaction type</p><p className="modal-value">{selectedRow.interactionType}</p></div>
                    <div><p className="modal-label">Status</p><p className="modal-value">{selectedRow.status}</p></div>
                    <div><p className="modal-label">Outcome</p><p className="modal-value">{selectedRow.outcome || '—'}</p></div>
                    <div><p className="modal-label">{selectedRow.kind === 'task' ? 'Due date' : 'Completed'}</p><p className="modal-value">{selectedRow.kind === 'task' ? formatDueLabel(selectedRow.dueAt) : formatDueLabel(selectedRow.completedAt)}</p></div>
                    {selectedRow.principal && <div><p className="modal-label">Principal</p><p className="modal-value">{selectedRow.principal}</p></div>}
                    {selectedRow.assignedTo && <div><p className="modal-label">Assigned to</p><p className="modal-value">{selectedRow.assignedTo}</p></div>}
                    {selectedRow.assignedBy && <div><p className="modal-label">Assigned by</p><p className="modal-value">{selectedRow.assignedBy}</p></div>}
                    {selectedRow.onBehalfOf && <div><p className="modal-label">On behalf of</p><p className="modal-value">{selectedRow.onBehalfOf}</p></div>}
                    <VisitWorkflowPanel
                      touchpoint={selectedRow}
                      onUpdated={() =>
                        setSelectedRow((p) => {
                          if (!p) return p;
                          const t = demoStore.getState().touchpoints.find((x) => x.id === p.id);
                          return t ? { ...t } : p;
                        })
                      }
                    />
                    {selectedRow.kind === 'task' && selectedRow.status === 'open' && (
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                        <p className="modal-label" style={{ margin: 0 }}>Reschedule</p>
                        <input value={rescheduleDueAt} onChange={(e) => setRescheduleDueAt(e.target.value)} placeholder="YYYY-MM-DD" style={{ border: '1px solid #d4d4d4', borderRadius: 8, padding: '6px 10px', fontSize: 13, flex: 1 }} />
                        <button className="detail-action-btn primary" type="button" onClick={() => { const iso = rescheduleDueAt ? new Date(`${rescheduleDueAt}T09:00:00`).toISOString() : null; if (!iso) return; demoStore.actions.rescheduleTouchpoint(selectedRow.id, iso); setSelectedRow((p) => p ? { ...p, dueAt: iso, status: 'open' } : p); setRescheduleDueAt(''); }}>Save</button>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'history' && (
                  <div>
                    {(selectedRow.history || []).length === 0 ? (
                      <p style={{ color: '#6b7280', fontSize: 13 }}>No interaction history.</p>
                    ) : (
                      <ul className="modal-list">
                        {(selectedRow.history || []).map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {detailTab === 'notes' && (
                  <div>
                    {tpNotes.length === 0 && !selectedRow.notes && <p style={{ color: '#6b7280', fontSize: 13 }}>No notes yet.</p>}
                    <ul className="modal-list">
                      {selectedRow.notes && <li key="inline-note"><strong>Original note</strong> — {selectedRow.notes}</li>}
                      {tpNotes.map((note) => (
                        <li key={note.id}><strong>{note.author}</strong> — {new Date(note.createdAt).toLocaleDateString()} <br />{note.text}</li>
                      ))}
                    </ul>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea rows={3} placeholder="Add a note about this touchpoint..." value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} style={{ width: '100%', borderRadius: 8, border: '1px solid #d4d4d4', padding: '8px 10px', fontSize: 13 }} />
                      <button type="button" className="detail-action-btn primary" style={{ alignSelf: 'flex-start' }} disabled={!newNoteText.trim()} onClick={() => { const text = newNoteText.trim(); if (!text) return; demoStore.actions.addTouchpointNote({ touchpointId: selectedRow.id, text }); setNewNoteText(''); }}>Add note</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Log Interaction Modal */}
      {isLogOpen && (
        <div className="modal-backdrop" onClick={() => setIsLogOpen(false)}>
          <div className="company-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head"><h2>Log Interaction</h2><button className="modal-close" onClick={() => setIsLogOpen(false)} aria-label="close">x</button></div>
            <form className="touchpoint-form" onSubmit={onCreateInteraction}>
              <label>Contact<select value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}>{contacts.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></label>
              <label>Interaction Type<select value={form.interactionType} onChange={(e) => setForm((p) => ({ ...p, interactionType: e.target.value }))}>{interactionTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
              <label>Date<input type="text" placeholder="MM/DD/YY" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></label>
              <label>Outcome<input value={form.outcome} onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))} placeholder="Outcome summary" /></label>
              <label>Follow-up Date<input type="text" placeholder="MM/DD/YY" value={form.followUpDate} onChange={(e) => setForm((p) => ({ ...p, followUpDate: e.target.value }))} /></label>
              <label>Notes<textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} /></label>
              {persona?.id === 'legal-assistant' && (
                <label>
                  On behalf of
                  <input
                    value={form.onBehalfOf}
                    onChange={(e) => setForm((p) => ({ ...p, onBehalfOf: e.target.value }))}
                    placeholder="Assigned lawyer"
                  />
                </label>
              )}
              <div className="modal-actions">
                <button type="button" className="tool-btn" onClick={() => setIsLogOpen(false)}>Cancel</button>
                <button type="submit" className="primary">Save Interaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AssignTaskModal touchpoint={assignTarget} isOpen={Boolean(assignTarget)} onClose={() => setAssignTarget(null)} />
      <MeetingBriefModal
        contact={meetingBriefContact}
        isOpen={Boolean(meetingBriefContact)}
        onClose={() => setMeetingBriefContact(null)}
      />
    </section>
  );
}
