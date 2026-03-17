import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PRACTICE_COLORS = ['#2563eb', '#22c55e', '#a855f7', '#f97316', '#ec4899'];

export function CompanyHealthPanel({ company }) {
  if (!company) return null;

  const { revenueHistory = [], practiceShare = [], metricsCurrent, metricsPrevious } = company;

  const engagementTrend = [
    { period: 'Prev', interactions: metricsPrevious?.interactionsLast90d ?? 0, matters: metricsPrevious?.mattersActive ?? 0 },
    { period: 'Current', interactions: metricsCurrent?.interactionsLast90d ?? 0, matters: metricsCurrent?.mattersActive ?? 0 },
  ];

  return (
    <div className="panel company-health-panel">
      <div className="panel-header">
        <h3>Company health</h3>
        <p className="panel-subtitle">High-level view of revenue and engagement trends</p>
      </div>

      <div className="panel-grid">
        <div className="panel-card">
          <h4 className="panel-card-title">Revenue trend</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueHistory}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(v) => `$${v.toFixed(1)}M`}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}M`, 'Revenue']}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card">
          <h4 className="panel-card-title">Practice mix</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={practiceShare}
                  dataKey="value"
                  nameKey="practice"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {practiceShare.map((entry, index) => (
                    <Cell
                      key={entry.practice}
                      fill={PRACTICE_COLORS[index % PRACTICE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share of revenue']} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card panel-card-wide">
          <h4 className="panel-card-title">Engagement & matters trend</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={engagementTrend}>
                <defs>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="mattersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="interactions"
                  name="Interactions last 90d"
                  stroke="#22c55e"
                  fill="url(#engagementGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="matters"
                  name="Active matters"
                  stroke="#a855f7"
                  fill="url(#mattersGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

