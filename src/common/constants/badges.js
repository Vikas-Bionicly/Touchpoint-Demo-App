/**
 * Badge type definitions for contacts.
 */
export const BADGE_TYPES = [
  { id: 'digital-engagement', label: 'Digital Engagement', icon: 'chart', color: '#3b82f6' },
  { id: 'pertinent-content', label: 'Pertinent Content', icon: 'docPlus', color: '#8b5cf6' },
  { id: 'event-match', label: 'Event Match', icon: 'handshake', color: '#10b981' },
  { id: 'visit', label: 'Visit', icon: 'target', color: '#f59e0b' },
  { id: 'birthday', label: 'Birthday', icon: 'sparkles', color: '#ec4899' },
  { id: 'job-change', label: 'Job Change', icon: 'switch', color: '#ef4444' },
];

export const BADGE_MAP = Object.fromEntries(BADGE_TYPES.map((b) => [b.id, b]));
