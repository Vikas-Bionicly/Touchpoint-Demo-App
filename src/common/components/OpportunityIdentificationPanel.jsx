import React, { useEffect, useState } from 'react';
import { usePersona } from '../hooks/usePersona';

const PRACTICE_COLORS = {
  Corporate: '#2563eb',
  Litigation: '#a855f7',
  Regulatory: '#22c55e',
};

export function OpportunityIdentificationPanel({ company, onCreateOpportunityList }) {
  if (!company || !company.revenueByPracticeOffice) return null;

  const { field } = usePersona({ company });
  const showExactFinancials = field('revenue.exact');
  const [isNarrow, setIsNarrow] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 520 : false));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setIsNarrow(window.innerWidth <= 520);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const matrix = company.revenueByPracticeOffice;
  const practices = Object.keys(matrix);
  const offices = Array.from(
    new Set(
      practices.flatMap((p) => Object.keys(matrix[p] || {}))
    )
  );

  const values = practices.flatMap((p) => Object.values(matrix[p] || {}));
  const max = Math.max(...values, 0);

  const getCellClass = (value) => {
    if (!value || max === 0) return 'heatmap-cell empty';
    const ratio = value / max;
    if (ratio > 0.66) return 'heatmap-cell strong';
    if (ratio > 0.33) return 'heatmap-cell medium';
    return 'heatmap-cell light';
  };

  function intensityLabel(value) {
    if (!value || max === 0) return '—';
    const ratio = value / max;
    if (ratio > 0.66) return 'High';
    if (ratio > 0.33) return 'Medium';
    return 'Low';
  }

  const officeTotals = offices
    .map((office) => ({
      office,
      value: practices.reduce((sum, practice) => sum + Number(matrix[practice]?.[office] || 0), 0),
    }))
    .sort((a, b) => a.value - b.value);

  const weakestOffices = officeTotals.slice(0, Math.min(2, officeTotals.length));

  const practiceGaps = [];
  practices.forEach((practice) => {
    offices.forEach((office) => {
      const value = Number(matrix[practice]?.[office] || 0);
      if (value <= max * 0.2) {
        practiceGaps.push({ practice, office, value });
      }
    });
  });

  const topPracticeGaps = practiceGaps
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  const headquartersCity = String(company.headquarters || '').split(',')[0]?.trim();
  const hqCoverage = headquartersCity
    ? practices.reduce((sum, practice) => sum + Number(matrix[practice]?.[headquartersCity] || 0), 0)
    : 0;
  const isHqGap = headquartersCity && offices.includes(headquartersCity) && hqCoverage <= max * 0.6;

  return (
    <div className="panel opportunity-identification-panel">
      <div className="panel-header">
        <h3>Opportunity identification</h3>
        <p className="panel-subtitle">
          Where are we strong today vs. where is there room to grow across practice and office.
        </p>
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">{showExactFinancials ? 'Revenue intensity' : 'Relative intensity'}</span>
        <div className="legend-scale">
          <span className="legend-box legend-light" /> Low
          <span className="legend-box legend-medium" /> Medium
          <span className="legend-box legend-strong" /> High
        </div>
      </div>

      {isNarrow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {practices.map((practice) => (
            <div key={practice} style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span className="practice-pill" style={{ backgroundColor: PRACTICE_COLORS[practice] || '#4b5563' }}>
                  {practice}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>By office</span>
              </div>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center' }}>
                {offices.map((office) => {
                  const value = Number(matrix[practice]?.[office] ?? 0);
                  const label = showExactFinancials ? (value ? `$${value.toFixed(1)}M` : '—') : (value ? intensityLabel(value) : '—');
                  return (
                    <React.Fragment key={`${practice}-${office}`}>
                      <div style={{ minWidth: 0, overflowWrap: 'anywhere', wordBreak: 'break-word', fontSize: 13, color: '#111827' }}>
                        {office}
                      </div>
                      <div className={getCellClass(value)} style={{ justifySelf: 'end' }}>
                        {label}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="heatmap-wrapper">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th>Practice \\ Office</th>
                {offices.map((office) => (
                  <th key={office}>{office}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {practices.map((practice) => (
                <tr key={practice}>
                  <td>
                    <span
                      className="practice-pill"
                      style={{ backgroundColor: PRACTICE_COLORS[practice] || '#4b5563' }}
                    >
                      {practice}
                    </span>
                  </td>
                  {offices.map((office) => {
                    const value = matrix[practice]?.[office] ?? 0;
                    return (
                      <td key={office}>
                        <div className={getCellClass(value)}>
                          {showExactFinancials
                            ? (value ? `$${value.toFixed(1)}M` : '—')
                            : (value ? intensityLabel(value) : '—')}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="geo-gap-section">
        <h4 className="panel-card-title">Geographic gap identification</h4>
        <ul className="geo-gap-list">
          {weakestOffices.map((row) => (
            <li key={`office-${row.office}`}>
              <strong>{row.office}:</strong>{' '}
              {showExactFinancials
                ? `lower overall revenue coverage ($${row.value.toFixed(1)}M across practices).`
                : 'lower relative coverage across practices compared with other offices.'}
            </li>
          ))}
          {topPracticeGaps.map((gap) => (
            <li key={`gap-${gap.practice}-${gap.office}`}>
              <strong>{gap.practice} in {gap.office}:</strong>{' '}
              {showExactFinancials
                ? `below expected footprint ($${gap.value.toFixed(1)}M).`
                : 'below expected relative footprint for this practice and office.'}
            </li>
          ))}
          {isHqGap && (
            <li>
              <strong>HQ alignment ({headquartersCity}):</strong> local coverage is behind relative to total account intensity.
            </li>
          )}
          {!weakestOffices.length && !topPracticeGaps.length && !isHqGap && (
            <li>No major geographic gaps detected in current mock coverage.</li>
          )}
        </ul>
      </div>

      <div className="panel-footer">
        <button className="btn btn-secondary btn-sm">View similar clients</button>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={() => onCreateOpportunityList?.(company)}
        >
          Create opportunity list
        </button>
      </div>
    </div>
  );
}

