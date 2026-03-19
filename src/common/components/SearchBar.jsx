import Icon from './Icon';

export default function SearchBar({ value, onChange, placeholder = 'Search', className = '' }) {
  return (
    <label className={`search ${className}`.trim()}>
      <Icon name="search" />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

