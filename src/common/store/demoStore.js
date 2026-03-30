import { useSyncExternalStore } from 'react';
import { manualAttributionFromLoggedType } from '../utils/lastInteractionAttribution';
import { buildCrossSellPracticeContext } from '../utils/crossSellPractice';
import { hasValueAddGap } from '../utils/valueAddGap';
import { buildSeedState } from './seed';

// Bump this version any time we change seed/transform logic,
// so users don't get stuck on an older localStorage snapshot.
const STORAGE_KEY = 'touchpoint-demo:v21';

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadFromStorage() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return safeJsonParse(raw);
}

function saveToStorage(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function extractMonthDay(text) {
  const m = String(text || '').match(/\b(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])\b/);
  if (!m) return null;
  return { month: Number(m[1]), day: Number(m[2]) };
}

function upcomingDateWithinDays(month, day, windowDays = 45) {
  if (!month || !day) return null;
  const now = new Date();
  const candidate = new Date(now.getFullYear(), month - 1, day, 9, 0, 0, 0);
  if (candidate < now) candidate.setFullYear(candidate.getFullYear() + 1);
  const diffDays = Math.ceil((candidate.getTime() - now.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= windowDays ? { date: candidate, diffDays } : null;
}

function createStore() {
  let state = loadFromStorage() || buildSeedState();
  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => fn());
  }

  function setState(updater) {
    const next = typeof updater === 'function' ? updater(state) : updater;
    state = next;
    saveToStorage(state);
    emit();
  }

  return {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions: {
      // --- Activity Log ---
      logActivity({ type, entityType, entityId, entityName, description, metadata }) {
        const activity = {
          id: uid('act'),
          type,
          entityType: entityType || '',
          entityId: entityId || '',
          entityName: entityName || '',
          description: description || '',
          metadata: metadata || {},
          createdAt: new Date().toISOString(),
        };
        setState((prev) => ({
          ...prev,
          activities: [activity, ...(prev.activities || []).slice(0, 499)],
        }));
        return activity.id;
      },

      // --- Persona ---
      setCurrentPersona(personaId) {
        setState((prev) => ({
          ...prev,
          currentPersonaId: personaId,
        }));
      },

      requestAssociateTier2Upgrade() {
        setState((prev) => ({
          ...prev,
          associateTier2UpgradeStatus: 'pending',
        }));
      },

      approveAssociateTier2Upgrade() {
        setState((prev) => ({
          ...prev,
          associateTier2UpgradeStatus: 'approved',
        }));
      },

      rejectAssociateTier2Upgrade() {
        setState((prev) => ({
          ...prev,
          associateTier2UpgradeStatus: 'none',
        }));
      },

      // Legacy role setter (kept for backward compat during transition)
      setCurrentRole(role) {
        setState((prev) => ({
          ...prev,
          currentRole: role,
        }));
      },

      resetToSeed() {
        setState(buildSeedState());
      },

      // --- Touchpoints ---
      addTouchpointTask(input) {
        const nowIso = new Date().toISOString();
        const id = uid('task');
        const item = {
          id,
          kind: 'task',
          status: 'open',
          createdAt: nowIso,
          dueAt: input.dueAt || null,
          completedAt: null,
          cancelledAt: null,
          contactName: input.contactName,
          company: input.company || '',
          role: input.role || '',
          interactionType: input.interactionType || 'Follow-up',
          title: input.title || 'Touchpoint follow-up',
          outcome: '',
          notes: input.notes || '',
          followUpDate: '',
          history: [],
          avatarUrl: input.avatarUrl || '',
          signalTone: input.signalTone || 'blue',
          relationshipStatus: input.relationshipStatus || 'Stable',
          relationshipScore: input.relationshipScore ?? 50,
          lastInteracted: input.lastInteracted || '',
          source: input.source || 'manual',
          principal: input.principal || '',
          assignedTo: input.assignedTo || '',
          assignedBy: input.assignedBy || '',
          onBehalfOf: input.onBehalfOf || '',
          visitStage: input.visitStage || '',
        };

        setState((prev) => ({
          ...prev,
          touchpoints: [item, ...prev.touchpoints],
        }));

        this.logActivity({ type: 'touchpoint.created', entityType: 'contact', entityName: input.contactName, description: `Created touchpoint: ${item.title}` });
        return id;
      },

      logInteraction(input) {
        const nowIso = new Date().toISOString();
        const id = uid('int');
        const item = {
          id,
          kind: 'interaction',
          status: 'completed',
          createdAt: nowIso,
          dueAt: null,
          completedAt: nowIso,
          cancelledAt: null,
          contactName: input.contactName,
          company: input.company || '',
          role: input.role || '',
          interactionType: input.interactionType || 'Email',
          title: input.title || `${input.interactionType || 'Interaction'} logged for ${input.contactName}`,
          outcome: input.outcome || '',
          notes: input.notes || '',
          followUpDate: input.followUpDate || '',
          history: input.history || [],
          avatarUrl: input.avatarUrl || '',
          signalTone: input.signalTone || 'blue',
          relationshipStatus: input.relationshipStatus || 'Stable',
          relationshipScore: input.relationshipScore ?? 50,
          lastInteracted: input.lastInteracted || '0 days ago',
          source: input.source || 'manual',
          principal: input.principal || '',
          assignedTo: input.assignedTo || '',
          assignedBy: input.assignedBy || '',
          onBehalfOf: input.onBehalfOf || '',
          visitStage: input.visitStage || '',
        };

        const attr = manualAttributionFromLoggedType(input.interactionType);
        setState((prev) => ({
          ...prev,
          touchpoints: [item, ...prev.touchpoints],
          contacts: prev.contacts.map((c) =>
            c.name !== input.contactName
              ? c
              : {
                  ...c,
                  lastInteraction: item.title || `${input.interactionType || 'Activity'} logged`,
                  lastInteracted: '0 days ago',
                  lastInteractionAttribution: attr,
                }
          ),
        }));

        this.logActivity({ type: 'interaction.logged', entityType: 'contact', entityName: input.contactName, description: `Logged ${input.interactionType || 'interaction'} with ${input.contactName}` });
        return id;
      },

      completeTouchpoint(id) {
        const nowIso = new Date().toISOString();
        const tp = state.touchpoints.find((t) => t.id === id);
        setState((prev) => ({
          ...prev,
          touchpoints: prev.touchpoints.map((t) =>
            t.id === id ? { ...t, status: 'completed', completedAt: nowIso, cancelledAt: null } : t
          ),
        }));
        this.logActivity({ type: 'touchpoint.completed', entityType: 'contact', entityId: id, entityName: tp?.contactName || '', description: `Completed touchpoint: ${tp?.title || id}` });
      },

      cancelTouchpoint(id) {
        const nowIso = new Date().toISOString();
        setState((prev) => ({
          ...prev,
          touchpoints: prev.touchpoints.map((t) => (t.id === id ? { ...t, status: 'cancelled', cancelledAt: nowIso } : t)),
        }));
      },

      rescheduleTouchpoint(id, dueAt) {
        setState((prev) => ({
          ...prev,
          touchpoints: prev.touchpoints.map((t) => (t.id === id ? { ...t, dueAt, status: 'open' } : t)),
        }));
      },

      assignTouchpoint(id, payloadOrAssignedTo, assignedByLegacy) {
        const payload =
          typeof payloadOrAssignedTo === 'object' && payloadOrAssignedTo !== null
            ? payloadOrAssignedTo
            : { assignedTo: payloadOrAssignedTo, assignedBy: assignedByLegacy };

        const current = state.touchpoints.find((t) => t.id === id);
        const historyEntry = [
          `Assignment updated`,
          payload.assignedTo !== undefined ? `to ${payload.assignedTo || 'Unassigned'}` : null,
          payload.principal !== undefined ? `principal ${payload.principal || 'Not set'}` : null,
          payload.onBehalfOf !== undefined && payload.onBehalfOf ? `(on behalf of ${payload.onBehalfOf})` : null,
          payload.assignedBy ? `by ${payload.assignedBy}` : null,
        ]
          .filter(Boolean)
          .join(' ');

        setState((prev) => ({
          ...prev,
          touchpoints: prev.touchpoints.map((t) =>
            t.id === id
              ? {
                  ...t,
                  assignedTo: payload.assignedTo ?? t.assignedTo,
                  assignedBy: payload.assignedBy ?? t.assignedBy,
                  principal: payload.principal ?? t.principal,
                  dueAt: payload.dueAt ?? t.dueAt,
                  onBehalfOf: payload.onBehalfOf ?? t.onBehalfOf,
                  history: historyEntry ? [historyEntry, ...(t.history || [])] : t.history || [],
                }
              : t
          ),
        }));

        this.logActivity({
          type: 'touchpoint.assigned',
          entityType: 'touchpoint',
          entityId: id,
          entityName: current?.title || id,
          description: historyEntry || `Updated assignment for ${current?.title || id}`,
        });
      },

      setVisitStage(id, stage) {
        setState((prev) => ({
          ...prev,
          touchpoints: prev.touchpoints.map((t) => {
            if (t.id !== id) return t;
            const prevStage = String(t.visitStage || '').trim();
            const line =
              prevStage && prevStage !== stage
                ? `Visit workflow: ${prevStage} → ${stage}`
                : `Visit workflow: ${stage}`;
            return {
              ...t,
              visitStage: stage,
              history: [line, ...(t.history || [])],
            };
          }),
        }));
      },

      // --- Insights ---
      likeInsight(insightId) {
        setState((prev) => {
          const current = prev.insightState?.[insightId] || {};
          return {
            ...prev,
            insightState: {
              ...(prev.insightState || {}),
              [insightId]: { ...current, liked: !current.liked },
            },
          };
        });
        this.logActivity({ type: 'insight.liked', entityType: 'insight', entityId: insightId, description: `Liked insight ${insightId}` });
      },

      dismissInsight(insightId) {
        setState((prev) => {
          const current = prev.insightState?.[insightId] || {};
          return {
            ...prev,
            insightState: {
              ...(prev.insightState || {}),
              [insightId]: { ...current, dismissed: true },
            },
          };
        });
        this.logActivity({ type: 'insight.dismissed', entityType: 'insight', entityId: insightId, description: `Dismissed insight ${insightId}` });
      },

      undismissInsight(insightId) {
        setState((prev) => {
          const current = prev.insightState?.[insightId] || {};
          return {
            ...prev,
            insightState: {
              ...(prev.insightState || {}),
              [insightId]: { ...current, dismissed: false },
            },
          };
        });
      },

      // --- Notes ---
      addContactNote(input) {
        const nowIso = new Date().toISOString();
        const id = uid('note');
        const note = {
          id,
          contactId: input.contactId,
          contactName: input.contactName,
          type: input.type || 'General',
          visibility: input.visibility || 'private',
          text: input.text,
          shareWith: input.shareWith || '',
          createdAt: nowIso,
        };

        setState((prev) => ({
          ...prev,
          notes: [note, ...prev.notes],
        }));

        this.logActivity({ type: 'note.added', entityType: 'contact', entityId: input.contactId, entityName: input.contactName, description: `Added note for ${input.contactName}` });
        return id;
      },

      generateNoteTypeReminders() {
        const nowIso = new Date().toISOString();
        setState((prev) => {
          const existing = prev.notifications || [];
          const sourceKeys = new Set(existing.map((n) => n.sourceKey).filter(Boolean));
          const add = [];

          (prev.notes || []).forEach((note) => {
            const contactName = note.contactName || 'Contact';

            if (note.type === 'Special Dates') {
              const md = extractMonthDay(note.text);
              if (!md) return;
              const upcoming = upcomingDateWithinDays(md.month, md.day, 45);
              if (!upcoming) return;
              const sourceKey = `note-reminder:special-date:${note.id}:${upcoming.date.getFullYear()}`;
              if (sourceKeys.has(sourceKey)) return;
              sourceKeys.add(sourceKey);
              add.push({
                id: uid('notif'),
                type: 'Reminder',
                title: `Upcoming special date: ${contactName}`,
                message: `${String(md.month).padStart(2, '0')}/${String(md.day).padStart(2, '0')} is in ${upcoming.diffDays} day(s). Plan a timely touchpoint.`,
                createdAt: nowIso,
                read: false,
                sourceKey,
              });
            }

            if (note.type === 'Personal Interests') {
              const createdAt = new Date(note.createdAt || 0);
              if (Number.isNaN(createdAt.getTime())) return;
              const ageDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
              if (ageDays < 45) return;
              const cycle = Math.floor(ageDays / 45);
              const sourceKey = `note-reminder:personal-interest:${note.id}:cycle-${cycle}`;
              if (sourceKeys.has(sourceKey)) return;
              sourceKeys.add(sourceKey);
              add.push({
                id: uid('notif'),
                type: 'Reminder',
                title: `Refresh personal interests: ${contactName}`,
                message: `This Personal Interests note is ${ageDays} days old. Confirm it is still current before your next outreach.`,
                createdAt: nowIso,
                read: false,
                sourceKey,
              });
            }
          });

          if (!add.length) return prev;
          return {
            ...prev,
            notifications: [...add, ...existing],
          };
        });
      },

      addCompanyNote(input) {
        const nowIso = new Date().toISOString();
        const id = uid('company-note');
        const note = {
          id,
          companyId: input.companyId,
          companyName: input.companyName,
          type: input.type || 'General',
          visibility: input.visibility || 'private',
          text: input.text,
          shareWith: input.shareWith || '',
          createdAt: nowIso,
        };

        setState((prev) => ({
          ...prev,
          companyNotes: [note, ...(prev.companyNotes || [])],
        }));

        this.logActivity({ type: 'note.added', entityType: 'company', entityId: input.companyId, entityName: input.companyName, description: `Added note for ${input.companyName}` });
        return id;
      },

      addContactToLists(contactId, listIds) {
        setState((prev) => ({
          ...prev,
          lists: prev.lists.map((list) =>
            listIds.includes(list.id) && !list.memberIds.includes(contactId)
              ? { ...list, memberIds: [...list.memberIds, contactId] }
              : list
          ),
        }));
      },

      addContactsToList(listId, contactIds) {
        const ids = Array.isArray(contactIds) ? contactIds.filter(Boolean) : [];
        if (!listId || !ids.length) return 0;
        let added = 0;
        setState((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => {
            if (list.id !== listId) return list;
            const existing = new Set(list.memberIds || []);
            ids.forEach((id) => {
              if (!existing.has(id)) {
                existing.add(id);
                added += 1;
              }
            });
            return {
              ...list,
              memberIds: Array.from(existing),
              members: Array.from(existing).length,
            };
          }),
        }));
        if (added > 0) {
          this.logActivity({
            type: 'list.members.added',
            entityType: 'list',
            entityId: listId,
            description: `Added ${added} contact${added === 1 ? '' : 's'} to trip planning list`,
          });
        }
        return added;
      },

      addListNote(input) {
        const nowIso = new Date().toISOString();
        const id = uid('list-note');
        const note = {
          id,
          listId: input.listId,
          text: input.text,
          createdAt: nowIso,
          author: input.author || 'BD team',
        };

        setState((prev) => ({
          ...prev,
          listNotes: [note, ...(prev.listNotes || [])],
        }));

        return id;
      },

      addTouchpointNote(input) {
        const nowIso = new Date().toISOString();
        const id = uid('tp-note');
        const note = {
          id,
          touchpointId: input.touchpointId,
          text: input.text,
          createdAt: nowIso,
          author: input.author || 'You',
        };

        setState((prev) => ({
          ...prev,
          touchpointNotes: [note, ...(prev.touchpointNotes || [])],
        }));

        return id;
      },

      // --- Contacts CRUD ---
      addContact(input) {
        const id = uid('contact');
        const contact = {
          id,
          name: input.name || 'New Contact',
          role: input.role || 'Client Contact',
          company: input.company || '',
          city: input.city || '',
          region: input.region || '',
          email: input.email || '',
          phone: input.phone || '',
          lastInteraction: 'No interactions yet',
          lastInteracted: '0 days ago',
          lastInteractionAttribution: { system: 'manual', channel: 'Pending first touchpoint' },
          avatarUrl: `https://i.pravatar.cc/96?img=${Math.floor(Math.random() * 70) + 1}&u=${encodeURIComponent(input.name || id)}`,
          signalTone: 'blue',
          recentInteractions: [],
          relationshipHistory: [],
          internalConnections: [],
          coordinationPeers: [],
          metricsCurrent: {
            daysSinceLastInteraction: 0,
            interactionsLast90d: 0,
            engagementQuality: 3,
            mattersActive: 0,
            twoWayRatio: 0.5,
          },
          metricsPrevious: {
            daysSinceLastInteraction: 0,
            interactionsLast90d: 0,
            engagementQuality: 3,
            mattersActive: 0,
            twoWayRatio: 0.5,
          },
          relationship: 'New',
          relationshipScore: 50,
          relationshipDelta: 0,
          isKeyContact: input.isKeyContact || false,
          isAlumni: input.isAlumni || false,
          contactBadges: [],
          specialDates: input.specialDates || {},
          ownerId: input.ownerId || 'current-user',
        };

        setState((prev) => ({
          ...prev,
          contacts: [contact, ...prev.contacts],
        }));

        this.logActivity({ type: 'contact.created', entityType: 'contact', entityId: id, entityName: contact.name, description: `Created contact: ${contact.name}` });
        return id;
      },

      updateContact(id, updates) {
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      toggleKeyContact(id) {
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) =>
            c.id === id ? { ...c, isKeyContact: !c.isKeyContact } : c
          ),
        }));
      },

      toggleAlumniFlag(id) {
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) =>
            c.id === id ? { ...c, isAlumni: !c.isAlumni } : c
          ),
        }));
      },

      // --- Companies CRUD ---
      addCompany(input) {
        const id = uid('company');
        const company = {
          id,
          name: input.name || 'New Company',
          category1: input.accountType || 'Prospective',
          category2: input.industry || '',
          engagementTitle: 'No engagements yet',
          recentEngagement: 'Never',
          clientStatus: 'New',
          logo: '',
          avatarUrl: '',
          revenue: '$0',
          hierarchy: [input.name || 'New Company'],
          keyContacts: [],
          recentInteractions: [],
          relationshipHistory: [],
          metricsCurrent: { daysSinceLastInteraction: 0, interactionsLast90d: 0, engagementQuality: 3, mattersActive: 0, twoWayRatio: 0.5 },
          metricsPrevious: { daysSinceLastInteraction: 0, interactionsLast90d: 0, engagementQuality: 3, mattersActive: 0, twoWayRatio: 0.5 },
          revenueHistory: [],
          practiceShare: [],
          revenueByPracticeOffice: {},
          mattersTrends: [],
          opportunityActivity: [],
          matters: [],
          opportunities: [],
          relationshipTrend: 'New',
          relationshipScore: 50,
          catCode: input.catCode || '',
          clientCode: input.clientCode || '',
          gics: input.gics || '',
          billingLawyer: input.billingLawyer || '',
          newsItems: [],
          accountType: input.accountType || 'Prospective',
          ownerId: input.ownerId || 'current-user',
          isStrategicAccount: Boolean(input.isStrategicAccount),
        };

        setState((prev) => ({
          ...prev,
          companies: [company, ...prev.companies],
        }));

        this.logActivity({ type: 'company.created', entityType: 'company', entityId: id, entityName: company.name, description: `Created company: ${company.name}` });
        return id;
      },

      updateCompany(id, updates) {
        setState((prev) => ({
          ...prev,
          companies: prev.companies.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      // --- Opportunities ---
      addOpportunity(input) {
        const id = uid('opp');
        const opp = {
          id,
          date: new Date().toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }),
          status: input.status || 'Pending',
          name: input.name || 'New Opportunity',
          type: input.type || 'Pitch',
        };

        setState((prev) => ({
          ...prev,
          companies: prev.companies.map((c) =>
            c.id === input.companyId
              ? { ...c, opportunities: [...(c.opportunities || []), opp] }
              : c
          ),
        }));

        return id;
      },

      // --- Lists ---
      createTargetingList(input = {}) {
        const maxMembers = Number(input.maxMembers || 15);
        const contacts = state.contacts || [];
        const companiesByName = new Map((state.companies || []).map((c) => [c.name, c]));
        const existingTargetingNames = new Set(
          (state.lists || [])
            .filter((l) => l.type === 'Targeting')
            .map((l) => String(l.name || '').toLowerCase())
        );

        const ranked = contacts
          .map((c) => {
            const company = companiesByName.get(c.company);
            const strategicGap = hasValueAddGap(company);
            const staleDays = Number(c.metricsCurrent?.daysSinceLastInteraction || 0);
            const lowStrength = Number(c.relationshipScore ?? 50) <= 62;
            const candidate = strategicGap || (staleDays >= 35 && lowStrength);
            return {
              contact: c,
              strategicGap,
              staleDays,
              lowStrength,
              candidate,
            };
          })
          .filter((x) => x.candidate)
          .sort((a, b) => {
            if (a.strategicGap !== b.strategicGap) return a.strategicGap ? -1 : 1;
            if (a.lowStrength !== b.lowStrength) return a.lowStrength ? -1 : 1;
            if (a.staleDays !== b.staleDays) return b.staleDays - a.staleDays;
            return (a.contact.relationshipScore ?? 50) - (b.contact.relationshipScore ?? 50);
          });

        const picked = ranked.slice(0, Math.max(1, maxMembers));
        const memberIds = picked.map((x) => x.contact.id);
        if (!memberIds.length) return { id: null, membersAdded: 0 };

        const stamp = new Date().toISOString().slice(0, 10);
        const baseName = input.name || `Firm-wide Targeting List (${stamp})`;
        let name = baseName;
        let suffix = 2;
        while (existingTargetingNames.has(name.toLowerCase())) {
          name = `${baseName} #${suffix}`;
          suffix += 1;
        }

        const id = uid('list');
        const list = {
          id,
          name,
          owner: input.owner || 'BD Team',
          type: 'Targeting',
          tag: input.tag || 'Targeting',
          initials: 'TG',
          color: input.color || 'bg-indigo',
          lastEngagement: 'Just created',
          visibility: 'Firm-wide',
          sharedWithUserIds: [],
          sharedWithUsers: [],
          sharedPracticeGroup: '',
          createdAt: stamp,
          members: memberIds.length,
          memberIds,
          marketingActivity: [],
          targetingMeta: {
            generatedAt: new Date().toISOString(),
            source: 'auto-targeting',
            strategicGapCount: picked.filter((x) => x.strategicGap).length,
            staleCoverageCount: picked.filter((x) => x.staleDays >= 35).length,
          },
        };

        setState((prev) => ({
          ...prev,
          lists: [list, ...prev.lists],
        }));

        this.logActivity({
          type: 'list.created',
          entityType: 'list',
          entityId: id,
          entityName: list.name,
          description: `Created targeting list with ${memberIds.length} contacts`,
        });
        return { id, membersAdded: memberIds.length };
      },

      createCrossPracticeInitiativeList(input = {}) {
        const maxMembers = Number(input.maxMembers || 18);
        const contacts = state.contacts || [];
        const companies = state.companies || [];
        const scopedCompanyName = String(input.companyName || '').trim();
        const scopedCompanies = scopedCompanyName
          ? companies.filter((company) => company.name === scopedCompanyName)
          : companies;
        const contactsByCompany = new Map();
        contacts.forEach((c) => {
          if (!c.company) return;
          const arr = contactsByCompany.get(c.company) || [];
          arr.push(c);
          contactsByCompany.set(c.company, arr);
        });

        const candidates = [];
        scopedCompanies.forEach((company) => {
          const ctx = buildCrossSellPracticeContext(company);
          if (!ctx.primaryGapPractice) return;
          const memberPool = contactsByCompany.get(company.name) || [];
          memberPool.forEach((contact) => {
            const staleDays = Number(contact.metricsCurrent?.daysSinceLastInteraction || 0);
            const score = Number(contact.relationshipScore ?? 50);
            const gapWeight = Math.max(1, 100 - score) + Math.min(60, staleDays);
            candidates.push({
              company,
              contact,
              gapPractice: ctx.primaryGapPractice,
              anchorPractice: ctx.anchorPractice,
              score: gapWeight,
            });
          });
        });

        const picked = candidates.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxMembers));
        const memberIds = Array.from(new Set(picked.map((x) => x.contact.id)));
        if (!memberIds.length) return { id: null, membersAdded: 0, gapPractices: 0 };

        const practiceSet = new Set(picked.map((x) => x.gapPractice).filter(Boolean));
        const stamp = new Date().toISOString().slice(0, 10);
        const id = uid('list');
        const defaultName = scopedCompanyName
          ? `${scopedCompanyName} Cross-Practice Opportunity (${stamp})`
          : `Cross-Practice BD Initiative (${stamp})`;
        const list = {
          id,
          name: input.name || defaultName,
          owner: input.owner || 'BD Team',
          type: 'Initiative-based',
          tag: 'Cross-Practice',
          initials: 'CP',
          color: input.color || 'bg-emerald',
          lastEngagement: 'Just created',
          visibility: 'Shared',
          sharedWithUserIds: [],
          sharedWithUsers: [],
          sharedPracticeGroup: '',
          createdAt: stamp,
          members: memberIds.length,
          memberIds,
          marketingActivity: [],
          crossPracticeMeta: {
            source: 'coverage-gap',
            generatedAt: new Date().toISOString(),
            gapPracticeCount: practiceSet.size,
            topGapPractices: Array.from(practiceSet).slice(0, 4),
          },
        };

        setState((prev) => ({
          ...prev,
          lists: [list, ...prev.lists],
        }));

        this.logActivity({
          type: 'list.created',
          entityType: 'list',
          entityId: id,
          entityName: list.name,
          description: `Created cross-practice initiative list with ${memberIds.length} contacts`,
        });

        return {
          id,
          membersAdded: memberIds.length,
          gapPractices: practiceSet.size,
          companyName: scopedCompanyName || null,
        };
      },

      createList(input) {
        const id = uid('list');
        const list = {
          id,
          name: input.name || 'New List',
          owner: input.owner || 'You',
          type: input.type || 'Personal',
          tag: input.tag || '',
          initials: (input.name || 'NL').slice(0, 2).toUpperCase(),
          color: input.color || 'bg-blue',
          lastEngagement: 'Just created',
          visibility: input.visibility || 'Personal',
          sharedWithUserIds: input.sharedWithUserIds || [],
          sharedWithUsers: input.sharedWithUsers || [],
          sharedPracticeGroup: input.sharedPracticeGroup || '',
          createdAt: new Date().toISOString().slice(0, 10),
          members: 0,
          memberIds: input.memberIds || [],
          marketingActivity: [],
        };

        setState((prev) => ({
          ...prev,
          lists: [list, ...prev.lists],
        }));

        this.logActivity({ type: 'list.created', entityType: 'list', entityId: id, entityName: list.name, description: `Created list: ${list.name}` });
        return id;
      },

      syncMarketingEventLists() {
        setState((prev) => {
          const sourceEvents = prev.marketingEventLists || [];
          if (!sourceEvents.length) return prev;

          const existingBySource = new Map(
            (prev.lists || [])
              .filter((l) => l.sourceSystem === 'Marketing Events' && l.sourceEventId)
              .map((l) => [l.sourceEventId, l])
          );

          const upserted = sourceEvents.map((ev) => {
            const existing = existingBySource.get(ev.id);
            const initials = (ev.eventName || 'EV')
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0] || '')
              .join('')
              .toUpperCase();

            return {
              id: existing?.id || uid('event-list'),
              sourceEventId: ev.id,
              sourceSystem: 'Marketing Events',
              name: ev.eventName,
              owner: ev.owner || 'BD Team',
              type: 'Event-based',
              tag: ev.tag || 'Events',
              initials,
              color: existing?.color || 'bg-purple',
              lastEngagement: existing?.lastEngagement || '1 day ago',
              visibility: ev.visibility || 'Shared',
              createdAt: existing?.createdAt || new Date().toISOString().slice(0, 10),
              members: (ev.attendeeIds || []).length,
              memberIds: ev.attendeeIds || [],
              marketingActivity: ev.activities || [],
            };
          });

          const retained = (prev.lists || []).filter(
            (l) => !(l.sourceSystem === 'Marketing Events' && l.sourceEventId)
          );

          return {
            ...prev,
            lists: [...retained, ...upserted],
          };
        });

        this.logActivity({
          type: 'list.synced',
          entityType: 'list',
          description: 'Synced Event-based lists from Marketing Events source',
        });
      },

      pullThroughEventFollowUps(listId) {
        const targetList = state.lists.find((l) => l.id === listId);
        if (!targetList || targetList.type !== 'Event-based') return 0;

        const memberIds = targetList.memberIds || [];
        const contactsById = new Map((state.contacts || []).map((c) => [c.id, c]));
        const existingOpenByContact = new Set(
          (state.touchpoints || [])
            .filter(
              (tp) =>
                tp.kind === 'task' &&
                tp.status === 'open' &&
                String(tp.source || '').startsWith('lists:event-followup') &&
                tp.source.includes(`:${listId}:`)
            )
            .map((tp) => tp.contactName)
        );

        const newItems = [];
        memberIds.forEach((contactId, idx) => {
          const contact = contactsById.get(contactId);
          if (!contact) return;
          if (existingOpenByContact.has(contact.name)) return;

          const due = new Date();
          due.setDate(due.getDate() + 7 + (idx % 5));
          due.setHours(9, 0, 0, 0);

          newItems.push({
            id: uid('task'),
            kind: 'task',
            status: 'open',
            createdAt: new Date().toISOString(),
            dueAt: due.toISOString(),
            completedAt: null,
            cancelledAt: null,
            contactName: contact.name,
            company: contact.company || '',
            role: contact.role || '',
            interactionType: 'Follow-up',
            title: `Event follow-up: ${targetList.name}`,
            outcome: '',
            notes: `Follow up after event list "${targetList.name}" participation.`,
            followUpDate: '',
            history: [`Pulled through from event list ${targetList.name}`],
            avatarUrl: contact.avatarUrl || '',
            signalTone: contact.signalTone || 'blue',
            relationshipStatus: contact.relationship || 'Stable',
            relationshipScore: contact.relationshipScore ?? 50,
            lastInteracted: contact.lastInteracted || '',
            source: `lists:event-followup:${listId}:${contactId}`,
            principal: '',
            assignedTo: '',
            assignedBy: '',
            onBehalfOf: '',
            visitStage: '',
          });
        });

        if (!newItems.length) return 0;

        setState((prev) => ({
          ...prev,
          touchpoints: [...newItems, ...(prev.touchpoints || [])],
        }));

        this.logActivity({
          type: 'list.pull-through',
          entityType: 'list',
          entityId: listId,
          entityName: targetList.name,
          description: `Pulled through ${newItems.length} follow-up touchpoints from ${targetList.name}`,
        });

        return newItems.length;
      },

      logMarketingEngagement(input) {
        const listId = input?.listId;
        const contactId = input?.contactId;
        if (!listId || !contactId) return null;

        const list = state.lists.find((l) => l.id === listId);
        const contact = (state.contacts || []).find((c) => c.id === contactId);
        if (!list || !contact) return null;

        const nowIso = new Date().toISOString();
        const date = input.date || nowIso.slice(0, 10);
        const type = input.type || 'Email Campaign';
        const title = input.title || `${type}: ${list.name}`;
        const description = input.description || `Marketing engagement for ${contact.name} via ${type}.`;

        const interaction = {
          id: uid('int'),
          kind: 'interaction',
          status: 'completed',
          createdAt: nowIso,
          dueAt: null,
          completedAt: nowIso,
          cancelledAt: null,
          contactName: contact.name,
          company: contact.company || '',
          role: contact.role || '',
          interactionType: 'Event',
          title,
          outcome: input.outcome || 'Engaged',
          notes: description,
          followUpDate: '',
          history: [`Logged from list ${list.name}`],
          avatarUrl: contact.avatarUrl || '',
          signalTone: contact.signalTone || 'blue',
          relationshipStatus: contact.relationship || 'Stable',
          relationshipScore: contact.relationshipScore ?? 50,
          lastInteracted: '0 days ago',
          source: `lists:marketing-engagement:${listId}:${contactId}`,
          principal: '',
          assignedTo: '',
          assignedBy: '',
          onBehalfOf: '',
          visitStage: '',
        };

        setState((prev) => ({
          ...prev,
          touchpoints: [interaction, ...(prev.touchpoints || [])],
          lists: (prev.lists || []).map((l) => {
            if (l.id !== listId) return l;
            const nextActivity = {
              date,
              type,
              description: `${title} (${contact.name})`,
              recipients: 1,
            };
            return {
              ...l,
              lastEngagement: 'Today',
              marketingActivity: [nextActivity, ...(l.marketingActivity || [])].slice(0, 50),
            };
          }),
        }));

        this.logActivity({
          type: 'marketing.engagement.logged',
          entityType: 'list',
          entityId: listId,
          entityName: list.name,
          description: `Logged marketing engagement for ${contact.name} in ${list.name}`,
        });

        return interaction.id;
      },

      updateList(id, updates) {
        const current = state.lists.find((l) => l.id === id);
        if (!current) return;
        setState((prev) => ({
          ...prev,
          lists: prev.lists.map((l) =>
            l.id === id
              ? {
                  ...l,
                  ...updates,
                  initials: updates?.name ? String(updates.name).slice(0, 2).toUpperCase() : l.initials,
                }
              : l
          ),
        }));
        this.logActivity({
          type: 'list.updated',
          entityType: 'list',
          entityId: id,
          entityName: updates?.name || current.name,
          description: `Updated list: ${updates?.name || current.name}`,
        });
      },

      deleteList(id) {
        const current = state.lists.find((l) => l.id === id);
        setState((prev) => ({
          ...prev,
          lists: prev.lists.filter((l) => l.id !== id),
          listNotes: (prev.listNotes || []).filter((n) => n.listId !== id),
          savedViews: (prev.savedViews || []).filter((v) => !(v.scope === 'lists' && v.id === id)),
        }));
        this.logActivity({
          type: 'list.deleted',
          entityType: 'list',
          entityId: id,
          entityName: current?.name || id,
          description: `Deleted list: ${current?.name || id}`,
        });
      },

      // --- Filters & Views ---
      setContactFilters(partial) {
        setState((prev) => ({
          ...prev,
          contactFilters: {
            ...(prev.contactFilters || {}),
            ...partial,
          },
        }));
      },

      setCompanyFilters(partial) {
        setState((prev) => ({
          ...prev,
          companyFilters: {
            ...(prev.companyFilters || {}),
            ...partial,
          },
        }));
      },

      saveContactView(name) {
        const trimmed = (name || '').trim();
        if (!trimmed) return null;
        const id = uid('view');
        setState((prev) => ({
          ...prev,
          savedViews: [
            ...(prev.savedViews || []),
            { id, name: trimmed, scope: 'contacts', filters: prev.contactFilters || {} },
          ],
        }));
        return id;
      },

      saveCompanyView(name) {
        const trimmed = (name || '').trim();
        if (!trimmed) return null;
        const id = uid('view');
        setState((prev) => ({
          ...prev,
          savedViews: [
            ...(prev.savedViews || []),
            { id, name: trimmed, scope: 'companies', filters: prev.companyFilters || {} },
          ],
        }));
        return id;
      },

      applyContactView(id) {
        setState((prev) => {
          const view = (prev.savedViews || []).find((v) => v.id === id && v.scope === 'contacts');
          if (!view) return prev;
          return { ...prev, contactFilters: { ...(view.filters || {}) } };
        });
      },

      applyCompanyView(id) {
        setState((prev) => {
          const view = (prev.savedViews || []).find((v) => v.id === id && v.scope === 'companies');
          if (!view) return prev;
          return { ...prev, companyFilters: { ...(view.filters || {}) } };
        });
      },

      deleteContactView(id) {
        setState((prev) => ({
          ...prev,
          savedViews: (prev.savedViews || []).filter((v) => v.id !== id),
        }));
      },

      setContactTags(contactId, tagIds) {
        setState((prev) => ({
          ...prev,
          contactTags: {
            ...(prev.contactTags || {}),
            [contactId]: tagIds,
          },
        }));
        this.logActivity({ type: 'tags.updated', entityType: 'contact', entityId: contactId, description: `Updated tags for contact` });
      },

      setCompanyTags(companyId, tagIds) {
        setState((prev) => ({
          ...prev,
          companyTags: {
            ...(prev.companyTags || {}),
            [companyId]: tagIds,
          },
        }));
        this.logActivity({ type: 'tags.updated', entityType: 'company', entityId: companyId, description: `Updated tags for company` });
      },

      // --- Notifications ---
      addNotification(input) {
        const notification = {
          id: uid('notif'),
          type: input?.type || 'info',
          title: input?.title || 'Notification',
          message: input?.message || '',
          read: Boolean(input?.read),
          createdAt: input?.createdAt || new Date().toISOString(),
        };
        setState((prev) => ({
          ...prev,
          notifications: [notification, ...(prev.notifications || [])],
        }));
        return notification.id;
      },

      shareInsightToTeams(input) {
        const insightTitle = input?.insightTitle || 'Insight';
        const target = input?.target || 'Client team';
        const channel = input?.channel || 'BD Insights';
        const summary = input?.summary || 'Shared from Touchpoints.';
        return this.addNotification({
          type: 'teams-share',
          title: 'Shared to Teams',
          message: `${insightTitle} shared to #${channel} for ${target}. ${summary}`,
          read: false,
        });
      },

      dismissNotification(id) {
        setState((prev) => ({
          ...prev,
          notifications: (prev.notifications || []).map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
    },
  };
}

export const demoStore = createStore();

function getSnapshot() {
  return demoStore.getState();
}

export function useDemoStore(selector = (s) => s) {
  return useSyncExternalStore(demoStore.subscribe, () => selector(getSnapshot()), () => selector(getSnapshot()));
}
