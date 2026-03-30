/**
 * AI-05 — practice mix signals for cross-sell insights (prototype).
 */

export function buildCrossSellPracticeContext(company) {
  const ps = company?.practiceShare;
  if (!Array.isArray(ps) || ps.length === 0) {
    return {
      leaders: [],
      underperformers: [],
      metaThinVsStrong: 'Practice mix: not available',
      pitchLine: 'Explore adjacent legal support aligned to their strategic priorities.',
    };
  }

  const sortedAsc = [...ps].sort((a, b) => a.value - b.value);
  const sortedDesc = [...ps].sort((a, b) => b.value - a.value);
  const underperformers = sortedAsc.slice(0, Math.min(2, sortedAsc.length));
  const leaders = sortedDesc.slice(0, Math.min(2, sortedDesc.length));

  const thinStr = underperformers.map((x) => `${x.practice} (${x.value}%)`).join(', ');
  const strongStr = leaders.map((x) => `${x.practice} (${x.value}%)`).join(', ');
  const metaThinVsStrong = `Thin: ${thinStr} · Strong: ${strongStr}`;

  const topGap = underperformers[0];
  const anchor = leaders[0];
  const pitchLine = topGap
    ? `Position a scoped ${topGap.practice} entry point while leveraging your ${anchor?.practice || 'core'} strength.`
    : 'Propose a short practice scan workshop to surface unmet demand.';

  return {
    leaders,
    underperformers,
    metaThinVsStrong,
    pitchLine,
    primaryGapPractice: topGap?.practice || null,
    anchorPractice: anchor?.practice || null,
  };
}

export function keyContactFirstName(company) {
  const name = company?.keyContacts?.[0];
  if (!name) return null;
  return String(name).split(/\s+/)[0] || name;
}
