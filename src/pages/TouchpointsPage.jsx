import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import { contactRows } from '../common/constants/contacts';
import { demoStore, useDemoStore } from '../common/store/demoStore';

const interactionTypes = ['Email', 'Meeting', 'Event', 'Call', 'Visit'];

function contactByName(name) {
  return contactRows.find((contact) => contact.name === name);
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
  });
  const [form, setForm] = useState({
    contactName: contactRows[0]?.name || '',
    interactionType: 'Email',
    date: '',
    outcome: '',
    followUpDate: '',
    notes: '',
  });

  const touchpoints = useDemoStore((s) => s.touchpoints);

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
  }, [query, touchpoints, view, sort]);

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

    const selectedContact = contactByName(form.contactName);
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
      contactName: contactRows[0]?.name || '',
      interactionType: 'Email',
      date: '',
      outcome: '',
      followUpDate: '',
      notes: '',
    });
  }

  return (
    <section className="touchpoints-view-v2">
      <header className="headbar">
        <h1>{String(view).toLowerCase().includes('missed') ? 'Missed Touchpoints' : 'Touchpoints'}</h1>
        <button className="context-btn" aria-label="more">
          <Icon name="more" />
        </button>
      </header>

      <section className="filterbar touchpoints-filterbar-v2">
        <label className="search touchpoints-search-v2">
          <Icon name="search" />
          <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="touchpoints-toolbar-v2">
          <button className="tool-btn" onClick={() => setIsLogOpen(true)}>
            Log Interaction
          </button>
          <button className="filter-btn" type="button" onClick={exportCsv}>
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
                  minWidth: 200,
                }}
              >
                {[
                  ['contact', 'Contact details'],
                  ['interaction', 'Interaction'],
                  ['status', 'Status / Relationship'],
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
          <span>Interaction</span>
          <button className="contacts-table-settings" aria-label="settings">
            <Icon name="settings" />
          </button>
        </div>

        <div className="touchpoints-table-body-v2">
          {rows.map((row) => (
            <div className="touchpoint-row-v2 is-clickable" key={row.id} onClick={() => setSelectedRow(row)} role="button" tabIndex={0}>
              <label className="checkbox-cell-v2" aria-label={`Select ${row.contactName}`} onClick={(e) => e.stopPropagation()}>
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
                {row.kind === 'task' ? formatDueLabel(row.dueAt) : row.completedAt ? formatDueLabel(row.completedAt) : '—'}
              </div>

              {showColumns.contact && (
                <div className="touchpoint-contact-col-v2">
                  <img src={row.avatarUrl} alt={row.contactName} className={`contact-avatar-v2 tone-${row.signalTone}`} />
                  <div className="touchpoint-contact-meta-v2">
                    <div className="contact-title-line-v2">
                      <strong>{row.contactName}</strong>
                      <Icon name="signal" className={`network-icon tone-${row.signalTone}`} />
                    </div>
                    <p>{row.role}</p>
                    <p>{row.company}</p>
                  </div>
                </div>
              )}

              {showColumns.interaction || showColumns.status ? (
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
                    {showColumns.status && (
                      <p className="touchpoint-interaction-sub-v2">
                        Status <strong>{row.status}</strong>
                        <span>
                          Relationship status <strong>{row.relationshipStatus}</strong>
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {selectedRow && (
        <div className="modal-backdrop" onClick={() => setSelectedRow(null)}>
          <div className="company-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>{selectedRow.contactName} Touchpoint</h2>
              <button className="modal-close" onClick={() => setSelectedRow(null)} aria-label="close modal">
                x
              </button>
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
                <p className="modal-label">Interaction history</p>
                <ul className="modal-list">
                  {(selectedRow.history || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="modal-label">Notes</p>
                <p className="modal-value">{selectedRow.notes}</p>
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
                  {contactRows.map((contact) => (
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
