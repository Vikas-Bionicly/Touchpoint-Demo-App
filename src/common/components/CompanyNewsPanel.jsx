export default function CompanyNewsPanel({ newsItems }) {
  if (!newsItems || newsItems.length === 0) {
    return (
      <div style={{ padding: '12px 0' }}>
        <p className="modal-label">Company News</p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>No recent news available.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <p className="modal-label">Company News</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {newsItems.map((item) => (
          <div key={item.id} style={{
            background: '#f9fafb', borderRadius: 8, padding: '10px 14px',
            border: '1px solid #e5e7eb', fontSize: 13,
          }}>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>{item.source} · {item.date}</div>
            <div style={{ color: '#374151' }}>{item.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
