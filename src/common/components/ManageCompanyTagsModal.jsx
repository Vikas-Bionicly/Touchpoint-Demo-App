import { useMemo, useState } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';

export default function ManageCompanyTagsModal({ company, isOpen, onClose }) {
  const tags = useDemoStore((s) => s.tags || []);
  const companyTags = useDemoStore((s) => s.companyTags || {});
  const [selected, setSelected] = useState(() => companyTags[company?.id] || []);

  const grouped = useMemo(() => {
    const byType = {};
    tags.forEach((t) => {
      if (!byType[t.type]) byType[t.type] = [];
      byType[t.type].push(t);
    });
    return byType;
  }, [tags]);

  if (!isOpen || !company) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Tags for {company.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="close modal">
            x
          </button>
        </div>

        <div className="modal-stack">
          {Object.entries(grouped).map(([type, list]) => (
            <div key={type}>
              <p className="modal-label">{type}</p>
              <ul className="modal-list">
                {list.map((tag) => {
                  const checked = selected.includes(tag.id);
                  return (
                    <li key={tag.id}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelected((prev) =>
                              e.target.checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id)
                            );
                          }}
                        />
                        <span>{tag.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="tool-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              demoStore.actions.setCompanyTags(company.id, selected);
              onClose();
            }}
          >
            Save Tags
          </button>
        </div>
      </div>
    </div>
  );
}

