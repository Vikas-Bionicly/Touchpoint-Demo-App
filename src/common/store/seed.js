import { companyRows } from '../constants/companies';
import { contactRows } from '../constants/contacts';
import { touchpointRows as legacyTouchpoints } from '../constants/touchpoints';
import { listRows as staticLists } from '../constants/lists';

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

export function buildSeedState() {
  const touchpoints = [
    ...legacyTouchpoints.map(makeTaskFromLegacy),
    // Open tasks (some overdue, some upcoming) to make the demo feel alive
    makePlannedTouchpoint({
      id: 'task-1',
      contact: pick(contactRows, 0),
      dueDaysFromNow: -6,
      title: 'Follow up after last email thread',
      description: 'Send a short check-in and propose 2 times next week.',
    }),
    makePlannedTouchpoint({
      id: 'task-2',
      contact: pick(contactRows, 1),
      dueDaysFromNow: -1,
      title: 'Prepare for upcoming meeting',
      description: 'Review relationship history and gather 3 relevant updates.',
    }),
    makePlannedTouchpoint({
      id: 'task-3',
      contact: pick(contactRows, 2),
      dueDaysFromNow: 2,
      title: 'Share relevant content',
      description: 'Send article on regulatory developments (keep it brief).',
    }),
    makePlannedTouchpoint({
      id: 'task-4',
      contact: pick(contactRows, 0),
      dueDaysFromNow: 9,
      title: 'Invite to upcoming firm event',
      description: 'Confirm interest, then coordinate with events team.',
    }),
  ];

  const lists = staticLists.map((list, index) => ({
    id: list.id,
    name: list.name,
    owner: list.owner,
    type: index === 0 ? 'Campaign' : index === 1 ? 'Targeting' : index === 2 ? 'Event' : 'Trip Planning',
    tag: list.tag,
    initials: list.initials,
    color: list.color,
    lastEngagement: list.lastEngagement,
    memberIds: contactRows.filter((_, i) => i % (index + 2) === 0).map((c) => c.id),
  }));

  return {
    version: 1,
    contacts: contactRows,
    companies: companyRows,
    touchpoints,
    notes: [],
    lists,
    tags: [
      { id: 't-practice-privacy', label: 'Privacy & Security', type: 'Practice' },
      { id: 't-practice-ma', label: 'Mergers & Acquisitions', type: 'Practice' },
      { id: 't-practice-lit', label: 'Litigation', type: 'Practice' },
      { id: 't-industry-tech', label: 'Technology', type: 'Industry' },
      { id: 't-industry-fin', label: 'Financial Services', type: 'Industry' },
      { id: 't-region-canada', label: 'Canada', type: 'Region' },
      { id: 't-region-us', label: 'United States', type: 'Region' },
      { id: 't-initiative-ai', label: 'AI & Emerging Tech', type: 'Initiative' },
      { id: 't-interest-golf', label: 'Golf', type: 'Area of Interest' },
    ],
    contactTags: {},
    companyTags: {},
    savedViews: [],
    contactFilters: {
      text: '',
      relationship: '',
      listId: '',
      city: '',
    },
    insightState: {},
  };
}

