import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import { useDemoStore } from '../common/store/demoStore';

export default function ListsPage() {
  const [query, setQuery] = useState('');
  const [checkedRows, setCheckedRows] = useState({});
  const lists = useDemoStore((s) => s.lists || []);

  const rows = useMemo(() => {
    if (!query.trim()) return lists;
    const q = query.toLowerCase();
    return lists.filter((row) => [row.name, row.owner, row.tag, row.lastEngagement].join(' ').toLowerCase().includes(q));
  }, [query, lists]);

  const allChecked = rows.length > 0 && rows.every((row) => checkedRows[row.id]);

  return (
    <section className="lists-view-v2">
      <header className="headbar">
        <h1>Lists</h1>
        <button className="context-btn" aria-label="more">
          <Icon name="more" />
        </button>
      </header>

      <section className="filterbar lists-filterbar-v2">
        <label className="search lists-search-v2">
          <Icon name="search" />
          <input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button className="filter-btn">
          <Icon name="sliders" className="btn-icon" />
          Filter View
        </button>
      </section>

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
          <span>Actions</span>
          <button className="contacts-table-settings" aria-label="settings">
            <Icon name="settings" />
          </button>
        </div>

        <div className="lists-table-body-v2">
          {rows.map((row) => (
            <div className="list-row-v2" key={row.id}>
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

              <div className="list-main-col-v2">
                <div className={`list-avatar-v2 ${row.color}`}>{row.initials}</div>
                <div className="list-main-meta-v2">
                  <strong>{row.name}</strong>
                  <p>
                    Members <strong>{row.members}</strong>
                    <span>
                      Last engagement <strong>{row.lastEngagement}</strong>
                    </span>
                  </p>
                </div>
              </div>

              <div className="list-owner-v2">{row.owner}</div>

              <div className="list-tag-v2">
                <span>{row.tag}</span>
              </div>

              <div className="list-actions-v2">
                <button aria-label="relationship">
                  <Icon name="target" />
                </button>
                <button aria-label="more actions">
                  <Icon name="listPlus" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
