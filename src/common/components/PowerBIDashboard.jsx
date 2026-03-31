import { useEffect, useMemo, useState } from 'react';
import { usePersona } from '../hooks/usePersona';
import { useDemoStore } from '../store/demoStore';

const TABS = ['Overview', 'Revenue', 'Relationships', 'Pipeline'];

export default function PowerBIDashboard({ company }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 900 : false));
  const { field, persona } = usePersona({ company });
  const companies = useDemoStore((s) => s.companies || []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const lawyerOptions = useMemo(() => {
    const relationship = Array.isArray(company?.relationshipLawyers) ? company.relationshipLawyers : [];
    const billing = company?.billingLawyer ? [company.billingLawyer] : [];
    const all = [...relationship, ...billing].filter(Boolean);
    return Array.from(new Set(all));
  }, [company]);

  const [perspective, setPerspective] = useState('Firm-wide');

  useEffect(() => {
    if (perspective === 'Firm-wide') return;
    if (!lawyerOptions.includes(perspective)) setPerspective('Firm-wide');
  }, [lawyerOptions, perspective]);

  const perspectiveMetrics = useMemo(() => {
    const matters = Array.isArray(company?.matters) ? company.matters : [];
    if (perspective === 'Firm-wide') {
      return {
        mattersTotal: matters.length,
        mattersActive: matters.filter((m) => m.status === 'Active').length,
        totalWip: matters.reduce((sum, m) => sum + Number(m?.wip || 0), 0),
      };
    }

    const filtered = matters.filter((m) => m?.leadLawyer === perspective);
    return {
      mattersTotal: filtered.length,
      mattersActive: filtered.filter((m) => m.status === 'Active').length,
      totalWip: filtered.reduce((sum, m) => sum + Number(m?.wip || 0), 0),
    };
  }, [company, perspective]);

  const selectedPerspectiveLabel = perspective === 'Firm-wide' ? 'Firm-wide' : perspective;
  const mode = useMemo(() => {
    if (persona?.id === 'billing-lawyer') return 'billing';
    if (persona?.id === 'group-lead') return 'group';
    if (persona?.id === 'bd-superuser') return 'bd-superuser';
    return 'standard';
  }, [persona?.id]);

  const firmMetrics = useMemo(() => {
    const allMatters = companies.flatMap((c) => c.matters || []);
    const pendingOpps = companies.flatMap((c) => c.opportunities || []).filter((o) => o.status === 'Pending').length;
    return {
      accounts: companies.length,
      activeMatters: allMatters.filter((m) => m.status === 'Active').length,
      pendingOpps,
      totalWip: allMatters.reduce((sum, m) => sum + Number(m?.wip || 0), 0),
    };
  }, [companies]);

  const revenueRange = useMemo(() => {
    const m = String(company?.revenue || '').match(/([\d.]+)/);
    const n = m ? parseFloat(m[1]) : null;
    if (!n) return '$500K-$2M';
    if (n < 0.8) return '<$1M';
    if (n < 1.5) return '$1M-$2M';
    return '$2M+';
  }, [company?.revenue]);

  if (!company) return null;

  const mobileCard = (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 12,
        background: '#f9fafb',
        margin: '0 0 12px',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Mobile key metrics card (BI-06)</p>
      <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{company.name}</p>
      <p style={{ margin: '6px 0 0', fontSize: 13 }}>
        Trend {company.relationshipTrend} · Matters {perspectiveMetrics.mattersActive}/{perspectiveMetrics.mattersTotal}
      </p>
      <button type="button" className="tool-btn" style={{ marginTop: 8, fontSize: 12 }}>
        Open full dashboard on desktop
      </button>
    </div>
  );

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{
          padding: 16,
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: '#111827', fontWeight: 700, fontSize: 13 }}>
          Account dashboard perspective
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Perspective</span>
          <select
            value={perspective}
            onChange={(e) => setPerspective(e.target.value)}
            style={{ borderRadius: 8, padding: '8px 10px', border: '1px solid #d4d4d4', fontSize: 13 }}
          >
            <option value="Firm-wide">Firm-wide</option>
            {lawyerOptions.map((lawyer) => (
              <option key={lawyer} value={lawyer}>
                {lawyer}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              background: activeTab === tab ? '#fff' : 'transparent',
              border: 'none', borderBottom: activeTab === tab ? '2px solid #b91c1c' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div style={{ padding: 24, minHeight: 180, textAlign: 'center' }}>
        {isMobile && mobileCard}
        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
          Embedded Power BI dashboard (prototype) — {activeTab}
        </div>
        <div style={{
          background: '#f3f4f6', borderRadius: 8, padding: 32, border: '2px dashed #d1d5db',
          color: '#9ca3af', fontSize: 14,
        }}>
          {activeTab === 'Overview' &&
            `${company.name} — ${selectedPerspectiveLabel} client overview placeholder. ` +
            `Matters: ${perspectiveMetrics.mattersTotal} (${perspectiveMetrics.mattersActive} active). ` +
            `${field('wip') ? `Total WIP: $${perspectiveMetrics.totalWip.toLocaleString()}. ` : ''}` +
            `Account trend: ${company.relationshipTrend}.`}

          {activeTab === 'Revenue' &&
            (mode === 'billing'
              ? `BI-02 Billing Lawyer view (full): Revenue ${company.revenue}; WIP $${perspectiveMetrics.totalWip.toLocaleString()}; AR/fees analytics scaffold for ${company.name}.`
              : `BI-03 Non-Billing view (range + trend): Revenue ${field('revenue.exact') ? company.revenue : revenueRange}; trend ${company.relationshipTrend}. Historical: ${(company.revenueHistory || []).map((r) => `${r.period}: $${r.value.toFixed(1)}M`).join(', ')}`)}

          {activeTab === 'Relationships' &&
            (mode === 'group'
              ? `BI-04 Group Lead aggregate prototype: practice-group benchmark and in-group relationship health for ${selectedPerspectiveLabel}.`
              : perspective === 'Firm-wide'
                ? `Relationship analytics for ${company.name}. Key contacts: ${(company.keyContacts || []).join(', ')}. Trend: ${company.relationshipTrend}`
                : `Relationship analytics for ${company.name} — ${selectedPerspectiveLabel}. Key contacts: ${(company.keyContacts || []).join(', ')}. Trend: ${company.relationshipTrend}`)}

          {activeTab === 'Pipeline' &&
            (mode === 'bd-superuser'
              ? `BI-05 BD SuperUser firm-wide view: Accounts ${firmMetrics.accounts}; active matters ${firmMetrics.activeMatters}; pending opportunities ${firmMetrics.pendingOpps}; WIP $${firmMetrics.totalWip.toLocaleString()}.`
              : `Pipeline analytics for ${company.name} — ${selectedPerspectiveLabel}. Opportunities: ${(company.opportunities || []).map((o) => `${o.name} (${o.status})`).join(', ')}`)}
        </div>
      </div>
    </div>
  );
}
