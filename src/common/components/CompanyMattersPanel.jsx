import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export function CompanyMattersPanel({ company }) {
  if (!company || !company.mattersTrends) return null;

  const data = company.mattersTrends;

  return (
    <div className="panel company-matters-panel">
      <div className="panel-header">
        <h3>Matters & financials</h3>
        <p className="panel-subtitle">High-level view of revenue, hours, and realization over time.</p>
      </div>

      <div className="panel-card panel-card-wide">
        <h4 className="panel-card-title">Matter and financial trends</h4>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                width={60}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'Realization') return [`${value}%`, name];
                  if (name === 'Billable hours') return [`${value.toLocaleString()}`, name];
                  return [`$${value.toLocaleString()}`, name];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                name="Billable hours"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="realization"
                name="Realization"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

