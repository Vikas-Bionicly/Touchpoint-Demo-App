import { useState } from 'react';
import Icon from './Icon';

export default function InsightCard({
  card,
  onCreateTouchpoint,
  onDraftOutreach,
  state,
  onLike,
  onDismiss,
  onReminder,
  onAddNote,
  onAddTag,
  onShareContent,
  onViewConnections,
}) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleCtaClick() {
    const cta = card.cta || '';
    if (cta === 'Create Touchpoint' || cta === 'Schedule Follow-up') {
      onCreateTouchpoint?.(card);
    } else if (cta === 'Draft Outreach' || cta === 'Share Content') {
      onDraftOutreach?.(card);
    } else if (cta === 'Request Intro' || cta === 'View Connections') {
      onViewConnections?.(card);
    } else {
      onCreateTouchpoint?.(card);
    }
  }

  return (
    <article className={`ins-card ${card.tone}`}>
      <div className="ins-head">
        <div className="ins-top">
          <div className="ins-badges">
            <span className="badge main">{card.label}</span>
            {card.tags.map((tag) => (
              <span key={tag} className="badge sub">
                {tag}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <button className="context-btn" aria-label="context" onClick={() => setMenuOpen((p) => !p)}>
              <Icon name="more" />
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 8,
                  boxShadow: '0 10px 15px -5px rgba(0,0,0,0.1)',
                  zIndex: 20,
                  minWidth: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <button className="tool-btn" type="button" onClick={() => onReminder?.(card)}>
                  Set reminder
                </button>
                <button
                  className={`tool-btn ${state?.liked ? 'active' : ''}`}
                  type="button"
                  onClick={() => onLike?.(card)}
                >
                  {state?.liked ? 'Liked' : 'Like'}
                </button>
                <button className="tool-btn" type="button" onClick={() => onAddNote?.(card)}>
                  Add note
                </button>
                <button className="tool-btn" type="button" onClick={() => onAddTag?.(card)}>
                  Add tag
                </button>
                <button className="tool-btn" type="button" onClick={() => onShareContent?.(card)}>
                  Share content
                </button>
                <button className="tool-btn" type="button" onClick={() => onDismiss?.(card)}>
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </div>

      <div className="ins-body">
        <div className="client-row">
          <div className="client-block">
            <div className="avatar">{card.subject.slice(0, 1)}</div>
            <div>
              <div className="name-line">
                <strong>{card.subject}</strong>
                <Icon name="signal" className={`network-icon tone-${card.tone}`} />
              </div>
              <small>VP, Regional General Counsel</small>
              <small>EdgeTech LLC</small>
            </div>
          </div>

          <div className="meta-block">
            <p>{card.meta1}</p>
            <small>{card.meta2}</small>
            <small>{card.meta3}</small>
          </div>

          <div className="actions">
            <button aria-label="firm connections" onClick={() => onViewConnections?.(card)}>
              <i className="fas fa-user-friends icon" />
            </button>
            <button aria-label="touchpoint" onClick={() => onCreateTouchpoint?.(card)}>
              <Icon name="target" />
            </button>
            <button aria-label="data">
              <Icon name="chart" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="suggestion-row">
            <p>{card.suggestion}</p>
            <button className="primary insights-cta" onClick={handleCtaClick}>
              <Icon name="send" className="btn-icon" />
              {card.cta}
            </button>
          </div>
        )}

        <button className="detail-link" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? 'Hide suggestions' : 'See more suggestions'}
          <Icon name="chevron" className={`chevron ${expanded ? 'up' : ''}`} />
        </button>
      </div>
    </article>
  );
}
