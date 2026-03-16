import { contactRows } from './contacts';

const jenny = contactRows.find((contact) => contact.name === 'Jenny Li');

export const touchpointRows = [
  {
    id: 't1',
    interactionType: 'Email',
    date: '11/23/24',
    contactName: 'Jenny Li',
    role: 'Chief Counsel, Litigation',
    company: 'Prisma Bio Research',
    interactionTitle: 'Assistant sent an email on 11/30 about an Upcoming...',
    lastInteracted: '108 days ago',
    relationshipStatus: jenny ? jenny.relationship : 'Declining',
    relationshipScore: jenny ? jenny.relationshipScore : 38,
    followUpDate: '12/03/24',
    outcome: 'Awaiting reply',
    notes: 'Follow up with event agenda and attendees.',
    history: [
      '11/30/24: Email sent - invited to upcoming event',
      '11/23/24: Prior check-in reminder created',
      '09/18/24: Shared litigation roundtable summary',
    ],
    avatarUrl: 'https://i.pravatar.cc/96?img=5',
    signalTone: 'yellow',
  },
];
