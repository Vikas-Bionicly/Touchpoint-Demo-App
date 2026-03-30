import { useDemoStore } from '../store/demoStore';
import { buildPersonaHelper } from '../constants/personas';

/**
 * Hook returning persona helper: { persona, tier, can(action), field(key), depth(key) }
 */
export function usePersona(context = {}) {
  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');
  const associateTier2UpgradeStatus = useDemoStore((s) => s.associateTier2UpgradeStatus);
  const associateTier2Approved = associateTier2UpgradeStatus === 'approved';
  return buildPersonaHelper(personaId, { ...context, associateTier2Approved });
}
