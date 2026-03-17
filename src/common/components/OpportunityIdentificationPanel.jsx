import React from 'react';

const PRACTICE_COLORS = {
  Corporate: '#2563eb',
  Litigation: '#a855f7',
  Regulatory: '#22c55e',
};

export function OpportunityIdentificationPanel({ company }) {
  if (!company || !company.revenueByPracticeOffice) return null;

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

  return (
    <div className="panel opportunity-identification-panel">
      <div className="panel-header">
        <h3>Opportunity identification</h3>
        <p className="panel-subtitle">
          Where are we strong today vs. where is there room to grow across practice and office.
        </p>
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">Revenue intensity</span>
        <div className="legend-scale">
          <span className="legend-box legend-light" /> Low
          <span className="legend-box legend-medium" /> Medium
          <span className="legend-box legend-strong" /> High
        </div>
      </div>

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
                        {value ? `$${value.toFixed(1)}M` : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel-footer">
        <button className="btn btn-secondary btn-sm">View similar clients</button>
        <button className="btn btn-primary btn-sm">Create opportunity list</button>
      </div>
    </div>
  );
}

