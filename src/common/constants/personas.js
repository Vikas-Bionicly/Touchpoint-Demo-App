/**
 * Persona definitions with tier mappings, field visibility, action permissions, and data depth.
 *
 * App persona tier (FIELD_VISIBILITY / depth):
 *   Tier 1 — Full access (all data, exact figures, full history)  → catalog DT-03 (Full)
 *   Tier 2 — Standard access (ranges, trends, summaries)        → catalog DT-02 (Abstract)
 *   Tier 3 — Restricted / baseline (counts & indicators only)     → catalog DT-01 (Baseline)
 *
 * Context bumps (billing lawyer, partner “own” accounts, group-lead in-practice) adjust
 * effective tier for field visibility only; see buildPersonaHelper.
 */

export const PERSONAS = [
  {
    id: 'partner',
    label: 'Partner',
    tier: 1,
    description: 'Equity partner with full client portfolio visibility',
  },
  {
    id: 'non-equity-partner',
    label: 'Non-Equity Partner',
    tier: 2,
    description: 'Non-equity partner with nearly full visibility',
  },
  {
    id: 'associate',
    label: 'Associate',
    tier: 3,
    description: 'Associate lawyer working on assigned matters',
  },
  {
    id: 'bd-superuser',
    label: 'BD SuperUser',
    tier: 1,
    description: 'Senior BD professional with full system access',
  },
  {
    id: 'bd-standard',
    label: 'BD Standard',
    tier: 2,
    description: 'BD team member with standard operational access',
  },
  {
    id: 'legal-assistant',
    label: 'Legal Assistant',
    tier: 3,
    description: 'Legal assistant with limited operational access',
  },
  {
    id: 'group-lead',
    label: 'Group Lead',
    tier: 2,
    description: 'Practice or industry group leader with cross-portfolio view',
  },
  {
    id: 'billing-lawyer',
    label: 'Billing Lawyer',
    tier: 2,
    description: 'Billing lawyer focused on matter-level financials',
  },
];

export const PERSONA_MAP = Object.fromEntries(PERSONAS.map((p) => [p.id, p]));

/**
 * Field visibility by tier.
 * true = visible, false = hidden entirely (no hints).
 */
const FIELD_VISIBILITY = {
  // Revenue / financial
  'revenue.exact':        { 1: true,  2: false, 3: false },
  'revenue.range':        { 1: true,  2: true,  3: false },
  'matters.table':        { 1: true,  2: true,  3: false },
  'matters.summary':      { 1: true,  2: true,  3: true  },
  'opportunities.table':  { 1: true,  2: true,  3: false },
  'opportunities.summary':{ 1: true,  2: true,  3: true  },
  'financialTrends':      { 1: true,  2: false, 3: false },
  'matterRank':           { 1: true,  2: false, 3: false },
  'wip':                  { 1: true,  2: false, 3: false },

  // Relationship
  // DT-03 full transparency: relationship history list only at app tier 1
  'relationshipHistory':  { 1: true,  2: false,  3: false },
  'relationshipScore':    { 1: true,  2: true,  3: false },
  'internalConnections':  { 1: true,  2: true,  3: false },
  /** DT-01: counts only (no names); used with tier 3 */
  'relationship.aggregate': { 1: false, 2: false, 3: true },
  /** DT-04 Who Knows Whom: colleague names at all tiers that can open the modal; role line tier 1–2; strength/last touch tier 1 only */
  'firmConnections.colleagueRole': { 1: true, 2: true, 3: false },
  'firmConnections.activityDetail': { 1: true, 2: false, 3: false },
  'recentInteractions':   { 1: true,  2: true,  3: true  },
  /** Full lines (modal lists, narrative); DT-01 = date / recency only */
  'recentInteractions.detail': { 1: true, 2: true, 3: false },

  // Company
  'companyHierarchy':     { 1: true,  2: true,  3: false },
  /** DT-01: baseline still sees a health summary; charts are gated separately */
  'companyHealth':        { 1: true,  2: true,  3: true  },
  /** Full charts (revenue trend, practice mix, engagement area); DT-01 baseline = false */
  'companyHealth.charts': { 1: true,  2: true,  3: false },
  'companyNews':          { 1: true,  2: true,  3: true  },
  'ciReports':            { 1: true,  2: true, 3: false },
  'powerBIDashboard':     { 1: true,  2: true, 3: false },
  'catCode':              { 1: true,  2: true,  3: false },
  'clientCode':           { 1: true,  2: true,  3: false },
  'gics':                 { 1: true,  2: false, 3: false },
  'billingLawyer':        { 1: true,  2: true,  3: false },

  // Contacts
  'keyContact.toggle':    { 1: true,  2: true,  3: false },
  'alumni.flag':          { 1: true,  2: true,  3: true  },
  'contactBadges':        { 1: true,  2: true,  3: false },
  'specialDates':         { 1: true,  2: true,  3: false },

  // Lists
  'personalLists':        { 1: true,  2: true,  3: false },
  'marketingActivity':    { 1: true,  2: true,  3: false },

  // Notes
  'companyNotes':         { 1: true,  2: true,  3: true  },
  'contactNotes':         { 1: true,  2: true,  3: true  },

  // AI features
  'aiDraft':              { 1: true,  2: true,  3: false },
  'aiSummary':            { 1: true,  2: true,  3: false },

  // Scoring
  'scoringDashboard':     { 1: true,  2: true,  3: false },

  // BD-specific
  'bdTaskAssign':         { 1: false, 2: false, 3: false }, // overridden per persona below
  'crossPractice':        { 1: true,  2: false, 3: false },
};

/**
 * Per-persona overrides for field visibility (beyond tier defaults).
 */
const PERSONA_FIELD_OVERRIDES = {
  'bd-superuser': {
    'bdTaskAssign': true,
    'crossPractice': true,
  },
  'bd-standard': {
    'bdTaskAssign': true,
  },
  'group-lead': {
    'crossPractice': true,
  },
  /** Keep operational + AI affordances while using tier 3 (DT-01) field visibility */
  'legal-assistant': {
    'aiDraft': true,
    'aiSummary': true,
  },
  'associate': {
    'aiDraft': true,
    'aiSummary': true,
  },
};

/**
 * Action permissions by tier.
 */
const ACTION_PERMISSIONS = {
  'touchpoint.create':     { 1: true,  2: true,  3: true  },
  'touchpoint.assign':     { 1: false, 2: false, 3: false }, // BD overrides below
  'touchpoint.complete':   { 1: true,  2: true,  3: true  },
  'contact.add':           { 1: true,  2: true,  3: false },
  'contact.edit':          { 1: true,  2: true,  3: false },
  'contact.markKey':       { 1: true,  2: true,  3: false },
  'contact.toggleAlumni':  { 1: true,  2: false, 3: false },
  'company.add':           { 1: true,  2: false, 3: false },
  'company.edit':          { 1: true,  2: true,  3: false },
  'opportunity.add':       { 1: true,  2: true,  3: false },
  'list.create':           { 1: true,  2: true,  3: true  },
  'note.add':              { 1: true,  2: true,  3: true  },
  'tag.manage':            { 1: true,  2: true,  3: false },
  'tripPlan.create':       { 1: true,  2: true,  3: false },
  'export.csv':            { 1: true,  2: true,  3: false },
  'insight.draftOutreach': { 1: true,  2: true,  3: false },
};

const PERSONA_ACTION_OVERRIDES = {
  'bd-superuser': {
    'touchpoint.assign': true,
    'company.add': true,
    'contact.toggleAlumni': true,
  },
  'bd-standard': {
    'touchpoint.assign': true,
    'company.add': true,
  },
  'group-lead': {
    'company.add': true,
  },
  'legal-assistant': {
    'contact.add': true,
    'contact.edit': true,
    'contact.markKey': true,
    'company.edit': true,
    'export.csv': true,
    'tag.manage': true,
    'insight.draftOutreach': true,
  },
  'associate': {
    'contact.add': true,
    'contact.edit': true,
    'contact.markKey': true,
    'export.csv': true,
    'tag.manage': true,
    'insight.draftOutreach': true,
    'opportunity.add': true,
  },
};

/**
 * Data depth limits by tier.
 * Values represent max items to show.
 */
const DATA_DEPTH = {
  'relationshipHistory':  { 1: 99, 2: 3,  3: 0 },
  'recentInteractions':   { 1: 99, 2: 3,  3: 2 },
  'keyContacts':          { 1: 99, 2: 3,  3: 2 },
  'companyNotes':         { 1: 99, 2: 5,  3: 2 },
  'contactNotes':         { 1: 99, 2: 5,  3: 2 },
  'engagementRows':       { 1: 99, 2: 10, 3: 3 },
  'insightCards':         { 1: 99, 2: 20, 3: 5 },
};

/**
 * Build a persona helper object.
 */
export function buildPersonaHelper(personaId, context = {}) {
  const persona = PERSONA_MAP[personaId] || PERSONA_MAP['partner'];
  let tier = persona.tier;

  // AC-07 — Billing Lawyer accounts get higher visibility (prototype).
  // In the demo dataset, we proxy "billing lawyer accounts" as companies owned by `current-user`.
  // This context-aware tier bump lets BL see exact financials only on their accounts.
  if (persona.id === 'billing-lawyer') {
    const company = context?.company;
    const isBlAccount = Boolean(company && company.ownerId === 'current-user');
    tier = isBlAccount ? 1 : persona.tier;
  }

  // AC-04 — Equity Partner own accounts: higher transparency when viewing "My Clients".
  // Prototype: treat "own accounts" as companies owned by current-user.
  if (persona.id === 'partner') {
    const company = context?.company;
    const isOwnAccount = Boolean(company && company.ownerId === 'current-user');
    tier = isOwnAccount ? 1 : 2;
  }

  // AC-06 — Associate: Group Lead can approve Tier 2 upgrade (abstract transparency vs baseline).
  // Prototype: `associateTier2Approved` in context from demo store when upgrade is approved.
  if (persona.id === 'associate') {
    tier = context.associateTier2Approved ? 2 : persona.tier;
  }

  // AC-08 — Group Lead: higher detail when viewing companies where their assigned practice dominates.
  // Prototype assignment: Group Lead is assigned to 'Corporate'.
  if (persona.id === 'group-lead') {
    const company = context?.company;
    const practiceShare = company?.practiceShare;
    const dominant = Array.isArray(practiceShare) && practiceShare.length
      ? practiceShare.reduce((acc, row) => (row?.value > acc?.value ? row : acc), practiceShare[0])
      : null;
    const assignedPracticeGroup = 'Corporate';
    const isInPracticeGroup = Boolean(dominant && dominant.practice === assignedPracticeGroup);
    tier = isInPracticeGroup ? 1 : persona.tier;
  }

  function field(key) {
    // Check persona-level overrides first
    const overrides = PERSONA_FIELD_OVERRIDES[persona.id];
    if (overrides && key in overrides) return overrides[key];
    // Fall back to tier-level
    const tierMap = FIELD_VISIBILITY[key];
    if (!tierMap) return true; // default visible
    return tierMap[tier] ?? true;
  }

  function can(action) {
    const overrides = PERSONA_ACTION_OVERRIDES[persona.id];
    if (overrides && action in overrides) return overrides[action];
    const tierMap = ACTION_PERMISSIONS[action];
    if (!tierMap) return false;
    return tierMap[tier] ?? false;
  }

  function depth(key) {
    const tierMap = DATA_DEPTH[key];
    if (!tierMap) return 99;
    return tierMap[tier] ?? 99;
  }

  return { persona, tier, field, can, depth };
}
