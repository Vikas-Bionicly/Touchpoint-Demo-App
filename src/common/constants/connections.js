import { contactRows } from './contacts';

// Simple mock "who knows whom" dataset keyed by contact id.
// In a real implementation this would be sourced from ERM relationship data.

function makeColleague(id, name, role, connectionType, strength, lastInteraction, note) {
  return {
    id,
    name,
    role,
    connectionType,
    strength,
    lastInteraction,
    note,
  };
}

export const firmConnectionsByContactId = contactRows.reduce((acc, contact, index) => {
  const colleagues = [];

  const colleague1 = contactRows[(index + 1) % contactRows.length];
  const colleague2 = contactRows[(index + 2) % contactRows.length];

  colleagues.push(
    makeColleague(
      `${contact.id}-c1`,
      colleague1.name,
      colleague1.role,
      'Worked together on matters',
      'Strong',
      '7 days ago',
      'Primary relationship holder for this client.'
    )
  );

  colleagues.push(
    makeColleague(
      `${contact.id}-c2`,
      colleague2.name,
      colleague2.role,
      'Met at conference',
      'Medium',
      '30 days ago',
      'Good rapport, can provide a warm intro.'
    )
  );

  acc[contact.id] = colleagues;
  return acc;
}, {});

