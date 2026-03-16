function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMatterInvolvement(mattersActive) {
  if (mattersActive >= 3) return 100;
  if (mattersActive === 2) return 80;
  if (mattersActive === 1) return 60;
  return 25;
}

function computeScore(input) {
  const recencyScore = clamp(100 - input.daysSinceLastInteraction * 1.2, 0, 100);
  const frequencyScore = clamp((input.interactionsLast90d / 20) * 100, 0, 100);
  const qualityScore = clamp((input.engagementQuality / 5) * 100, 0, 100);
  const matterScore = normalizeMatterInvolvement(input.mattersActive);
  const twoWayScore = clamp(input.twoWayRatio * 100, 0, 100);

  return Math.round(
    recencyScore * 0.3 +
      frequencyScore * 0.2 +
      qualityScore * 0.2 +
      matterScore * 0.15 +
      twoWayScore * 0.15
  );
}

export function calculateRelationshipStrength(current, previous) {
  const score = computeScore(current);
  const previousScore = previous ? computeScore(previous) : score;
  const delta = score - previousScore;

  let trend = 'Stable';
  if (delta >= 8) trend = 'Growing';
  if (delta <= -8) trend = 'Declining';

  return {
    score,
    previousScore,
    delta,
    trend,
  };
}
