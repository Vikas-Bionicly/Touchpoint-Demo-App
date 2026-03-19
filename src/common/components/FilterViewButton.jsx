import Icon from './Icon';

export default function FilterViewButton({ active = false, children, className = '', ...props }) {
  const label = children || (active ? 'High Priority' : 'Filter View');

  return (
    <button
      type="button"
      className={`filter-btn ${active ? 'active' : ''} ${className}`.trim()}
      {...props}
    >
      <Icon name="sliders" className="btn-icon" />
      {label}
    </button>
  );
}

