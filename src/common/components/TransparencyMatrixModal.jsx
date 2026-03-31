import React, { useMemo, useState } from 'react';
import { buildPersonaHelper } from '../constants/personas';

const RELATIONSHIP_FIELDS = [
  'relationshipHistory',
  'relationshipScore',
  'relationship.aggregate',
  'internalConnections',
  'firmConnections.colleagueRole',
  'firmConnections.activityDetail',
  'recentInteractions',
  'recentInteractions.detail',
  'keyContact.toggle',
  'contactBadges',
  'specialDates',
  'contactNotes',
  'companyNotes',
  'aiDraft',
  'aiSummary',
];

const FINANCIAL_FIELDS = [
  'revenue.exact',
  'revenue.range',
  'financialTrends',
  'matters.table',
  'matters.summary',
  'matterRank',
  'wip',
  'opportunities.table',
  'opportunities.summary',
  'companyHealth',
  'companyHealth.charts',
  'companyHierarchy',
  'catCode',
  'clientCode',
  'gics',
  'marketingActivity',
  'personalLists',
  'powerBIDashboard',
  'ciReports',
  'billingLawyer',
];

const RELATIONSHIP_DEPTH_KEYS = [
  'relationshipHistory',
  'recentInteractions',
  'keyContacts',
  'companyNotes',
  'contactNotes',
  'insightCards',
];

const FINANCIAL_DEPTH_KEYS = [
  'engagementRows',
  'insightCards',
];

function labelForField(key) {
  switch (key) {
    case 'relationship.aggregate':
      return 'Relationship aggregates only';
    case 'recentInteractions.detail':
      return 'Recent interactions (detail)';
    case 'firmConnections.colleagueRole':
      return 'Firm connections (colleague role)';
    case 'firmConnections.activityDetail':
      return 'Firm connections (activity detail)';
    case 'keyContact.toggle':
      return 'Key contact toggle';
    case 'companyHealth.charts':
      return 'Company health charts';
    case 'matters.summary':
      return 'Matters summary';
    case 'opportunities.summary':
      return 'Opportunities summary';
    case 'companyHierarchy':
      return 'Company hierarchy';
    case 'marketingActivity':
      return 'List marketing activity';
    case 'personalLists':
      return 'Personal lists';
    case 'catCode':
      return 'Cat code (Iridium)';
    case 'clientCode':
      return 'Client code (Iridium)';
    case 'gics':
      return 'GICS fields (Iridium)';
    default:
      return key;
  }
}

function tierColumnNames() {
  return [
    { col: 't1', title: 'Full (DT-03)', personaId: 'bd-superuser' },
    { col: 't2', title: 'Abstract (DT-02)', personaId: 'bd-standard' },
    { col: 't3', title: 'Baseline (DT-01)', personaId: 'legal-assistant' },
  ];
}

function personaColumnDefs() {
  return [
    { id: 'partner-default', title: 'Partner', personaId: 'partner', context: {} },
    { id: 'non-equity-partner-default', title: 'Non-Equity Partner', personaId: 'non-equity-partner', context: {} },
    { id: 'associate-baseline', title: 'Associate (Baseline)', personaId: 'associate', context: { associateTier2Approved: false } },
    { id: 'associate-approved', title: 'Associate (Approved)', personaId: 'associate', context: { associateTier2Approved: true } },
    { id: 'bd-standard-default', title: 'BD Standard', personaId: 'bd-standard', context: {} },
    { id: 'legal-assistant-default', title: 'Legal Assistant', personaId: 'legal-assistant', context: {} },
    { id: 'group-lead-default', title: 'Group Lead', personaId: 'group-lead', context: {} },
    {
      id: 'group-lead-in-group',
      title: 'Group Lead (In-group)',
      personaId: 'group-lead',
      context: { company: { practiceShare: [{ practice: 'Corporate', value: 70 }] } },
    },
    { id: 'billing-lawyer-default', title: 'Billing Lawyer', personaId: 'billing-lawyer', context: {} },
    {
      id: 'billing-lawyer-own',
      title: 'Billing Lawyer (Own Acct)',
      personaId: 'billing-lawyer',
      context: { company: { ownerId: 'current-user' } },
    },
    { id: 'bd-superuser-default', title: 'BD SuperUser', personaId: 'bd-superuser', context: {} },
  ];
}

function VisibilityCell({ visible }) {
  return (
    <td style={{ textAlign: 'center' }}>
      {visible ? (
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: '#22c55e' }} />
      ) : (
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: '#9ca3af' }} />
      )}
    </td>
  );
}

export default function TransparencyMatrixModal({ onClose }) {
  const [tab, setTab] = useState('relationship');

  const columns = tierColumnNames();

  const tierFields = useMemo(() => {
    const mkTierHelper = (personaId) => buildPersonaHelper(personaId);
    const t1 = mkTierHelper(columns[0].personaId);
    const t2 = mkTierHelper(columns[1].personaId);
    const t3 = mkTierHelper(columns[2].personaId);

    const relationshipRows = RELATIONSHIP_FIELDS.map((key) => ({
      key,
      label: labelForField(key),
      t1: t1.field(key),
      t2: t2.field(key),
      t3: t3.field(key),
    }));

    const financialRows = FINANCIAL_FIELDS.map((key) => ({
      key,
      label: labelForField(key),
      t1: t1.field(key),
      t2: t2.field(key),
      t3: t3.field(key),
    }));

    return { relationshipRows, financialRows };
  }, [columns]);

  const relationshipPersonaMatrix = useMemo(() => {
    const personaColumns = personaColumnDefs();
    const helpers = personaColumns.map((col) => ({
      ...col,
      helper: buildPersonaHelper(col.personaId, col.context),
    }));

    const rows = RELATIONSHIP_FIELDS.map((key) => ({
      key,
      label: labelForField(key),
      cells: helpers.map((h) => h.helper.field(key)),
    }));

    const depthRows = RELATIONSHIP_DEPTH_KEYS.map((key) => ({
      key,
      label: `${labelForField(key)} depth`,
      cells: helpers.map((h) => h.helper.depth(key)),
    }));

    return { personaColumns, rows, depthRows };
  }, []);

  const financialPersonaMatrix = useMemo(() => {
    const personaColumns = personaColumnDefs();
    const helpers = personaColumns.map((col) => ({
      ...col,
      helper: buildPersonaHelper(col.personaId, col.context),
    }));

    const rows = FINANCIAL_FIELDS.map((key) => ({
      key,
      label: labelForField(key),
      cells: helpers.map((h) => h.helper.field(key)),
    }));

    const depthRows = FINANCIAL_DEPTH_KEYS.map((key) => ({
      key,
      label: `${labelForField(key)} depth`,
      cells: helpers.map((h) => h.helper.depth(key)),
    }));

    return { personaColumns, rows, depthRows };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="company-modal company-modal--xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Visibility Matrix (Prototype)</h2>
          <button className="modal-close" onClick={onClose} aria-label="close modal">
            x
          </button>
        </div>

        <div className="modal-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexShrink: 0 }}>
            <button
              type="button"
              className={tab === 'relationship' ? 'primary' : 'tool-btn'}
              onClick={() => setTab('relationship')}
              style={{ fontSize: 13 }}
            >
              Relationship
            </button>
            <button
              type="button"
              className={tab === 'financial' ? 'primary' : 'tool-btn'}
              onClick={() => setTab('financial')}
              style={{ fontSize: 13 }}
            >
              Financial
            </button>
          </div>

          {tab === 'relationship' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid #e5e7eb' }}>Field</th>
                    {columns.map((c) => (
                      <th key={c.col} style={{ textAlign: 'center', padding: '8px 8px', borderBottom: '1px solid #e5e7eb' }}>
                        {c.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tierFields.relationshipRows.map((row) => (
                    <tr key={row.key}>
                      <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}>
                        {row.label}
                      </td>
                      <VisibilityCell visible={row.t1} />
                      <VisibilityCell visible={row.t2} />
                      <VisibilityCell visible={row.t3} />
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: 10, color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>
                Uses the same `field()` gates as the UI with expanded relationship coverage (history, aggregates, notes, AI affordances).
                This remains a prototype proxy for Section 3.2.
              </p>
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Persona Relationship Matrix (Detailed)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Field</th>
                      {relationshipPersonaMatrix.personaColumns.map((col) => (
                        <th key={col.id} style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {relationshipPersonaMatrix.rows.map((row) => (
                      <tr key={row.key}>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                          {row.label}
                        </td>
                        {row.cells.map((visible, idx) => (
                          <td key={`${row.key}-${relationshipPersonaMatrix.personaColumns[idx].id}`} style={{ textAlign: 'center', padding: '6px', borderBottom: '1px solid #f3f4f6' }}>
                            {visible ? 'Yes' : 'No'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {relationshipPersonaMatrix.depthRows.map((row) => (
                      <tr key={row.key}>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                          {row.label}
                        </td>
                        {row.cells.map((depth, idx) => (
                          <td key={`${row.key}-${relationshipPersonaMatrix.personaColumns[idx].id}`} style={{ textAlign: 'center', padding: '6px', borderBottom: '1px solid #f3f4f6' }}>
                            {depth}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'financial' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 8px', borderBottom: '1px solid #e5e7eb' }}>Field</th>
                    {columns.map((c) => (
                      <th key={c.col} style={{ textAlign: 'center', padding: '8px 8px', borderBottom: '1px solid #e5e7eb' }}>
                        {c.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tierFields.financialRows.map((row) => (
                    <tr key={row.key}>
                      <td style={{ padding: '8px 8px', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}>
                        {row.label}
                      </td>
                      <VisibilityCell visible={row.t1} />
                      <VisibilityCell visible={row.t2} />
                      <VisibilityCell visible={row.t3} />
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: 10, color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>
                Uses the same `field()` gates as the UI with expanded financial + Iridium-proxy fields
                (revenue mode, matter/opportunity depth, hierarchy/codes, BI visibility). This remains a prototype proxy for Section 3.2.
              </p>
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Persona Financial Matrix (Detailed)</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>Field</th>
                      {financialPersonaMatrix.personaColumns.map((col) => (
                        <th key={col.id} style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' }}>
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {financialPersonaMatrix.rows.map((row) => (
                      <tr key={row.key}>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                          {row.label}
                        </td>
                        {row.cells.map((visible, idx) => (
                          <td key={`${row.key}-${financialPersonaMatrix.personaColumns[idx].id}`} style={{ textAlign: 'center', padding: '6px', borderBottom: '1px solid #f3f4f6' }}>
                            {visible ? 'Yes' : 'No'}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {financialPersonaMatrix.depthRows.map((row) => (
                      <tr key={row.key}>
                        <td style={{ padding: '6px', borderBottom: '1px solid #f3f4f6', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                          {row.label}
                        </td>
                        {row.cells.map((depth, idx) => (
                          <td key={`${row.key}-${financialPersonaMatrix.personaColumns[idx].id}`} style={{ textAlign: 'center', padding: '6px', borderBottom: '1px solid #f3f4f6' }}>
                            {depth}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

