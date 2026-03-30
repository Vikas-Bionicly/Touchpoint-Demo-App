/**
 * BH-06 — value-add / firm outreach gap signals for strategic accounts (prototype).
 */

export function companyBdMixRatio(company) {
  const rows = company?.opportunityActivity || [];
  const last = rows[rows.length - 1];
  if (!last?.totalActivities) return null;
  return last.bdActivity / last.totalActivities;
}

export function valueAddGapSignals(company) {
  const mix = companyBdMixRatio(company);
  const lowMix = mix != null && mix < 0.22;
  const lowTouch = (company?.metricsCurrent?.interactionsLast90d ?? 99) <= 6;
  const lowQuality = (company?.metricsCurrent?.engagementQuality ?? 99) <= 2;
  return { lowMix, lowTouch, lowQuality, mix };
}

export function isStrategicAccount(company) {
  return Boolean(company?.isStrategicAccount);
}

export function hasValueAddGap(company) {
  if (!isStrategicAccount(company)) return false;
  const { lowMix, lowTouch, lowQuality } = valueAddGapSignals(company);
  return lowMix || lowTouch || lowQuality;
}

export function describeValueAddGap(company) {
  if (!hasValueAddGap(company)) return null;
  const { lowMix, lowTouch, lowQuality, mix } = valueAddGapSignals(company);
  const parts = [];

  if (lowTouch) parts.push('touchpoint volume in the last 90 days is thin');
  if (lowQuality) parts.push('engagement quality scores are soft');
  if (lowMix) {
    parts.push(
      mix != null
        ? `BD-leaning activity is only about ${Math.round(mix * 100)}% of logged outreach`
        : 'BD-leaning share of outreach looks low'
    );
  }

  return {
    summary: `This strategic account shows a value-add coverage gap: ${parts.join('; ')}.`,
    parts,
  };
}

