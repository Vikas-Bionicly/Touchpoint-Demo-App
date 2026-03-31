/**
 * Relationship scoring framework.
 * Layer 1: Recency, frequency, quality, matter involvement, two-way ratio
 * Layer 2: Activity type weighting, strategic importance
 */

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/**
 * Compute a relationship score from 0-100 for a contact.
 */
export function computeRelationshipScore(metrics) {
  if (!metrics) return { score: 50, breakdown: {}, zone: 'neutral' };

  const recencyScore = clamp(100 - (metrics.daysSinceLastInteraction || 0), 0, 100);
  const frequencyScore = clamp((metrics.interactionsLast90d || 0) * 8, 0, 100);
  const qualityScore = clamp((metrics.engagementQuality || 3) * 20, 0, 100);
  const matterScore = clamp((metrics.mattersActive || 0) * 25, 0, 100);
  const twoWayScore = clamp((metrics.twoWayRatio || 0.5) * 100, 0, 100);

  // Layer 1 weighted average
  const l1 = (
    recencyScore * 0.25 +
    frequencyScore * 0.25 +
    qualityScore * 0.2 +
    matterScore * 0.15 +
    twoWayScore * 0.15
  );

  // Layer 2 activity weighting bonus (mock: add up to 10 points)
  const activityBonus = metrics.mattersActive > 2 ? 8 : metrics.interactionsLast90d > 10 ? 5 : 0;
  const strategicBonus = metrics.engagementQuality >= 4 ? 5 : 0;

  const score = clamp(Math.round(l1 + activityBonus + strategicBonus), 0, 100);

  let zone = 'neutral';
  if (score >= 75) zone = 'strong';
  else if (score >= 50) zone = 'healthy';
  else if (score >= 30) zone = 'attention';
  else zone = 'critical';

  return {
    score,
    zone,
    breakdown: {
      recency: Math.round(recencyScore),
      frequency: Math.round(frequencyScore),
      quality: Math.round(qualityScore),
      matter: Math.round(matterScore),
      twoWay: Math.round(twoWayScore),
    },
  };
}

/**
 * Compute trend from current vs previous scores.
 */
export function computeTrend(currentScore, previousScore) {
  const diff = currentScore - previousScore;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

const ZONE_COLORS = {
  strong: '#22c55e',
  healthy: '#3b82f6',
  attention: '#f59e0b',
  critical: '#ef4444',
  neutral: '#9ca3af',
};

export function getZoneColor(zone) {
  return ZONE_COLORS[zone] || ZONE_COLORS.neutral;
}
