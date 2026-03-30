/**
 * Deterministic "digest" helpers for CO-10 — prototype AI note summarization
 * (no external API; narrative is derived from stored note text and types).
 */

export function shorten(text, max = 120) {
  const t = String(text || '').trim().replace(/\s+/g, ' ');
  if (!t.length) return '(empty)';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function sortedNotesDesc(notes) {
  return [...notes].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function noteDigestSourceLines(notes) {
  return sortedNotesDesc(notes).map((n) => ({
    id: n.id,
    type: n.type || 'General',
    visibility: n.visibility || 'private',
    excerpt: shorten(n.text, 160),
  }));
}

export function groupNotesByType(notes) {
  const map = {};
  for (const n of notes) {
    const t = n.type || 'General';
    if (!map[t]) map[t] = [];
    map[t].push(n);
  }
  return map;
}

function recommendationFromTypes(types) {
  if (types.includes('Meeting Notes')) return 'Follow up on open items from meeting notes in your next conversation.';
  if (types.includes('Client Preferences')) return 'Reference recorded preferences when preparing decks or outreach.';
  if (types.includes('Relationship Context')) return 'Use relationship context to personalize timing and tone of the next touchpoint.';
  if (types.includes('Personal Interests')) return 'Where appropriate, acknowledge personal interests to strengthen rapport.';
  if (types.includes('Special Dates')) return 'Acknowledge upcoming special dates noted in the file.';
  return 'Consolidate recurring themes into a short agenda for the next meeting or call.';
}

/**
 * Multi-line narrative for display after "Summarize with AI" (simulated generation).
 */
export function buildAiNoteDigestNarrative(notes, contactName) {
  if (!notes.length) return null;
  const byType = groupNotesByType(notes);
  const types = Object.keys(byType).sort();
  const name = contactName || 'this contact';
  const head = `Across ${notes.length} note${notes.length > 1 ? 's' : ''} for ${name}, recurring themes include:`;
  const bullets = types.map((type) => {
    const arr = byType[type];
    const joined = arr.map((n) => shorten(n.text, 88)).join(' · ');
    return `• ${type} (${arr.length}): ${joined}`;
  });
  const rec = recommendationFromTypes(types);
  return [head, '', ...bullets, '', `Suggested next step: ${rec}`].join('\n');
}
