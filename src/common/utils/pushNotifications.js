const PUSH_CACHE_KEY = 'touchpoint-demo:push-seen';

const CRITICAL_TYPES = new Set([
  'team-coordination',
  'misalignment',
  'new-role',
  'company-news',
  'Reminder',
]);

function canUseBrowserNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function readSeen() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PUSH_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSeen(ids) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PUSH_CACHE_KEY, JSON.stringify(ids.slice(-200)));
}

export function getPushPermissionState() {
  if (!canUseBrowserNotifications()) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission() {
  if (!canUseBrowserNotifications()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
}

export function isCriticalNotification(n) {
  if (!n) return false;
  if (CRITICAL_TYPES.has(n.type)) return true;
  const title = String(n.title || '').toLowerCase();
  return title.includes('alert') || title.includes('misalignment');
}

export function sendCriticalInsightPushes(notifications = []) {
  if (!canUseBrowserNotifications()) return 0;
  if (Notification.permission !== 'granted') return 0;
  const seen = new Set(readSeen());
  const toSend = notifications.filter((n) => !n.read && isCriticalNotification(n) && !seen.has(n.id));
  toSend.slice(0, 3).forEach((n) => {
    const body = String(n.message || '').slice(0, 180);
    // Browser-level push-style toast for critical insight reminders.
    new Notification(n.title || 'Touchpoints alert', { body });
    seen.add(n.id);
  });
  writeSeen(Array.from(seen));
  return Math.min(toSend.length, 3);
}

