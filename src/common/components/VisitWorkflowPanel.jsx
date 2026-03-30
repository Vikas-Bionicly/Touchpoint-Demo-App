import { demoStore } from '../store/demoStore';
import { usePersona } from '../hooks/usePersona';
import {
  VISIT_WORKFLOW_STAGES,
  effectiveVisitStage,
  isVisitTouchpoint,
  nextVisitStage,
} from '../constants/visitWorkflow';

/**
 * Pre-visit → Visit → Post-visit controls for visit-type touchpoints (BH-13 prototype).
 */
export default function VisitWorkflowPanel({ touchpoint, compact, onUpdated }) {
  const { can } = usePersona();
  if (!touchpoint || !isVisitTouchpoint(touchpoint)) return null;

  const stage = effectiveVisitStage(touchpoint);
  const isTerminal =
    touchpoint.kind === 'interaction' ||
    (touchpoint.kind === 'task' && touchpoint.status === 'completed');
  const canAct = can('touchpoint.complete') && !isTerminal;
  const next = nextVisitStage(stage);
  const idx = VISIT_WORKFLOW_STAGES.indexOf(stage);

  const bump = () => {
    if (!next || !touchpoint.id) return;
    demoStore.actions.setVisitStage(touchpoint.id, next);
    onUpdated?.();
  };

  const finish = () => {
    if (!touchpoint.id) return;
    demoStore.actions.completeTouchpoint(touchpoint.id);
    onUpdated?.();
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <span style={{ color: '#6b7280' }}>Visit workflow</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {VISIT_WORKFLOW_STAGES.map((s, i) => (
            <span
              key={s}
              title={s}
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: i <= idx ? '#fef3c7' : '#f3f4f6',
                color: i <= idx ? '#92400e' : '#9ca3af',
              }}
            >
              {s}
            </span>
          ))}
        </div>
        {canAct && next && (
          <button type="button" className="tool-btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={bump}>
            Next: {next}
          </button>
        )}
        {canAct && !next && (
          <button type="button" className="primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={finish}>
            Complete touchpoint
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        border: '1px solid #fde68a',
        background: '#fffbeb',
        borderRadius: 10,
        padding: 12,
        marginTop: 4,
      }}
    >
      <p className="modal-label" style={{ marginBottom: 8 }}>
        Client visit workflow
      </p>
      <p style={{ fontSize: 12, color: '#78350f', margin: '0 0 10px' }}>
        Pre-visit covers logistics and briefs; Visit is the in-person touchpoint; Post-visit is follow-up and notes.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        {VISIT_WORKFLOW_STAGES.map((s, i) => (
          <span
            key={s}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: s === stage ? '#fbbf24' : i < idx ? '#fcd34d' : '#e5e7eb',
              color: s === stage ? '#422006' : i < idx ? '#78350f' : '#6b7280',
            }}
          >
            {s}
          </span>
        ))}
      </div>
      {isTerminal ? (
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>This touchpoint is completed — stage was {stage}.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {next && (
            <button type="button" className="primary" disabled={!canAct} onClick={bump}>
              Advance to {next}
            </button>
          )}
          {!next && (
            <button type="button" className="primary" disabled={!canAct} onClick={finish}>
              Mark complete (post-visit done)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
