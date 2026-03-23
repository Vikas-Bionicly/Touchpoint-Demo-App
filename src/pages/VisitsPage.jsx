import { useMemo, useState } from 'react';
import Icon from '../common/components/Icon';
import SubTabBar from '../common/components/SubTabBar';
import PageHeader from '../common/components/PageHeader';
import SearchBar from '../common/components/SearchBar';
import FilterBar from '../common/components/FilterBar';
import { FilterControls, FilterSelect } from '../common/components/FilterControls';
import { demoStore, useDemoStore } from '../common/store/demoStore';
import { resolveContactAvatarUrl } from '../common/utils/avatars';

const SUB_TABS = ['Plan a Visit', 'Visit History', 'Nearby Contacts'];

export default function VisitsPage({ subPage }) {
  const [activeTab, setActiveTab] = useState(subPage || 'Plan a Visit');
  const [citySearch, setCitySearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState({});
  const [relationshipFilter, setRelationshipFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [nearbyCity, setNearbyCity] = useState('');

  const contacts = useDemoStore((s) => s.contacts || []);
  const companies = useDemoStore((s) => s.companies || []);
  const lists = useDemoStore((s) => s.lists || []);
  const tags = useDemoStore((s) => s.tags || []);
  const contactTags = useDemoStore((s) => s.contactTags || {});
  const touchpoints = useDemoStore((s) => s.touchpoints || []);

  // Unique cities for autocomplete
  const allCities = useMemo(() => {
    const citySet = new Set();
    contacts.forEach((c) => { if (c.city) citySet.add(c.city); });
    return Array.from(citySet).sort();
  }, [contacts]);

  // Plan a Visit: filtered contacts by city + criteria
  const planContacts = useMemo(() => {
    if (!citySearch.trim()) return [];
    const q = citySearch.toLowerCase();
    let data = contacts.filter((c) => (c.city || '').toLowerCase().includes(q));
    if (relationshipFilter) data = data.filter((c) => c.relationship === relationshipFilter);
    if (companyFilter) data = data.filter((c) => c.company === companyFilter);
    if (tagFilter) data = data.filter((c) => (contactTags[c.id] || []).includes(tagFilter));
    return data;
  }, [contacts, citySearch, relationshipFilter, companyFilter, tagFilter, contactTags]);

  // Visit History: Trip Planning lists + visit-type touchpoints
  const visitHistory = useMemo(() => {
    const tripLists = lists.filter((l) => l.type === 'Trip Planning');
    const visitTouchpoints = touchpoints.filter((t) => t.visitStage || t.interactionType === 'Visit');
    return { tripLists, visitTouchpoints };
  }, [lists, touchpoints]);

  // Nearby Contacts
  const nearbyContacts = useMemo(() => {
    if (!nearbyCity.trim()) return [];
    const q = nearbyCity.toLowerCase();
    return contacts
      .filter((c) => (c.city || '').toLowerCase().includes(q))
      .sort((a, b) => {
        // Sort by relationship score descending, then by days since last contact ascending
        if (b.relationshipScore !== a.relationshipScore) return b.relationshipScore - a.relationshipScore;
        return (a.metricsCurrent?.daysSinceLastInteraction || 999) - (b.metricsCurrent?.daysSinceLastInteraction || 999);
      });
  }, [contacts, nearbyCity]);

  function handleCreateVisitPlan() {
    const selected = Object.keys(selectedContacts).filter((id) => selectedContacts[id]);
    if (selected.length === 0) return;
    const planName = `${citySearch} Visit — ${new Date().toLocaleDateString()}`;
    demoStore.actions.createList({
      name: planName,
      type: 'Trip Planning',
      tag: 'Travel',
      visibility: 'Personal',
      color: 'bg-amber',
      memberIds: selected,
    });
    setSelectedContacts({});
    setCitySearch('');
  }

  function avatarSrc(contact) {
    return resolveContactAvatarUrl(contact.avatarUrl) || contact.avatarUrl;
  }

  return (
    <section className="visits-view" style={{ padding: '0 0 24px' }}>
      <PageHeader title="Visits" showMore={false} />
      <SubTabBar tabs={SUB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'Plan a Visit' && (
        <div style={{ padding: '0 16px' }}>
          <FilterBar className="mb-4">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <SearchBar
                  value={citySearch}
                  onChange={setCitySearch}
                  placeholder="Search by city..."
                />
                {citySearch && !planContacts.length && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 4, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                    {allCities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 10).map((city) => (
                      <button key={city} type="button" className="tool-btn" style={{ width: '100%', textAlign: 'left' }} onClick={() => setCitySearch(city)}>
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <FilterControls>
              <FilterSelect value={relationshipFilter} onChange={(e) => setRelationshipFilter(e.target.value)}>
                <option value="">Relationship</option>
                <option value="Growing">Growing</option>
                <option value="Stable">Stable</option>
                <option value="Declining">Declining</option>
              </FilterSelect>
              <FilterSelect value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                <option value="">Company</option>
                {companies.map((co) => <option key={co.id} value={co.name}>{co.name}</option>)}
              </FilterSelect>
              <FilterSelect value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                <option value="">Tag</option>
                {tags.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </FilterSelect>
            </FilterControls>
          </FilterBar>

          {planContacts.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#6b7280' }}>{planContacts.length} contacts found in "{citySearch}"</p>
                <button
                  className="primary"
                  disabled={Object.values(selectedContacts).filter(Boolean).length === 0}
                  onClick={handleCreateVisitPlan}
                >
                  Create Visit Plan ({Object.values(selectedContacts).filter(Boolean).length} selected)
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {planContacts.map((contact) => (
                  <div key={contact.id} style={{
                    border: '1px solid #e5e7eb', borderRadius: 10, padding: 12,
                    background: selectedContacts[contact.id] ? '#f0f9ff' : '#fff',
                    display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
                  }} onClick={() => setSelectedContacts((p) => ({ ...p, [contact.id]: !p[contact.id] }))}>
                    <input type="checkbox" checked={Boolean(selectedContacts[contact.id])} readOnly />
                    <img src={avatarSrc(contact)} alt={contact.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 14 }}>{contact.name}</strong>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{contact.role} · {contact.company}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                        Last: {contact.lastInteracted} · Score: {contact.relationshipScore}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {citySearch && planContacts.length === 0 && (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>No contacts found in "{citySearch}". Try another city.</p>
          )}

          {!citySearch && (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 48, fontSize: 14 }}>
              <Icon name="globe" className="icon" />
              <p style={{ marginTop: 8 }}>Search for a city to find contacts and plan your visit.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                {allCities.slice(0, 8).map((city) => (
                  <button key={city} className="tool-btn" onClick={() => setCitySearch(city)}>{city}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Visit History' && (
        <div style={{ padding: '0 16px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Trip Planning Lists</h3>
          {visitHistory.tripLists.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13 }}>No trip plans created yet. Go to "Plan a Visit" to create one.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
              {visitHistory.tripLists.map((list) => (
                <div key={list.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div className={`list-avatar-v2 ${list.color}`} style={{ width: 36, height: 36, fontSize: 12 }}>{list.initials}</div>
                    <div>
                      <strong style={{ fontSize: 14 }}>{list.name}</strong>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{list.memberIds?.length || 0} contacts</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>Created: {list.createdAt}</p>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Visit Touchpoints</h3>
          {visitHistory.visitTouchpoints.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13 }}>No visit touchpoints recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visitHistory.visitTouchpoints.slice(0, 20).map((tp) => (
                <div key={tp.id} style={{ display: 'flex', gap: 12, padding: '10px 12px', border: '1px solid #f3f4f6', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>{tp.completedAt ? new Date(tp.completedAt).toLocaleDateString() : 'Pending'}</span>
                  <strong>{tp.contactName}</strong>
                  <span style={{ color: '#6b7280' }}>{tp.title}</span>
                  {tp.visitStage && <span style={{ padding: '1px 8px', borderRadius: 8, background: '#fef3c7', fontSize: 11 }}>{tp.visitStage}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Nearby Contacts' && (
        <div style={{ padding: '0 16px' }}>
          <FilterBar className="mb-4">
            <SearchBar value={nearbyCity} onChange={setNearbyCity} placeholder="Search city..." />
          </FilterBar>

          {nearbyCity && nearbyContacts.length > 0 && (
            <>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{nearbyContacts.length} contacts in "{nearbyCity}" — sorted by relationship score</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nearbyContacts.map((contact) => (
                  <div key={contact.id} style={{ display: 'flex', gap: 12, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, alignItems: 'center' }}>
                    <img src={avatarSrc(contact)} alt={contact.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 14 }}>{contact.name}</strong>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{contact.role} · {contact.company}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Score: {contact.relationshipScore}</p>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Last: {contact.lastInteracted}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {nearbyCity && nearbyContacts.length === 0 && (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>No contacts found in "{nearbyCity}".</p>
          )}

          {!nearbyCity && (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 48, fontSize: 14 }}>
              <p>Search for a city to find nearby contacts sorted by relationship strength.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                {allCities.slice(0, 8).map((city) => (
                  <button key={city} className="tool-btn" onClick={() => setNearbyCity(city)}>{city}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
