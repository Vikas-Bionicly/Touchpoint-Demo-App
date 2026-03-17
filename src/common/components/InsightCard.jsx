import { useState } from 'react';
import Icon from './Icon';

export default function InsightCard({
  card,
  onCreateTouchpoint,
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
          <button className="context-btn" aria-label="context" onClick={() => setMenuOpen((p) => !p)}>
            <Icon name="more" />
          </button>
        </div>

        <h3>{card.title}</h3>
        <p>{card.description}</p>

        {menuOpen && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="tool-btn" type="button" onClick={() => onReminder?.(card)}>
              Set reminder
            </button>
            <button className={`tool-btn ${state?.liked ? 'active' : ''}`} type="button" onClick={() => onLike?.(card)}>
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
              <Icon name="users" />
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
            <button className="primary" onClick={() => onCreateTouchpoint?.(card)}>
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
