import { useEffect, useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import PageHeader from '../common/components/PageHeader';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import SearchBar from '../common/components/SearchBar';
import { FilterControls, FilterSelect } from '../common/components/FilterControls';

const interactionTypes = ['Email', 'Meeting', 'Event', 'Call', 'Visit'];

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
  const [rescheduleDueAt, setRescheduleDueAt] = useState('');
  const [sort, setSort] = useState({ key: '', direction: '' });
  const [showColumns, setShowColumns] = useState({
    contact: true,
    interaction: true,
    status: true,
    relationship: true,
  });
  const contacts = useDemoStore((s) => s.contacts || []);
  const [form, setForm] = useState({
    contactName: contacts[0]?.name || '',
    interactionType: 'Email',
    date: '',
    outcome: '',
    followUpDate: '',
    notes: '',
  });

  const rawTouchpoints = useDemoStore((s) => s.touchpoints);
  const rawTags = useDemoStore((s) => s.tags);
  const rawContactTags = useDemoStore((s) => s.contactTags);
  const rawCompanyTags = useDemoStore((s) => s.companyTags);
  const touchpoints = rawTouchpoints || [];
  const tags = rawTags || [];
  const contactTags = rawContactTags || {};
  const companyTags = rawCompanyTags || {};
  const rawTouchpointNotes = useDemoStore((s) => s.touchpointNotes);
  const touchpointNotes = rawTouchpointNotes || [];
  const [newNoteText, setNewNoteText] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    // If seed/state loads after the first render, ensure the modal default is populated.
    if (!contacts.length) return;
    setForm((prev) => (prev.contactName ? prev : { ...prev, contactName: contacts[0].name }));
  }, [contacts]);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    const isMissedView = String(view).toLowerCase().includes('missed');

    let data = touchpoints
      .filter((t) => {
        if (!isMissedView) return true;
        return isOverdue(t);
      })
      .filter((row) => {
        if (!query.trim()) return true;
        return [
          row.contactName,
          row.role,
          row.company,
          row.title,
          row.lastInteracted,
          row.relationshipStatus,
          row.dueAt ? formatDueLabel(row.dueAt) : '',
          row.interactionType,
          row.outcome,
          row.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q);
      });

    if (tagFilter) {
      data = data.filter((row) => {
        const contact = contacts.find((c) => c.name === row.contactName);
        const contactTagIds = contact ? contactTags[contact.id] || [] : [];
        return contactTagIds.includes(tagFilter);
      });
    }

    if (sort.key && sort.direction) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      data = [...data].sort((a, b) => {
        if (sort.key === 'date') {
          const da = a.kind === 'task' ? a.dueAt : a.completedAt;
          const db = b.kind === 'task' ? b.dueAt : b.completedAt;
          const va = da ? new Date(da).getTime() : 0;
          const vb = db ? new Date(db).getTime() : 0;
          return (va - vb) * dir;
        }
        if (sort.key === 'status') return a.status.localeCompare(b.status) * dir;
        if (sort.key === 'contact') return a.contactName.localeCompare(b.contactName) * dir;
        return 0;
      });
    }

    return data;
  }, [query, touchpoints, view, sort, tagFilter, contacts, contactTags, companyTags]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let open = 0;
    let overdue = 0;
    let completedThisMonth = 0;

    touchpoints.forEach((t) => {
      if (t.status === 'open') {
        open += 1;
        if (isOverdue(t)) overdue += 1;
      } else if (t.status === 'completed' && t.completedAt) {
        const d = new Date(t.completedAt);
        if (!Number.isNaN(d.getTime()) && d >= monthStart && d <= now) {
          completedThisMonth += 1;
        }
      }
    });

    return { open, overdue, completedThisMonth };
  }, [touchpoints]);

  const overdueTrendLabel =
    stats.overdue === 0
      ? 'No overdue touchpoints'
      : stats.overdue <= 2
      ? 'Light overdue load'
      : 'High overdue load';

  const contactParentOn = Boolean(showColumns.contact);
  const interactionParentOn = Boolean(showColumns.interaction);
  const statusParentOn = Boolean(showColumns.status) || Boolean(showColumns.relationship);
  const parentKeys = ['contact', 'interaction', 'statusParent'];
  const activeParentsCount =
    (contactParentOn ? 1 : 0) + (interactionParentOn ? 1 : 0) + (statusParentOn ? 1 : 0);

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
    const headers = ['Date'];
    if (showColumns.contact) headers.push('Contact', 'Role', 'Company');
    if (showColumns.interaction) headers.push('Interaction type', 'Title');
    if (showColumns.status) headers.push('Status', 'Relationship status');

    const lines = [headers.join(',')];
    rows.forEach((row) => {
      const dateLabel =
        row.kind === 'task'
          ? formatDueLabel(row.dueAt)
          : row.completedAt
          ? formatDueLabel(row.completedAt)
          : '';
      const cols = [JSON.stringify(dateLabel)];
      if (showColumns.contact) {
        cols.push(JSON.stringify(row.contactName), JSON.stringify(row.role), JSON.stringify(row.company));
      }
      if (showColumns.interaction) {
        cols.push(JSON.stringify(row.interactionType), JSON.stringify(row.title));
      }
      if (showColumns.status) {
        cols.push(JSON.stringify(row.status), JSON.stringify(row.relationshipStatus));
      }
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
      contactName: form.contactName,
      interactionType: form.interactionType,
      title: `${form.interactionType} logged for ${form.contactName}`,
      company: selectedContact?.company || 'Unknown Company',
      role: selectedContact?.role || 'Client Contact',
      outcome: form.outcome,
      notes: form.notes || 'No notes provided.',
      followUpDate: form.followUpDate || '',
      history: [
        `${form.date}: ${form.interactionType} logged - Outcome: ${form.outcome}`,
        ...(selectedContact?.recentInteractions || []),
      ],
      avatarUrl: selectedContact?.avatarUrl || 'https://i.pravatar.cc/96?img=8',
      signalTone: selectedContact?.signalTone || 'blue',
      relationshipStatus: selectedContact?.relationship || 'Stable',
      relationshipScore: selectedContact?.relationshipScore || 50,
      lastInteracted: '0 days ago',
      source: 'touchpoints:log-interaction',
    });

    setIsLogOpen(false);
    setForm({
      contactName: contacts[0]?.name || '',
      interactionType: 'Email',
      date: '',
      outcome: '',
      followUpDate: '',
      notes: '',
    });
  }

  return (
    <section className="touchpoints-view-v2">
      <PageHeader
        title={String(view).toLowerCase().includes('missed') ? 'Missed Touchpoints' : 'Touchpoints'}
        showMore={false}
      />

      <section className="filterbar touchpoints-filterbar-v2">
        <SearchBar
          className="touchpoints-search-v2"
          value={query}
          onChange={(value) => setQuery(value)}
        />
        <FilterControls className="touchpoints-toolbar-v2">
          <button className="tool-btn" onClick={() => setIsLogOpen(true)}>
            Log Interaction
          </button>
          <button className="filter-btn" type="button" onClick={exportCsv}>
            Export CSV
          </button>
          <FilterSelect
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </FilterSelect>
        </FilterControls>
      </section>

      {!String(view).toLowerCase().includes('missed') && (
        <section className="touchpoints-summary">
          <div className="touchpoints-summary-item">
            <p className="touchpoints-summary-label">Open</p>
            <p className="touchpoints-summary-value">{stats.open}</p>
          </div>
          <div className="touchpoints-summary-item">
            <p className="touchpoints-summary-label">Overdue</p>
            <p className="touchpoints-summary-value">{stats.overdue}</p>
          </div>
          <div className="touchpoints-summary-item">
            <p className="touchpoints-summary-label">Completed this month</p>
            <p className="touchpoints-summary-value">{stats.completedThisMonth}</p>
          </div>
          <div className="touchpoints-summary-item touchpoints-summary-trend">
            <p className="touchpoints-summary-label">Status</p>
            <p className="touchpoints-summary-trend-text">{overdueTrendLabel}</p>
          </div>
        </section>
      )}

      <section className="touchpoints-table-v2">
        <div className="touchpoints-table-head-v2">
          <label className="checkbox-cell-v2" aria-label="Select all touchpoints">
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
          <button
            type="button"
            style={{ all: 'unset', cursor: 'pointer' }}
            onClick={() => toggleSort('date')}
          >
            {String(view).toLowerCase().includes('missed') ? 'Due' : 'Date'}
          </button>
          <button
            type="button"
            style={{ all: 'unset', cursor: 'pointer' }}
            onClick={() => toggleSort('contact')}
          >
            Contact
          </button>
          <span>Interaction | Status</span>
          <div style={{ position: 'relative' }}>
            <button
              className="contacts-table-settings"
              type="button"
              aria-label="settings"
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
                  minWidth: 220,
                }}
              >
                {/* Contact parent */}
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
                    checked={contactParentOn}
                    disabled={activeParentsCount === 1 && contactParentOn}
                    onChange={(e) =>
                      setShowColumns((prev) => ({
                        ...prev,
                        contact: e.target.checked,
                      }))
                    }
                  />
                  <span style={{ fontWeight: 600 }}>Contact</span>
                </label>

                {/* Interaction parent */}
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
                    checked={interactionParentOn}
                    disabled={activeParentsCount === 1 && interactionParentOn}
                    onChange={(e) =>
                      setShowColumns((prev) => ({
                        ...prev,
                        interaction: e.target.checked,
                      }))
                    }
                  />
                  <span style={{ fontWeight: 600 }}>Interaction</span>
                </label>

                {/* Status + Relationship parent + children */}
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
                    checked={statusParentOn}
                    disabled={activeParentsCount === 1 && statusParentOn}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShowColumns((prev) => ({
                        ...prev,
                        status: checked,
                        relationship: checked,
                      }));
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>Status | Relationship</span>
                </label>

                {[
                  ['status', 'Status'],
                  ['relationship', 'Relationship status'],
                ].map(([key, label]) => {
                  const activeStatusChildren =
                    (showColumns.status ? 1 : 0) + (showColumns.relationship ? 1 : 0);
                  const isLastStatusChild = statusParentOn && activeStatusChildren === 1 && showColumns[key];

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
                        disabled={isLastStatusChild && activeParentsCount === 1}
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

        <div className="touchpoints-table-body-v2">
          {rows.map((row) => (
            <div
              className="touchpoint-row-v2 is-clickable"
              key={row.id}
              onClick={() => setSelectedRow(row)}
              role="button"
              tabIndex={0}
            >
              <label
                className="checkbox-cell-v2"
                aria-label={`Select ${row.contactName}`}
                onClick={(e) => e.stopPropagation()}
              >
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

              <div className="touchpoint-date-v2">
                <span>
                  {row.kind === 'task'
                    ? formatDueLabel(row.dueAt)
                    : row.completedAt
                    ? formatDueLabel(row.completedAt)
                    : '—'}
                </span>
                {isOverdue(row) && (
                  <span className="tp-pill tp-pill-overdue" aria-label="Overdue touchpoint">
                    Overdue
                  </span>
                )}
              </div>

              {showColumns.contact && (
                <div className="touchpoint-contact-col-v2">
                  <img
                    src={row.avatarUrl}
                    alt={row.contactName}
                    className={`contact-avatar-v2 tone-${row.signalTone}`}
                  />
                  <div className="touchpoint-contact-meta-v2">
                    <div className="contact-title-line-v2">
                      <strong>{row.contactName}</strong>
                      <Icon name="signal" className={`network-icon tone-${row.signalTone}`} />
                    </div>
                    <p>{row.role}</p>
                    <p>{row.company}</p>
                    {(() => {
                      const contact = contacts.find((c) => c.name === row.contactName);
                      const tagIds = contact ? contactTags[contact.id] || [] : [];
                      if (!tagIds.length) return null;
                      const tagLabels = tags
                        .filter((t) => tagIds.includes(t.id))
                        .slice(0, 2)
                        .map((t) => t.label);
                      if (!tagLabels.length) return null;
                      return (
                        <div className="touchpoint-tags-row">
                          {tagLabels.map((label) => (
                            <span key={label} className="tp-tag-chip">
                              {label}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {showColumns.interaction || showColumns.status || showColumns.relationship ? (
                <div className="touchpoint-interaction-col-v2">
                  <div className="touchpoint-note-pill-v2">
                    <Icon name="note" />
                  </div>
                  <div className="touchpoint-interaction-text-v2">
                    {showColumns.interaction && (
                      <p className="touchpoint-interaction-title-v2">
                        [{row.interactionType}] {row.title}
                      </p>
                    )}
                    {(showColumns.status || showColumns.relationship) && (
                      <p className="touchpoint-interaction-sub-v2">
                        {showColumns.status && (
                          <span className="tp-pill tp-pill-status" data-status={row.status}>
                            {row.status === 'open'
                              ? 'Open'
                              : row.status === 'completed'
                              ? 'Completed'
                              : row.status === 'cancelled'
                              ? 'Cancelled'
                              : row.status}
                          </span>
                        )}
                        {showColumns.relationship && (
                          <span className="tp-pill tp-pill-relationship">
                            Relationship <strong>{row.relationshipStatus}</strong>
                          </span>
                        )}
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
          <article
            key={row.id}
            className="touchpoint-card"
            role="button"
            tabIndex={0}
            onClick={() => setSelectedRow(row)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedRow(row);
              }
            }}
          >
            <header className="touchpoint-card-header">
              <div className="touchpoint-card-date">
                <span className="touchpoint-card-date-label">
                  {row.kind === 'task' ? 'Due' : 'Date'}
                </span>
                <span className="touchpoint-card-date-value">
                  {row.kind === 'task'
                    ? formatDueLabel(row.dueAt)
                    : row.completedAt
                    ? formatDueLabel(row.completedAt)
                    : '—'}
                </span>
                {isOverdue(row) && (
                  <span className="tp-pill tp-pill-overdue" aria-label="Overdue touchpoint">
                    Overdue
                  </span>
                )}
              </div>

              <div className="touchpoint-card-contact">
                <img
                  src={row.avatarUrl}
                  alt={row.contactName}
                  className={`contact-avatar-v2 tone-${row.signalTone}`}
                />
                <div className="touchpoint-card-contact-meta">
                  <div className="contact-title-line-v2">
                    <strong>{row.contactName}</strong>
                    <Icon name="signal" className={`network-icon tone-${row.signalTone}`} />
                  </div>
                  <p>{row.role}</p>
                  <p>{row.company}</p>
                </div>
              </div>
            </header>

            <div className="touchpoint-card-body">
              <p className="touchpoint-card-title">
                [{row.interactionType}] {row.title}
              </p>
              <p className="touchpoint-card-status-row">
                <span className="tp-pill tp-pill-status" data-status={row.status}>
                  {row.status === 'open'
                    ? 'Open'
                    : row.status === 'completed'
                    ? 'Completed'
                    : row.status === 'cancelled'
                    ? 'Cancelled'
                    : row.status}
                </span>
                <span className="tp-pill tp-pill-relationship">
                  Relationship <strong>{row.relationshipStatus}</strong>
                </span>
              </p>

              {(() => {
                const contact = contacts.find((c) => c.name === row.contactName);
                const tagIds = contact ? contactTags[contact.id] || [] : [];
                if (!tagIds.length) return null;
                const tagLabels = tags
                  .filter((t) => tagIds.includes(t.id))
                  .slice(0, 3)
                  .map((t) => t.label);
                if (!tagLabels.length) return null;
                return (
                  <div className="touchpoint-card-tags">
                    {tagLabels.map((label) => (
                      <span key={label} className="tp-tag-chip">
                        {label}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </article>
        ))}
      </section>

      {selectedRow && (
        <div className="modal-backdrop" onClick={() => setSelectedRow(null)}>
          <div className="company-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head touchpoint-detail-head">
              <div className="touchpoint-detail-contact">
                <img
                  src={selectedRow.avatarUrl}
                  alt={selectedRow.contactName}
                  className={`contact-avatar-v2 tone-${selectedRow.signalTone}`}
                />
                <div className="touchpoint-detail-contact-meta">
                  <h2>{selectedRow.contactName}</h2>
                  <p>
                    {selectedRow.role} • {selectedRow.company}
                  </p>
                </div>
              </div>
              <div className="touchpoint-detail-meta">
                <div>
                  <p className="modal-label">Status</p>
                  <p className="modal-value">{selectedRow.status}</p>
                </div>
                <div>
                  <p className="modal-label">Relationship</p>
                  <p className="modal-value">
                    {selectedRow.relationshipStatus} (Score {selectedRow.relationshipScore})
                  </p>
                </div>
                <button className="modal-close" onClick={() => setSelectedRow(null)} aria-label="close modal">
                  x
                </button>
              </div>
            </div>
            <div className="modal-grid">
              <div>
                <p className="modal-label">Interaction type</p>
                <p className="modal-value">{selectedRow.interactionType}</p>
              </div>
              <div>
                <p className="modal-label">Status</p>
                <p className="modal-value">{selectedRow.status}</p>
              </div>
              <div>
                <p className="modal-label">Outcome</p>
                <p className="modal-value">{selectedRow.outcome}</p>
              </div>
              <div>
                <p className="modal-label">{selectedRow.kind === 'task' ? 'Due date' : 'Completed'}</p>
                <p className="modal-value">
                  {selectedRow.kind === 'task' ? formatDueLabel(selectedRow.dueAt) : formatDueLabel(selectedRow.completedAt)}
                </p>
              </div>
              <div>
                <p className="modal-label">Relationship progress</p>
                <p className="modal-value">
                  {selectedRow.relationshipStatus} (Score {selectedRow.relationshipScore})
                </p>
              </div>
            </div>
            <div className="modal-stack">
              <div>
                <p className="modal-label">Next steps</p>
                <p className="modal-value">
                  Engage assistant → Outreach. Mark this touchpoint complete when the follow-up is done or reschedule
                  if timing needs to change.
                </p>
              </div>
              <div>
                <p className="modal-label">Interaction history</p>
                <ul className="modal-list">
                  {(selectedRow.history || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="modal-label">Notes</p>
                {touchpointNotes.filter((n) => n.touchpointId === selectedRow.id).length === 0 && !selectedRow.notes && (
                  <p className="modal-value">No notes yet for this touchpoint.</p>
                )}
                <ul className="modal-list">
                  {selectedRow.notes && (
                    <li key="inline-note">
                      <strong>Original note</strong> — {selectedRow.notes}
                    </li>
                  )}
                  {touchpointNotes
                    .filter((n) => n.touchpointId === selectedRow.id)
                    .map((note) => (
                      <li key={note.id}>
                        <strong>{note.author}</strong> — {new Date(note.createdAt).toLocaleDateString()} <br />
                        {note.text}
                      </li>
                    ))}
                </ul>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    rows={3}
                    placeholder="Add a note about this touchpoint..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #d4d4d4', padding: '8px 10px' }}
                  />
                  <button
                    type="button"
                    className="filter-btn"
                    disabled={!newNoteText.trim()}
                    onClick={() => {
                      const text = newNoteText.trim();
                      if (!text) return;
                      demoStore.actions.addTouchpointNote({
                        touchpointId: selectedRow.id,
                        text,
                      });
                      setNewNoteText('');
                    }}
                  >
                    Add note
                  </button>
                </div>
              </div>
            </div>
            {selectedRow.kind === 'task' && (
              <div className="modal-actions">
                <button
                  className="tool-btn"
                  onClick={() => {
                    demoStore.actions.completeTouchpoint(selectedRow.id);
                    setSelectedRow((prev) => (prev ? { ...prev, status: 'completed' } : prev));
                  }}
                  disabled={selectedRow.status !== 'open'}
                >
                  Complete
                </button>
                <button
                  className="tool-btn"
                  onClick={() => {
                    demoStore.actions.cancelTouchpoint(selectedRow.id);
                    setSelectedRow((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
                  }}
                  disabled={selectedRow.status !== 'open'}
                >
                  Cancel
                </button>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Reschedule</span>
                  <input
                    value={rescheduleDueAt}
                    onChange={(e) => setRescheduleDueAt(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    style={{ border: '1px solid #d4d4d4', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
                  />
                  <button
                    className="primary"
                    type="button"
                    onClick={() => {
                      const iso = rescheduleDueAt ? new Date(`${rescheduleDueAt}T09:00:00`).toISOString() : null;
                      if (!iso) return;
                      demoStore.actions.rescheduleTouchpoint(selectedRow.id, iso);
                      setSelectedRow((prev) => (prev ? { ...prev, dueAt: iso, status: 'open' } : prev));
                      setRescheduleDueAt('');
                    }}
                  >
                    Save
                  </button>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {isLogOpen && (
        <div className="modal-backdrop" onClick={() => setIsLogOpen(false)}>
          <div className="company-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>Log Interaction</h2>
              <button className="modal-close" onClick={() => setIsLogOpen(false)} aria-label="close modal">
                x
              </button>
            </div>
            <form className="touchpoint-form" onSubmit={onCreateInteraction}>
              <label>
                Contact
                <select value={form.contactName} onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.name}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Interaction Type
                <select value={form.interactionType} onChange={(e) => setForm((prev) => ({ ...prev, interactionType: e.target.value }))}>
                  {interactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input type="text" placeholder="MM/DD/YY" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
              </label>
              <label>
                Outcome
                <input value={form.outcome} onChange={(e) => setForm((prev) => ({ ...prev, outcome: e.target.value }))} placeholder="Outcome summary" />
              </label>
              <label>
                Follow-up Date
                <input
                  type="text"
                  placeholder="MM/DD/YY"
                  value={form.followUpDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                />
              </label>
              <label>
                Notes
                <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
              </label>
              <div className="modal-actions">
                <button type="button" className="tool-btn" onClick={() => setIsLogOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Save Interaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
