import { useState } from 'react';
import { demoStore, useDemoStore } from '../store/demoStore';
import Icon from './Icon';

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const notifications = useDemoStore((s) => s.notifications || []);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="tool-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        style={{ position: 'relative', padding: '6px 8px' }}
      >
        <Icon name="signal" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff',
            borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, background: '#fff',
          border: '1px solid #e5e5e5', borderRadius: 10, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
          zIndex: 50, minWidth: 320, maxHeight: 400, overflowY: 'auto',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, fontSize: 14 }}>
            Notifications
          </div>
          {notifications.length === 0 && (
            <div style={{ padding: '16px', color: '#6b7280', fontSize: 13 }}>No notifications</div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '10px 16px', borderBottom: '1px solid #f9fafb', cursor: 'pointer',
                background: n.read ? '#fff' : '#fef3c7', fontSize: 13,
              }}
              onClick={() => demoStore.actions.dismissNotification(n.id)}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
              <div style={{ color: '#4b5563' }}>{n.message}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                {new Date(n.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
