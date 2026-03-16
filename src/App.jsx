import { useState } from 'react';
import Icon from './common/components/Icon';
import { navItems } from './common/constants/navigation';
import MyInsightsPage from './pages/MyInsightsPage';
import ContactsPage from './pages/ContactsPage';
import CompaniesPage from './pages/CompaniesPage';
import ListsPage from './pages/ListsPage';
import TouchpointsPage from './pages/TouchpointsPage';

export default function App() {
  const [activePage, setActivePage] = useState('My Insights');
  const [activeSubPage, setActiveSubPage] = useState('');

  return (
    <div className="layout">
      <aside className="sidebar">
        <nav>
          {navItems.map((item) => (
            <div key={item.label} className="nav-group">
              <button
                className={`nav-item ${activePage === item.label ? 'active' : ''}`}
                onClick={() => {
                  setActivePage(item.label);
                  setActiveSubPage('');
                }}
              >
                <Icon name={item.icon} className="nav-icon" />
                {item.label}
              </button>
              {item.children && activePage === item.label && (
                <div className="submenu">
                  {item.children.map((child) => (
                    <button
                      key={child}
                      className="sub-item"
                      onClick={() => setActiveSubPage(child)}
                      aria-current={activeSubPage === child ? 'page' : undefined}
                    >
                      {child}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main">
        {activePage === 'My Insights' && <MyInsightsPage />}
        {activePage === 'Contacts' && <ContactsPage />}
        {activePage === 'Companies' && <CompaniesPage />}
        {activePage === 'Lists' && <ListsPage />}
        {activePage === 'Touchpoints' && <TouchpointsPage view={activeSubPage} />}
      </main>
    </div>
  );
}
