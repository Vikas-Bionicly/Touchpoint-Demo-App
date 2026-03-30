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
import { usePersona } from '../hooks/usePersona';
import { describeValueAddGap, hasValueAddGap } from '../utils/valueAddGap';

const PRACTICE_COLORS = ['#2563eb', '#22c55e', '#a855f7', '#f97316', '#ec4899'];

export function CompanyHealthPanel({ company }) {
  if (!company) return null;

  const { field } = usePersona({ company });
  const showExactRevenue = field('revenue.exact');
  const showCharts = field('companyHealth.charts');

  const { revenueHistory = [], practiceShare = [], metricsCurrent, metricsPrevious } = company;
  const activeTimekeepers = new Set(
    [
      ...(Array.isArray(company.relationshipLawyers) ? company.relationshipLawyers : []),
      ...(Array.isArray(company.matters) ? company.matters.map((m) => m?.leadLawyer) : []),
      company.billingLawyer,
    ].filter(Boolean)
  ).size;

  const engagementTrend = [
    { period: 'Prev', interactions: metricsPrevious?.interactionsLast90d ?? 0, matters: metricsPrevious?.mattersActive ?? 0 },
    { period: 'Current', interactions: metricsCurrent?.interactionsLast90d ?? 0, matters: metricsCurrent?.mattersActive ?? 0 },
  ];

  const valueAddGap = showCharts && hasValueAddGap(company) ? describeValueAddGap(company) : null;

  const baselineCards = [
    {
      label: 'Active timekeepers',
      value: activeTimekeepers,
      hint: 'Unique relationship + matter lead lawyers.',
    },
    {
      label: 'Days since last interaction',
      value: metricsCurrent?.daysSinceLastInteraction ?? '—',
      hint: 'Recorded firm–client touch recency.',
    },
    {
      label: 'Interactions (90d)',
      value: metricsCurrent?.interactionsLast90d ?? '—',
      hint: 'Aggregate touch volume.',
    },
    {
      label: 'Active matters (high level)',
      value: metricsCurrent?.mattersActive ?? '—',
      hint: 'Current matter count band.',
    },
    {
      label: 'Engagement quality',
      value: metricsCurrent?.engagementQuality ?? '—',
      hint: '1–5 internal indicator.',
    },
    {
      label: 'Two-way ratio',
      value:
        metricsCurrent?.twoWayRatio != null
          ? `${Math.round(Number(metricsCurrent.twoWayRatio) * 100)}%`
          : '—',
      hint: 'Bidirectional engagement mix.',
    },
  ];

  return (
    <div className="panel company-health-panel">
      <div className="panel-header">
        <h3>Company health</h3>
        <p className="panel-subtitle">
          {showCharts
            ? 'High-level view of revenue and engagement trends'
            : 'Baseline transparency: aggregate counts and indicators only'}
        </p>
      </div>
      {valueAddGap ? (
        <div
          className="company-value-add-gap-callout"
          style={{
            marginBottom: 14,
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #fcd34d',
            background: '#fffbeb',
            fontSize: 13,
            color: '#78350f',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ display: 'block', marginBottom: 6, color: '#92400e' }}>Value-add coverage gap</strong>
          {valueAddGap.summary}
        </div>
      ) : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {(
          showCharts
            ? (showExactRevenue ? baselineCards.slice(0, 1) : baselineCards.slice(0, 3))
            : baselineCards
        ).map((card) => (
          <div
            key={card.label}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              padding: '12px 14px',
            }}
          >
            <p style={{ margin: 0, color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {card.label}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, color: '#111827' }}>{card.value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{card.hint}</p>
          </div>
        ))}
      </div>

      {showCharts ? (
      <div className="panel-grid">
        {showExactRevenue && (
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
        )}

        {!showExactRevenue && field('revenue.range') && revenueHistory?.length >= 2 && (
          <div className="panel-card">
            <h4 className="panel-card-title">Revenue trend direction</h4>
            {(() => {
              const first = revenueHistory[0]?.value ?? 0;
              const last = revenueHistory[revenueHistory.length - 1]?.value ?? 0;
              const up = last > first * 1.05;
              const down = last < first * 0.95;
              const dir = up ? 'Up' : down ? 'Down' : 'Stable';
              const tone = up ? '#16a34a' : down ? '#dc2626' : '#64748b';
              return (
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: tone, lineHeight: 1 }}>
                    {dir}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                    {dir === 'Up'
                      ? 'Growth vs prior year (range view).'
                      : dir === 'Down'
                        ? 'Decline vs prior year (range view).'
                        : 'Relatively stable over the last years (range view).'}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

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
      ) : null}
    </div>
  );
}

