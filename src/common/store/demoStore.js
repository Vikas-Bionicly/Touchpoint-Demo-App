import { useSyncExternalStore } from 'react';
import { buildSeedState } from './seed';

// Bump this version any time we change seed/transform logic,
// so users don't get stuck on an older localStorage snapshot.
const STORAGE_KEY = 'touchpoint-demo:v5';

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
      // --- Persona ---
      setCurrentPersona(personaId) {
        setState((prev) => ({
          ...prev,
          currentPersonaId: personaId,
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
          assignedTo: input.assignedTo || '',
          assignedBy: input.assignedBy || '',
          onBehalfOf: input.onBehalfOf || '',
          visitStage: input.visitStage || '',
        };

        setState((prev) => ({
          ...prev,
          touchpoints: [item, ...prev.touchpoints],
        }));

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
          assignedTo: input.assignedTo || '',
          assignedBy: input.assignedBy || '',
          onBehalfOf: input.onBehalfOf || '',
          visitStage: input.visitStage || '',
        };

        setState((prev) => ({
          ...prev,
          touchpoints: [item, ...prev.touchpoints],
        }));

        return id;
      },

      completeTouchpoint(id) {
        const nowIso = new Date().toISOString();
        setState((prev) => ({
          ...prev,
          touchpoints: prev.touchpoints.map((t) =>
            t.id === id ? { ...t, status: 'completed', completedAt: nowIso, cancelledAt: null } : t
          ),
        }));
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

      assignTouchpoint(id, assignedTo, assignedBy) {
        setState((prev) => ({
          ...prev,
          touchpoints: prev.touchpoints.map((t) =>
            t.id === id ? { ...t, assignedTo, assignedBy: assignedBy || '' } : t
          ),
        }));
      },

      setVisitStage(id, stage) {
        setState((prev) => ({
          ...prev,
          touchpoints: prev.touchpoints.map((t) =>
            t.id === id ? { ...t, visitStage: stage } : t
          ),
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

        return id;
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
          avatarUrl: `https://i.pravatar.cc/96?img=${Math.floor(Math.random() * 70) + 1}&u=${encodeURIComponent(input.name || id)}`,
          signalTone: 'blue',
          recentInteractions: [],
          relationshipHistory: [],
          internalConnections: [],
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
        };

        setState((prev) => ({
          ...prev,
          companies: [company, ...prev.companies],
        }));

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
          createdAt: new Date().toISOString().slice(0, 10),
          members: 0,
          memberIds: input.memberIds || [],
          marketingActivity: [],
        };

        setState((prev) => ({
          ...prev,
          lists: [list, ...prev.lists],
        }));

        return id;
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
      },

      setCompanyTags(companyId, tagIds) {
        setState((prev) => ({
          ...prev,
          companyTags: {
            ...(prev.companyTags || {}),
            [companyId]: tagIds,
          },
        }));
      },

      // --- Notifications ---
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
