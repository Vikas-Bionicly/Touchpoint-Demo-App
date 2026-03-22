# Blakes Touchpoints App — Requirements Catalog

**Source:** V3.1 (March 18, 2026) as source of truth, with V3.0 (March 17, 2026) delta noted
**Purpose:** Comprehensive feature/functionality inventory for prototype validation against existing app and second app

---

## How to Use This Document

- **V3.1 Status** column flags what changed from V3.0: `Unchanged`, `New in V3.1`, `Modified in V3.1`
- **Prototype**, **Existing App**, and **Other App** columns are blank — to be filled in the comparison phase
- Requirements are organized by functional area, not by document section, so we can evaluate coverage holistically
- Each requirement has a unique ID for traceability

---

## 1. My Touchpoints / Insight Feed

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| MT-01 | AI-curated insight feed as primary landing page | P0 | Unchanged | ✅ Done | | |
| MT-02 | Insight cards with: type badge, practice/industry tags, actionable headline, contact card (photo, name, title, company, relationship strength), last interaction summary (days since contact), company insights, suggested next action, quick action buttons | P0 | Unchanged | ✅ Done | | |
| MT-03 | Last interaction summary includes both relationship interactions (Introhive) AND marketing/BD activities (Vuture: event attendance, bulletin distribution) AND manually logged activities (awards, trip invitations, pro bono, suite/ticket access) | P0 | Unchanged | ⚠️ Partial — last interaction shown but sourced from mock data only, no Introhive/Vuture/manual source attribution | | |
| MT-04 | Company-level insights on cards: RFPs/opportunities, news events, leadership changes, M&A activity, regulatory developments | P0 | Unchanged | ⚠️ Partial — company insights generated from engagement metrics; no real RFP/news/leadership/M&A/regulatory data | | |
| MT-05 | Quick actions menu (hamburger) on each insight card: Add Note, Add Tag, Dismiss, Like, Set Reminder | P0 | Unchanged | ✅ Done | | |
| MT-06 | Firm Connections modal ("Who Knows Whom") from insight card: firm connection strength, individual colleague relationships (names, roles, strength, last interaction), action icons for introduction requests, alumni flag | P0 | Unchanged | ⚠️ Partial — modal works with connections, strength, intro request; no alumni flag | | |
| MT-07 | Add Touchpoint Task directly from insight card (subject, description/note, due date) | P0 | Unchanged | ✅ Done | | |
| MT-08 | Recent Interactions modal: engagement history with date, type, summary; user and firm-wide interactions; marketing/BD activity history | P0 | Unchanged | ⚠️ Partial — recent interactions shown on contact detail; no separate modal with firm-wide or marketing/BD history | | |
| MT-09 | Unified taxonomy for practice/industry tags across source systems (Aderant practice codes, website categories, marketing mailing lists); applies to touchpoints, insights, contacts, accounts, matters | P0 | Unchanged | ⚠️ Partial — tag system exists and is shared across modules, but not mapped to real source system taxonomies | | |
| MT-10 | Sub-navigation: Key Contacts, Referrals, Visits | P0 | Unchanged | ❌ Missing — insight feed has no sub-navigation for Key Contacts, Referrals, Visits | | |

---

## 2. Contacts Module

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| CO-01 | Contact card: photo, name, title, company, alumni flag (prominent), VIP indicator | P0 | Unchanged | ⚠️ Partial — photo, name, title, company present; no alumni flag or VIP indicator | | |
| CO-02 | Relationship strength indicator (visual bars) | P0 | Unchanged | ✅ Done | | |
| CO-03 | Last interaction summary with days since contact | P0 | Unchanged | ✅ Done | | |
| CO-04 | Relationship status display (Good, Fading, Cold) | P0 | Unchanged | ✅ Done | | |
| CO-05 | Quick action icons on each contact | P0 | Unchanged | ✅ Done | | |
| CO-06 | Sub-tabs: My Contacts, Firm Contacts, Key Contacts | P0 | Unchanged | ❌ Missing — single flat contact list, no sub-tabs | | |
| CO-07 | VIP/Key Contact tagging and filtering (supports focused set of 10–30 priority relationships) | P0 | Unchanged | ❌ Missing | | |
| CO-08 | Add Note modal with note types: General, Meeting Notes, Client Preferences, Relationship Context, Special Dates, Personal Interests | P0 | Unchanged | ✅ Done | | |
| CO-09 | Note visibility controls: Private, Shared (specific colleagues), Firm-wide | P0 | Unchanged | ✅ Done | | |
| CO-10 | AI-assisted note summarization (digest of key information across multiple notes) | P1 | Unchanged | ❌ Missing | | |
| CO-11 | Add to List modal: search existing lists, multi-select, list details (member count, last engagement) | P0 | Unchanged | ✅ Done | | |
| CO-12 | Add Touchpoint Task from contacts context with AI pre-population (suggested follow-up type, recommended content, upcoming event flags) | P0 | Unchanged | ⚠️ Partial — touchpoint creation works but no AI pre-population | | |
| CO-13 | Firm Connections view (expanded "Who Knows Whom" from contact): strongest connections, coordination to avoid duplication, relationship network, manual relationship notes | P1 | Unchanged | ✅ Done | | |
| CO-14 | Advanced filtering: type (Insight, Contact, Company, Key Contact, Key Client, Target, Location), tags (practice areas, industries, custom), Save View | P0 | Unchanged | ⚠️ Partial — has text, city, region, relationship, list, tag filters + Save View; missing type filters (Key Contact, Key Client, Target, Location) | | |
| CO-15 | Ability to see if a contact already appears in a colleague's list | P1 | Unchanged | ❌ Missing | | |
| CO-16 | Relationship visibility scoped to user's persona/tier | P0 | Unchanged | ✅ Done — Partner vs BD role switching | | |

---

## 3. Companies Module

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| CM-01 | Company list: logo, name, industry classification, recent engagement summary, client status (Good, At Risk, etc.), quick action icons | P0 | Unchanged | ✅ Done | | |
| CM-02 | Sub-tabs: My Clients, Firm Clients, Prospective Clients | P0 | Unchanged | ❌ Missing — single flat company list, no sub-tabs | | |
| CM-03 | Company Details — Overview: header (name, industry, engagement summary, status), details section (Industry, Sector, Company Type, Cat Code, Client Code, GICs 1-3, Relationship Lawyer(s), Billing Lawyer(s)), company news feed, contact info, navigation tabs | P0 | Unchanged | ⚠️ Partial — header, industry, engagement, status present; missing detailed fields (Cat Code, Client Code, GICs, Billing Lawyer), no company news feed | | |
| CM-04 | Company Details — Client Health: Relationship Trend (Growing/Stable/Declining), Engagement Trend, Matters Trend, Active Timekeepers count, status indicators, Revenue Trend Chart | P1 | Unchanged | ⚠️ Partial — health panel with charts exists; relationship trend shown; missing Active Timekeepers count | | |
| CM-05 | Client Health MVP: Relationship Engagement Score sourced exclusively from Introhive interaction data (emails, meetings, calendar detections) — directional indicators only (Growing/Stable/Declining) | P1 | **New in V3.1** | ⚠️ Partial — directional indicators shown (Growing/Stable/Declining) from mock metrics, not Introhive | | |
| CM-06 | Client Health Future: Comprehensive Client Health Score adding digital engagement (Vuture), financial weighting (Aderant), marketing activity (InterAction) | Phase 2 | **New in V3.1** | ❌ Phase 2 | | |
| CM-07 | Company Details — Engagement: interaction timeline with attribution (who, what, when, importance), recent engagement table, all touchpoints (individual + bundled activities), filters (internal personnel, client job level, interaction type, event type, relationship strength), marketing/BD activities | P1 | Unchanged | ⚠️ Partial — engagement section with type and person filters; missing client job level, event type, relationship strength filters; no marketing/BD activity breakdown | | |
| CM-08 | Company Details — Matters: matter list (Open Date, Status, Matter Name, Practice Area), click-through to lead lawyers, matter rank, realization rate, financial charts (revenue trend, billable hours trend, realization rate trends), WIP surface, company hierarchy drill-down (parent → subsidiaries) | P1 | Unchanged | ⚠️ Partial — matter table and trend charts exist; missing click-through to lead lawyers, matter rank, WIP surface, hierarchy drill-down | | |
| CM-09 | Company Details — Opportunities (Future): opportunity list (Date, Status, Name, Type), activity charts, pipeline tracking, win/loss analysis | Phase 2 | Unchanged | ⚠️ Partial — opportunity table and BD activity charts present; no pipeline tracking or win/loss analysis | | |
| CM-10 | Company Details — Opportunity Identification: share of revenue by practice (pie chart), revenue indicator across practice and office (visual matrix, traffic light/sparklines), geographic gap identification | P2 | Unchanged | ⚠️ Partial — practice share pie chart and revenue-by-practice-office matrix exist; no geographic gap identification | | |
| CM-11 | Company Details — CI Reports tab (embedded analytics) | P2 | Unchanged | ❌ Missing | | |
| CM-12 | Account-level dashboard adaptable to individual lawyer's perspective (not just firm-wide view) | P1 | Unchanged | ⚠️ Partial — Partner vs BD role shows different data scopes, but not per-lawyer perspective | | |

---

## 4. Lists Module

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| LI-01 | List overview: name, icon/color coding, member count, last engagement date, owner, primary tag, visibility indicator (Private/Shared/Firm-wide), action icons | P0 | Unchanged | ✅ Done | | |
| LI-02 | List types: Practice-based, Initiative-based, Event-based, Referral contacts, Personal | P0 | Unchanged | ⚠️ Partial — lists exist with different purposes but no explicit type categorization UI | | |
| LI-03 | List visibility: private, shared with specific users, shared with practice group, firm-wide | P0 | Unchanged | ⚠️ Partial — visibility field exists; no sharing with specific users or practice groups | | |
| LI-04 | List creation/management by lawyers, BD professionals, or assistants | P0 | Unchanged | ❌ Missing — no list creation UI | | |
| LI-05 | Marketing activity surfacing within list view (RSVPs, attendance, engagement from contacts) | P1 | Unchanged | ❌ Missing | | |
| LI-06 | List detail view: header, metadata (owner, date created, type), member table (contact with photo/title, status, summary notes, action icons), notes section | P0 | Unchanged | ✅ Done | | |
| LI-07 | Event-based lists pull through from existing marketing event lists | P1 | Unchanged | ❌ Missing | | |

---

## 5. Touchpoints Module

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| TP-01 | Touchpoints list: date, contact (photo, title, company), interaction summary with last interaction date and relationship status | P0 | Unchanged | ✅ Done | | |
| TP-02 | Sub-tabs: My Touchpoints, Missed Touchpoints (overdue items) | P0 | Unchanged | ✅ Done | | |
| TP-03 | Touchpoint detail view: header (contact info, relationship status, interaction summary, days since contact), metadata (Principal, Date, Type: Email/Meeting/Call/Event), next steps (action workflow), notes section (chronological) | P1 | Unchanged | ⚠️ Partial — detail modal has contact info, metadata, notes; missing Principal field and action workflow for next steps | | |
| TP-04 | Principal assignment manageable by BD | P1 | Unchanged | ❌ Missing | | |
| TP-05 | BD can assign tasks to lawyers from touchpoint detail view | P1 | Unchanged | ❌ Missing | | |
| TP-06 | Touchpoint lifecycle: create, track, complete, reschedule, cancel | P0 | Unchanged | ✅ Done | | |
| TP-07 | Touchpoint sync consideration with ERM (Introhive) to avoid duplicate data entry | P1 | Unchanged | ❌ N/A for prototype | | |

---

## 6. Search & Navigation

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| SN-01 | Left sidebar navigation with hierarchy: My Touchpoints, Contacts, Companies, Lists, Touchpoints (each with sub-nav) | P0 | Unchanged | ✅ Done | | |
| SN-02 | Multi-criteria search: free-text across Contact name, Company name, associated fields | P0 | Unchanged | ✅ Done | | |
| SN-03 | Search performance: results within 2 seconds for up to 10,000 records | P0 | Unchanged | N/A — mock data, no performance benchmark | | |
| SN-04 | Filters: Tags, Lists, Industry, Geography, Relationship Strength, City/Location | P0 | Unchanged | ⚠️ Partial — has Tags, Lists, City, Relationship Status; missing Industry and Geography (region) as standalone filters | | |
| SN-05 | AND logic for combined filters | P0 | Unchanged | ✅ Done — filters combine with AND logic | | |
| SN-06 | Filter state persists during session (survives page navigation) | P0 | Unchanged | ✅ Done — persisted in localStorage | | |
| SN-07 | Results display: card or list view (user preference) | P0 | Unchanged | ✅ Done | | |
| SN-08 | Location-based search (city/region) for trip planning | P0 | Unchanged | ⚠️ Partial — city filter exists; no trip planning integration | | |
| SN-09 | Location filter integrates with other criteria; results can be added to trip planning list directly | P0 | Unchanged | ❌ Missing — no trip planning list workflow | | |
| SN-10 | Saved Views: save filter state with custom name, dropdown access, edit/delete, private by default | P0 | Unchanged | ✅ Done | | |

---

## 7. Quick Actions (Cross-Module)

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| QA-01 | Add Activity | P0 | Unchanged | ✅ Done — Log Interaction modal | | |
| QA-02 | Add Note (Private, Public, Client Preferences) | P0 | Unchanged | ✅ Done | | |
| QA-03 | Add to List | P0 | Unchanged | ✅ Done | | |
| QA-04 | Add Tag | P0 | Unchanged | ✅ Done | | |
| QA-05 | Add Contact | P0 | Unchanged | ❌ Missing — no create contact form | | |
| QA-06 | Add Company | P0 | Unchanged | ❌ Missing — no create company form | | |
| QA-07 | Add Opportunity | P0 | Unchanged | ❌ Missing — no create opportunity form | | |
| QA-08 | Update Contact | P0 | Unchanged | ❌ Missing — no edit contact form | | |
| QA-09 | Update Company | P0 | Unchanged | ❌ Missing — no edit company form | | |
| QA-10 | Mark as Key Contact | P0 | Unchanged | ❌ Missing — no VIP/Key Contact functionality | | |
| QA-11 | Dismiss | P0 | Unchanged | ✅ Done | | |
| QA-12 | Like (for system learning) | P0 | Unchanged | ✅ Done | | |
| QA-13 | Set Reminder | P0 | Unchanged | ✅ Done — creates touchpoint task | | |

---

## 8. Insight Types & AI Engine

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| AI-01 | Fading Relationship Alert (statistical baseline/control chart approach rather than fixed days) | P0 | **Modified in V3.1** — added activity weighting hierarchy and statistical threshold design note | ⚠️ Partial — fading alert exists (>90 days threshold), uses fixed days not statistical baseline | | |
| AI-02 | Activity weighting hierarchy: (1) In-person/visit = highest, (2) 1:1 call/video = high, (3) Personal email/DM = medium, (4) Mass marketing email = near-zero, (5) Event invite with no RSVP = zero | P0 | **New in V3.1** | ❌ Missing — no activity weighting | | |
| AI-03 | New Role/Promotion Alert | P1 | Unchanged | ❌ Missing | | |
| AI-04 | Company News Alert (including RFPs and opportunities) | P1 | Unchanged | ❌ Missing | | |
| AI-05 | Cross-Sell Opportunity | P2 | Unchanged | ⚠️ Partial — "Untapped Practice Opportunity" insight exists as basic version | | |
| AI-06 | Meeting Preparation insight (calendar-triggered) | P0 | Unchanged | ❌ Missing | | |
| AI-07 | Introduction Opportunity ("Who Knows Whom" triggered) | P1 | Unchanged | ⚠️ Partial — "Internal Connection" insight type exists | | |
| AI-08 | Team Coordination Alert (multiple lawyers → same contact) | P1 | Unchanged | ❌ Missing | | |
| AI-09 | Digital Engagement badge | P0 | Unchanged | ❌ Missing — no badge system | | |
| AI-10 | Pertinent Content badge | P0 | Unchanged | ❌ Missing | | |
| AI-11 | Event Match badge | P0 | Unchanged | ❌ Missing | | |
| AI-12 | Visit Touchpoint badge | P1 | Unchanged | ❌ Missing | | |
| AI-13 | Birthday / Special Event badge | P1 | Unchanged | ❌ Missing | | |
| AI-14 | Job Change badge | P1 | Unchanged | ❌ Missing | | |
| AI-15 | Misalignment Alert (relationship vs financial trend divergence) | P2 | Unchanged | ❌ Missing | | |
| AI-16 | AI-assisted draft outreach messages and surface relevant news/talking points per contact | P1 | Unchanged | ❌ Missing | | |
| AI-17 | AI summarizes meeting preparation context and highlights relevant talking points | P1 | Unchanged | ❌ Missing | | |

---

## 9. User Personas & Access Control

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| AC-01 | BD SuperUser persona — Tier 3 (full financial and relationship visibility, firm-wide) | P0 | Unchanged | ⚠️ Partial — BD role shows full data, but no formal tier system | | |
| AC-02 | BD Standard persona — Tier 2 (scoped to assigned accounts and sectors) | P0 | Unchanged | ❌ Missing — only Partner and BD roles exist | | |
| AC-03 | Legal Assistant persona — Tier 1 (scoped to assigned lawyers' contacts) | P0 | Unchanged | ❌ Missing | | |
| AC-04 | Equity Partner persona — Tier 3 for own accounts (as BL), Tier 2 otherwise | P0 | Unchanged | ⚠️ Partial — Partner role exists with reduced visibility, but no BL-specific Tier 3 | | |
| AC-05 | Non-Equity Partner persona — Tier 2 | P0 | Unchanged | ❌ Missing | | |
| AC-06 | Associate persona — Tier 1, with Group Lead approval for Tier 2 upgrade | P0 | Unchanged | ❌ Missing | | |
| AC-07 | Billing Lawyer persona — Tier 3 for BL accounts, Tier 2 otherwise | P0 | Unchanged | ❌ Missing | | |
| AC-08 | Group Lead persona — Tier 3 for their practice group, plus group-level analytics | P0 | Unchanged | ❌ Missing | | |
| AC-09 | BD White Glove support workflows (PLACEHOLDER — pending Gary's use cases) | TBD | Unchanged | ❌ TBD | | |

---

## 10. Data Transparency Framework

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| DT-01 | Tier 1 (Baseline): aggregate counts, general indicators, relationship counts, last interaction date only, high-level matter counts | P0 | Unchanged | ⚠️ Partial — Partner role shows reduced data but not formally Tier 1 scoped | | |
| DT-02 | Tier 2 (Abstract): names, trend direction, revenue ranges (not exact), activity summaries | P0 | Unchanged | ⚠️ Partial — Partner sees revenue ranges vs BD exact values; trend directions shown | | |
| DT-03 | Tier 3 (Full): exact revenue, detailed billing hours, full relationship histories, realization rates, matter-level financials | P0 | Unchanged | ⚠️ Partial — BD role shows full data including revenue, matters, histories | | |
| DT-04 | Tier 1 Who Knows Whom: colleague names only (who at firm has a connection) | P0 | **Modified in V3.1** — V3.0 showed "—" (not available); V3.1 grants colleague names at Tier 1 | ⚠️ Partial — Firm Connections modal shows names for all roles; no tier-based scoping of detail | | |
| DT-05 | Relationship Data visibility matrix (full table per Section 3.2) | P0 | Unchanged | ❌ Missing — no formal visibility matrix implementation | | |
| DT-06 | Financial Data visibility matrix using Iridium field names (full table per Section 3.2) | P0 | Unchanged | ❌ Missing | | |
| DT-07 | Row-level security based on user role and transparency tier | P0 | Unchanged | ⚠️ Partial — role-based UI toggling exists but no real row-level security | | |
| DT-08 | **No Ghosted Fields rule**: never display locked/greyed-out data fields to users at lower tiers; if data point not available at user's tier, field and label should not appear | P0 | **New in V3.1** | ⚠️ Partial — Partner view hides some data and shows "+more (BD view)"; should fully omit fields instead | | |
| DT-09 | BD Access Gap: BD has no Iridium access today; Touchpoints is their first structured financial data access | P0 | Unchanged | N/A — design consideration, not UI feature | | |

---

## 11. Behavioral Requirements (Lawyer, Assistant, BD)

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| BH-01 | Lawyers: reach out to priority contacts before relationships go cold (10–30 key relationships) | P0 | Unchanged | ⚠️ Partial — fading alerts exist but no Key Contact filtering for focused set | | |
| BH-02 | Lawyers: come prepared to every client meeting with full context (meeting preparation view) | P0 | Unchanged | ❌ Missing — no meeting preparation view | | |
| BH-03 | Lawyers: leverage firm-wide connections for warm introductions (introduction request workflow) | P1 | Unchanged | ✅ Done — Firm Connections modal with intro request | | |
| BH-04 | Lawyers: follow through on planned outreach with accountability (touchpoint tasks, missed touchpoints) | P0 | Unchanged | ✅ Done | | |
| BH-05 | Lawyers: coordinate outreach across client team to prevent duplication (team coordination alerts, shared lists) | P1 | Unchanged | ⚠️ Partial — shared lists exist; no team coordination alerts | | |
| BH-06 | Lawyers: ensure key clients consistently receive firm value-added services (engagement history, gap visibility) | P1 | Unchanged | ⚠️ Partial — engagement history exists; gap visibility limited | | |
| BH-07 | Lawyers: identify cross-sell opportunities (opportunity identification, practice mix visualization) — Phase 2 | P2 | Unchanged | ⚠️ Partial — practice share visualization exists | | |
| BH-08 | Lawyers: track and cultivate referral sources and alumni relationships (alumni flag, referral lists, matter attribution) | P1 | Unchanged | ❌ Missing — no alumni flag, referral lists, or matter attribution | | |
| BH-09 | Assistants: log touchpoints and record outcomes on behalf of assigned lawyers (attributed to lawyer's profile) | P0 | Unchanged | ⚠️ Partial — Log Interaction exists but no on-behalf-of attribution | | |
| BH-10 | Assistants: maintain contact preferences, special dates, personal details (structured note types with automated reminders) | P0 | Unchanged | ⚠️ Partial — note types include Special Dates and Personal Interests; no automated reminders | | |
| BH-11 | Assistants: identify contacts for upcoming lawyer trips (location-based search → trip planning list) | P0 | Unchanged | ⚠️ Partial — city filter exists but no trip planning list workflow | | |
| BH-12 | Assistants: prepare meeting briefing materials (relationship history, touchpoints, company intelligence, matter context, AI summarization) | P1 | Unchanged | ❌ Missing — no meeting briefing feature | | |
| BH-13 | Assistants: coordinate client visit logistics and manage follow-up (visit touchpoint workflow: pre-visit, visit, post-visit) | P1 | Unchanged | ❌ Missing — no visit workflow | | |
| BH-14 | BD: assign touchpoint tasks to lawyers and track follow-through | P0 | Unchanged | ❌ Missing — no task assignment to lawyers | | |
| BH-15 | BD: manage marketing activities and track contact-level engagement | P1 | Unchanged | ❌ Missing | | |
| BH-16 | BD: coordinate cross-practice BD initiatives and identify coverage gaps | P2 | Unchanged | ❌ Missing | | |
| BH-17 | BD: maintain firm-wide shared contact lists and targeting lists | P0 | Unchanged | ⚠️ Partial — lists with visibility exist; no targeting list workflow | | |

---

## 12. Data Integration

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| DI-01 | Introhive (ERM): email activity tracking, calendar meeting detection, relationship strength scoring, contact data enrichment | P0 | Unchanged | N/A — prototype uses mock data | | |
| DI-02 | InterAction (CRM): contact/company master data, marketing lists/campaigns, event management, mailing preferences | P0 | Unchanged | N/A — prototype uses mock data | | |
| DI-03 | InterAction write-back: Touchpoints App → InterAction via API | P1 | Unchanged | N/A — no backend | | |
| DI-04 | Aderant: matter details, revenue/billing data, timekeeper assignments, practice area classification, parent/child hierarchy, industry code | P0 | Unchanged | N/A — prototype uses mock data | | |
| DI-05 | Vuture: email engagement, event attendance | P1 | Unchanged | N/A — prototype uses mock data | | |
| DI-06 | ChromeRiver: expense reports from trips and BD meetings | P2 | Unchanged | N/A — prototype uses mock data | | |
| DI-07 | HR System: lawyer profiles, practice groups | P0 | Unchanged | N/A — prototype uses mock data | | |
| DI-08 | All data flows through Microsoft Fabric data warehouse | P0 | Unchanged | N/A — no backend | | |
| DI-09 | Data model sync meeting required: Touchpoints requirements vs BDO/Microsoft Fabric schema (last week of March / first week of April 2026) | P0 | **New in V3.1** | N/A — process requirement | | |

---

## 13. Technical & Non-Functional Requirements

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| NF-01 | Page load time: < 3 seconds | P0 | Unchanged | N/A — mock data, instant load | | |
| NF-02 | Search results: < 2 seconds for up to 10,000 records | P0 | Unchanged | N/A — mock data | | |
| NF-03 | Insight feed refresh: < 1 second | P0 | Unchanged | N/A — mock data | | |
| NF-04 | Concurrent users: 500+ simultaneous | P0 | Unchanged | N/A — static prototype | | |
| NF-05 | Data sync: near real-time (< 15 min lag from source systems) | P0 | Unchanged | N/A — no backend | | |
| NF-06 | Azure AD authentication with SSO | P0 | Unchanged | N/A — no auth | | |
| NF-07 | Audit logging of all data access | P0 | Unchanged | N/A — no backend | | |
| NF-08 | Encryption at rest and in transit | P0 | Unchanged | N/A — GitHub Pages HTTPS only | | |
| NF-09 | Canadian data residency compliance | P0 | Unchanged | N/A — no real data | | |
| NF-10 | Responsive design (tablet and phone) | P0 | Unchanged | ✅ Done — mobile responsive sidebar, card/list layouts | | |
| NF-11 | Core functionality available offline | P1 | Unchanged | ⚠️ Partial — localStorage persistence, but no service worker/PWA | | |
| NF-12 | Push notifications for critical insights | P1 | Unchanged | ❌ Missing | | |
| NF-13 | Touch-optimized interface elements | P0 | Unchanged | ✅ Done — touch-friendly button sizes | | |
| NF-14 | Outlook Add-in for context-aware contact lookup | P1 | Unchanged | ❌ Missing | | |
| NF-15 | Teams integration for sharing insights | P1 | Unchanged | ❌ Missing | | |
| NF-16 | REST API for data warehouse connectivity | P0 | Unchanged | N/A — no backend | | |
| NF-17 | Configurable data tables: sorting, column customization, export | P1 | Unchanged | ✅ Done — sorting, column toggles, CSV export | | |

---

## 14. Embedded Analytics / Power BI

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| BI-01 | CI Dashboards (Power BI) embedded within Touchpoints app with same role-based access controls | P2 | Unchanged | ❌ Missing — Phase 2+ | | |
| BI-02 | Billing Lawyers: full WIP, AR, fee data in embedded view | P2 | Unchanged | ❌ Missing — Phase 2+ | | |
| BI-03 | Non-Billing Lawyers: revenue ranges and trend direction (Tier 2) | P2 | Unchanged | ❌ Missing — Phase 2+ | | |
| BI-04 | Practice Group Leaders: aggregate group-level dashboards | P2 | Unchanged | ❌ Missing — Phase 2+ | | |
| BI-05 | BD SuperUsers: firm-wide dashboards | P2 | Unchanged | ❌ Missing — Phase 2+ | | |
| BI-06 | Mobile: condensed key-metrics card with link to full dashboard on desktop | P2 | Unchanged | ❌ Missing — Phase 2+ | | |

---

## 15. Platform Scope & Design Rules

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| PL-01 | Touchpoints App = action-oriented (2-5 min sessions); CI Dashboards = analysis-oriented (15-30 min sessions) | P0 | Unchanged | ✅ Done — app is action-oriented with quick actions | | |
| PL-02 | Visits App remains separate system; integration is future consideration | N/A | Unchanged | N/A | | |
| PL-03 | Platform technology selection pending (purpose-built, custom dev, or low-code) | N/A | Unchanged | N/A — React/Vite prototype | | |
| PL-04 | **No Ghosted Fields**: never show locked/greyed-out data to lower-tier users — omit field and label entirely | P0 | **New in V3.1** | ⚠️ Partial — Partner view hides some sections but shows "+more (BD view)" hints | | |
| PL-05 | Phased rollout: Phase 1 (P0), Phase 2 (P1), Phase 3 (P2) | N/A | Unchanged | N/A | | |
| PL-06 | Pilot group: 10–20 equity partners across 2–3 practice groups, prioritizing those already active in BD with Introhive adoption | P0 | **New in V3.1** — V3.0 said "Identify pilot group for soft launch" with no specifics | N/A — process requirement | | |

---

## 16. Relationship Scoring Framework (Future / Appendix D)

| ID | Requirement | Priority | V3.1 Status | Prototype | Existing App | Other App |
|----|-------------|----------|-------------|-----------|-------------|-----------|
| RS-01 | Layer 1: Individual Relationship Strength Score (Recency, Frequency, Engagement Quality, Matter Involvement, Two-Way Engagement) — 1-5 scale | Future | Unchanged | ⚠️ Partial — relationship score computed from metrics but simplified formula | | |
| RS-02 | Layer 2: Strategic Importance Weighting (Client Status, Contact Role/Seniority, Revenue Contribution, Relationship Depth, Coverage Ratio) | Future | Unchanged | ❌ Missing — Future | | |
| RS-03 | Weighted Client Health Score formula: (Individual Score × Strategic Weight) / 5 | Future | Unchanged | ❌ Missing — Future | | |
| RS-04 | Dashboard display: Individual lawyers (strength + 1:1 risks), Practice Leaders (aggregated health + misalignment), Firm Leadership (portfolio metrics + concentration risk) | Future | Unchanged | ❌ Missing — Future | | |

---

## Summary: V3.0 → V3.1 Changes

| Change Type | Count | Key Items |
|-------------|-------|-----------|
| **New in V3.1** | 7 | Activity weighting hierarchy (AI-02), Two-track client health roadmap (CM-05, CM-06), No Ghosted Fields rule (DT-08/PL-04), Data model sync meeting dependency (DI-09), Detailed pilot group criteria (PL-06) |
| **Modified in V3.1** | 2 | Fading Relationship Alert now references statistical thresholds + activity weighting (AI-01), Tier 1 Who Knows Whom changed from "not available" to "colleague names only" (DT-04) |
| **Unchanged** | ~110+ | Bulk of requirements stable between versions |

---

## Next Steps

1. **Fill "Existing App" column** — map each requirement against the current system's capabilities
2. **Fill "Other App" column** — map against the second app already built
3. **Gap analysis** — identify requirements with no coverage in either comparison system
4. **Prototype validation** — confirm the prototype addresses all P0 requirements and key P1 items
