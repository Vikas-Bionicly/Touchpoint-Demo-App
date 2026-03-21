import { useEffect, useState } from 'react';
import Icon from './common/components/Icon';
import BlakesLogo from './common/components/BlakesLogo';
import { navItems } from './common/constants/navigation';
import { demoStore, useDemoStore } from './common/store/demoStore';
import { PERSONAS } from './common/constants/personas';
import { usePersona } from './common/hooks/usePersona';
import NotificationCenter from './common/components/NotificationCenter';
import MyInsightsPage from './pages/MyInsightsPage';
import ContactsPage from './pages/ContactsPage';
import CompaniesPage from './pages/CompaniesPage';
import ListsPage from './pages/ListsPage';
import TouchpointsPage from './pages/TouchpointsPage';

export default function App() {
  const [activePage, setActivePage] = useState('My Insights');
  const [activeSubPage, setActiveSubPage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');
  const { persona, tier } = usePersona();
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
    setIsSidebarOpen(false);
    if (typeof window !== 'undefined') {
      const hash = subPage ? `${page}/${subPage}` : page;
      window.location.hash = encodeURIComponent(hash);
    }
  }

  return (
    <div className="layout">
      <button
        type="button"
        className="sidebar-toggle"
        aria-label="Toggle navigation"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Mobile top header (hamburger + page title) */}
      {!isSidebarOpen && (
        <div className="mobile-topbar">
          <button
            type="button"
            className="mobile-menu-btn"
            aria-label="Open navigation"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <h1 className="mobile-topbar-title">{activePage}</h1>
          <div className="mobile-topbar-right">
            <NotificationCenter />
          </div>
        </div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand-bar">
            <BlakesLogo />

            <button
              type="button"
              className="sidebar-close"
              aria-label="Close navigation"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Icon name="x" />
            </button>
          </div>

          <div className="role-switcher">
            <span className="role-label">Viewing as</span>
            <div className="role-card">
              <div className="role-avatar">JD</div>
              <div className="role-meta">
                <span className="role-name">John Doe</span>
                <span className="role-title">{persona.label}</span>
                <span className="role-tier" style={{ fontSize: 11, opacity: 0.7 }}>Tier {tier}</span>
              </div>
              <select
                className="persona-select"
                value={personaId}
                onChange={(e) => actions.setCurrentPersona(e.target.value)}
                style={{
                  border: '1px solid #d4d4d4',
                  borderRadius: 6,
                  padding: '4px 6px',
                  fontSize: 12,
                  background: '#fff',
                  cursor: 'pointer',
                  maxWidth: 120,
                }}
              >
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} (T{p.tier})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <nav>
          {navItems.map((item) => {
            const isActive = activePage === item.label;
            return (
              <div key={item.label} className="nav-group">
                <button
                  type="button"
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    navigate(item.label);
                  }}
                >
                  <Icon name={item.icon} className="nav-icon" />
                  <span>{item.label}</span>
                  {item.children && (
                    <span className="nav-chevron">
                      <Icon name="chevron" />
                    </span>
                  )}
                </button>

                {item.children && isActive && (
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
            );
          })}

          {/* Placeholder integration items */}
          <div className="nav-group">
            <button type="button" className="nav-item" disabled style={{ opacity: 0.4 }}>
              <Icon name="note" className="nav-icon" />
              <span>Outlook Add-in</span>
              <span style={{ fontSize: 10, marginLeft: 'auto', color: '#9ca3af' }}>Soon</span>
            </button>
          </div>
          <div className="nav-group">
            <button type="button" className="nav-item" disabled style={{ opacity: 0.4 }}>
              <Icon name="handshake" className="nav-icon" />
              <span>Teams</span>
              <span style={{ fontSize: 10, marginLeft: 'auto', color: '#9ca3af' }}>Soon</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className="main">
        <div className="main-header-bar" style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 0', gap: 8 }}>
          <NotificationCenter />
        </div>
        {activePage === 'My Insights' && <MyInsightsPage subPage={activeSubPage} />}
        {activePage === 'Contacts' && <ContactsPage subPage={activeSubPage} />}
        {activePage === 'Companies' && <CompaniesPage subPage={activeSubPage} />}
        {activePage === 'Lists' && <ListsPage />}
        {activePage === 'Touchpoints' && <TouchpointsPage view={activeSubPage} />}
      </main>
    </div>
  );
}
