import { useMemo, useState } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';

export default function AddContactToListModal({ contact, isOpen, onClose }) {
  const lists = useDemoStore((s) => s.lists || []);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() =>
    contact ? lists.filter((l) => l.memberIds.includes(contact.id)).map((l) => l.id) : []
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return lists;
    const q = query.toLowerCase();
    return lists.filter((l) => [l.name, l.tag, l.owner].join(' ').toLowerCase().includes(q));
  }, [lists, query]);

  if (!isOpen || !contact) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add {contact.name} to Lists</h2>
          <button className="modal-close" onClick={onClose} aria-label="close modal">
            x
          </button>
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="search lists-search-v2">
            <input
              placeholder="Search lists"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%' }}
            />
          </label>

          <ul className="modal-list">
            {filtered.map((list) => {
              const checked = selected.includes(list.id);
              return (
                <li key={list.id}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked ? [...prev, list.id] : prev.filter((id) => id !== list.id)
                        );
                      }}
                    />
                    <span>
                      <strong>{list.name}</strong> — {list.tag}{' '}
                      <span style={{ color: '#6b7280', fontSize: 12 }}>
                        Members {list.memberIds.length} · Last engagement {list.lastEngagement}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                demoStore.actions.addContactToLists(contact.id, selected);
                onClose();
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

