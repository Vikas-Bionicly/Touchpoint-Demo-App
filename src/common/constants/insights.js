import { demoStore } from '../store/demoStore';
import insightTypesRaw from '../../../demo-data/insight-types.json';

// Build priority map from insight-types.json
const priorityMap = {};
insightTypesRaw.forEach((it) => {
  priorityMap[it.insightTypeName] = parseFloat(it.priorityWeighting) || 0.09;
});

function getContacts() {
  return demoStore.getState().contacts || [];
}

function getCompanies() {
  return demoStore.getState().companies || [];
}

function priorityFromWeight(weight) {
  if (weight >= 0.098) return 'High';
  if (weight >= 0.095) return 'Medium';
  return 'Low';
}

function fadingRelationshipInsights() {
  return getContacts()
    .filter((contact) => contact.metricsCurrent.daysSinceLastInteraction >= 90)
    .slice(0, 15)
    .map((contact, index) => ({
      id: `fade-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Fading Relationship'] || 0.096),
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
  return getCompanies()
    .filter((company) => company.metricsCurrent.mattersActive <= 1)
    .map((company, index) => ({
      id: `practice-${company.id}`,
      priority: priorityFromWeight(priorityMap['Opportunity Follow-up'] || 0.094),
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
  return getContacts()
    .filter((contact) => contact.internalConnections.length > 0 && contact.metricsCurrent.daysSinceLastInteraction >= 45)
    .slice(0, 10)
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
  return getCompanies()
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

function initialEngagementInsights() {
  return getContacts()
    .filter((c) => c.metricsCurrent.interactionsLast90d === 0)
    .slice(0, 5)
    .map((contact, index) => ({
      id: `initial-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Initial Engagement'] || 0.093),
      tone: index % 2 === 0 ? 'blue' : 'green',
      label: 'Initial Engagement',
      tags: ['New Contact', contact.company],
      title: `Introduce yourself to ${contact.name}`,
      description: `${contact.name} was recently added but has no touchpoints. Initiate first contact.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: `Company: ${contact.company}`,
      meta3: `City: ${contact.city || 'Unknown'}`,
      suggestion: `Send a brief introductory email referencing a mutual interest or recent company news.`,
      cta: 'Draft Outreach',
    }));
}

function eventRecommendationInsights() {
  return getContacts()
    .filter((_, i) => i % 12 === 0)
    .slice(0, 4)
    .map((contact, index) => ({
      id: `event-rec-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Event Recommendation'] || 0.095),
      tone: index % 2 === 0 ? 'green' : 'cyan',
      label: 'Event Recommendation',
      tags: ['Engagement', contact.company],
      title: `Invite ${contact.name} to upcoming event`,
      description: `${contact.name}'s interests align with an upcoming firm event. A personal invite could strengthen the relationship.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: `Relationship: ${contact.relationship}`,
      meta3: `Last interacted: ${contact.lastInteracted}`,
      suggestion: `Send a personalized event invitation highlighting topics relevant to ${contact.name}'s work.`,
      cta: 'Draft Outreach',
    }));
}

function litigationFilingInsights() {
  return getCompanies()
    .filter((co) => co.matters?.some((m) => m.practiceArea === 'Litigation' && m.status === 'Active'))
    .slice(0, 3)
    .map((company, index) => ({
      id: `lit-filing-${company.id}`,
      priority: priorityFromWeight(priorityMap['Litigation Filing'] || 0.097),
      tone: 'orange',
      label: 'Litigation Filing',
      tags: ['Legal Alert', company.name],
      title: `Active litigation detected for ${company.name}`,
      description: `${company.name} has an active litigation matter. Ensure the team is aligned and the client is supported.`,
      subject: company.name,
      meta1: `Active matters: ${company.metricsCurrent.mattersActive}`,
      meta2: `Client status: ${company.clientStatus}`,
      meta3: `Revenue: ${company.revenue}`,
      suggestion: `Coordinate with the litigation team and check in with the key contact about case progress.`,
      cta: 'Schedule Follow-up',
    }));
}

function upcomingMeetingInsights() {
  return getContacts()
    .filter((c) => c.metricsCurrent.daysSinceLastInteraction <= 14 && c.metricsCurrent.interactionsLast90d >= 3)
    .slice(0, 4)
    .map((contact, index) => ({
      id: `meeting-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Upcoming Meeting'] || 0.098),
      tone: index % 2 === 0 ? 'blue' : 'green',
      label: 'Upcoming Meeting',
      tags: ['Preparation', contact.company],
      title: `Prepare for meeting with ${contact.name}`,
      description: `You have recent activity with ${contact.name}. Review notes and prepare talking points.`,
      subject: contact.name,
      meta1: `Last interacted: ${contact.lastInteracted}`,
      meta2: `Interactions (90d): ${contact.metricsCurrent.interactionsLast90d}`,
      meta3: `Relationship: ${contact.relationship}`,
      suggestion: `Review recent notes and gather 3 relevant updates before your next meeting.`,
      cta: 'Create Touchpoint',
    }));
}

function pertinentClientAlertInsights() {
  return getContacts()
    .filter((_, i) => i % 15 === 0)
    .slice(0, 3)
    .map((contact, index) => ({
      id: `client-alert-${contact.id}`,
      priority: priorityFromWeight(priorityMap['Pertinent Client Alert'] || 0.099),
      tone: 'orange',
      label: 'Pertinent Client Alert',
      tags: ['Content Match', contact.company],
      title: `New firm content relevant to ${contact.name}`,
      description: `Recently published firm content matches ${contact.name}'s interests. Share it to add value.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: `Company: ${contact.company}`,
      meta3: `Relationship: ${contact.relationship}`,
      suggestion: `Forward the content with a personal note explaining its relevance to their current work.`,
      cta: 'Share Content',
    }));
}

function newRolePromotionInsights() {
  return getContacts()
    .filter((_, i) => i % 5 === 0)
    .slice(0, 3)
    .map((contact) => ({
      id: `role-change-${contact.id}`,
      priority: 'High',
      tone: 'orange',
      label: 'Job Change',
      tags: ['Career Move', contact.company],
      title: `${contact.name} has a new role`,
      description: `${contact.name} appears to have been promoted or changed roles. This is a great opportunity to re-engage.`,
      subject: contact.name,
      meta1: `Current role: ${contact.role}`,
      meta2: `Company: ${contact.company}`,
      meta3: `Relationship: ${contact.relationship}`,
      suggestion: `Send a congratulatory note and explore how the new role might create opportunities for expanded engagement.`,
      cta: 'Draft Outreach',
    }));
}

function companyNewsInsights() {
  return getCompanies()
    .slice(0, 3)
    .map((company, index) => ({
      id: `news-${company.id}`,
      priority: 'Medium',
      tone: index % 2 === 0 ? 'blue' : 'green',
      label: 'Company News',
      tags: ['Market Intelligence', company.name],
      title: `${company.name}: recent news coverage`,
      description: `${company.name} has been in the news recently. Review and consider timely outreach.`,
      subject: company.name,
      meta1: `Client status: ${company.clientStatus}`,
      meta2: `Revenue: ${company.revenue}`,
      meta3: `Engagement: ${company.recentEngagement}`,
      suggestion: `Reference the news in your next touchpoint to demonstrate awareness and add value.`,
      cta: 'Share Content',
    }));
}

function teamCoordinationInsights() {
  return getContacts()
    .filter((c) => c.internalConnections.length > 1)
    .slice(0, 3)
    .map((contact) => ({
      id: `team-coord-${contact.id}`,
      priority: 'Medium',
      tone: 'yellow',
      label: 'Team Coordination',
      tags: ['Coordination', contact.company],
      title: `Coordinate outreach for ${contact.name}`,
      description: `Multiple colleagues have recent activity with ${contact.name}. Align to avoid duplication.`,
      subject: contact.name,
      meta1: `Internal connections: ${contact.internalConnections.join(', ')}`,
      meta2: `Relationship: ${contact.relationship}`,
      meta3: `Last interacted: ${contact.lastInteracted}`,
      suggestion: `Check with ${contact.internalConnections[0]} before your next outreach to coordinate messaging.`,
      cta: 'View Connections',
    }));
}

function crossSellInsights() {
  return getCompanies()
    .filter((co) => co.metricsCurrent.mattersActive >= 2)
    .slice(0, 3)
    .map((company) => ({
      id: `cross-sell-${company.id}`,
      priority: 'Medium',
      tone: 'cyan',
      label: 'Cross-Sell Opportunity',
      tags: ['Revenue Growth', company.name],
      title: `Cross-practice opportunity at ${company.name}`,
      description: `${company.name} has strong engagement in one practice area. Explore adjacent services.`,
      subject: company.name,
      meta1: `Active matters: ${company.metricsCurrent.mattersActive}`,
      meta2: `Revenue: ${company.revenue}`,
      meta3: `Relationship trend: ${company.relationshipTrend}`,
      suggestion: `Propose a practice overview meeting to identify where additional support could add value.`,
      cta: 'Draft Outreach',
    }));
}

function birthdaySpecialEventInsights() {
  return getContacts()
    .filter((c) => c.specialDates?.birthday)
    .slice(0, 5)
    .map((contact) => ({
      id: `birthday-${contact.id}`,
      priority: 'Low',
      tone: 'green',
      label: 'Special Date',
      tags: ['Personal Touch', contact.company],
      title: `${contact.name}'s birthday is coming up`,
      description: `Birthday: ${contact.specialDates.birthday}. A personal touch can strengthen the relationship.`,
      subject: contact.name,
      meta1: `Birthday: ${contact.specialDates.birthday}`,
      meta2: `Relationship: ${contact.relationship}`,
      meta3: `Company: ${contact.company}`,
      suggestion: `Send a brief, personal birthday message to maintain warmth in the relationship.`,
      cta: 'Create Touchpoint',
    }));
}

function jobChangeBadgeInsights() {
  return getContacts()
    .filter((c) => (c.contactBadges || []).includes('job-change'))
    .slice(0, 3)
    .map((contact) => ({
      id: `badge-job-${contact.id}`,
      priority: 'High',
      tone: 'orange',
      label: 'Job Change Alert',
      tags: ['Career Move', contact.company],
      title: `${contact.name} — job change detected`,
      description: `${contact.name} has a job change badge. This may signal a new opportunity or risk.`,
      subject: contact.name,
      meta1: `Role: ${contact.role}`,
      meta2: `Company: ${contact.company}`,
      meta3: `Score: ${contact.relationshipScore}`,
      suggestion: `Reach out promptly to congratulate and explore the implications for your engagement.`,
      cta: 'Draft Outreach',
    }));
}

export function generateInsightCards() {
  return [
    ...fadingRelationshipInsights(),
    ...untappedPracticeInsights(),
    ...internalConnectionInsights(),
    ...engagementTrendInsights(),
    ...initialEngagementInsights(),
    ...eventRecommendationInsights(),
    ...litigationFilingInsights(),
    ...upcomingMeetingInsights(),
    ...pertinentClientAlertInsights(),
    ...newRolePromotionInsights(),
    ...companyNewsInsights(),
    ...teamCoordinationInsights(),
    ...crossSellInsights(),
    ...birthdaySpecialEventInsights(),
    ...jobChangeBadgeInsights(),
  ];
}

// Legacy export for backward compatibility — generates fresh on each access
export const insightCards = generateInsightCards();
