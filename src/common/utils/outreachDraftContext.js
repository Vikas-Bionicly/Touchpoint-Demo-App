/**
 * AI-16 — deterministic outreach context from contact + company (prototype; no external model).
 */

import { formatLastTouchSourceLine } from './lastInteractionAttribution';

function hashMod(str, n) {
  let h = 0;
  const s = String(str ?? '');
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return n > 0 ? h % n : 0;
}

/**
 * @returns {{ label: string, text: string }[]}
 */
export function buildOutreachTalkingPoints(contact, company) {
  if (!contact) return [];
  const pts = [];

  if (contact.lastInteraction) {
    pts.push({ label: 'Recent activity', text: contact.lastInteraction });
  }
  if (contact.lastInteractionAttribution) {
    pts.push({
      label: 'Last touch source',
      text: formatLastTouchSourceLine(contact.lastInteractionAttribution),
    });
  }

  const newsItems = Array.isArray(company?.newsItems) ? company.newsItems : [];
  newsItems.slice(0, 2).forEach((n) => {
    const bit = [n.type, n.title].filter(Boolean).join(': ');
    if (bit) pts.push({ label: 'Company news', text: bit });
  });

  if (contact.recentInteractions?.length) {
    pts.push({ label: 'Engagement history', text: contact.recentInteractions[0] });
  }
  if (contact.internalConnections?.length) {
    pts.push({ label: 'Internal connection', text: contact.internalConnections[0] });
  }
  if (contact.relationship) {
    pts.push({
      label: 'Relationship',
      text: `${contact.relationship}${contact.relationshipScore != null ? ` (score ${contact.relationshipScore})` : ''}`,
    });
  }

  return pts.slice(0, 8);
}

export function buildOutreachDraftEmail(contact, company, talkingPoints) {
  const name = contact?.name || 'there';
  const firstName = name.split(/\s+/)[0] || name;
  const companyName = contact?.company || company?.name || 'your organization';
  const role = contact?.role || 'your team';
  const news0 = Array.isArray(company?.newsItems) ? company.newsItems[0] : null;

  const subject = news0?.title
    ? `Re: ${companyName} — ${news0.type || 'Update'} (${news0.title.length > 42 ? `${news0.title.slice(0, 42)}…` : news0.title})`
    : `Quick note for ${firstName} at ${companyName}`;

  const tpLines = talkingPoints.map((p) => `• ${p.text}`).join('\n');
  const tpBlock = talkingPoints.length
    ? `\n\nA few angles worth weaving in if it feels natural:\n${tpLines}\n`
    : '';

  const newsPara = news0
    ? `I noticed the recent ${String(news0.type || 'news').toLowerCase()} — "${news0.title}" — and thought it might be a useful moment to compare notes on how peers are responding.`
    : `I'm hearing recurring themes in your sector around execution speed, governance, and cross-border coordination — I'd welcome a short compare-notes conversation.`;

  const variant = hashMod(contact?.id || name, 3);
  const openers = [
    `I hope you're doing well. In your role as ${role}, you're likely balancing a lot of moving pieces right now.`,
    `Hope this finds you well. Given ${companyName}'s trajectory, I imagined a concise check-in might be useful.`,
    `I wanted to reach out personally while things are active for ${companyName}.`,
  ];

  const body = `Hi ${firstName},

${openers[variant]}

${newsPara}${tpBlock}
Would you have ~20 minutes in the next week or two for a call?

Warm regards`;

  return { subject, body };
}
