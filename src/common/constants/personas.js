/**
 * Persona definitions with tier mappings, field visibility, action permissions, and data depth.
 *
 * Tier 1 — Full access (all data, exact figures, full history)
 * Tier 2 — Standard access (most data, ranges instead of exact, limited history depth)
 * Tier 3 — Restricted access (minimal data, no sensitive fields, shallow history)
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
    tier: 1,
    description: 'Non-equity partner with nearly full visibility',
  },
  {
    id: 'associate',
    label: 'Associate',
    tier: 2,
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
    tier: 1,
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
  'relationshipHistory':  { 1: true,  2: true,  3: false },
  'relationshipScore':    { 1: true,  2: true,  3: false },
  'internalConnections':  { 1: true,  2: true,  3: false },
  'recentInteractions':   { 1: true,  2: true,  3: true  },

  // Company
  'companyHierarchy':     { 1: true,  2: true,  3: false },
  'companyHealth':        { 1: true,  2: true,  3: false },
  'companyNews':          { 1: true,  2: true,  3: true  },
  'ciReports':            { 1: true,  2: false, 3: false },
  'powerBIDashboard':     { 1: true,  2: false, 3: false },
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
    'ciReports': true,
  },
  'billing-lawyer': {
    'financialTrends': true,
    'wip': true,
    'matterRank': true,
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
  'list.create':           { 1: true,  2: true,  3: false },
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
export function buildPersonaHelper(personaId) {
  const persona = PERSONA_MAP[personaId] || PERSONA_MAP['partner'];
  const tier = persona.tier;

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
