/**
 * MT-03 — mock source attribution for last interaction (Introhive / Vuture / Manual).
 * Labels match catalog language; data remains prototype-only.
 */

export function formatLastTouchSourceLine(attr) {
  if (!attr || !attr.system) return '';
  const sys =
    attr.system === 'introhive'
      ? 'Introhive'
      : attr.system === 'vuture'
        ? 'Vuture'
        : 'Manual';
  const ch = attr.channel || 'Activity';
  return `${sys} · ${ch}`;
}

export function lastInteractionSystemClass(attr) {
  if (!attr?.system) return '';
  return `lia-${attr.system}`;
}

/** When user logs an interaction in the app — counts as manually logged activity. */
export function manualAttributionFromLoggedType(interactionType) {
  const t = String(interactionType || '').toLowerCase();
  if (t === 'email') return { system: 'manual', channel: 'Email (logged in Touchpoints)' };
  if (t === 'meeting' || t === 'visit') return { system: 'manual', channel: 'Meeting / visit (logged)' };
  if (t === 'call') return { system: 'manual', channel: 'Call (logged)' };
  if (t === 'event') return { system: 'manual', channel: 'Event (logged)' };
  return { system: 'manual', channel: 'Activity (logged)' };
}
