import { useSyncExternalStore } from 'react';
import { buildSeedState } from './seed';

const STORAGE_KEY = 'touchpoint-demo:v1';

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
      resetToSeed() {
        setState(buildSeedState());
      },

      addTouchpointTask(input) {
        const nowIso = new Date().toISOString();
        const id = `task-${Math.random().toString(16).slice(2)}-${Date.now()}`;
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
        };

        setState((prev) => ({
          ...prev,
          touchpoints: [item, ...prev.touchpoints],
        }));

        return id;
      },

      logInteraction(input) {
        const nowIso = new Date().toISOString();
        const id = `int-${Math.random().toString(16).slice(2)}-${Date.now()}`;
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

      likeInsight(insightId) {
        setState((prev) => {
          const current = prev.insightState?.[insightId] || {};
          return {
            ...prev,
            insightState: {
              ...(prev.insightState || {}),
              [insightId]: {
                ...current,
                liked: !current.liked,
              },
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
              [insightId]: {
                ...current,
                dismissed: true,
              },
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
              [insightId]: {
                ...current,
                dismissed: false,
              },
            },
          };
        });
      },

      addContactNote(input) {
        const nowIso = new Date().toISOString();
        const id = `note-${Math.random().toString(16).slice(2)}-${Date.now()}`;
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

      setContactFilters(partial) {
        setState((prev) => ({
          ...prev,
          contactFilters: {
            ...(prev.contactFilters || {}),
            ...partial,
          },
        }));
      },

      saveContactView(name) {
        const trimmed = (name || '').trim();
        if (!trimmed) return null;
        const id = `view-${Math.random().toString(16).slice(2)}-${Date.now()}`;
        setState((prev) => ({
          ...prev,
          savedViews: [
            ...(prev.savedViews || []),
            { id, name: trimmed, scope: 'contacts', filters: prev.contactFilters || {} },
          ],
        }));
        return id;
      },

      applyContactView(id) {
        setState((prev) => {
          const view = (prev.savedViews || []).find((v) => v.id === id && v.scope === 'contacts');
          if (!view) return prev;
          return {
            ...prev,
            contactFilters: { ...(view.filters || {}) },
          };
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

