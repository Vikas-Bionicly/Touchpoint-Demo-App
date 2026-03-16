import { companyRows } from './companies';
import { contactRows } from './contacts';

function fadingRelationshipInsights() {
  return contactRows
    .filter((contact) => contact.metricsCurrent.daysSinceLastInteraction >= 90)
    .map((contact, index) => ({
      id: `fade-${contact.id}`,
      priority: 'High',
      tone: index % 2 === 0 ? 'orange' : 'yellow',
      label: 'Fading Relationship',
      tags: ['Client Coverage', contact.company],
      title: `Re-engage with ${contact.name}`,
      description: `You have not contacted ${contact.name} in ${contact.metricsCurrent.daysSinceLastInteraction} days.`,
      subject: contact.name,
      meta1: contact.lastInteraction,
      meta2: `Last interacted ${contact.metricsCurrent.daysSinceLastInteraction} days ago`,
      meta3: `Relationship trend ${contact.relationship}`,
      suggestion: `Use internal connection ${contact.internalConnections[0]} to warm the outreach before your follow-up.`,
      cta: 'Create Touchpoint',
    }));
}

function untappedPracticeInsights() {
  return companyRows
    .filter((company) => company.metricsCurrent.mattersActive <= 1)
    .map((company, index) => ({
      id: `practice-${company.id}`,
      priority: 'Medium',
      tone: index % 2 === 0 ? 'blue' : 'cyan',
      label: 'Untapped Opportunity',
      tags: ['Practice Growth', company.category2],
      title: `${company.name}: expand active matters`,
      description: `${company.name} has only ${company.metricsCurrent.mattersActive} active matter. Identify cross-practice opportunities.`,
      subject: company.name,
      meta1: company.engagementTitle,
      meta2: `Current revenue ${company.revenue}`,
      meta3: `Relationship trend ${company.relationshipTrend}`,
      suggestion: `Review company hierarchy and pitch additional support to ${company.hierarchy[1] || company.hierarchy[0]}.`,
      cta: 'Draft Outreach',
    }));
}

function internalConnectionInsights() {
  return contactRows
    .filter((contact) => contact.internalConnections.length > 0 && contact.metricsCurrent.daysSinceLastInteraction >= 45)
    .map((contact, index) => ({
      id: `internal-${contact.id}`,
      priority: 'Medium',
      tone: index % 2 === 0 ? 'yellow' : 'orange',
      label: 'Internal Connection',
      tags: ['Warm Intro', contact.company],
      title: `Leverage internal connection for ${contact.name}`,
      description: `${contact.internalConnections[0]} has prior engagement and can help restart momentum.`,
      subject: contact.name,
      meta1: contact.lastInteraction,
      meta2: `Relationship trend ${contact.relationship}`,
      meta3: `Available connectors ${contact.internalConnections.length}`,
      suggestion: `Ask ${contact.internalConnections[0]} for a direct intro and share a targeted update.`,
      cta: 'Request Intro',
    }));
}

function engagementTrendInsights() {
  return companyRows
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

export const insightCards = [
  ...fadingRelationshipInsights(),
  ...untappedPracticeInsights(),
  ...internalConnectionInsights(),
  ...engagementTrendInsights(),
];
