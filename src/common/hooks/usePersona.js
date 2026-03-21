import { useDemoStore } from '../store/demoStore';
import { buildPersonaHelper } from '../constants/personas';

/**
 * Hook returning persona helper: { persona, tier, can(action), field(key), depth(key) }
 */
export function usePersona() {
  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');
  return buildPersonaHelper(personaId);
}
