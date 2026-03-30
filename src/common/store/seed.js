import { companyRows } from '../constants/companies';
import { contactRows } from '../constants/contacts';
import { touchpointRows as legacyTouchpoints } from '../constants/touchpoints';
import { listRows as staticLists } from '../constants/lists';
import { calculateRelationshipStrength } from '../utils/relationshipStrength';
import { BADGE_TYPES } from '../constants/badges';
import { aderantCodeForPracticeArea, enrichTagWithSourceCodes } from '../utils/tagTaxonomy';

// Client-provided mock DB (taxonomy + identity).
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

function lawyerDisplayName(entry) {
  const s = String(entry || '');
  const i = s.indexOf(' (');
  return i >= 0 ? s.slice(0, i).trim() : s.trim();
}

function calculateErmEngagementStrength(current, previous) {
  const toScore = (input = {}) => {
    const recency = clamp(100 - (input.daysSinceLastInteraction || 0) * 1.1, 0, 100);
    const frequency = clamp(((input.interactionsLast90d || 0) / 20) * 100, 0, 100);
    const twoWay = clamp((input.twoWayRatio || 0) * 100, 0, 100);
    return Math.round(recency * 0.45 + frequency * 0.4 + twoWay * 0.15);
  };

  const score = toScore(current);
  const previousScore = toScore(previous);
  const delta = score - previousScore;

  let trend = 'Stable';
  if (delta >= 8) trend = 'Growing';
  if (delta <= -8) trend = 'Declining';

  return { score, previousScore, delta, trend };
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
    principal: row.principal || '',
    assignedTo: '',
    assignedBy: '',
    onBehalfOf: '',
    visitStage: '',
  };
}

function makePlannedTouchpoint({ id, contact, dueDaysFromNow, title, description, assignedTo, assignedBy, onBehalfOf, visitStage, interactionType }) {
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
    interactionType: interactionType || 'Follow-up',
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
    principal: '',
    assignedTo: assignedTo || '',
    assignedBy: assignedBy || '',
    onBehalfOf: onBehalfOf || '',
    visitStage: visitStage || '',
  };
}

const SIGNAL_TONES = ['blue', 'green', 'yellow', 'orange', 'cyan'];

/** MT-03 — last-touch source buckets (mock Introhive / Vuture / manual). */
const LIA_INTROHIVE_CHANNELS = ['Email (relationship)', 'Meeting', '1:1 call / video', 'Calendar-detected touchpoint'];
const LIA_VUTURE_CHANNELS = ['Event attendance', 'Bulletin distribution'];
const LIA_MANUAL_CHANNELS = ['Award recognition', 'Trip invitation', 'Pro bono matter', 'Suite / ticket access'];

function pickLastInteractionAttribution(seed) {
  const u = hashToUnit(`${seed}-lia-sys`);
  if (u < 0.42) {
    return { system: 'introhive', channel: pickFrom(LIA_INTROHIVE_CHANNELS, `${seed}-lia-int`) };
  }
  if (u < 0.78) {
    return { system: 'vuture', channel: pickFrom(LIA_VUTURE_CHANNELS, `${seed}-lia-vut`) };
  }
  return { system: 'manual', channel: pickFrom(LIA_MANUAL_CHANNELS, `${seed}-lia-man`) };
}

function lastInteractionSummaryForAttribution(seed, topic, attr) {
  const d = formatMmDd(seed);
  const { system, channel } = attr;
  if (system === 'introhive') {
    if (channel.startsWith('Meeting')) return `Meeting touchpoint on ${d} synced from Introhive (${topic}).`;
    if (channel.includes('1:1') || channel.includes('video')) return `Call / video on ${d} — relationship activity via Introhive (${topic}).`;
    if (channel.includes('Calendar')) return `Calendar-detected client touch on ${d} (Introhive) — ${topic}.`;
    return `Email thread on ${d} tracked in Introhive — ${topic}.`;
  }
  if (system === 'vuture') {
    if (channel.includes('Event')) return `Event attendance recorded ${d} (Vuture) — ${topic}.`;
    return `Bulletin / newsletter engagement ${d} (Vuture) — ${topic}.`;
  }
  if (channel.includes('Award')) return `Award / recognition note logged ${d} (manual) — ${topic}.`;
  if (channel.includes('Trip')) return `Trip / hospitality invitation logged ${d} (manual).`;
  if (channel.includes('Pro bono')) return `Pro bono engagement logged ${d} (manual) — ${topic}.`;
  if (channel.includes('Suite')) return `Suite / ticket access logged ${d} (manual).`;
  return `Activity manually logged ${d} — ${topic}.`;
}

const PRACTICE_OPTIONS = ['Corporate', 'Litigation', 'Regulatory'];
const PRACTICE_GROUPS = ['Corporate', 'Litigation', 'Regulatory'];
const OFFICES = ['Toronto', 'Calgary', 'Vancouver'];

const LAWYER_NAMES = ['M. Chen', 'A. Patel', 'R. Thompson', 'S. Nakamura', 'L. Martinez', 'J. Kim', 'D. Okafor', 'H. Singh'];
const CAT_CODES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1'];
const CLIENT_CODES = ['CL-1001', 'CL-1002', 'CL-2001', 'CL-2002', 'CL-3001', 'CL-3002', 'CL-4001'];
const GICS_SECTORS = ['Information Technology', 'Financials', 'Health Care', 'Consumer Discretionary', 'Industrials', 'Energy', 'Real Estate'];

function transformClientTags(clientTags) {
  const tagsBase = Array.isArray(clientTags) ? clientTags : [];
  const inferSourcesFromType = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('practice')) return ['Aderant'];
    if (t.includes('industry') || t.includes('region') || t.includes('location')) return ['Website'];
    if (t.includes('initiative') || t.includes('interest') || t.includes('event')) return ['Marketing Lists'];
    return ['Manual'];
  };
  return tagsBase.map((t, idx) => {
    const label = t.tagName || '';
    const type = t.tagType || 'Other';
    const sourceTaxonomies = inferSourcesFromType(type);
    const raw = {
      id: `ct-${idx + 1}-${slugify(label)}-${slugify(type)}`,
      label,
      type,
      canonicalType: type,
      sourceTaxonomies,
    };
    return enrichTagWithSourceCodes(raw, idx);
  });
}

function transformClientCompanies(clientCompanies, clientContacts) {
  const companiesBase = Array.isArray(clientCompanies) ? clientCompanies : [];
  const contactsBase = Array.isArray(clientContacts) ? clientContacts : [];

  const companies = companiesBase.map((co, idx) => {
    const name = co.companyName || '';
    const seed = `${name}-${idx}`;
    const accountType = co.accountType || 'Client';
    const industryTag = pickFrom(clientTagsFromContactsFallback(clientContacts, idx), seed) || 'Technology';

    const category1 = accountType;
    const category2 = industryTag;

    const baseRevenue = 0.6 + hashToUnit(`${seed}-rev`) * 2.4;
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

    const relationship = calculateErmEngagementStrength(metricsCurrent, metricsPrevious);

    const practiceShareRaw = PRACTICE_OPTIONS.map((p, pIdx) => {
      const v = 10 + Math.floor(hashToUnit(`${seed}-ps-${pIdx}`) * 80);
      return { practice: p, value: v };
    });
    const psTotal = practiceShareRaw.reduce((sum, x) => sum + x.value, 0) || 1;
    const practiceShare = practiceShareRaw.map((x) => ({
      practice: x.practice,
      value: Math.max(5, Math.round((x.value / psTotal) * 100)),
    }));
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

    const matterPa1 = pickFrom(PRACTICE_OPTIONS, `${seed}-mpra`);
    const matterPa2 = pickFrom(PRACTICE_OPTIONS, `${seed}-mpra2`);
    const companiesSeedMatter = [
      {
        id: `m-${idx}-1`,
        openDate: formatMmDd(seed, idx + 20),
        status: pickFrom(['Active', 'In Conflicts', 'Closed'], `${seed}-mstat`),
        name: pickFrom(['Commercial Agreements Review', 'Privacy Program Overhaul', 'Regulatory Compliance Support', 'AI Governance Framework'], `${seed}-mname`),
        practiceArea: matterPa1,
        aderantPracticeCode: aderantCodeForPracticeArea(matterPa1),
        leadLawyer: pickFrom(LAWYER_NAMES, `${seed}-ml1`),
        matterRank: clamp(Math.floor(hashToUnit(`${seed}-mr1`) * 10) + 1, 1, 10),
        wip: Math.floor(hashToUnit(`${seed}-wip1`) * 500000),
      },
      {
        id: `m-${idx}-2`,
        openDate: formatMmDd(seed, idx + 60),
        status: pickFrom(['Active', 'In Conflicts', 'Closed'], `${seed}-mstat2`),
        name: pickFrom(['Competition Review – APAC Expansion', 'Driver Classification Litigation', 'Data Breach Incident Response'], `${seed}-mname2`),
        practiceArea: matterPa2,
        aderantPracticeCode: aderantCodeForPracticeArea(matterPa2),
        leadLawyer: pickFrom(LAWYER_NAMES, `${seed}-ml2`),
        matterRank: clamp(Math.floor(hashToUnit(`${seed}-mr2`) * 10) + 1, 1, 10),
        wip: Math.floor(hashToUnit(`${seed}-wip2`) * 500000),
      },
    ];

    const companiesSeedOpps = [
      {
        id: `o-${idx}-1`,
        date: formatMmDd(seed, idx + 10),
        status: pickFrom(['Pending', 'Won', 'Lost'], `${seed}-ostatus`),
        name: pickFrom(['Unified Communications Suite Launch', 'Privacy Program Overhaul', 'Cross-border Data Transfer Program'], `${seed}-oname`),
        type: pickFrom(['Pitch', 'RFP', 'Panel'], `${seed}-otype`),
      },
      {
        id: `o-${idx}-2`,
        date: formatMmDd(seed, idx + 35),
        status: pickFrom(['Pending', 'Won', 'Lost'], `${seed}-ostatus2`),
        name: pickFrom(['AI Safety Advisory Panel', 'Global Mobility Program', 'Strategic Target Opportunity'], `${seed}-oname2`),
        type: pickFrom(['Pitch', 'RFP', 'Panel'], `${seed}-otype2`),
      },
    ];

    const gicsPrimary = pickFrom(GICS_SECTORS, `${seed}-gics-1`);
    const gicsSecondary = pickFrom(GICS_SECTORS, `${seed}-gics-2`);
    const gicsTertiary = pickFrom(GICS_SECTORS, `${seed}-gics-3`);
    const relationshipLawyers = [
      pickFrom(LAWYER_NAMES, `${seed}-rlaw-1`),
      pickFrom(LAWYER_NAMES, `${seed}-rlaw-2`),
    ].filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i);

    const headquarters = co.addresses?.[0]
      ? [co.addresses[0].city, co.addresses[0].state, co.addresses[0].country]
          .filter(Boolean)
          .join(', ')
      : '';

    // Mock news feed with explicit categories required by CM-03/MT-04.
    const newsItems = [
      {
        id: `news-${idx}-1`,
        date: formatMmDd(seed, 3),
        type: 'RFP',
        title: `${name} issues strategic legal services RFP`,
        source: 'Industry Wire',
        summary: `${name} has launched an RFP focused on cross-border regulatory and commercial support.`,
      },
      {
        id: `news-${idx}-2`,
        date: formatMmDd(seed, 10),
        type: 'Leadership',
        title: `${name} appoints new General Counsel`,
        source: 'Law.com',
        summary: `${name} named a new GC as part of broader legal function restructuring.`,
      },
      {
        id: `news-${idx}-3`,
        date: formatMmDd(seed, 18),
        type: 'M&A',
        title: `${name} announces acquisition to expand regional footprint`,
        source: 'Bloomberg',
        summary: `${name} confirmed an acquisition that increases presence in priority markets.`,
      },
      {
        id: `news-${idx}-4`,
        date: formatMmDd(seed, 27),
        type: 'Regulatory',
        title: `${name} flagged in new sector regulatory update`,
        source: 'Regulatory Bulletin',
        summary: `New policy guidance could affect ${name}'s compliance and reporting approach.`,
      },
    ];

    const baseCompany = {
      id: `client-co-${idx + 1}`,
      name,
      category1,
      category2,
      engagementTitle: `Engagement scheduled for ${formatMmDd(seed, 2)}`,
      recentEngagement: recentDays <= 0 ? 'Today' : `${recentDays} days ago`,
      clientStatus,
      logo: slugify(name) || `company-${idx + 1}`,
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
      catCode: pickFrom(CAT_CODES, `${seed}-cat`),
      clientCode: pickFrom(CLIENT_CODES, `${seed}-cc`),
      gics: gicsPrimary,
      gicsLevels: [gicsPrimary, gicsSecondary, gicsTertiary],
      billingLawyer: pickFrom(LAWYER_NAMES, `${seed}-bl`),
      relationshipLawyers,
      industry: category2,
      sector: gicsPrimary,
      companyType: accountType,
      website: co.website || '',
      domain: co.domain || '',
      headquarters,
      newsItems,
      accountType,
      ownerId: hashToUnit(`${seed}-owner`) < 0.5 ? 'current-user' : 'other-user',
      // BH-06: strategic / key relationship — used for value-add gap visibility
      isStrategicAccount: hashToUnit(`${seed}-strat`) < 0.32,
    };

    // AI-15: two seeded misalignment profiles (relationship trend vs revenue/matter momentum).
    if (idx === 0) {
      const rh = baseCompany.revenueHistory.map((r, i, arr) =>
        i === arr.length - 1 && arr.length >= 2
          ? { ...r, value: Math.max(0.05, arr[arr.length - 2].value * 0.86) }
          : r
      );
      const mt = baseCompany.mattersTrends.map((row, i, arr) =>
        i === arr.length - 1 ? { ...row, revenue: Math.round(rh[rh.length - 1].value * 1000000) } : row
      );
      return {
        ...baseCompany,
        relationshipTrend: 'Growing',
        relationshipScore: Math.max(baseCompany.relationshipScore, 58),
        revenueHistory: rh,
        mattersTrends: mt,
      };
    }
    if (idx === 1) {
      const prevMat = baseCompany.metricsPrevious.mattersActive;
      return {
        ...baseCompany,
        relationshipTrend: 'Declining',
        relationshipScore: Math.min(baseCompany.relationshipScore, 44),
        metricsCurrent: {
          ...baseCompany.metricsCurrent,
          mattersActive: Math.max(prevMat + 2, 4),
        },
      };
    }
    return baseCompany;
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

function clientTagsFromContactsFallback(clientContacts, idx) {
  const companyIndustryHints = ['Technology', 'Financial Services', 'Biotech', 'Healthcare', 'Retail', 'Defense', 'Semiconductors'];
  const seed = `${idx}-${(clientContacts?.[idx]?.jobTitle || '')}`;
  return [pickFrom(companyIndustryHints, seed)];
}

function transformClientContacts(clientContacts, transformedCompanies) {
  const contactsBase = Array.isArray(clientContacts) ? clientContacts : [];
  const companies = Array.isArray(transformedCompanies) ? transformedCompanies : [];

  // Build domain→company lookup from raw company data
  const domainToCompany = {};
  clientCompaniesRaw.forEach((co) => {
    if (co.domain) domainToCompany[co.domain.toLowerCase()] = co.companyName;
  });

  const namePool = generateMockNamePool();
  const badgeIds = BADGE_TYPES.map((b) => b.id);

  return contactsBase.map((ct, idx) => {
    const firstName = ct.firstName || '';
    const lastName = ct.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    const seed = `${name}-${idx}`;

    // Map contact to company via email domain
    const emailDomain = (ct.contactEmail || '').split('@')[1]?.toLowerCase() || '';
    const companyFromDomain = domainToCompany[emailDomain];
    const companyFromCompanies = companyFromDomain || (companies.length ? companies[idx % companies.length].name : 'Unknown Company');
    const company = companyFromCompanies;

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

    // BH-05 / AI-08: parallel lawyer touchpoints on the same contact (demo signal)
    const coordinationPeers =
      hashToUnit(`${seed}-coord`) < 0.18
        ? [
            `${pickFrom(namePool, `${seed}-cp1`)} ${pickFrom(namePool, `${seed}-cp1b`)} (Partner)`,
            `${pickFrom(namePool, `${seed}-cp2`)} ${pickFrom(namePool, `${seed}-cp2b`)} (Associate)`,
          ]
        : [];

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

    // ~20% key contacts, ~10% alumni
    const isKeyContact = hashToUnit(`${seed}-key`) < 0.2;
    const isAlumni = hashToUnit(`${seed}-alumni`) < 0.1;

    // Assign 0-3 badges deterministically
    const badgeCount = Math.floor(hashToUnit(`${seed}-bc`) * 4);
    const contactBadges = [];
    for (let b = 0; b < badgeCount; b++) {
      const bid = pickFrom(badgeIds, `${seed}-badge-${b}`);
      if (!contactBadges.includes(bid)) contactBadges.push(bid);
    }
    // AI-12: ensure a slice of contacts carry visit-touchpoint signal for demo insights
    if (!contactBadges.includes('visit') && hashToUnit(`${seed}-visit-badge`) < 0.14) {
      contactBadges.push('visit');
    }

    // Special dates
    const specialDates = {};
    if (hashToUnit(`${seed}-bday`) < 0.4) {
      const bMonth = 1 + Math.floor(hashToUnit(`${seed}-bdm`) * 12);
      const bDay = 1 + Math.floor(hashToUnit(`${seed}-bdd`) * 28);
      specialDates.birthday = `${String(bMonth).padStart(2, '0')}/${String(bDay).padStart(2, '0')}`;
    }
    if (hashToUnit(`${seed}-anniv`) < 0.2) {
      specialDates.workAnniversary = `${1 + Math.floor(hashToUnit(`${seed}-anny`) * 12)} years`;
    }

    const lastTopic = pickFrom(
      ['privacy', 'litigation', 'contract renewal', 'regulatory update', 'client acquisition'],
      seed
    );
    const lastInteractionAttribution = pickLastInteractionAttribution(seed);
    const lastInteraction = lastInteractionSummaryForAttribution(seed, lastTopic, lastInteractionAttribution);

    return {
      id: `client-contact-${idx + 1}`,
      name: name || `Client ${idx + 1}`,
      role: ct.jobTitle || 'Client Contact',
      email: ct.contactEmail || '',
      phone: ct.phoneNumber || '',
      company,
      city,
      region,
      lastInteraction,
      lastInteractionAttribution,
      lastInteracted: `${lastInteractedDays} days ago`,
      avatarUrl: ct.avatarUrl || `https://i.pravatar.cc/96?img=${(idx % 70) + 1}&u=${encodeURIComponent(name)}`,
      signalTone: pickFrom(SIGNAL_TONES, `${seed}-tone`),
      recentInteractions,
      relationshipHistory,
      internalConnections: fakeInternal.slice(0, 1 + (idx % 2)),
      coordinationPeers,
      metricsCurrent,
      metricsPrevious,
      relationship: relationship.trend,
      relationshipScore: relationship.score,
      relationshipDelta: relationship.delta,
      isKeyContact,
      isAlumni,
      contactBadges,
      specialDates,
      ownerId: hashToUnit(`${seed}-owner`) < 0.5 ? 'current-user' : 'other-user',
    };
  });
}

function buildSeedContactNotes(contacts) {
  if (!contacts.length) return [];
  const row = (i, contact, type, text, daysAgo, visibility) => ({
    id: `seed-cn-${i}`,
    contactId: contact.id,
    contactName: contact.name,
    type,
    visibility,
    text,
    shareWith: '',
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  });
  const out = [];
  const a = contacts[0];
  const b = contacts[1];
  if (a) {
    out.push(row(1, a, 'Meeting Notes', 'Discussed regulatory timeline; follow-up on breach playbooks by month end.', 3, 'private'));
    out.push(row(2, a, 'Relationship Context', 'Former colleague from Toronto office; warm intro path via partner on file.', 14, 'private'));
    out.push(row(3, a, 'General', 'Sent CLE bulletin — positive reply; interested in privacy stream.', 21, 'firm-wide'));
  }
  if (b) {
    out.push(row(4, b, 'Client Preferences', 'Board materials need plain-language exec summary; minimize footnotes.', 7, 'shared'));
    out.push(row(5, b, 'Personal Interests', 'Avid skier; mentioned Whistler trip in spring.', 30, 'private'));
  }
  return out;
}

export function buildSeedState() {
  const CLIENT_COMPANY_LIMIT = 12;
  const clientCompanies = clientCompaniesRaw.slice(0, CLIENT_COMPANY_LIMIT);
  const clientContacts = clientContactsRaw; // Use all 184 contacts
  const clientTags = transformClientTags(clientTagsRaw);

  const transformedClientCompanies = transformClientCompanies(clientCompanies, []);
  const transformedClientContacts = transformClientContacts(clientContacts, transformedClientCompanies);

  const clientCompaniesRehydrated = transformClientCompanies(clientCompanies, transformedClientContacts);

  const mergedCompanies = [...clientCompaniesRehydrated];
  const mergedContacts = [...transformedClientContacts];

  const baseTags = [
    { id: 't-practice-privacy', label: 'Privacy & Security', type: 'Practice', canonicalType: 'Practice', sourceTaxonomies: ['Aderant'], sourceCodes: { aderantPracticeCode: 'ADR-PR-2044' } },
    { id: 't-practice-ma', label: 'Mergers & Acquisitions', type: 'Practice', canonicalType: 'Practice', sourceTaxonomies: ['Aderant'], sourceCodes: { aderantPracticeCode: 'ADR-PR-2180' } },
    { id: 't-practice-lit', label: 'Litigation', type: 'Practice', canonicalType: 'Practice', sourceTaxonomies: ['Aderant'], sourceCodes: { aderantPracticeCode: 'ADR-PR-3420' } },
    { id: 't-industry-tech', label: 'Technology', type: 'Industry', canonicalType: 'Industry', sourceTaxonomies: ['Website'], sourceCodes: { websiteCategoryCode: 'WEB-410' } },
    { id: 't-industry-fin', label: 'Financial Services', type: 'Industry', canonicalType: 'Industry', sourceTaxonomies: ['Website'], sourceCodes: { websiteCategoryCode: 'WEB-220' } },
    { id: 't-region-canada', label: 'Canada', type: 'Region', canonicalType: 'Region', sourceTaxonomies: ['Website'], sourceCodes: { websiteCategoryCode: 'WEB-REG-CA' } },
    { id: 't-region-us', label: 'United States', type: 'Region', canonicalType: 'Region', sourceTaxonomies: ['Website'], sourceCodes: { websiteCategoryCode: 'WEB-REG-US' } },
    { id: 't-initiative-ai', label: 'AI & Emerging Tech', type: 'Initiative', canonicalType: 'Initiative', sourceTaxonomies: ['Marketing Lists'], sourceCodes: { marketingListCode: 'VUT-ML-880' } },
    { id: 't-interest-golf', label: 'Golf', type: 'Area of Interest', canonicalType: 'Area of Interest', sourceTaxonomies: ['Manual'], sourceCodes: { manualRef: 'MN-0007' } },
  ];

  const mergedTags = (() => {
    const byLabelAndType = new Map();
    [...baseTags, ...clientTags].forEach((t) => {
      if (!t?.label) return;
      const key = `${t.label}__${t.type}`;
      if (!byLabelAndType.has(key)) byLabelAndType.set(key, t);
    });
    return Array.from(byLabelAndType.values()).map((t, i) => enrichTagWithSourceCodes(t, i));
  })();

  // Deterministic tag assignments
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

  // BH-08: matter-level referral attribution (mock — which contact originated the referral)
  mergedCompanies.forEach((co) => {
    const atCompany = mergedContacts.filter((c) => c.company === co.name);
    co.matters = (co.matters || []).map((m) => {
      if (hashToUnit(`matter-ref-${co.id}-${m.id}`) < 0.42 && atCompany.length) {
        const src = pickFrom(atCompany, `matter-ref-pick-${m.id}`);
        return {
          ...m,
          referralSourceContactId: src.id,
          referralSourceContactName: src.name,
        };
      }
      return { ...m, referralSourceContactId: '', referralSourceContactName: '' };
    });
  });

  // ---- Touchpoints ----
  const touchpoints = [
    ...legacyTouchpoints.map(makeTaskFromLegacy),
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
    // Assigned touchpoints for BD demo
    makePlannedTouchpoint({
      id: 'task-5',
      contact: pick(mergedContacts, 4),
      dueDaysFromNow: 3,
      title: 'BD-assigned: Client introduction email',
      description: 'Draft introduction email for partner review.',
      assignedTo: 'M. Chen',
      assignedBy: 'BD Team',
    }),
    makePlannedTouchpoint({
      id: 'task-6',
      contact: pick(mergedContacts, 6),
      dueDaysFromNow: 5,
      title: 'BD-assigned: Event follow-up calls',
      description: 'Follow up with attendees from the recent seminar.',
      assignedTo: 'A. Patel',
      assignedBy: 'BD Team',
      onBehalfOf: 'Partner Group',
    }),
    // BH-13: client visit workflow (pre-visit → visit → post-visit)
    makePlannedTouchpoint({
      id: 'task-visit-pre',
      contact: pick(mergedContacts, 3),
      dueDaysFromNow: 4,
      title: 'Client site visit — logistics & brief',
      description: 'Confirm travel, materials, and attendee list; open meeting brief.',
      interactionType: 'Visit',
      visitStage: 'Pre-visit',
    }),
    makePlannedTouchpoint({
      id: 'task-visit-live',
      contact: pick(mergedContacts, 5),
      dueDaysFromNow: 0,
      title: 'In-person client meeting (scheduled)',
      description: 'On-site relationship meeting; capture notes for post-visit follow-up.',
      interactionType: 'Visit',
      visitStage: 'Visit',
    }),
  ];

  // ---- Lists (expanded to 8-10) ----
  const baseListTypes = ['Practice-based', 'Initiative-based', 'Event-based', 'Event-based', 'Referral', 'Personal', 'Trip Planning', 'Practice-based', 'Initiative-based', 'Event-based'];
  const baseListVisibilities = ['Firm-wide', 'Firm-wide', 'Shared', 'Personal', 'Shared', 'Personal', 'Personal', 'Firm-wide', 'Shared', 'Firm-wide'];
  const baseListColors = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange', 'bg-cyan', 'bg-rose', 'bg-amber', 'bg-indigo', 'bg-emerald', 'bg-red'];

  const extraLists = [
    { id: 'list-5', name: 'Referral Network – Financial Services', owner: 'L. Martinez', tag: 'Financial Services', initials: 'RN', members: 6 },
    { id: 'list-6', name: 'Personal Watch List', owner: 'You', tag: 'Strategy', initials: 'PW', members: 4 },
    { id: 'list-7', name: 'Vancouver Trip – March 2026', owner: 'You', tag: 'Travel', initials: 'VT', members: 5 },
    { id: 'list-8', name: 'Litigation Practice Group', owner: 'R. Thompson', tag: 'Litigation', initials: 'LP', members: 12 },
    { id: 'list-9', name: 'AI & Emerging Tech Initiative', owner: 'S. Nakamura', tag: 'AI & Emerging Tech', initials: 'AI', members: 8 },
    { id: 'list-10', name: 'Annual Client Appreciation Gala', owner: 'BD Team', tag: 'Events', initials: 'CG', members: 20 },
  ];

  const allStaticLists = [...staticLists, ...extraLists];

  const lists = allStaticLists.map((list, index) => ({
    // Deterministic sharing fields for "Shared" lists.
    // We alternate between "shared with specific users" and "shared with practice group".
    id: list.id,
    name: list.name,
    owner: list.owner,
    type: baseListTypes[index] || 'Event-based',
    tag: list.tag,
    initials: list.initials,
    color: baseListColors[index] || 'bg-blue',
    lastEngagement: list.lastEngagement || `${3 + index * 2} days ago`,
    visibility: baseListVisibilities[index] || 'Firm-wide',
    createdAt: '2025-01-15',
    members: list.members,
    memberIds: mergedContacts.filter((_, i) => i % (index + 2) === 0).map((c) => c.id),
    sharedWithUserIds: [],
    sharedWithUsers: [],
    sharedPracticeGroup: '',
    marketingActivity: index < 4 ? [
      { date: formatMmDd(`${list.name}-ma1`, 5), type: 'Email Campaign', description: 'Quarterly newsletter sent', recipients: 45 },
      { date: formatMmDd(`${list.name}-ma2`, 20), type: 'Event Invite', description: 'Webinar invitation distributed', recipients: 30 },
    ] : [],
    ...(baseListVisibilities[index] === 'Shared'
      ? {
          sharedWithUserIds: (() => {
            const seed = `${list.name}-${index}-u`;
            const count = 2 + (Math.floor(hashToUnit(seed) * 2) % 2); // 2 or 3
            const picked = [];
            for (let k = 0; k < count; k += 1) {
              const u = pickFrom(LAWYER_NAMES, `${seed}-${k}`);
              if (u && !picked.includes(u)) picked.push(u);
            }
            return picked;
          })(),
          sharedWithUsers: [],
          sharedPracticeGroup: index % 2 === 1 ? pickFrom(PRACTICE_GROUPS, `${list.name}-${index}-pg`) : '',
        }
      : {}),
  }));

  // Mock source system event lists (for LI-07 pull-through behavior).
  const marketingEventLists = [
    {
      id: 'mev-1',
      eventName: 'Client Appreciation Dinner',
      owner: 'BD Team',
      tag: 'Events',
      visibility: 'Shared',
      attendeeIds: mergedContacts.filter((_, i) => i % 5 === 0).map((c) => c.id),
      activities: [
        { date: formatMmDd('mev-1-a1', 4), type: 'RSVP Campaign', description: 'Dinner RSVP reminder sent', recipients: 42 },
        { date: formatMmDd('mev-1-a2', 1), type: 'Attendance', description: 'Dinner attendance captured', recipients: 28 },
      ],
    },
    {
      id: 'mev-2',
      eventName: 'AI Regulation Roundtable',
      owner: 'S. Nakamura',
      tag: 'AI & Emerging Tech',
      visibility: 'Firm-wide',
      attendeeIds: mergedContacts.filter((_, i) => i % 6 === 0).map((c) => c.id),
      activities: [
        { date: formatMmDd('mev-2-a1', 9), type: 'Event Invite', description: 'Roundtable invitation distributed', recipients: 35 },
        { date: formatMmDd('mev-2-a2', 2), type: 'Attendance', description: 'Attendance synced from event platform', recipients: 24 },
      ],
    },
    {
      id: 'mev-3',
      eventName: 'Financial Services GC Forum',
      owner: 'L. Martinez',
      tag: 'Financial Services',
      visibility: 'Shared',
      attendeeIds: mergedContacts.filter((_, i) => i % 7 === 0).map((c) => c.id),
      activities: [
        { date: formatMmDd('mev-3-a1', 12), type: 'Invite', description: 'Forum invite sent to priority contacts', recipients: 31 },
        { date: formatMmDd('mev-3-a2', 3), type: 'Engagement', description: 'Post-event engagement tracked', recipients: 18 },
      ],
    },
  ];

  const pulledEventLists = marketingEventLists.map((ev, idx) => ({
    id: `event-list-${idx + 1}`,
    sourceEventId: ev.id,
    sourceSystem: 'Marketing Events',
    name: ev.eventName,
    owner: ev.owner,
    type: 'Event-based',
    tag: ev.tag || 'Events',
    initials: ev.eventName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase(),
    color: baseListColors[(idx + 2) % baseListColors.length],
    lastEngagement: '1 day ago',
    visibility: ev.visibility || 'Shared',
    createdAt: '2025-01-15',
    members: ev.attendeeIds.length,
    memberIds: ev.attendeeIds,
    sharedWithUserIds: ev.visibility === 'Shared' ? [pickFrom(LAWYER_NAMES, `mev-${idx}-su-1`), pickFrom(LAWYER_NAMES, `mev-${idx}-su-2`)].filter(Boolean) : [],
    sharedWithUsers: [],
    sharedPracticeGroup: ev.visibility === 'Shared' && idx % 2 === 1 ? pickFrom(PRACTICE_GROUPS, `mev-${idx}-spg`) : '',
    marketingActivity: ev.activities || [],
  }));

  const mergedLists = [...lists, ...pulledEventLists];

  // BH-08: ensure referral list has enough members for demo workflows
  const referralListRow = mergedLists.find((l) => l.type === 'Referral');
  if (referralListRow) {
    const extraIds = mergedContacts.filter((_, i) => i % 11 === 0).map((c) => c.id);
    const mergedIds = Array.from(new Set([...(referralListRow.memberIds || []), ...extraIds]));
    referralListRow.memberIds = mergedIds;
    referralListRow.members = mergedIds.length;
  }

  // ---- Mock notifications ----
  const coordContactForNotif = mergedContacts.find((c) => (c.coordinationPeers?.length ?? 0) >= 2);
  const teamCoordMessage = coordContactForNotif
    ? `${lawyerDisplayName(coordContactForNotif.coordinationPeers[0])} and ${lawyerDisplayName(coordContactForNotif.coordinationPeers[1])} both contacted ${coordContactForNotif.name} this week — coordinate outreach.`
    : 'Multiple colleagues reached the same priority contact this week — align before your next touch.';

  const notifications = [
    { id: 'notif-1', type: 'team-coordination', title: 'Team Coordination Alert', message: teamCoordMessage, read: false, createdAt: isoDaysFromNow(-1) },
    { id: 'notif-2', type: 'new-role', title: 'Job Change Detected', message: 'Derek Liu has been promoted to VP, Legal at TechCorp.', read: false, createdAt: isoDaysFromNow(-2) },
    { id: 'notif-3', type: 'company-news', title: 'Company News', message: 'Magna International announced Q4 results — revenue up 12%.', read: false, createdAt: isoDaysFromNow(-3) },
    { id: 'notif-4', type: 'birthday', title: 'Upcoming Birthday', message: 'Naomi Park\'s birthday is in 3 days.', read: false, createdAt: isoDaysFromNow(0) },
    { id: 'notif-5', type: 'misalignment', title: 'Engagement Misalignment', message: 'Two partners contacted the same client this week without coordination.', read: true, createdAt: isoDaysFromNow(-5) },
  ];

  // Generate additional interactions spread across the larger contact set for demo realism
  const interactionTypes = ['Email', 'Meeting', 'Call', 'Event', 'Visit'];
  const interactionTitles = [
    'Quarterly check-in', 'Shared regulatory update', 'Follow-up on proposal', 'Discussed partnership opportunity',
    'Intro call with legal team', 'Budget review meeting', 'Webinar attendance', 'Conference follow-up',
    'Shared industry report', 'Contract renewal discussion', 'Holiday greetings', 'Board prep materials sent',
  ];
  const additionalInteractions = [];
  for (let i = 0; i < 60; i++) {
    const contact = mergedContacts[Math.floor(hashToUnit(`seed-int-${i}`) * mergedContacts.length)];
    if (!contact) continue;
    const daysAgo = Math.floor(hashToUnit(`seed-int-days-${i}`) * 120) + 1;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(9, 0, 0, 0);
    const isoDate = d.toISOString();
    const intType = pickFrom(interactionTypes, `seed-int-type-${i}`);
    const intTitle = pickFrom(interactionTitles, `seed-int-title-${i}`);
    additionalInteractions.push({
      id: `seed-int-${i}`,
      kind: 'interaction',
      status: 'completed',
      createdAt: isoDate,
      dueAt: null,
      completedAt: isoDate,
      cancelledAt: null,
      contactName: contact.name,
      company: contact.company,
      role: contact.role,
      interactionType: intType,
      title: `${intTitle} with ${contact.name}`,
      outcome: 'Completed successfully',
      notes: '',
      followUpDate: '',
      history: [],
      avatarUrl: contact.avatarUrl,
      signalTone: contact.signalTone || 'blue',
      relationshipStatus: contact.relationship || 'Stable',
      relationshipScore: contact.relationshipScore || 50,
      lastInteracted: contact.lastInteracted || '0 days ago',
      source: 'seed',
      assignedTo: '',
      assignedBy: '',
      onBehalfOf: '',
      visitStage: '',
    });
  }

  touchpoints.push(...additionalInteractions);

  const seedContactNotes = buildSeedContactNotes(mergedContacts);

  return {
    version: 1,
    currentPersonaId: 'partner',
    /** AC-06: 'none' | 'pending' | 'approved' — Group Lead approves Associate Tier 2 data access */
    associateTier2UpgradeStatus: 'none',
    currentRole: 'Partner',
    contacts: mergedContacts,
    companies: mergedCompanies,
    touchpoints,
    notes: seedContactNotes,
    companyNotes: [],
    listNotes: [],
    touchpointNotes: [],
    lists: mergedLists,
    marketingEventLists,
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
    notifications,
    activities: [],
  };
}
