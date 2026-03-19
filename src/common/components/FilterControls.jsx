export function FilterControls({ children, className = '' }) {
  return <div className={`filter-controls ${className}`.trim()}>{children}</div>;
}

export function FilterSelect({ className = '', children, ...props }) {
  return (
    <select className={`filter-select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function FilterButton({ className = '', type = 'button', children, ...props }) {
  return (
    <button type={type} className={`filter-btn ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

