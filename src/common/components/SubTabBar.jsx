/**
 * Reusable horizontal pill-style sub-tab bar.
 */
export default function SubTabBar({ tabs, activeTab, onTabChange }) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="subtab-bar">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`subtab-pill ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
