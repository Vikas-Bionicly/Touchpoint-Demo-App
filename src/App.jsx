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
import VisitsPage from './pages/VisitsPage';
import QuickCapture from './common/components/QuickCapture';
import TransparencyMatrixModal from './common/components/TransparencyMatrixModal';

export default function App() {
  const [activePage, setActivePage] = useState('My Insights');
  const [activeSubPage, setActiveSubPage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const personaId = useDemoStore((s) => s.currentPersonaId || 'partner');
  const associateTier2UpgradeStatus = useDemoStore((s) => s.associateTier2UpgradeStatus ?? 'none');
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
            <div className="role-card">
              <div className="role-profile-row">
                <div className="role-avatar">JD</div>
                <div className="role-meta">
                  <span className="role-name">John Doe</span>
                  <span className="role-title">{persona.label}</span>
                  <span className="role-tier">Tier {tier}</span>
                </div>
              </div>
              <div className="role-viewing-block">
                <span className="role-label">Viewing as</span>
                <select
                  className="persona-select"
                  value={personaId}
                  onChange={(e) => actions.setCurrentPersona(e.target.value)}
                >
                  {PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} (T{p.tier})
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="role-matrix-btn" onClick={() => setIsMatrixOpen(true)}>
                Visibility matrix
              </button>
              {personaId === 'associate' && associateTier2UpgradeStatus !== 'approved' && (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, lineHeight: 1.45, color: '#334155' }}>
                  <strong style={{ display: 'block', marginBottom: 6 }}>Tier 2 data access</strong>
                  {associateTier2UpgradeStatus === 'pending' ? (
                    <span>Pending Group Lead approval.</span>
                  ) : (
                    <button
                      type="button"
                      className="primary"
                      style={{ width: '100%', marginTop: 6, fontSize: 11, padding: '6px 8px' }}
                      onClick={() => actions.requestAssociateTier2Upgrade()}
                    >
                      Request upgrade
                    </button>
                  )}
                </div>
              )}
              {personaId === 'group-lead' && associateTier2UpgradeStatus === 'pending' && (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#fffbeb', border: '1px solid #fcd34d', fontSize: 11, lineHeight: 1.45, color: '#78350f' }}>
                  <strong style={{ display: 'block', marginBottom: 6 }}>Associate Tier 2 request</strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="primary"
                      style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
                      onClick={() => actions.approveAssociateTier2Upgrade()}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="tool-btn"
                      style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
                      onClick={() => actions.rejectAssociateTier2Upgrade()}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}
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
        {activePage === 'Visits' && <VisitsPage subPage={activeSubPage} />}
        {activePage === 'Touchpoints' && <TouchpointsPage view={activeSubPage} />}
      </main>
      <QuickCapture />
      {isMatrixOpen && (
        <TransparencyMatrixModal onClose={() => setIsMatrixOpen(false)} />
      )}
    </div>
  );
}
