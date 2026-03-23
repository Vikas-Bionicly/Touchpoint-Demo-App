import { useState } from 'react';
import Icon from './Icon';

const TYPE_ICONS = {
  'touchpoint.created': 'handshake',
  'touchpoint.completed': 'target',
  'interaction.logged': 'send',
  'insight.liked': 'sparkles',
  'insight.dismissed': 'x',
  'note.added': 'note',
  'contact.created': 'addressCard',
  'company.created': 'buildings',
  'list.created': 'list',
  'tags.updated': 'sliders',
  'ai.summary.generated': 'sparkles',
};

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function ActivityFeed({ activities = [], limit = 15, entityFilter }) {
  const [showCount, setShowCount] = useState(limit);

  const filtered = entityFilter
    ? activities.filter((a) => a.entityId === entityFilter || a.entityName === entityFilter)
    : activities;

  const visible = filtered.slice(0, showCount);

  if (visible.length === 0) {
    return <p style={{ color: '#6b7280', fontSize: 13, padding: '8px 0' }}>No activity recorded yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {visible.map((act, idx) => {
        const iconName = TYPE_ICONS[act.type] || 'note';
        return (
          <div key={act.id} style={{
            display: 'flex', gap: 12, padding: '10px 0',
            borderBottom: idx < visible.length - 1 ? '1px solid #f3f4f6' : 'none',
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={iconName} className="icon" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, margin: 0, lineHeight: 1.4 }}>{act.description}</p>
              {act.entityName && (
                <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{act.entityType}: {act.entityName}</p>
              )}
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {relativeTime(act.createdAt)}
            </span>
          </div>
        );
      })}
      {filtered.length > showCount && (
        <button
          type="button"
          className="tool-btn"
          style={{ marginTop: 8, alignSelf: 'center', fontSize: 12 }}
          onClick={() => setShowCount((p) => p + limit)}
        >
          Show more ({filtered.length - showCount} remaining)
        </button>
      )}
    </div>
  );
}
