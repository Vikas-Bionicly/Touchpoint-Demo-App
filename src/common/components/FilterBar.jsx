export default function FilterBar({ children, className = '' }) {
  return (
    <section className={`filterbar ${className}`.trim()}>
      {children}
    </section>
  );
}

