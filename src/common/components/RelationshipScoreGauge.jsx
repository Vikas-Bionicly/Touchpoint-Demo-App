import { computeRelationshipScore, computeTrend, getZoneColor } from '../utils/relationshipScoring';

export default function RelationshipScoreGauge({ metricsCurrent, metricsPrevious, compact }) {
  const current = computeRelationshipScore(metricsCurrent);
  const previous = computeRelationshipScore(metricsPrevious);
  const trend = computeTrend(current.score, previous.score);
  const color = getZoneColor(current.zone);

  const trendArrow = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
  const trendColor = trend === 'improving' ? '#22c55e' : trend === 'declining' ? '#ef4444' : '#6b7280';

  if (compact) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: '50%', background: color, color: '#fff',
          fontWeight: 700, fontSize: 11,
        }}>
          {current.score}
        </span>
        <span style={{ color: trendColor, fontWeight: 600 }}>{trendArrow}</span>
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16,
        }}>
          {current.score}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{current.zone}</div>
          <div style={{ color: trendColor, fontSize: 12, fontWeight: 600 }}>{trendArrow} {trend}</div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6, width: '100%' }}>
        <div style={{ background: color, borderRadius: 4, height: 6, width: `${current.score}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Breakdown */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: '#6b7280' }}>
        {Object.entries(current.breakdown).map(([k, v]) => (
          <span key={k}>{k}: {v}</span>
        ))}
      </div>
    </div>
  );
}
