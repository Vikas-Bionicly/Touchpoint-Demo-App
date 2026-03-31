import Icon from './Icon';

const ACTION_ICONS = {
  'Add Note': 'note',
  'Create Touchpoint': 'handshake',
  'Draft Outreach': 'send',
  'AI Summary': 'sparkles',
  'Firm Connections': 'target',
  'Add to List': 'listPlus',
  'Manage Tags': 'sliders',
  'Tags': 'sliders',
  'Edit': 'edit',
  'Recent Interactions': 'chart',
  '+ Opportunity': 'plus',
  'Complete': 'check',
  'Cancel': 'x',
  'Assign': 'user',
  'Pull Through Follow-ups': 'send',
};

export default function DetailActionBar({ actions = [], className = '' }) {
  if (!actions.length) return null;
  return (
    <div className={`detail-action-bar ${className}`}>
      {actions.map((action, i) => {
        if (action.divider) return <span key={`div-${i}`} className="detail-action-divider" />;
        const iconName = action.icon || ACTION_ICONS[action.label] || 'more';
        return (
          <button
            key={action.label}
            type="button"
            className={`detail-action-btn ${action.primary ? 'primary' : ''}`}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.label}
          >
            <Icon name={iconName} />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
