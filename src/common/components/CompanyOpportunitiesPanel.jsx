import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export function CompanyOpportunitiesPanel({ company }) {
  if (!company || !company.opportunityActivity) return null;

  const data = company.opportunityActivity;

  return (
    <div className="panel company-opportunities-panel">
      <div className="panel-header">
        <h3>BD activity</h3>
        <p className="panel-subtitle">Trend of BD touchpoints and total activities over time.</p>
      </div>

      <div className="panel-card panel-card-wide">
        <h4 className="panel-card-title">Activity trends</h4>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bdActivity" name="BD activities" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalActivities" name="Total activities" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

