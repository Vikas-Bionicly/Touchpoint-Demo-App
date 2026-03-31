import { useEffect, useState } from 'react';
import { demoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';

const LIST_TYPES = ['Practice-based', 'Initiative-based', 'Event-based', 'Referral', 'Personal', 'Trip Planning', 'Targeting'];
const LIST_VISIBILITIES = ['Firm-wide', 'Shared', 'Personal'];
const LIST_COLORS = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange', 'bg-cyan', 'bg-rose', 'bg-amber', 'bg-indigo'];
const USER_POOL = ['M. Chen', 'A. Patel', 'R. Thompson', 'S. Nakamura', 'L. Martinez', 'J. Kim', 'D. Okafor', 'H. Singh'];
const PRACTICE_GROUPS = ['Corporate', 'Litigation', 'Regulatory'];
const LAWYER_PERSONA_IDS = ['partner', 'non-equity-partner', 'associate', 'group-lead', 'billing-lawyer'];
const BD_PERSONA_IDS = ['bd-superuser', 'bd-standard'];

export default function UpdateListModal({ list, isOpen, onClose }) {
  const { can, field, persona } = usePersona();
  const isLegalAssistant = persona?.id === 'legal-assistant';
  const isBdPersona = BD_PERSONA_IDS.includes(persona?.id);
  const isLawyerPersona = LAWYER_PERSONA_IDS.includes(persona?.id);
  const ownerOptions = isLegalAssistant
    ? ['You (Assistant)', ...USER_POOL]
    : isBdPersona
      ? ['You (BD)', 'BD Team', ...USER_POOL]
      : isLawyerPersona
        ? ['You', ...USER_POOL.filter((u) => u !== 'You')]
        : ['You', 'BD Team', ...USER_POOL];
  const [form, setForm] = useState({
    name: '',
    type: 'Personal',
    owner: 'You',
    tag: '',
    visibility: 'Personal',
    color: 'bg-blue',
    sharedScope: 'Users',
    sharedWithUserIds: [],
    sharedWithUsers: [],
    sharedPracticeGroup: PRACTICE_GROUPS[0] || 'Corporate',
  });

  useEffect(() => {
    if (!list) return;
    const hasPracticeGroup = Boolean(list.sharedPracticeGroup);
    const hasUsers = Array.isArray(list.sharedWithUserIds) ? list.sharedWithUserIds.length > 0 : false;
    const sharedScope = hasPracticeGroup ? 'Practice group' : 'Users';
    setForm({
      name: list.name || '',
      type: list.type || 'Personal',
      owner: list.owner || 'You',
      tag: list.tag || '',
      visibility: list.visibility || 'Personal',
      color: list.color || 'bg-blue',
      sharedScope,
      sharedWithUserIds: list.sharedWithUserIds || [],
      sharedWithUsers: list.sharedWithUsers || list.sharedWithUserIds || [],
      sharedPracticeGroup: list.sharedPracticeGroup || (PRACTICE_GROUPS[0] || 'Corporate'),
    });
  }, [list]);

  if (!isOpen || !list) return null;
  if (!can('list.create')) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    demoStore.actions.updateList(list.id, form);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Edit List</h2>
          <button className="modal-close" onClick={onClose} aria-label="close">x</button>
        </div>
        <form className="touchpoint-form" onSubmit={handleSubmit}>
          <label>List Name <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label>
          <label>Type
            <select
              value={form.type}
              onChange={(e) => {
                const nextType = e.target.value;
                setForm((p) =>
                  nextType === 'Targeting'
                    ? { ...p, type: nextType, visibility: 'Firm-wide' }
                    : { ...p, type: nextType }
                );
              }}
            >
              {LIST_TYPES.map((t) => {
                if (t === 'Personal' && !field('personalLists')) return null;
                return <option key={t} value={t}>{t}</option>;
              })}
            </select>
          </label>
          <label>{isLegalAssistant ? 'Assign owner (on behalf of)' : 'Owner'}
            <select value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))}>
              {[...new Set([form.owner, ...ownerOptions])].filter(Boolean).map((owner) => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </label>
          <label>Tag <input value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} /></label>
          <label>Visibility
            <select
              value={form.visibility}
              disabled={form.type === 'Targeting'}
              onChange={(e) => {
                const nextVisibility = e.target.value;
                setForm((p) => {
                  if (nextVisibility !== 'Shared') {
                    return {
                      ...p,
                      visibility: nextVisibility,
                      sharedScope: 'Users',
                      sharedWithUserIds: [],
                      sharedWithUsers: [],
                      sharedPracticeGroup: PRACTICE_GROUPS[0] || 'Corporate',
                    };
                  }
                  return { ...p, visibility: nextVisibility };
                });
              }}
            >
              {LIST_VISIBILITIES.map((v) => {
                if (v === 'Personal' && !field('personalLists')) return null;
                return <option key={v} value={v}>{v}</option>;
              })}
            </select>
          </label>
          {form.visibility === 'Shared' && (
            <>
              <label>Shared with
                <select
                  value={form.sharedScope}
                  onChange={(e) => setForm((p) => ({ ...p, sharedScope: e.target.value }))}
                >
                  <option value="Users">Specific users</option>
                  <option value="Practice group">Practice group</option>
                </select>
              </label>
              {form.sharedScope === 'Users' ? (
                <label>
                  Shared users
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 8 }}>
                    {USER_POOL.map((u) => {
                      const checked = (form.sharedWithUserIds || []).includes(u);
                      return (
                        <label key={u} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(new Set([...(form.sharedWithUserIds || []), u]))
                                : (form.sharedWithUserIds || []).filter((x) => x !== u);
                              setForm((p) => ({ ...p, sharedWithUserIds: next, sharedWithUsers: next }));
                            }}
                          />
                          {u}
                        </label>
                      );
                    })}
                  </div>
                </label>
              ) : (
                <label>Practice group
                  <select
                    value={form.sharedPracticeGroup}
                    onChange={(e) => setForm((p) => ({ ...p, sharedPracticeGroup: e.target.value }))}
                  >
                    {PRACTICE_GROUPS.map((pg) => (
                      <option key={pg} value={pg}>{pg}</option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          <label>Color
            <select value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}>
              {LIST_COLORS.map((c) => <option key={c} value={c}>{c.replace('bg-', '')}</option>)}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="tool-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
