export default function CrossPracticeCoordination({ companies }) {
  if (!companies || companies.length === 0) return null;

  const practices = ['Corporate', 'Litigation', 'Regulatory'];
  const engagements = companies.slice(0, 5).map((co) => ({
    company: co.name,
    practices: (co.practiceShare || []).filter((ps) => ps.value > 20).map((ps) => ps.practice),
    score: co.relationshipScore,
  }));

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginTop: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Cross-Practice Coordination</h3>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
        Clients engaged across multiple practice groups — coordination opportunities
      </p>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>Company</th>
            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>Active Practices</th>
            <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {engagements.map((e) => (
            <tr key={e.company}>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>{e.company}</td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>
                {e.practices.length > 0 ? e.practices.join(', ') : 'Single practice'}
              </td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>{e.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
