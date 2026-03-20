import { companyRows } from '../constants/companies';
import { contactRows } from '../constants/contacts';
import { touchpointRows as legacyTouchpoints } from '../constants/touchpoints';
import { listRows as staticLists } from '../constants/lists';
import { calculateRelationshipStrength } from '../utils/relationshipStrength';

// Client-provided mock DB (taxonomy + identity).
// We'll normalize it into the app's expected schema and append it.
import clientTagsRaw from '../../../demo-data/tags.json';
import clientContactsRaw from '../../../demo-data/contacts.json';
import clientCompaniesRaw from '../../../demo-data/companies.json';

function pick(list, index) {
  return list[index % list.length];
}

function isoDaysFromNow(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function toIsoFromMmDdYy(mmddyy) {
  const match = String(mmddyy).match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  const [, mm, dd, yy] = match;
  const year = 2000 + Number(yy);
  const d = new Date(Date.UTC(year, Number(mm) - 1, Number(dd), 13, 0, 0));
  return d.toISOString();
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function hashToUnit(value) {
  // Deterministic 0..1 from a string.
  const str = String(value ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatMmDd(dateSeed, offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const mm = String(clamp(1 + Math.floor((hashToUnit(dateSeed) * 12) % 12), 1, 12)).padStart(2, '0');
  const dd = String(1 + Math.floor((hashToUnit(`${dateSeed}-day`) * 28) % 28)).padStart(2, '0');
  return `${mm}/${dd}`;
}

function pickFrom(arr, seedValue) {
  if (!arr.length) return undefined;
  const idx = Math.floor(hashToUnit(seedValue) * arr.length);
  return arr[idx];
}

function generateMockNamePool() {
  return ['Aria', 'Naomi', 'Ravi', 'Shanon', 'Derek', 'Molly', 'Jeff', 'Jenny', 'Ken', 'Lena', 'Omar', 'Priya'];
}

function makeTaskFromLegacy(row) {
  return {
    id: row.id,
    kind: 'interaction',
    status: 'completed',
    createdAt: toIsoFromMmDdYy(row.date) || new Date().toISOString(),
    dueAt: null,
    completedAt: toIsoFromMmDdYy(row.date) || new Date().toISOString(),
    cancelledAt: null,
    contactName: row.contactName,
    company: row.company,
    role: row.role,
    interactionType: row.interactionType,
    title: row.interactionTitle,
    outcome: row.outcome,
    notes: row.notes,
    followUpDate: row.followUpDate,
    history: row.history || [],
    avatarUrl: row.avatarUrl,
    signalTone: row.signalTone,
    relationshipStatus: row.relationshipStatus,
    relationshipScore: row.relationshipScore,
    lastInteracted: row.lastInteracted,
    source: 'seed',
  };
}

function makePlannedTouchpoint({ id, contact, dueDaysFromNow, title, description }) {
  return {
    id,
    kind: 'task',
    status: 'open',
    createdAt: new Date().toISOString(),
    dueAt: isoDaysFromNow(dueDaysFromNow),
    completedAt: null,
    cancelledAt: null,
    contactName: contact.name,
    company: contact.company,
    role: contact.role,
    interactionType: 'Follow-up',
    title,
    outcome: '',
    notes: description,
    followUpDate: '',
    history: [],
    avatarUrl: contact.avatarUrl,
    signalTone: contact.signalTone,
    relationshipStatus: contact.relationship,
    relationshipScore: contact.relationshipScore,
    lastInteracted: contact.lastInteracted,
    source: 'seed',
  };
}

const SIGNAL_TONES = ['blue', 'green', 'yellow', 'orange', 'cyan'];
const PRACTICE_OPTIONS = ['Corporate', 'Litigation', 'Regulatory'];
const OFFICES = ['Toronto', 'Calgary', 'Vancouver'];

function transformClientTags(clientTags) {
  const tagsBase = Array.isArray(clientTags) ? clientTags : [];
  return tagsBase.map((t, idx) => {
    const label = t.tagName || '';
    const type = t.tagType || 'Other';
    return {
      id: `ct-${idx + 1}-${slugify(label)}-${slugify(type)}`,
      label,
      type,
    };
  });
}

function transformClientCompanies(clientCompanies, clientContacts) {
  const companiesBase = Array.isArray(clientCompanies) ? clientCompanies : [];
  const contactsBase = Array.isArray(clientContacts) ? clientContacts : [];

  // Generate relationships/metrics first; then we'll fill keyContacts below.
  const companies = companiesBase.map((co, idx) => {
    const name = co.companyName || '';
    const seed = `${name}-${idx}`;
    const accountType = co.accountType || 'Client';
    const industryTag = pickFrom(clientTagsFromContactsFallback(clientContacts, idx), seed) || 'Technology';

    const category1 = accountType;
    const category2 = industryTag;

    const baseRevenue = 0.6 + hashToUnit(`${seed}-rev`) * 2.4; // in $M
    const recentDays = Math.floor(hashToUnit(`${seed}-days`) * 60);
    const statusOptions = ['Good', 'At Risk', 'Needs Attention', 'Improving'];
    const clientStatus = pickFrom(statusOptions, `${seed}-status`);

    const metricsCurrent = {
      daysSinceLastInteraction: clamp(Math.floor(hashToUnit(`${seed}-dsi`) * 120), 0, 140),
      interactionsLast90d: clamp(Math.floor(hashToUnit(`${seed}-i90`) * 20), 0, 20),
      engagementQuality: clamp(Math.floor(hashToUnit(`${seed}-eq`) * 5) + 1, 1, 5),
      mattersActive: clamp(Math.floor(hashToUnit(`${seed}-mat`) * 4) + 1, 0, 5),
      twoWayRatio: clamp(hashToUnit(`${seed}-tw`) * 0.95, 0.05, 0.95),
    };

    const metricsPrevious = {
      daysSinceLastInteraction: clamp(Math.floor(hashToUnit(`${seed}-prev-dsi`) * 120), 0, 140),
      interactionsLast90d: clamp(Math.floor(hashToUnit(`${seed}-prev-i90`) * 20), 0, 20),
      engagementQuality: clamp(Math.floor(hashToUnit(`${seed}-prev-eq`) * 5) + 1, 1, 5),
      mattersActive: clamp(Math.floor(hashToUnit(`${seed}-prev-mat`) * 4) + 1, 0, 5),
      twoWayRatio: clamp(hashToUnit(`${seed}-prev-tw`) * 0.95, 0.05, 0.95),
    };

    const relationship = calculateRelationshipStrength(metricsCurrent, metricsPrevious);

    const practiceShareRaw = PRACTICE_OPTIONS.map((p, pIdx) => {
      const v = 10 + Math.floor(hashToUnit(`${seed}-ps-${pIdx}`) * 80);
      return { practice: p, value: v };
    });
    const psTotal = practiceShareRaw.reduce((sum, x) => sum + x.value, 0) || 1;
    const practiceShare = practiceShareRaw.map((x) => ({
      practice: x.practice,
      value: Math.max(5, Math.round((x.value / psTotal) * 100)),
    }));
    // Normalize to 100% (roughly; keep demo-friendly).
    const shareSum = practiceShare.reduce((s, x) => s + x.value, 0);
    if (shareSum !== 100 && practiceShare.length) {
      practiceShare[0].value = clamp(practiceShare[0].value + (100 - shareSum), 0, 100);
    }

    const revenueHistory = [
      { period: '2022', value: Math.max(0.1, baseRevenue * (0.75 + hashToUnit(`${seed}-y0`) * 0.3)) },
      { period: '2023', value: Math.max(0.1, baseRevenue * (0.85 + hashToUnit(`${seed}-y1`) * 0.4)) },
      { period: '2024', value: Math.max(0.1, baseRevenue * (0.95 + hashToUnit(`${seed}-y2`) * 0.5)) },
    ];

    const revenueByPracticeOffice = {};
    PRACTICE_OPTIONS.forEach((p, pIdx) => {
      const scale = 0.2 + hashToUnit(`${seed}-rbo-${pIdx}`) * 1.1;
      revenueByPracticeOffice[p] = {
        [OFFICES[0]]: Math.max(0.05, scale * (0.6 + hashToUnit(`${seed}-${p}-t0`) * 0.8)),
        [OFFICES[1]]: Math.max(0.05, scale * (0.3 + hashToUnit(`${seed}-${p}-t1`) * 0.6)),
      };
    });

    const mattersTrends = [
      { year: '2022', revenue: Math.round(revenueHistory[0].value * 1000000), hours: 5000 + Math.floor(hashToUnit(`${seed}-h0`) * 7000), realization: 85 + Math.floor(hashToUnit(`${seed}-rl0`) * 15) },
      { year: '2023', revenue: Math.round(revenueHistory[1].value * 1000000), hours: 5000 + Math.floor(hashToUnit(`${seed}-h1`) * 7000), realization: 85 + Math.floor(hashToUnit(`${seed}-rl1`) * 15) },
      { year: '2024', revenue: Math.round(revenueHistory[2].value * 1000000), hours: 5000 + Math.floor(hashToUnit(`${seed}-h2`) * 7000), realization: 85 + Math.floor(hashToUnit(`${seed}-rl2`) * 15) },
    ];

    const opportunityActivity = [
      { period: '2023 Q1', bdActivity: 2 + Math.floor(hashToUnit(`${seed}-q1`) * 12), totalActivities: 8 + Math.floor(hashToUnit(`${seed}-t1`) * 18) },
      { period: '2023 Q2', bdActivity: 2 + Math.floor(hashToUnit(`${seed}-q2`) * 12), totalActivities: 8 + Math.floor(hashToUnit(`${seed}-t2`) * 18) },
      { period: '2023 Q3', bdActivity: 2 + Math.floor(hashToUnit(`${seed}-q3`) * 12), totalActivities: 8 + Math.floor(hashToUnit(`${seed}-t3`) * 18) },
      { period: '2023 Q4', bdActivity: 2 + Math.floor(hashToUnit(`${seed}-q4`) * 12), totalActivities: 8 + Math.floor(hashToUnit(`${seed}-t4`) * 18) },
    ];

    const companiesSeedMatter = [
      {
        id: `m-${idx}-1`,
        openDate: formatMmDd(seed, idx + 20),
        status: pickFrom(['Active', 'In Conflicts', 'Closed'], `${seed}-mstat`),
        name: pickFrom(
          ['Commercial Agreements Review', 'Privacy Program Overhaul', 'Regulatory Compliance Support', 'AI Governance Framework'],
          `${seed}-mname`
        ),
        practiceArea: pickFrom(PRACTICE_OPTIONS, `${seed}-mpra`),
      },
      {
        id: `m-${idx}-2`,
        openDate: formatMmDd(seed, idx + 60),
        status: pickFrom(['Active', 'In Conflicts', 'Closed'], `${seed}-mstat2`),
        name: pickFrom(
          ['Competition Review – APAC Expansion', 'Driver Classification Litigation', 'Data Breach Incident Response'],
          `${seed}-mname2`
        ),
        practiceArea: pickFrom(PRACTICE_OPTIONS, `${seed}-mpra2`),
      },
    ];

    const companiesSeedOpps = [
      {
        id: `o-${idx}-1`,
        date: formatMmDd(seed, idx + 10),
        status: pickFrom(['Pending', 'Won', 'Lost'], `${seed}-ostatus`),
        name: pickFrom(
          ['Unified Communications Suite Launch', 'Privacy Program Overhaul', 'Cross-border Data Transfer Program'],
          `${seed}-oname`
        ),
        type: pickFrom(['Pitch', 'RFP', 'Panel'], `${seed}-otype`),
      },
      {
        id: `o-${idx}-2`,
        date: formatMmDd(seed, idx + 35),
        status: pickFrom(['Pending', 'Won', 'Lost'], `${seed}-ostatus2`),
        name: pickFrom(
          ['AI Safety Advisory Panel', 'Global Mobility Program', 'Strategic Target Opportunity'],
          `${seed}-oname2`
        ),
        type: pickFrom(['Pitch', 'RFP', 'Panel'], `${seed}-otype2`),
      },
    ];

    return {
      id: `client-co-${idx + 1}`,
      name,
      category1,
      category2,
      engagementTitle: `Engagement scheduled for ${formatMmDd(seed, 2)}`,
      recentEngagement: recentDays <= 0 ? 'Today' : `${recentDays} days ago`,
      clientStatus,
      logo: slugify(name) || `company-${idx + 1}`,
      // Client DB provides avatar filenames like "Sony-Logo.png".
      // UI resolves these filenames to actual bundled assets.
      avatarUrl: co.avatarUrl || co.logoUrl || '',
      revenue: `$${baseRevenue.toFixed(1)}M`,
      hierarchy: [`${name} (Parent)`, `${name} Legal Team`, `${name} Operations`],
      keyContacts: [],
      recentInteractions: [],
      relationshipHistory: [
        `Q1 2025: ${pickFrom(['Growing', 'Stable', 'Declining'], `${seed}-rh0`)}`,
        `Q2 2025: ${pickFrom(['Growing', 'Stable', 'Declining'], `${seed}-rh1`)}`,
        `Q3 2025: ${pickFrom(['Growing', 'Stable', 'Declining'], `${seed}-rh2`)}`,
      ],
      metricsCurrent,
      metricsPrevious,
      revenueHistory,
      practiceShare,
      revenueByPracticeOffice,
      mattersTrends,
      opportunityActivity,
      matters: companiesSeedMatter,
      opportunities: companiesSeedOpps,
      relationshipTrend: relationship.trend,
      relationshipScore: relationship.score,
    };
  });

  // Fill keyContacts + recentInteractions from assigned contacts.
  const contactsByCompany = {};
  contactsBase.forEach((c) => {
    if (!c?.company) return;
    contactsByCompany[c.company] = contactsByCompany[c.company] || [];
    contactsByCompany[c.company].push(c.name);
  });

  companies.forEach((c) => {
    const assigned = contactsByCompany[c.name] || [];
    c.keyContacts = assigned.slice(0, 2);
    c.recentInteractions = [
      `${formatMmDd(c.name, 10)}: Shared compliance summary`,
      `${formatMmDd(c.name, 25)}: Follow-up thread with legal team`,
      `${formatMmDd(c.name, 40)}: Engagement update request`,
    ];
    if (!c.keyContacts.length && contactsBase.length) {
      c.keyContacts = [contactsBase[0]?.name].filter(Boolean);
    }
  });

  return companies;
}

// Helper: because we are generating everything, we need a fallback “industry tag”
// source even if we didn't fully map client tags to companies.
function clientTagsFromContactsFallback(clientContacts, idx) {
  // Use contact job titles as a crude proxy for industry naming.
  const companyIndustryHints = ['Technology', 'Financial Services', 'Biotech', 'Healthcare', 'Retail', 'Defense', 'Semiconductors'];
  const seed = `${idx}-${(clientContacts?.[idx]?.jobTitle || '')}`;
  return [pickFrom(companyIndustryHints, seed)];
}

function transformClientContacts(clientContacts, transformedCompanies) {
  const contactsBase = Array.isArray(clientContacts) ? clientContacts : [];
  const companies = Array.isArray(transformedCompanies) ? transformedCompanies : [];

  const namePool = generateMockNamePool();
  return contactsBase.map((ct, idx) => {
    const firstName = ct.firstName || '';
    const lastName = ct.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    const seed = `${name}-${idx}`;

    const company = companies.length ? companies[idx % companies.length].name : 'Unknown Company';

    const country = ct.address?.country || '';
    const state = ct.address?.state || '';
    const city = ct.address?.city || '';
    const region =
      country.toLowerCase().includes('canada') ? 'Canada' : country.toLowerCase().includes('usa') || country.toLowerCase().includes('united states') ? 'United States' : state || country || 'Other';

    const metricsCurrent = {
      daysSinceLastInteraction: clamp(Math.floor(hashToUnit(`${seed}-dsi`) * 140), 0, 160),
      interactionsLast90d: clamp(Math.floor(hashToUnit(`${seed}-i90`) * 20), 0, 20),
      engagementQuality: clamp(Math.floor(hashToUnit(`${seed}-eq`) * 5) + 1, 1, 5),
      mattersActive: clamp(Math.floor(hashToUnit(`${seed}-mat`) * 4), 0, 5),
      twoWayRatio: clamp(hashToUnit(`${seed}-tw`) * 0.95, 0.05, 0.95),
    };

    const metricsPrevious = {
      daysSinceLastInteraction: clamp(Math.floor(hashToUnit(`${seed}-prev-dsi`) * 140), 0, 160),
      interactionsLast90d: clamp(Math.floor(hashToUnit(`${seed}-prev-i90`) * 20), 0, 20),
      engagementQuality: clamp(Math.floor(hashToUnit(`${seed}-prev-eq`) * 5) + 1, 1, 5),
      mattersActive: clamp(Math.floor(hashToUnit(`${seed}-prev-mat`) * 4), 0, 5),
      twoWayRatio: clamp(hashToUnit(`${seed}-prev-tw`) * 0.95, 0.05, 0.95),
    };

    const relationship = calculateRelationshipStrength(metricsCurrent, metricsPrevious);

    const fakeInternal = [
      `${pickFrom(namePool, `${seed}-int1`)} ${pickFrom(namePool, `${seed}-int1b`)} (Partner)`,
      `${pickFrom(namePool, `${seed}-int2`)} ${pickFrom(namePool, `${seed}-int2b`)} (Associate)`,
    ];

    const relationshipHistory = [
      `Q1 2025: ${pickFrom(['Growing', 'Stable', 'Declining'], `${seed}-rh0`)}`,
      `Q2 2025: ${pickFrom(['Growing', 'Stable', 'Declining'], `${seed}-rh1`)}`,
      `Q3 2025: ${pickFrom(['Growing', 'Stable', 'Declining'], `${seed}-rh2`)}`,
    ];

    const recentInteractions = [
      `${formatMmDd(seed, 5)}: Shared regulatory briefing`,
      `${formatMmDd(seed, 20)}: Follow-up thread with internal counsel`,
      `${formatMmDd(seed, 55)}: Update request on matters status`,
    ];

    const lastInteractedDays = metricsCurrent.daysSinceLastInteraction;
    return {
      id: `client-contact-${idx + 1}`,
      name: name || `Client ${idx + 1}`,
      role: ct.jobTitle || 'Client Contact',
      company,
      city,
      region,
      lastInteraction: `Assistant sent an email on ${formatMmDd(seed)} about ${pickFrom(
        ['privacy', 'litigation', 'contract renewal', 'regulatory update', 'client acquisition'],
        seed
      )}`,
      lastInteracted: `${lastInteractedDays} days ago`,
      avatarUrl: `https://i.pravatar.cc/96?img=${(idx % 70) + 1}&u=${encodeURIComponent(name)}`,
      signalTone: pickFrom(SIGNAL_TONES, `${seed}-tone`),
      recentInteractions,
      relationshipHistory,
      internalConnections: fakeInternal.slice(0, 1 + (idx % 2)),
      metricsCurrent,
      metricsPrevious,
      relationship: relationship.trend,
      relationshipScore: relationship.score,
      relationshipDelta: relationship.delta,
    };
  });
}

export function buildSeedState() {
  // ---- Normalize and append client-provided mock DB ----
  const CLIENT_COMPANY_LIMIT = 12;
  const CLIENT_CONTACT_LIMIT = 40;
  const clientCompanies = clientCompaniesRaw.slice(0, CLIENT_COMPANY_LIMIT);
  const clientContacts = clientContactsRaw.slice(0, CLIENT_CONTACT_LIMIT);
  const clientTags = transformClientTags(clientTagsRaw);

  const transformedClientCompanies = transformClientCompanies(clientCompanies, []);
  const transformedClientContacts = transformClientContacts(clientContacts, transformedClientCompanies);

  // Re-fill keyContacts based on transformed contacts -> company.
  const clientCompaniesRehydrated = transformClientCompanies(clientCompanies, transformedClientContacts);

  // Use ONLY client-provided companies for the demo.
  // (Legacy `companyRows` are no longer merged into state.)
  const mergedCompanies = [...clientCompaniesRehydrated];
  const mergedContacts = [...contactRows, ...transformedClientContacts];

  // Keep existing base tags so Lists still match by label.
  const baseTags = [
    { id: 't-practice-privacy', label: 'Privacy & Security', type: 'Practice' },
    { id: 't-practice-ma', label: 'Mergers & Acquisitions', type: 'Practice' },
    { id: 't-practice-lit', label: 'Litigation', type: 'Practice' },
    { id: 't-industry-tech', label: 'Technology', type: 'Industry' },
    { id: 't-industry-fin', label: 'Financial Services', type: 'Industry' },
    { id: 't-region-canada', label: 'Canada', type: 'Region' },
    { id: 't-region-us', label: 'United States', type: 'Region' },
    { id: 't-initiative-ai', label: 'AI & Emerging Tech', type: 'Initiative' },
    { id: 't-interest-golf', label: 'Golf', type: 'Area of Interest' },
  ];

  const mergedTags = (() => {
    const byLabelAndType = new Map();
    [...baseTags, ...clientTags].forEach((t) => {
      if (!t?.label) return;
      const key = `${t.label}__${t.type}`;
      if (!byLabelAndType.has(key)) byLabelAndType.set(key, t);
    });
    return Array.from(byLabelAndType.values());
  })();

  // Deterministic tag assignments (so tag filters show content immediately).
  const contactTags = {};
  mergedContacts.forEach((c, idx) => {
    const tagsCount = 1 + (idx % 2);
    const chosen = [];
    for (let i = 0; i < tagsCount; i += 1) {
      const tag = mergedTags[(idx + i * 3) % mergedTags.length];
      if (tag && !chosen.includes(tag.id)) chosen.push(tag.id);
    }
    contactTags[c.id] = chosen;
  });

  const companyTags = {};
  mergedCompanies.forEach((co, idx) => {
    const tagsCount = 1 + ((idx + 1) % 3);
    const chosen = [];
    for (let i = 0; i < tagsCount; i += 1) {
      const tag = mergedTags[(idx + i * 5) % mergedTags.length];
      if (tag && !chosen.includes(tag.id)) chosen.push(tag.id);
    }
    companyTags[co.id] = chosen;
  });

  // ---- Existing seed behavior (touchpoints + lists) ----
  const touchpoints = [
    ...legacyTouchpoints.map(makeTaskFromLegacy),
    // Open tasks (some overdue, some upcoming) to make the demo feel alive
    makePlannedTouchpoint({
      id: 'task-1',
      contact: pick(mergedContacts, 0),
      dueDaysFromNow: -6,
      title: 'Follow up after last email thread',
      description: 'Send a short check-in and propose 2 times next week.',
    }),
    makePlannedTouchpoint({
      id: 'task-2',
      contact: pick(mergedContacts, 1),
      dueDaysFromNow: -1,
      title: 'Prepare for upcoming meeting',
      description: 'Review relationship history and gather 3 relevant updates.',
    }),
    makePlannedTouchpoint({
      id: 'task-3',
      contact: pick(mergedContacts, 2),
      dueDaysFromNow: 2,
      title: 'Share relevant content',
      description: 'Send article on regulatory developments (keep it brief).',
    }),
    makePlannedTouchpoint({
      id: 'task-4',
      contact: pick(mergedContacts, 0),
      dueDaysFromNow: 9,
      title: 'Invite to upcoming firm event',
      description: 'Confirm interest, then coordinate with events team.',
    }),
  ];

  const lists = staticLists.map((list, index) => ({
    id: list.id,
    name: list.name,
    owner: list.owner,
    type:
      index === 0
        ? 'Practice-based'
        : index === 1
        ? 'Initiative-based'
        : index === 2
        ? 'Event-based'
        : 'Event-based',
    tag: list.tag,
    initials: list.initials,
    color: list.color,
    lastEngagement: list.lastEngagement,
    visibility: index === 3 ? 'Personal' : index === 2 ? 'Shared' : 'Firm-wide',
    createdAt: '2025-01-15',
    members: list.members,
    memberIds: mergedContacts.filter((_, i) => i % (index + 2) === 0).map((c) => c.id),
  }));

  return {
    version: 1,
    currentRole: 'Partner',
    contacts: mergedContacts,
    companies: mergedCompanies,
    touchpoints,
    notes: [],
    companyNotes: [],
    listNotes: [],
    touchpointNotes: [],
    lists,
    tags: mergedTags,
    contactTags,
    companyTags,
    savedViews: [],
    contactFilters: {
      text: '',
      relationship: '',
      listId: '',
      city: '',
      region: '',
    },
    companyFilters: {
      text: '',
      relationshipTrend: '',
      tagId: '',
    },
    insightState: {},
  };
}

