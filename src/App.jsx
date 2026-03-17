import { useEffect, useState } from 'react';
import Icon from './common/components/Icon';
import BlakesLogo from './common/components/BlakesLogo';
import { navItems } from './common/constants/navigation';
import { demoStore, useDemoStore } from './common/store/demoStore';
import MyInsightsPage from './pages/MyInsightsPage';
import ContactsPage from './pages/ContactsPage';
import CompaniesPage from './pages/CompaniesPage';
import ListsPage from './pages/ListsPage';
import TouchpointsPage from './pages/TouchpointsPage';

export default function App() {
  const [activePage, setActivePage] = useState('My Insights');
  const [activeSubPage, setActiveSubPage] = useState('');
  const role = useDemoStore((s) => s.currentRole || 'Partner');
  const actions = demoStore.actions;

  useEffect(() => {
    function applyHash() {
      if (typeof window === 'undefined') return;
      const raw = window.location.hash.replace(/^#/, '');
      if (!raw) return;
      const [pagePart, subPart] = decodeURIComponent(raw).split('/');
      if (!pagePart) return;
      setActivePage(pagePart);
      setActiveSubPage(subPart || '');
    }

    applyHash();

    if (typeof window === 'undefined') return undefined;
    const handler = () => applyHash();
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  function navigate(page, subPage = '') {
    setActivePage(page);
    setActiveSubPage(subPage);
    if (typeof window !== 'undefined') {
      const hash = subPage ? `${page}/${subPage}` : page;
      window.location.hash = encodeURIComponent(hash);
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <BlakesLogo />
          <div className="role-switcher">
            <span className="role-label">Viewing as</span>
            <div className="role-toggle">
              {['Partner', 'BD'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-pill ${role === r ? 'active' : ''}`}
                  onClick={() => actions.setCurrentRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <div key={item.label} className="nav-group">
              <button
                className={`nav-item ${activePage === item.label ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.label);
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
                      onClick={() => navigate(item.label, child)}
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
