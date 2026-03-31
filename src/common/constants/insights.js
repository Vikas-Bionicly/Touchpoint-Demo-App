import { demoStore } from '../store/demoStore';
import insightTypesRaw from '../../../demo-data/insight-types.json';
import {
  formatLastTouchSourceLine,
  lastInteractionSystemClass,
} from '../utils/lastInteractionAttribution';
import {
  buildCrossSellPracticeContext,
  keyContactFirstName,
} from '../utils/crossSellPractice';
import {
  describeValueAddGap,
  hasValueAddGap,
  valueAddGapSignals,
} from '../utils/valueAddGap';
import { BADGE_MAP } from './badges';

function cardLastTouchFields(contact) {
  if (!contact?.lastInteractionAttribution) return {};
  return {
    lastTouchSource: formatLastTouchSourceLine(contact.lastInteractionAttribution),
    lastTouchSourceClass: lastInteractionSystemClass(contact.lastInteractionAttribution),
  };
}

// Build priority map from insight-types.json
const priorityMap = {};
insightTypesRaw.forEach((it) => {
  priorityMap[it.insightTypeName] = parseFloat(it.priorityWeighting) || 0.09;
});

function getContacts() {
  return demoStore.getState().contacts || [];
}

function getCompanies() {
  return demoStore.getState().companies || [];
}

function getTouchpoints() {
  return demoStore.getState().touchpoints || [];
}

function getContactNotes() {
  return demoStore.getState().notes || [];
}

function getUpcomingMeetingTouchpoints(daysAhead = 7) {
  const now = Date.now();
  const maxTs = now + daysAhead * 24 * 60 * 60 * 1000;
  return getTouchpoints().filter((tp) => {
    const interaction = String(tp.interactionType || '').toLowerCase();
    const status = String(tp.status || '').toLowerCase();
    if (status === 'completed' || status === 'cancelled') return false;
    if (!['meeting', 'visit', 'call'].includes(interaction)) return false;
    const ts = new Date(tp.dueAt || tp.createdAt || tp.completedAt).getTime();
    if (!Number.isFinite(ts)) return false;
    return ts >= now && ts <= maxTs;
  });
}

function daysSince(iso) {
  if (!iso) return 999;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 999;
  const now = Date.now();
  return Math.max(0, Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function computeWeightedActivityScore(contact) {
  const touchpoints = getTouchpoints()
    .filter((tp) => tp.contactName === contact.name)
    .slice(0, 80);

  const score = touchpoints.reduce((sum, tp) => {
    const type = String(tp.interactionType || '').toLowerCase();
    const title = String(tp.title || '').toLowerCase();
    const notes = String(tp.notes || '').toLowerCase();
    const source = String(tp.source || '').toLowerCase();
    const status = String(tp.status || '').toLowerCase();
    const date = tp.completedAt || tp.createdAt || tp.dueAt;
    const ageDays = daysSince(date);
    if (ageDays > 120) return sum;

    // AI-02 weighting hierarchy:
    // 1) in-person/visit highest, 2) call/video high, 3) personal email medium,
    // 4) mass marketing near-zero, 5) event invite without RSVP zero.
    let weight = 0.25;
    if (type === 'visit' || title.includes('in-person') || notes.includes('in-person') || type === 'meeting') weight = 1.0;
    else if (type === 'call' || title.includes('video') || notes.includes('video')) weight = 0.8;
    else if (type === 'email') weight = 0.5;
    else if (type === 'event') weight = 0.35;
    else if (source.includes('marketing') || source.includes('campaign')) weight = 0.08;

    const looksLikeInvite = title.includes('invite') || notes.includes('invite') || notes.includes('rsvp');
    const noRsvpSignal = status === 'open' && type === 'event';
    if (looksLikeInvite && noRsvpSignal) weight = 0;

    // Recency multiplier inside 120-day window
    const recencyMultiplier = Math.max(0.1, 1 - ageDays / 120);
    return sum + weight * recencyMultiplier;
  }, 0);

  return Number(score.toFixed(2));
}

/** AI-15 — financial pulse from YoY revenue history + active matter momentum */
function computeFinancialTrendDirection(company) {
  let score = 0;
  const rh = company.revenueHistory;
  if (Array.isArray(rh) && rh.length >= 2) {
    const last = rh[rh.length - 1]?.value;
    const prev = rh[rh.length - 2]?.value;
    if (typeof last === 'number' && typeof prev === 'number' && prev > 0) {
      const r = (last - prev) / prev;
      if (r > 0.015) score += 1;
      else if (r < -0.015) score -= 1;
    }
  }
  const mc = company.metricsCurrent?.mattersActive;
  const mp = company.metricsPrevious?.mattersActive;
  if (typeof mc === 'number' && typeof mp === 'number') {
    if (mp === 0 && mc > 0) score += 1;
    else if (mp > 0) {
      const d = (mc - mp) / mp;
      if (d > 0.08) score += 1;
      else if (d < -0.08) score -= 1;
    }
  }
  if (score >= 1) return 'growing';
  if (score <= -1) return 'declining';
  return 'flat';
}

function financialPulseLabel(fin) {
  if (fin === 'growing') return 'Growing (revenue and/or matters)';
  if (fin === 'declining') return 'Softening (revenue and/or matters)';
  return 'Flat / mixed';
}

function misalignmentInsights() {
  return getCompanies()
    .map((company, index) => {
      const rel = company.relationshipTrend;
      const fin = computeFinancialTrendDirection(company);
      if (rel === 'Growing' && fin === 'declining') {
        return {
          id: `misalign-rel-up-fin-down-${company.id}`,
          priority: 'Medium',
          tone: index % 2 === 0 ? 'orange' : 'yellow',
          label: 'Misalignment Alert',
          tags: ['Portfolio Risk', company.name],
          title: `${company.name}: warm engagement, cooling commercial signals`,
          description:
            'Relationship data shows momentum, but revenue and/or active-matter traction has dipped — confirm whether scope, staffing, or competition are eroding share despite friendly touchpoints.',
          subject: company.name,
          meta1: `Relationship trend: ${rel}`,
          meta2: `Financial pulse: ${financialPulseLabel(fin)}`,
          meta3: `Revenue ${company.revenue} · Active matters ${company.metricsCurrent?.mattersActive ?? '—'}`,
          suggestion:
            'Pair a partner check-in with a commercial review: pipeline, realization, and matter mix vs peers. Align client team messaging.',
          cta: 'Schedule Follow-up',
        };
      }
      if (rel === 'Declining' && fin === 'growing') {
        return {
          id: `misalign-rel-down-fin-up-${company.id}`,
          priority: 'High',
          tone: index % 2 === 0 ? 'orange' : 'red',
          label: 'Misalignment Alert',
          tags: ['Churn Risk', company.name],
          title: `${company.name}: financial lift with cooling engagement`,
          description:
            'Fees and/or matters are trending up while relationship engagement is declining — revenue may mask sponsor fatigue, staffing changes, or unspoken issues.',
          subject: company.name,
          meta1: `Relationship trend: ${rel}`,
          meta2: `Financial pulse: ${financialPulseLabel(fin)}`,
          meta3: `Client status ${company.clientStatus} · Score ${company.relationshipScore ?? '—'}`,
          suggestion:
            'Schedule a candid sponsor conversation, review service quality threads, and confirm coverage across new matters before renewal conversations.',
          cta: 'Schedule Follow-up',
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 8);
}

function buildContactSourceAttribution(contact) {
  const touchpoints = getTouchpoints().filter((tp) => tp.contactName === contact.name);
  const notes = getContactNotes().filter((n) => n.contactId === contact.id);

  const relationshipInteractions = touchpoints.filter((tp) => {
    if (tp.kind !== 'interaction') return false;
    return String(tp.interactionType || '').toLowerCase() !== 'event';
  }).length;

  const marketingBdActivities = touchpoints.filter((tp) => {
    const interactionType = String(tp.interactionType || '').toLowerCase();
    const source = String(tp.source || '').toLowerCase();
    return interactionType === 'event' || source.startsWith('lists:event-followup');
  }).length;

  const manualLogs = notes.length;

  return `Sources — Relationship: ${relationshipInteractions}, Marketing/BD: ${marketingBdActivities}, Manual: ${manualLogs}`;
}

function priorityFromWeight(weight) {
  if (weight >= 0.098) return 'High';
  if (weight >= 0.095) return 'Medium';
  return 'Low';
}

function percentile(values, p) {
  const arr = (values || []).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!arr.length) return null;
  const clamped = Math.max(0, Math.min(1, p));
  const idx = clamped * (arr.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return arr[lo];
  const w = idx - lo;
  return arr[lo] * (1 - w) + arr[hi] * w;
}

function meanStd(values) {
  const arr = (values || []).filter((v) => Number.isFinite(v));
  if (!arr.length) return { mean: null, std: null };
  const mean = arr.reduce((sum, v) => sum + v, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + ((v - mean) ** 2), 0) / Math.max(1, arr.length);
  const std = Math.sqrt(variance);
  return { mean, std };
}

function fadingRelationshipInsights() {
  const contacts = getContacts();
  const daysScores = contacts
    .map((c) => c.metricsCurrent?.daysSinceLastInteraction)
    .filter((d) => Number.isFinite(d));

  // Statistical aging cohort threshold: contacts in the top ~25% of "days since last interaction".
  // Fallback to legacy 45d cutoff if cohort baseline can't be computed.
  const daysThreshold = percentile(daysScores, 0.75);

  const aged = contacts.filter((contact) => {
    const days = contact.metricsCurrent?.daysSinceLastInteraction;
    const threshold = daysThreshold != null ? daysThreshold : 45;
    return Number.isFinite(days) && days >= threshold;
  });

  const activityScores = aged.map((c) => computeWeightedActivityScore(c));
  const baselineThreshold = percentile(activityScores, 0.25); // P25 low-activity baseline
  const { mean, std } = meanStd(activityScores);

  const eligible = aged
    .filter((contact) => {
      const weightedActivity = computeWeightedActivityScore(contact);
      // Statistical baseline: flag low-activity members vs the cohort distribution.
      // Fallback to legacy constant if baseline can't be computed.
      const threshold = baselineThreshold != null ? baselineThreshold : 1.6;
      return weightedActivity <= threshold;
    })
    .slice(0, 15)
    .map((contact, index) => {
      const weightedActivity = computeWeightedActivityScore(contact);
      const threshold = baselineThreshold != null ? baselineThreshold : 1.6;
      const z = std != null && std > 0 ? (weightedActivity - mean) / std : null;
      const agingLine = `Aging ${daysThreshold != null ? 'P75' : 'legacy'} threshold ${(
        (daysThreshold != null ? daysThreshold : 45) || 45
      ).toFixed(0)} days`;
      const baselineLine = `Low-activity ${baselineThreshold != null ? 'P25' : 'legacy'} threshold ${threshold.toFixed(2)} weighted-activity`;
      return {
        id: `fade-${contact.id}`,
        priority: priorityFromWeight(priorityMap['Fading Relationship'] || 0.096),
        tone: index % 2 === 0 ? 'orange' : 'yellow',
        label: 'Fading Relationship',
        tags: ['Client Coverage', contact.company],
        title: `Re-engage with ${contact.name}`,
        description: `You have not contacted ${contact.name} in ${contact.metricsCurrent.daysSinceLastInteraction} days. ${agingLine}. Weighted activity is ${weightedActivity.toFixed(2)} vs ${baselineLine}.`,
        subject: contact.name,
        meta1: `Last interaction: ${contact.lastInteraction}`,
        meta2: buildContactSourceAttribution(contact),
        meta3: `${agingLine} · ${baselineLine}${z != null ? ` · Z-score ${z.toFixed(2)}` : ''} · Relationship trend ${contact.relationship}`,
        suggestion: `Use internal connection ${contact.internalConnections[0]} to warm the outreach before your follow-up.`,
        cta: 'Create Touchpoint',
        ...cardLastTouchFields(contact),
      };
    });

  return eligible;
}

function untappedPracticeInsights() {
  return getCompanies()
    .filter((company) => company.metricsCurrent.mattersActive <= 1)
    .map((company, index) => {
      const ctx = buildCrossSellPracticeContext(company);
      const first = keyContactFirstName(company);
      const n = company.metricsCurrent.mattersActive;
      const mattersPhrase =
        n === 0 ? 'no active matters' : n === 1 ? 'only one active matter' : `${n} active matters`;
      return {
        id: `practice-${company.id}`,
        priority: priorityFromWeight(priorityMap['Cross-Sell Opportunity'] || 0.094),
        tone: index % 2 === 0 ? 'blue' : 'cyan',
        label: 'Cross-Sell Opportunity',
        tags: ['Practice Growth', company.category2],
        title: ctx.primaryGapPractice
          ? `${company.name}: grow ${ctx.primaryGapPractice}`
          : `${company.name}: cross-practice expansion`,
        description: `${company.name} has ${mattersPhrase}. ${ctx.pitchLine}`,
        subject: company.name,
        meta1: company.engagementTitle,
        meta2: `Revenue ${company.revenue}`,
        meta3: ctx.metaThinVsStrong,
        suggestion: first
          ? `${ctx.pitchLine} Book time with ${first} to align on priorities.`
          : `${ctx.pitchLine} Coordinate with ${company.hierarchy[1] || company.hierarchy[0] || 'the client team'}.`,
        cta: 'Create Opportunity List',
      };
    });
}

function introductionOpportunityContext(contact) {
  const conns = contact.internalConnections || [];
  const primary = conns[0];
  const secondary = conns.slice(1);
  const days = contact.metricsCurrent?.daysSinceLastInteraction ?? 0;
  const firstName =
    String(contact.name || '')
      .trim()
      .split(/\s+/)[0] || contact.name || 'this contact';
  const whoKnowsMeta =
    conns.length <= 2
      ? conns.join(' · ')
      : `${conns.slice(0, 2).join(' · ')} +${conns.length - 2} more`;
  return { primary, secondary, days, firstName, whoKnowsMeta, conns };
}

function internalConnectionInsights() {
  return getContacts()
    .filter((contact) => contact.internalConnections.length > 0 && contact.metricsCurrent.daysSinceLastInteraction >= 45)
    .slice(0, 10)
    .map((contact, index) => {
      const { primary, secondary, days, firstName, whoKnowsMeta } = introductionOpportunityContext(contact);
      const secondaryPhrase = secondary.length
        ? ` Colleagues also connected: ${secondary.join('; ')}.`
        : '';
      return {
        id: `internal-${contact.id}`,
        priority: priorityFromWeight(priorityMap['Introduction Opportunity'] || 0.095),
        tone: index % 2 === 0 ? 'yellow' : 'orange',
        label: 'Introduction Opportunity',
        tags: ['Warm Intro', 'Who Knows Whom', contact.company],
        title: `Who Knows Whom: ${contact.name} (${contact.company})`,
        description: `${primary} is a firm path to ${firstName} at ${contact.company}.${secondaryPhrase} After ${days} days since your last touchpoint, use this internal route before a cold restart.`,
        subject: contact.name,
        meta1: `Last interaction: ${contact.lastInteraction}`,
        meta2: buildContactSourceAttribution(contact),
        meta3: `Who knows them: ${whoKnowsMeta}`,
        suggestion: `Ask ${primary} for a short warm intro or joint touch with ${firstName}; share your topic so they can add credible context.`,
        cta: 'Request Intro',
        ...cardLastTouchFields(contact),
      };
    });
}

function keyClientValueAddGapInsights() {
  return getCompanies()
    .filter((c) => hasValueAddGap(c))
    .slice(0, 10)
    .map((company, index) => {
      const { lowMix, lowQuality, mix } = valueAddGapSignals(company);
      const desc = describeValueAddGap(company);
      const meta2Parts = [];
      if (company.metricsCurrent?.interactionsLast90d != null) {
        meta2Parts.push(`Interactions 90d: ${company.metricsCurrent.interactionsLast90d}`);
      }
      if (lowQuality) {
        meta2Parts.push(`Engagement quality: ${company.metricsCurrent?.engagementQuality ?? '—'}/5`);
      }
      if (lowMix) {
        meta2Parts.push(`BD mix (last quarter): ${mix != null ? `${Math.round(mix * 100)}%` : '—'}`);
      }
      return {
        id: `value-add-gap-${company.id}`,
        priority: priorityFromWeight(priorityMap['Value-Add Coverage Gap'] || 0.095),
        tone: index % 2 === 0 ? 'cyan' : 'blue',
        label: 'Value-Add Coverage Gap',
        tags: ['Key Client', 'Engagement', company.name],
        title: `${company.name}: strengthen firm value-add touchpoints`,
        description:
          desc?.summary ||
          'Strategic account may be under-served by proactive marketing, BD, and relationship outreach.',
        subject: company.name,
        meta1: `Client status: ${company.clientStatus} · Recent engagement ${company.recentEngagement}`,
        meta2: meta2Parts.join(' · ') || 'Review company engagement tab',
        meta3: `Active matters: ${company.metricsCurrent?.mattersActive ?? '—'}`,
        suggestion:
          'Review the engagement history, then schedule a coordinated content, event, or partner touch so the client consistently sees firm value beyond matter work.',
        cta: 'Schedule Follow-up',
      };
    });
}

function engagementTrendInsights() {
  return getCompanies()
    .filter((company) => company.relationshipTrend !== 'Stable')
    .map((company, index) => ({
      id: `trend-${company.id}`,
      priority: company.relationshipTrend === 'Declining' ? 'High' : 'Medium',
      tone: index % 2 === 0 ? 'cyan' : 'blue',
      label: 'Client Engagement Trend',
      tags: ['Engagement Trend', company.relationshipTrend],
      title: `${company.name} engagement is ${company.relationshipTrend.toLowerCase()}`,
      description: `Score moved to ${company.relationshipScore}. Track two-way activity and next interactions.`,
      subject: company.name,
      meta1: company.engagementTitle,
      meta2: `Recent engagement ${company.recentEngagement}`,
      meta3: `Client status ${company.clientStatus}`,
      suggestion: `Schedule a targeted check-in with ${company.keyContacts[0]} and align on current matters.`,
      cta: 'Schedule Follow-up',
    }));
}

function initialEngagementInsights() {
  return getContacts()
    .filter((c) => c.metricsCurrent.interactionsLast90d === 0)
    .slice(0, 5)
    .map((contact, index) => ({
      id: `initial-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Initial Engagement'] || 0.093),
      tone: index % 2 === 0 ? 'blue' : 'green',
      label: 'Initial Engagement',
      tags: ['New Contact', contact.company],
      title: `Introduce yourself to ${contact.name}`,
      description: `${contact.name} was recently added but has no touchpoints. Initiate first contact.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: `Company: ${contact.company}`,
      meta3: `City: ${contact.city || 'Unknown'}`,
      suggestion: `Send a brief introductory email referencing a mutual interest or recent company news.`,
      cta: 'Draft Outreach',
      ...cardLastTouchFields(contact),
    }));
}

function eventRecommendationInsights() {
  return getContacts()
    .filter((_, i) => i % 12 === 0)
    .slice(0, 4)
    .map((contact, index) => ({
      id: `event-rec-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Event Recommendation'] || 0.095),
      tone: index % 2 === 0 ? 'green' : 'cyan',
      label: 'Event Recommendation',
      tags: ['Engagement', contact.company],
      title: `Invite ${contact.name} to upcoming event`,
      description: `${contact.name}'s interests align with an upcoming firm event. A personal invite could strengthen the relationship.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: buildContactSourceAttribution(contact),
      meta3: `Last interacted: ${contact.lastInteracted}`,
      suggestion: `Send a personalized event invitation highlighting topics relevant to ${contact.name}'s work.`,
      cta: 'Draft Outreach',
      ...cardLastTouchFields(contact),
    }));
}

function litigationFilingInsights() {
  return getCompanies()
    .filter((co) => co.matters?.some((m) => m.practiceArea === 'Litigation' && m.status === 'Active'))
    .slice(0, 3)
    .map((company, index) => ({
      id: `lit-filing-${company.id}`,
      priority: priorityFromWeight(priorityMap['Litigation Filing'] || 0.097),
      tone: 'orange',
      label: 'Litigation Filing',
      tags: ['Legal Alert', company.name],
      title: `Active litigation detected for ${company.name}`,
      description: `${company.name} has an active litigation matter. Ensure the team is aligned and the client is supported.`,
      subject: company.name,
      meta1: `Active matters: ${company.metricsCurrent.mattersActive}`,
      meta2: `Client status: ${company.clientStatus}`,
      meta3: `Revenue: ${company.revenue}`,
      suggestion: `Coordinate with the litigation team and check in with the key contact about case progress.`,
      cta: 'Schedule Follow-up',
    }));
}

function upcomingMeetingInsights() {
  return getContacts()
    .filter((c) => c.metricsCurrent.daysSinceLastInteraction <= 14 && c.metricsCurrent.interactionsLast90d >= 3)
    .slice(0, 4)
    .map((contact, index) => ({
      id: `meeting-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Upcoming Meeting'] || 0.098),
      tone: index % 2 === 0 ? 'blue' : 'green',
      label: 'Upcoming Meeting',
      tags: ['Preparation', contact.company],
      title: `Prepare for meeting with ${contact.name}`,
      description: `You have recent activity with ${contact.name}. Review notes and prepare talking points.`,
      subject: contact.name,
      meta1: `Last interacted: ${contact.lastInteracted}`,
      meta2: buildContactSourceAttribution(contact),
      meta3: `Relationship: ${contact.relationship}`,
      suggestion: `Review recent notes and gather 3 relevant updates before your next meeting.`,
      cta: 'Create Touchpoint',
      ...cardLastTouchFields(contact),
    }));
}

function pertinentClientAlertInsights() {
  return getContacts()
    .filter((_, i) => i % 15 === 0)
    .slice(0, 3)
    .map((contact, index) => ({
      id: `client-alert-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Pertinent Client Alert'] || 0.099),
      tone: 'orange',
      label: 'Pertinent Client Alert',
      tags: ['Content Match', contact.company],
      title: `New firm content relevant to ${contact.name}`,
      description: `Recently published firm content matches ${contact.name}'s interests. Share it to add value.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: `Company: ${contact.company}`,
      meta3: `Relationship: ${contact.relationship}`,
      suggestion: `Forward the content with a personal note explaining its relevance to their current work.`,
      cta: 'Share Content',
      ...cardLastTouchFields(contact),
    }));
}

function newRolePromotionInsights() {
  return getContacts()
    .filter((_, i) => i % 5 === 0)
    .slice(0, 3)
    .map((contact) => ({
      id: `role-change-${contact.id}`,
      priority: 'High',
      tone: 'orange',
      label: 'Job Change',
      tags: ['Career Move', contact.company],
      title: `${contact.name} has a new role`,
      description: `${contact.name} appears to have been promoted or changed roles. This is a great opportunity to re-engage.`,
      subject: contact.name,
      meta1: `Current role: ${contact.role}`,
      meta2: `Company: ${contact.company}`,
      meta3: `Relationship: ${contact.relationship}`,
      suggestion: `Send a congratulatory note and explore how the new role might create opportunities for expanded engagement.`,
      cta: 'Draft Outreach',
      ...cardLastTouchFields(contact),
    }));
}

function companyNewsInsights() {
  return getCompanies()
    .slice(0, 3)
    .map((company, index) => {
      const taggedNews = Array.isArray(company.newsItems) ? company.newsItems : [];
      const prioritized =
        taggedNews.find((n) => n.type === 'RFP') ||
        taggedNews.find((n) => n.type === 'M&A') ||
        taggedNews.find((n) => n.type === 'Leadership') ||
        taggedNews.find((n) => n.type === 'Regulatory') ||
        taggedNews[0];

      const newsType = prioritized?.type || 'Company News';
      const newsTitle = prioritized?.title || `${company.name}: recent news coverage`;
      const newsDate = prioritized?.date || 'N/A';
      const newsSource = prioritized?.source || 'News feed';
      const newsSummary =
        prioritized?.summary ||
        `${company.name} has recent external activity worth reviewing for outreach timing.`;

      return {
        id: `news-${company.id}`,
        priority: newsType === 'RFP' || newsType === 'M&A' ? 'High' : 'Medium',
        tone: index % 2 === 0 ? 'blue' : 'green',
        label: 'Company News',
        tags: ['Market Intelligence', company.name, newsType],
        title: newsTitle,
        description: newsSummary,
        subject: company.name,
        meta1: `${newsType} · ${newsSource}`,
        meta2: `Date: ${newsDate}`,
        meta3: `Client status: ${company.clientStatus}`,
        suggestion: `Use this ${newsType.toLowerCase()} update to tailor outreach and propose relevant next steps.`,
        cta: 'Share Content',
      };
    });
}

function lawyerLabelForCoordination(entry) {
  const s = String(entry || '');
  const i = s.indexOf(' (');
  return i >= 0 ? s.slice(0, i).trim() : s.trim();
}

function teamCoordinationSignal(contact) {
  const parallel = contact.coordinationPeers;
  if (Array.isArray(parallel) && parallel.length >= 2) {
    return { peers: parallel, source: 'parallel' };
  }
  const ic = contact.internalConnections || [];
  if (ic.length > 1) return { peers: ic, source: 'multiPath' };
  return { peers: [], source: null };
}

function teamCoordinationInsights() {
  return getContacts()
    .filter((c) => teamCoordinationSignal(c).peers.length >= 2)
    .slice(0, 6)
    .map((contact, index) => {
      const { peers, source } = teamCoordinationSignal(contact);
      const a = peers[0];
      const b = peers[1];
      const isParallel = source === 'parallel';
      const others = peers.length > 2 ? peers.length - 2 : 0;
      const description = isParallel
        ? `Within the past few days, ${lawyerLabelForCoordination(a)} and ${lawyerLabelForCoordination(b)} both logged firm activity with ${contact.name} at ${contact.company}. Align sequencing before the client hears overlapping messages.${
            others ? ` (+${others} other colleague${others > 1 ? 's' : ''} tied in)` : ''
          }`
        : `Multiple colleagues are mapped to ${contact.name} at ${contact.company}. Confirm who owns the next touch and share a short internal recap before outreach.${
            others ? ` (+${others} additional connector${others > 1 ? 's' : ''})` : ''
          }`;
      return {
        id: `team-coord-${contact.id}`,
        priority: priorityFromWeight(priorityMap['Team Coordination Alert'] || 0.095),
        tone: index % 2 === 0 ? 'yellow' : 'orange',
        label: 'Team Coordination Alert',
        tags: ['Coordination', 'Team', contact.company],
        title: isParallel ? `Parallel outreach risk: ${contact.name}` : `Coordinate before contacting ${contact.name}`,
        description,
        subject: contact.name,
        meta1: isParallel
          ? `Recent firm touches: ${peers
              .slice(0, 3)
              .map(lawyerLabelForCoordination)
              .join(' · ')}${peers.length > 3 ? ` +${peers.length - 3}` : ''}`
          : `Mapped connectors: ${peers.join('; ')}`,
        meta2: buildContactSourceAttribution(contact),
        meta3: isParallel ? 'Signal: overlapping lawyer activity' : 'Signal: multiple internal relationship paths',
        suggestion: isParallel
          ? `Huddle with ${lawyerLabelForCoordination(a)} and ${lawyerLabelForCoordination(b)} on who follows up first and with what single client-facing message.`
          : `Name a lead for ${contact.name.split(/\s+/)[0] || 'this contact'}'s next touch and loop ${lawyerLabelForCoordination(a)} before you go external.`,
        cta: 'View Connections',
        ...cardLastTouchFields(contact),
      };
    });
}

function crossSellInsights() {
  return getCompanies()
    .filter((co) => co.metricsCurrent.mattersActive >= 2)
    .slice(0, 3)
    .map((company, index) => {
      const ctx = buildCrossSellPracticeContext(company);
      const first = keyContactFirstName(company);
      return {
        id: `cross-sell-${company.id}`,
        priority: priorityFromWeight(priorityMap['Cross-Sell Opportunity'] || 0.094),
        tone: index % 2 === 0 ? 'cyan' : 'blue',
        label: 'Cross-Sell Opportunity',
        tags: ['Revenue Growth', company.name],
        title:
          ctx.anchorPractice && ctx.primaryGapPractice
            ? `${company.name}: balance ${ctx.anchorPractice} with ${ctx.primaryGapPractice}`
            : `Cross-practice depth at ${company.name}`,
        description: `${company.name} runs ${company.metricsCurrent.mattersActive} active matters; practice mix still shows room to deepen weaker lines. ${ctx.pitchLine}`,
        subject: company.name,
        meta1: `Active matters: ${company.metricsCurrent.mattersActive}`,
        meta2: company.revenue ? `Revenue: ${company.revenue}` : company.engagementTitle,
        meta3: ctx.metaThinVsStrong,
        suggestion: first
          ? `Propose a short cross-practice review with ${first}. ${ctx.pitchLine}`
          : `Propose a practice overview with ${company.hierarchy[1] || company.hierarchy[0] || 'stakeholders'}. ${ctx.pitchLine}`,
        cta: 'Create Opportunity List',
      };
    });
}

function birthdaySpecialEventInsights() {
  return getContacts()
    .filter((c) => c.specialDates?.birthday)
    .slice(0, 5)
    .map((contact) => ({
      id: `birthday-${contact.id}`,
      priority: 'Low',
      tone: 'green',
      label: 'Special Date',
      tags: ['Personal Touch', contact.company],
      title: `${contact.name}'s birthday is coming up`,
      description: `Birthday: ${contact.specialDates.birthday}. A personal touch can strengthen the relationship.`,
      subject: contact.name,
      meta1: `Birthday: ${contact.specialDates.birthday}`,
      meta2: `Relationship: ${contact.relationship}`,
      meta3: `Company: ${contact.company}`,
      suggestion: `Send a brief, personal birthday message to maintain warmth in the relationship.`,
      cta: 'Create Touchpoint',
      ...cardLastTouchFields(contact),
    }));
}

function jobChangeBadgeInsights() {
  return getContacts()
    .filter((c) => (c.contactBadges || []).includes('job-change'))
    .slice(0, 3)
    .map((contact) => ({
      id: `badge-job-${contact.id}`,
      priority: 'High',
      tone: 'orange',
      label: 'Job Change Alert',
      tags: ['Career Move', contact.company],
      title: `${contact.name} — job change detected`,
      description: `${contact.name} has a job change badge. This may signal a new opportunity or risk.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: `Company: ${contact.company}`,
      meta3: `Score: ${contact.relationshipScore}`,
      suggestion: `Reach out promptly to congratulate and explore the implications for your engagement.`,
      cta: 'Draft Outreach',
      ...cardLastTouchFields(contact),
    }));
}

function buildBadgeInsight(badgeId, {
  idPrefix,
  priority = 'Medium',
  tone = 'blue',
  label,
  titleFor,
  descriptionFor,
  suggestionFor,
  cta = 'Draft Outreach',
}) {
  const badgeLabel = BADGE_MAP[badgeId]?.label || label;
  return getContacts()
    .filter((c) => (c.contactBadges || []).includes(badgeId))
    .slice(0, 4)
    .map((contact) => ({
      id: `${idPrefix}-${contact.id}`,
      priority,
      tone,
      label: label || `${badgeLabel} Alert`,
      tags: [badgeLabel, contact.company],
      title: titleFor(contact),
      description: descriptionFor(contact),
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: buildContactSourceAttribution(contact),
      meta3: `Relationship: ${contact.relationship}`,
      suggestion: suggestionFor(contact),
      cta,
      ...cardLastTouchFields(contact),
    }));
}

function digitalEngagementBadgeInsights() {
  return buildBadgeInsight('digital-engagement', {
    idPrefix: 'badge-digital',
    priority: 'Medium',
    tone: 'cyan',
    label: 'Digital Engagement',
    titleFor: (contact) => `${contact.name} shows strong digital engagement`,
    descriptionFor: (contact) =>
      `${contact.name} has recent digital signals worth converting into a direct relationship touchpoint.`,
    suggestionFor: (contact) =>
      `Follow up with ${contact.name} using a short message tied to their recent digital engagement.`,
    cta: 'Create Touchpoint',
  });
}

function pertinentContentBadgeInsights() {
  return buildBadgeInsight('pertinent-content', {
    idPrefix: 'badge-content',
    priority: 'Medium',
    tone: 'orange',
    label: 'Pertinent Content',
    titleFor: (contact) => `Share targeted content with ${contact.name}`,
    descriptionFor: (contact) =>
      `${contact.name} has a content match signal. Sharing relevant material can keep momentum high.`,
    suggestionFor: (contact) =>
      `Send one relevant update to ${contact.name} and include a short point on why it matters now.`,
    cta: 'Share Content',
  });
}

function eventMatchBadgeInsights() {
  return buildBadgeInsight('event-match', {
    idPrefix: 'badge-event',
    priority: 'Medium',
    tone: 'green',
    label: 'Event Match',
    titleFor: (contact) => `${contact.name} is a candidate for event outreach`,
    descriptionFor: (contact) =>
      `${contact.name} is likely a fit for an upcoming firm event based on event-match signals.`,
    suggestionFor: (contact) =>
      `Invite ${contact.name} to the most relevant event and personalize the outreach with a clear value hook.`,
    cta: 'Draft Outreach',
  });
}

function visitTouchpointBadgeInsights() {
  return getContacts()
    .filter((c) => (c.contactBadges || []).includes('visit'))
    .slice(0, 4)
    .map((contact) => ({
      id: `badge-visit-${contact.id}`,
      priority: 'Medium',
      tone: 'yellow',
      label: 'Visit Touchpoint',
      tags: ['Visit', contact.company],
      title: `Plan a visit touchpoint with ${contact.name}`,
      description: `${contact.name} is flagged for an in-person or client-site visit to deepen the relationship.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: buildContactSourceAttribution(contact),
      meta3: `${contact.city || 'Location TBD'} · Relationship ${contact.relationship}`,
      suggestion:
        'Schedule a pre-visit brief, align on objectives, and plan post-visit follow-ups while travel or site access is fresh.',
      cta: 'Create Touchpoint',
      ...cardLastTouchFields(contact),
    }));
}

function meetingPreparationInsights() {
  const contactsByName = new Map(getContacts().map((c) => [c.name, c]));
  return getUpcomingMeetingTouchpoints(7)
    .slice(0, 8)
    .map((tp, index) => {
      const contact = contactsByName.get(tp.contactName);
      const company = contact?.company || tp.company || 'Client';
      const dueDate = tp.dueAt ? new Date(tp.dueAt) : null;
      const dateLabel = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toLocaleDateString() : 'Upcoming';
      return {
        id: `meeting-prep-${tp.id}`,
        priority: priorityFromWeight(priorityMap['Upcoming Meeting'] || 0.098),
        tone: index % 2 === 0 ? 'blue' : 'cyan',
        label: 'Meeting Preparation',
        tags: ['Preparation', company],
        title: `Prepare for upcoming meeting with ${tp.contactName}`,
        description: `A scheduled ${tp.interactionType || 'meeting'} is coming up on ${dateLabel}. Review context and align talking points.`,
        subject: tp.contactName || company,
        meta1: `Scheduled: ${dateLabel}`,
        meta2: contact ? buildContactSourceAttribution(contact) : `Source: ${tp.source || 'Calendar sync'}`,
        meta3: `Topic: ${tp.title || 'Client follow-up'}`,
        suggestion: `Open recent interactions and notes for ${tp.contactName}, then prepare 3 concise discussion points before the meeting.`,
        cta: 'Create Touchpoint',
        ...cardLastTouchFields(contact),
      };
    });
}

export function generateInsightCards() {
  return [
    ...fadingRelationshipInsights(),
    ...untappedPracticeInsights(),
    ...internalConnectionInsights(),
    ...engagementTrendInsights(),
    ...keyClientValueAddGapInsights(),
    ...misalignmentInsights(),
    ...initialEngagementInsights(),
    ...eventRecommendationInsights(),
    ...litigationFilingInsights(),
    ...upcomingMeetingInsights(),
    ...pertinentClientAlertInsights(),
    ...newRolePromotionInsights(),
    ...companyNewsInsights(),
    ...teamCoordinationInsights(),
    ...crossSellInsights(),
    ...birthdaySpecialEventInsights(),
    ...jobChangeBadgeInsights(),
    ...digitalEngagementBadgeInsights(),
    ...pertinentContentBadgeInsights(),
    ...eventMatchBadgeInsights(),
    ...visitTouchpointBadgeInsights(),
    ...meetingPreparationInsights(),
  ];
}

// Legacy export for backward compatibility — generates fresh on each access
export const insightCards = generateInsightCards();
