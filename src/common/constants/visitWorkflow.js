/** Canonical client-visit touchpoint workflow (BH-13 prototype). */
export const VISIT_WORKFLOW_STAGES = ['Pre-visit', 'Visit', 'Post-visit'];

export function isVisitTouchpoint(tp) {
  if (!tp) return false;
  if (String(tp.interactionType || '').toLowerCase() === 'visit') return true;
  return Boolean(String(tp.visitStage || '').trim());
}

export function effectiveVisitStage(tp) {
  if (!tp) return '';
  const raw = String(tp.visitStage || '').trim();
  if (raw) return raw;
  if (String(tp.interactionType || '').toLowerCase() === 'visit') return VISIT_WORKFLOW_STAGES[0];
  return '';
}

export function nextVisitStage(current) {
  const i = VISIT_WORKFLOW_STAGES.indexOf(current);
  if (i < 0 || i >= VISIT_WORKFLOW_STAGES.length - 1) return null;
  return VISIT_WORKFLOW_STAGES[i + 1];
}
