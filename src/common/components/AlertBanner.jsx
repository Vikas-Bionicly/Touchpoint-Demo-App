import { useState } from 'react';

const ALERT_STYLES = {
  'team-coordination': { bg: '#fef3c7', border: '#fbbf24', icon: 'i' },
  'new-role': { bg: '#dbeafe', border: '#3b82f6', icon: 'i' },
  'company-news': { bg: '#f0fdf4', border: '#22c55e', icon: 'i' },
  'misalignment': { bg: '#fef2f2', border: '#ef4444', icon: '!' },
  default: { bg: '#f3f4f6', border: '#9ca3af', icon: 'i' },
};

export default function AlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState({});

  if (!alerts || alerts.length === 0) return null;

  const visible = alerts.filter((a) => !dismissed[a.id]);
  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {visible.map((alert) => {
        const style = ALERT_STYLES[alert.type] || ALERT_STYLES.default;
        return (
          <div
            key={alert.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              background: style.bg, border: `1px solid ${style.border}`, borderRadius: 8,
              fontSize: 13,
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: style.border,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, flexShrink: 0,
            }}>
              {style.icon}
            </span>
            <div style={{ flex: 1 }}>
              <strong>{alert.title}</strong>
              <span style={{ marginLeft: 6 }}>{alert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setDismissed((p) => ({ ...p, [alert.id]: true }))}
              style={{ all: 'unset', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}
              aria-label="dismiss"
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
}
