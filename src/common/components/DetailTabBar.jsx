export default function DetailTabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="detail-tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.count != null && <span className="detail-tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
