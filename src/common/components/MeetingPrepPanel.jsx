import { useDemoStore } from '../store/demoStore';
import { calendarEntries } from '../constants/calendar';

export default function MeetingPrepPanel() {
  const contacts = useDemoStore((s) => s.contacts || []);
  const companies = useDemoStore((s) => s.companies || []);

  const resolved = calendarEntries.map((entry) => {
    const contact = contacts[entry.contactIndex] || contacts[0];
    const company = companies[entry.companyIndex] || companies[0];
    return { ...entry, contact, company };
  }).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const upcoming = resolved.filter((e) => new Date(e.startAt) >= new Date());

  return (
    <div className="meeting-prep-panel">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Upcoming Meetings</h3>
      {upcoming.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>No upcoming meetings.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {upcoming.slice(0, 5).map((entry) => {
          const date = new Date(entry.startAt);
          const dateStr = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={entry.id} style={{
              background: '#f9fafb', borderRadius: 10, padding: '12px 16px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 14 }}>{entry.title}</strong>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{dateStr} {timeStr}</span>
              </div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                {entry.contact?.name} — {entry.company?.name}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                {entry.location} · {entry.type}
              </div>

              {/* Relationship summary */}
              <div style={{ background: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 12, border: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Prep Summary</div>
                <div>Relationship: <strong>{entry.contact?.relationship || 'N/A'}</strong> (Score: {entry.contact?.relationshipScore || 'N/A'})</div>
                <div>Last interacted: <strong>{entry.contact?.lastInteracted || 'N/A'}</strong></div>
                {entry.contact?.recentInteractions?.[0] && (
                  <div style={{ marginTop: 4, color: '#4b5563' }}>Recent: {entry.contact.recentInteractions[0]}</div>
                )}
                <div style={{ marginTop: 6 }}>
                  <em style={{ color: '#6b7280' }}>Suggested talking points: Recent matter updates, relationship health check, upcoming opportunities</em>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
