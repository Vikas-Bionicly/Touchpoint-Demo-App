/**
 * MT-09 — unified taxonomy helpers (canonical tag + mock source-system codes).
 */

function hashUnit(str) {
  const s = String(str ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return (h % 10000) / 10000;
}

/** Attach deterministic mock codes for Aderant / Website / Vuture-style marketing lists / Manual. */
export function enrichTagWithSourceCodes(tag, idx = 0) {
  const seed = `${tag.id || tag.label}-${idx}`;
  const codes = { ...(tag.sourceCodes || {}) };
  const sources = tag.sourceTaxonomies || [];
  for (const src of sources) {
    if (src === 'Aderant' && !codes.aderantPracticeCode) {
      codes.aderantPracticeCode = `ADR-PR-${1000 + Math.floor(hashUnit(`${seed}-a`) * 8999)}`;
    }
    if (src === 'Website' && !codes.websiteCategoryCode) {
      codes.websiteCategoryCode = `WEB-${Math.floor(hashUnit(`${seed}-w`) * 999)}`;
    }
    if (src === 'Marketing Lists' && !codes.marketingListCode) {
      codes.marketingListCode = `VUT-ML-${200 + Math.floor(hashUnit(`${seed}-m`) * 700)}`;
    }
    if (src === 'Manual' && !codes.manualRef) {
      codes.manualRef = `MN-${String(idx + 1).padStart(4, '0')}`;
    }
  }
  return {
    ...tag,
    canonicalType: tag.canonicalType || tag.type,
    sourceCodes: codes,
  };
}

export function formatTagCodesLine(tag) {
  const c = tag?.sourceCodes || {};
  return [c.aderantPracticeCode, c.websiteCategoryCode, c.marketingListCode, c.manualRef].filter(Boolean).join(' · ');
}

export function formatTagTaxonomySubtitle(tag) {
  if (!tag) return '';
  const canon = tag.canonicalType || tag.type || '';
  const src = (tag.sourceTaxonomies || []).join(' · ');
  const code = formatTagCodesLine(tag);
  return [canon, src, code].filter(Boolean).join(' · ');
}

/** Tooltip text for filter dropdown options. */
export function formatTagTaxonomyTitleAttr(tag) {
  if (!tag) return '';
  const lines = [
    tag.label,
    `Canonical type: ${tag.canonicalType || tag.type || '—'}`,
    `Source systems: ${(tag.sourceTaxonomies || []).join(', ') || '—'}`,
  ];
  const c = tag.sourceCodes || {};
  if (c.aderantPracticeCode) lines.push(`Aderant practice code: ${c.aderantPracticeCode}`);
  if (c.websiteCategoryCode) lines.push(`Website category code: ${c.websiteCategoryCode}`);
  if (c.marketingListCode) lines.push(`Marketing / mailing list code: ${c.marketingListCode}`);
  if (c.manualRef) lines.push(`Manual reference: ${c.manualRef}`);
  return lines.join('\n');
}

export function resolveContactTaxonomyChips(contact, contactTagsMap, allTags, max = 4) {
  if (!contact?.id) return [];
  const ids = contactTagsMap[contact.id] || [];
  return ids
    .slice(0, max)
    .map((id) => allTags.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => ({
      id: t.id,
      label: t.label,
      subtitle: formatTagTaxonomySubtitle(t),
    }));
}

const PRACTICE_TO_ADERANT = {
  Corporate: 'ADR-PR-2100',
  Litigation: 'ADR-PR-3420',
  Regulatory: 'ADR-PR-4188',
};

export function aderantCodeForPracticeArea(practiceArea) {
  return PRACTICE_TO_ADERANT[practiceArea] || `ADR-PR-${8000 + Math.floor(hashUnit(practiceArea) * 999)}`;
}
