import { useMemo, useState } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';
import { formatTagCodesLine, formatTagTaxonomyTitleAttr } from '../utils/tagTaxonomy';

export default function ManageContactTagsModal({ contact, isOpen, onClose }) {
  const tags = useDemoStore((s) => s.tags || []);
  const contactTags = useDemoStore((s) => s.contactTags || {});
  const { can } = usePersona();
  const [selected, setSelected] = useState(() => contactTags[contact?.id] || []);

  const grouped = useMemo(() => {
    const byType = {};
    tags.forEach((t) => {
      if (!byType[t.type]) byType[t.type] = [];
      byType[t.type].push(t);
    });
    return byType;
  }, [tags]);

  if (!isOpen || !contact) return null;
  if (!can('tag.manage')) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Tags for {contact.name}</h2>
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
                  const sources = (tag.sourceTaxonomies || []).join(', ');
                  const codes = formatTagCodesLine(tag);
                  return (
                    <li key={tag.id}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }} title={formatTagTaxonomyTitleAttr(tag)}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelected((prev) =>
                              e.target.checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id)
                            );
                          }}
                        />
                        <span>
                          <strong>{tag.label}</strong>
                          <small style={{ display: 'block', color: '#6b7280', marginTop: 2 }}>
                            {tag.canonicalType || tag.type}
                            {sources ? ` · ${sources}` : ''}
                          </small>
                          {codes ? (
                            <small style={{ display: 'block', color: '#4b5563', marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
                              {codes}
                            </small>
                          ) : null}
                        </span>
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
              demoStore.actions.setContactTags(contact.id, selected);
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

