/**
 * AI-17 — deterministic meeting prep narrative + highlight selection (prototype; no external model).
 */

export function pickCompanyNewsForPrep(newsItems, limit = 2) {
  const tagged = Array.isArray(newsItems) ? newsItems : [];
  const picked = [];
  const priorityTypes = ['RFP', 'M&A', 'Leadership', 'Regulatory'];
  priorityTypes.forEach((t) => {
    const n = tagged.find((x) => x.type === t);
    if (n && !picked.includes(n)) picked.push(n);
  });
  tagged.forEach((n) => {
    if (picked.length >= limit) return;
    if (!picked.includes(n)) picked.push(n);
  });
  return picked.slice(0, limit);
}

/**
 * Short narrative for header / calendar strip.
 */
export function buildMeetingPrepAiNarrow(contact, company, ctx) {
  if (!contact) return '';
  const { openTasks = [], newsItems = [] } = ctx;
  const first = contact.name.split(/\s+/)[0] || contact.name;
  const bits = [
    `${first}: ${contact.relationship || 'Stable'} relationship`,
    openTasks.length ? `${openTasks.length} open follow-up${openTasks.length > 1 ? 's' : ''}` : 'no open tasks',
    newsItems.length ? `${newsItems.length} news hook${newsItems.length > 1 ? 's' : ''}` : 'lean on relationship context',
  ];
  return bits.join(' · ');
}

/**
 * Fuller prep summary paragraph for meeting brief modal.
 */
export function buildMeetingPrepAiNarrative(contact, company, ctx) {
  if (!contact) return '';
  const {
    openTasks = [],
    newsItems = [],
    contactNotes = [],
    referralMeta = null,
  } = ctx;
  const firstName = contact.name.split(/\s+/)[0] || contact.name;
  const sentences = [];

  sentences.push(
    `You are meeting with ${firstName} (${contact.role || 'contact'}) at ${contact.company || 'their organization'}. ` +
      `Relationship trend: ${contact.relationship || 'not classified'}. ` +
      `Their last logged touchpoint: ${contact.lastInteraction || 'none on file'}.`
  );

  if (openTasks.length) {
    sentences.push(
      `There ${openTasks.length === 1 ? 'is' : 'are'} ${openTasks.length} open touchpoint task${openTasks.length > 1 ? 's' : ''} — if time is tight, start with the nearest due date.`
    );
  } else {
    sentences.push('No open tasks are flagged; use the time to lock one specific next step and owner.');
  }

  if (newsItems.length) {
    const lead = newsItems[0];
    sentences.push(
      `Company intelligence highlights ${newsItems.length} item${newsItems.length > 1 ? 's' : ''}` +
        (lead?.type ? `, led by ${lead.type} coverage` : '') +
        ' — weave in only where it advances their stated priorities.'
    );
  } else {
    sentences.push('Prioritized company news is thin in this briefing; anchor on their agenda and your notes.');
  }

  if (contactNotes.length) {
    sentences.push(`${contactNotes.length} recent note${contactNotes.length > 1 ? 's' : ''} on file — skim for preferences and landmines before you open.`);
  }

  if (referralMeta?.referralListCount || referralMeta?.referredMatterCount) {
    sentences.push(
      'Referral context exists for this contact; acknowledge the trust early and avoid over-selling if the tone should stay relationship-first.'
    );
  }

  return sentences.join(' ');
}

export function topHighlightedTalkingPoints(talkingPoints, limit = 3) {
  return (talkingPoints || []).slice(0, Math.max(0, limit));
}
