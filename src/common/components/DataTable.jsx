export default function DataTable({
  className = '',
  tableClassName = '',
  tableConfig,
  // backward‑compatible render props
  renderHeader,
  renderBody,
}) {
  const renderGenericHeader = () => {
    if (!tableConfig) return null;
    const { isSortable = false, isSelectable = true, columns = [] } = tableConfig;

    return (
      <tr className="datatable-head-row">
        {isSelectable && (
          <th className="checkbox-cell-v2 datatable-head-cell" aria-label="Select all rows">
            {/* Checkbox wiring is handled at the row level for now */}
          </th>
        )}
        {columns.map((col) => (
          <th key={col.key} className="datatable-head-cell">
            {col.label}
          </th>
        ))}
      </tr>
    );
  };

  return (
    <section className={className}>
      <table className={`datatable ${tableClassName}`.trim()}>
        <thead>
          {/* Prefer config-based header if provided, otherwise fall back to old API */}
          {tableConfig && renderGenericHeader()}
          {!tableConfig && renderHeader && renderHeader()}
        </thead>
        {renderBody && <tbody>{renderBody()}</tbody>}
      </table>
    </section>
  );
}

