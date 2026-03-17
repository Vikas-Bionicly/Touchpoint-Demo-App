import { calculateRelationshipStrength } from '../utils/relationshipStrength';

const contacts = [
  {
    id: 'r1',
    name: 'Molly Hensen',
    role: 'VP, Regional General Counsel',
    company: 'EdgeTech LLC',
    city: 'Toronto',
    region: 'Canada',
    lastInteraction: 'Assistant sent an email on 12/15 about Holiday...',
    avatarUrl: 'https://i.pravatar.cc/96?img=47',
    signalTone: 'green',
    recentInteractions: [
      '12/15: Assistant sent holiday schedule update email',
      '11/28: Shared privacy webinar invite',
      '10/14: Intro call with data governance team',
    ],
    relationshipHistory: ['Q1 2025: Growing', 'Q2 2025: Stable', 'Q3 2025: Declining'],
    internalConnections: ['Shanon Easter (Partner)', 'Ravi Patel (Cybersecurity Partner)'],
    metricsCurrent: {
      daysSinceLastInteraction: 93,
      interactionsLast90d: 2,
      engagementQuality: 2,
      mattersActive: 1,
      twoWayRatio: 0.35,
    },
    metricsPrevious: {
      daysSinceLastInteraction: 48,
      interactionsLast90d: 6,
      engagementQuality: 3,
      mattersActive: 1,
      twoWayRatio: 0.5,
    },
  },
  {
    id: 'r2',
    name: 'Jeff Gilberto',
    role: 'Chief Legal Officer',
    company: 'Blue Water Engineering',
    city: 'Calgary',
    region: 'Canada',
    lastInteraction: 'You met Jeff for lunch last month...',
    avatarUrl: 'https://i.pravatar.cc/96?img=12',
    signalTone: 'yellow',
    recentInteractions: [
      '01/12: In-person lunch with BD team',
      '12/29: Sent quarterly update memo',
      '12/21: Jeff replied with budget priorities',
    ],
    relationshipHistory: ['Q1 2025: Stable', 'Q2 2025: Stable', 'Q3 2025: Growing'],
    internalConnections: ['Aria Collins (Client Partner)', 'Naomi Grant (Corporate Associate)'],
    metricsCurrent: {
      daysSinceLastInteraction: 12,
      interactionsLast90d: 11,
      engagementQuality: 4,
      mattersActive: 2,
      twoWayRatio: 0.72,
    },
    metricsPrevious: {
      daysSinceLastInteraction: 26,
      interactionsLast90d: 8,
      engagementQuality: 4,
      mattersActive: 1,
      twoWayRatio: 0.62,
    },
  },
  {
    id: 'r3',
    name: 'Jenny Li',
    role: 'Chief Counsel, Litigation',
    company: 'Prisma Bio Research',
    city: 'Vancouver',
    region: 'Canada',
    lastInteraction: 'Assistant sent an email on 11/30 about an U...',
    avatarUrl: 'https://i.pravatar.cc/96?img=5',
    signalTone: 'orange',
    recentInteractions: [
      '11/30: Assistant sent event invitation',
      '09/22: Litigation update follow-up',
      '08/17: Shared regulatory briefing',
    ],
    relationshipHistory: ['Q1 2025: Stable', 'Q2 2025: Declining', 'Q3 2025: Declining'],
    internalConnections: ['Derek Shaw (Litigation Partner)'],
    metricsCurrent: {
      daysSinceLastInteraction: 108,
      interactionsLast90d: 1,
      engagementQuality: 2,
      mattersActive: 0,
      twoWayRatio: 0.28,
    },
    metricsPrevious: {
      daysSinceLastInteraction: 72,
      interactionsLast90d: 3,
      engagementQuality: 3,
      mattersActive: 1,
      twoWayRatio: 0.42,
    },
  },
];

export const contactRows = contacts.map((contact) => {
  const relationship = calculateRelationshipStrength(contact.metricsCurrent, contact.metricsPrevious);
  return {
    ...contact,
    lastInteracted: `${contact.metricsCurrent.daysSinceLastInteraction} days ago`,
    relationship: relationship.trend,
    relationshipScore: relationship.score,
    relationshipDelta: relationship.delta,
  };
});
