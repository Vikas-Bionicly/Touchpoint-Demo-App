/**
 * Mock upcoming meetings over the next 14 days.
 * contactName references are resolved at runtime against the store.
 */
function isoDate(daysFromNow, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const calendarEntries = [
  {
    id: 'cal-1',
    title: 'Quarterly Review',
    startAt: isoDate(1, 10),
    endAt: isoDate(1, 11),
    contactIndex: 0,
    companyIndex: 0,
    location: 'Toronto Office',
    type: 'Meeting',
  },
  {
    id: 'cal-2',
    title: 'Lunch Catch-up',
    startAt: isoDate(2, 12),
    endAt: isoDate(2, 13),
    contactIndex: 3,
    companyIndex: 1,
    location: 'Downtown Grill',
    type: 'Meeting',
  },
  {
    id: 'cal-3',
    title: 'Privacy Program Update',
    startAt: isoDate(3, 14),
    endAt: isoDate(3, 15),
    contactIndex: 5,
    companyIndex: 2,
    location: 'Virtual (Teams)',
    type: 'Call',
  },
  {
    id: 'cal-4',
    title: 'Pitch Preparation Session',
    startAt: isoDate(4, 9),
    endAt: isoDate(4, 10),
    contactIndex: 1,
    companyIndex: 0,
    location: 'Board Room A',
    type: 'Meeting',
  },
  {
    id: 'cal-5',
    title: 'Regulatory Compliance Check-in',
    startAt: isoDate(5, 15),
    endAt: isoDate(5, 16),
    contactIndex: 7,
    companyIndex: 3,
    location: 'Virtual (Zoom)',
    type: 'Call',
  },
  {
    id: 'cal-6',
    title: 'Client Advisory Board Dinner',
    startAt: isoDate(7, 18),
    endAt: isoDate(7, 21),
    contactIndex: 2,
    companyIndex: 1,
    location: "Canoe Restaurant",
    type: 'Event',
  },
  {
    id: 'cal-7',
    title: 'Cross-Practice Alignment',
    startAt: isoDate(9, 10),
    endAt: isoDate(9, 11),
    contactIndex: 4,
    companyIndex: 4,
    location: 'Calgary Office',
    type: 'Meeting',
  },
  {
    id: 'cal-8',
    title: 'Annual Relationship Review',
    startAt: isoDate(12, 14),
    endAt: isoDate(12, 15),
    contactIndex: 6,
    companyIndex: 5,
    location: 'Partner Boardroom',
    type: 'Meeting',
  },
  {
    id: 'cal-9',
    title: 'AI Governance Briefing',
    startAt: isoDate(3, 16),
    endAt: isoDate(3, 17),
    contactIndex: 8,
    companyIndex: 6,
    location: 'Virtual (Teams)',
    type: 'Call',
  },
  {
    id: 'cal-10',
    title: 'Site Visit Follow-up',
    startAt: isoDate(6, 11),
    endAt: isoDate(6, 12),
    contactIndex: 9,
    companyIndex: 7,
    location: 'Client Office',
    type: 'Visit',
  },
];
