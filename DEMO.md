# Touchpoint Demo – Feature & Flow Guide

This document explains **what features exist in the demo** and **how they work in the UI**, module by module. It is meant to be a concise tour you can use when showing the app.

---

## 1. My Insights

**Goal:** Surface an AI‑style feed of relationship and BD insights with one‑click actions.

### 1.1 What you see

- Card list of insights (`My Insights` in the sidebar), each card showing:
  - **Type badge** (e.g. Fading Relationship, Untapped Opportunity, Engagement Trend).
  - **Tags** (practice / industry / opportunity).
  - **Title & description**.
  - **Subject** (contact or company).
  - **Meta rows** (recent interactions, relationship trend, client status, etc.).

### 1.2 Quick actions (three‑dots menu)

On each card, click the **three‑dots icon** (top‑right) to open a dropdown:

- **Set reminder**
  - Creates a follow‑up **touchpoint task** due ~3 days from now.
  - Uses the card’s subject and suggestion text.
  - Dismisses the insight from the feed.
- **Like / Liked**
  - Toggles a persisted “liked” state in `insightState`.
  - You can use this later to reason about which insights worked well.
- **Add note**
  - Resolves the subject to a **contact** (by name or company).
  - Opens the **Add Contact Note** modal with:
    - Note type (General, Meeting Notes, Client Preferences, etc.).
    - Visibility (Private, Shared, Firm‑wide).
    - Optional “Share with” field and text area.
  - Saves a contact‑level note that appears in the Contact detail screen.
- **Add tag**
  - Resolves the subject to a contact.
  - Opens the **Manage Contact Tags** modal for that contact.
  - Lets you add/remove tags from the shared tag taxonomy.
- **Share content**
  - Opens **Create Touchpoint** prefilled as a “share content” task:
    - Target contact/company from the card.
    - Title like “Share content with [Name]”.
    - Notes from the card suggestion.
- **Dismiss**
  - Marks the insight as dismissed in `insightState`.
  - Card disappears until the store is reset.

### 1.3 Create Touchpoint from an insight

Each card has:

- A **primary CTA button** in the suggestion area.
- A **target icon** in the client row.

Both:

- Open the **Create Touchpoint** modal.
- Pre‑fill:
  - `contactName`, `company`, `role` (best guess from contacts/companies).
  - `title` and `notes` from the insight’s title/suggestion.
- On submit, create a **new touchpoint task** that appears in **Touchpoints** and, if overdue, in **Missed Touchpoints**.

### 1.4 Firm connections from an insight

- In the card’s actions row, click the **Firm Connections** icon (Font Awesome user‑friends).
- This opens the shared **FirmConnectionsModal** for the subject contact:
  - Shows colleagues who know this person.
  - Connection type, strength, and last interaction for each colleague.
  - **Request intro** button:
    - Creates a touchpoint task like “Request intro from [Colleague] to [Contact]”.

---

## 2. Contacts

**Goal:** Manage individual relationships and their notes, tags, lists and follow‑ups.

### 2.1 Table & basic usage

- Open **`Contacts`** from the sidebar.
- Table columns:
  - Name (with avatar + signal icon).
  - Role.
  - Company.
  - Last interaction text.
  - Relationship status (Good / Fading / Cold).

### 2.2 Searching & filtering

- **Search bar**:
  - Filters across name, role, company, last interaction and relationship text.
- **Filters**:
  - Relationship dropdown (All / Good / Fading / Cold).
  - List dropdown (restrict to members of a selected list from the Lists module).
  - Tag dropdown (filter contacts by any assigned tag).

### 2.3 Saved Views (Advanced Search & Views)

- Configure search + filters.
- Click **Save View**, give it a name.
- Use the **Views** dropdown to:
  - **Apply** a saved view.
  - **Delete** a view (special “Delete: [name]” entries).
- Views are scoped to **Contacts** and persisted in `savedViews`.

### 2.4 Column configuration (header settings)

- Click the **settings cog** in the Contacts table header.
- Options are hierarchical:
  - Parent: **Name**
    - Children: Role, Company.
  - Parent: **Last interaction | Relationship status**
    - Children: Last interaction, Relationship status.
- Behavior:
  - Turning a **parent** off hides that entire logical column.
  - Turning **children** off hides only that child field.
  - Guard rails:
    - At least one parent must remain visible.
    - Within the last parent, at least one child must remain visible.

### 2.5 Row actions & Contact detail

- Row actions (right side of each contact):
  - **New touchpoint** (docPlus) → opens **Create Touchpoint** prefilled with that contact.
  - **Relationship** (target) → reserved, not wired yet.
  - **More** (listPlus) → opens **Add Contact Note** for that contact.
- Opening detail:
  - Click anywhere else in the row.
  - Detail shows:
    - Role, company.
    - Relationship strength & score.
    - Internal connections.
    - Relationship history & recent interactions.
    - Contact notes (type + visibility + text).
  - Footer/actions in detail:
    - **Add note**: Notes with Visibility modal.
    - **Add to list**: Add Contact To List modal.
    - **Create touchpoint**: prefilled Create Touchpoint modal.
    - **Firm connections**: FirmConnectionsModal with Request Intro CTA.

---

## 3. Companies

**Goal:** Manage client accounts at the company level – health, engagement, matters, and opportunities.

### 3.1 Companies table

- Open **`Companies`** from the sidebar.
- Table columns:
  - Logo + name.
  - Categories (industry/sector).
  - Recent engagement headline + recency.
  - Client status.
- Per‑row actions:
  - **New touchpoint** → Create Touchpoint for a guessed primary contact.
  - **Relationship** → reserved.
  - **Analytics** → reserved.

### 3.2 Filtering & Saved Views

- Search box:
  - Filters across name, categories, engagement title, recency text, client status.
- Filters:
  - Relationship trend: Growing / Stable / Declining.
  - Tag: company-level tags from the shared taxonomy.
- Saved Views:
  - Save current filters via **Save View**.
  - Apply a view via the **Views** dropdown (only views with `scope: 'companies'`).

### 3.3 Column configuration

- Header settings cog:
  - Parent: **Name**
    - Child: Categories.
  - Parent: **Recent Engagement**
    - Children: Recent engagement, Client status.
- Ensures you never blank the engagement column completely.

### 3.4 Company Detail page

Open by clicking a row:

- Header:
  - Back button to return to Companies.
  - Company logo, name, categories.
  - Actions:
    - **Add note** (company-level Notes with Visibility).
    - **Firm connections** (guessed primary contact + FirmConnectionsModal).
    - **Manage tags** (Assign/remove tags for this company).
    - **Create touchpoint** (guessed contact).

- Summary strip:
  - Client status.
  - Recent engagement.
  - Client revenue:
    - **Partner role**: shows revenue as a **range** label.
    - **BD role**: shows exact revenue string.
  - Relationship trend + score.
  - Company hierarchy (parent/subs).

- Relationship / Connections / Interactions columns:
  - Each column lists:
    - Relationship history.
    - Key internal connections.
    - Recent interactions.
  - **Partner role**:
    - Only top 2 items per list + “+ more…” hint when additional entries exist.
  - **BD role**:
    - Shows full lists.

- Company notes:
  - Shows notes from `companyNotes` with:
    - Type, visibility, created date, and text.
  - “Add note” opens AddCompanyNote modal with same types/visibility as contact notes.

### 3.5 Engagement, Matters, Opportunities & Analytics

- **Engagement** section:
  - Table combining:
    - Seeded `recentInteractions` strings, parsed into Date/Type/Contact/Summary.
    - Touchpoints whose `company` matches this company.
  - Filters:
    - Type (All/Email/Meeting/Call/Event/Other).
    - Internal person (All/You).

- **Matters** section:
  - **BD role**:
    - Full table: Open date, Status, Matter name, Practice area.
  - **Partner role**:
    - Summary text: total matters count and number active.

- **Opportunities pipeline** section:
  - **BD role**:
    - Full table: Date, Status (Pending/Won/Lost), Name, Type (Pitch/RFP/Panel).
  - **Partner role**:
    - Summary text: total opportunities count, pending count, won count.

- **Analytics panels**:
  - Client Health:
    - Revenue trend (Area chart).
    - Practice mix (Pie chart).
  - Opportunity Identification:
    - Practice x office revenue matrix (heatmap-style table).
  - Matters & Opportunities trends:
    - Revenue, hours, realization by year (Matters).
    - BD vs total activities by period (Opportunities).

---

## 4. Lists

**Goal:** Group contacts into reusable lists for campaigns, events, trip planning, targeting.

### 4.1 Lists overview

- Open **`Lists`** from sidebar.
- Columns:
  - List name + avatar.
  - Owner.
  - Tag (e.g. Event, Privacy & Security).
  - Visibility (Firm-wide, Shared, Personal).
  - Actions (relationship / more) reserved for future work.

### 4.2 Tag & role-based filtering

- Search box:
  - Filters across name, owner, tag, last engagement.
- **Tag filter**:
  - Dropdown of all tags from shared taxonomy.
  - Filters Lists by their primary tag (label).
- **Role behavior**:
  - **Partner**:
    - Sees only Firm-wide + Shared lists.
    - Personal lists hidden.
  - **BD**:
    - Sees all lists, including Personal.

### 4.3 Header config

- Settings cog:
  - Toggles columns: Name, Owner, Tag, Visibility.
  - Enforces at least one column visible at all times.

### 4.4 List Detail view

- Open by clicking a list row.
- Header:
  - Back to Lists.
  - Avatar + name.
  - Member count and last engagement.
  - Primary tag and visibility.
- Summary:
  - List owner.
  - List type (Practice-based, Event-based, Initiative-based, etc.).
  - Date created.
- Members:
  - For each `memberId`:
    - Contact initials avatar, name, title, company.
    - **Status** derived from touchpoints:
      - Attended / Confirmed / Invited.
    - Summary placeholder.
    - Actions:
      - Open contact (user icon).
      - Add touchpoint (docPlus icon).
- List notes:
  - Notes stored in `listNotes` with author, date, and text.
  - “Add note” text area + button calls `addListNote`.

---

## 5. Touchpoints

**Goal:** Central place to track all interactions and planned follow‑ups.

### 5.1 Main view vs Missed Touchpoints

- Open **`Touchpoints`** from sidebar.
- Sub-navigation:
  - **My Touchpoints**: all open + completed items.
  - **Missed Touchpoints**: only overdue open tasks (based on dueAt and status).

### 5.2 Summary strip (My Touchpoints view)

At the top of the main Touchpoints view:

- **Open**: number of tasks with `status === 'open'`.
- **Overdue**: open tasks whose `dueAt` is in the past.
- **Completed this month**: tasks with `status === 'completed'` whose `completedAt` falls in the current month.
- Status text:
  - “No overdue touchpoints”
  - “Light overdue load”
  - “High overdue load”

### 5.3 Search, Tag filter & CSV

- **Search**:
  - Filters across contact name, role, company, title, last interacted, relationship status, date label, interaction type, outcome, and status.
- **Tag filter**:
  - Dropdown of all tags.
  - Filters touchpoints whose **subject contact** has that tag.
- **Export CSV**:
  - Respects current filters and visible columns.

### 5.4 Header configuration

- Settings cog.
- Parent groups:
  - **Contact**.
  - **Interaction**.
  - **Status | Relationship** (with children **Status**, **Relationship status**).
- Guard rails:
  - At least one parent group stays visible.
  - Within Status | Relationship, at least one child remains when it’s the last visible parent.

### 5.5 Rows & Detail

- **Row layout**:
  - Checkbox cell.
  - Date cell:
    - Due date (for tasks) or completed date (for interactions).
    - **Overdue** pill for overdue open tasks.
  - Contact column:
    - Avatar, name, signal icon, role, company.
    - Tag chips for up to two contact tags.
  - Interaction/Status column:
    - `[interactionType] title`.
    - Status chip: Open / Completed / Cancelled (colored pills).
    - Relationship pill: “Relationship [Status]”.

- **Detail modal (click a row)**:
  - Top area:
    - Contact avatar, name, role, company.
    - Status and Relationship sections.
  - Grid:
    - Interaction type, status, outcome.
    - Due or Completed date.
    - Relationship progress (status + score).
  - Stack:
    - Next steps (explanatory text).
    - Interaction history list (from `history` array).
    - Notes:
      - Original note text from the touchpoint.
      - Additional notes from `touchpointNotes` (per‑touchpoint notes).

- **Lifecycle actions**:
  - Buttons to:
    - Mark as **Complete**.
    - **Cancel**.
    - **Reschedule** (update due date and reset status to open).

---

## 6. Roles & Data Transparency

### 6.1 Role switcher

- In the sidebar, use the **“Viewing as”** toggle to switch between:
  - **Partner**
  - **BD**
- Stored as `currentRole` in the `demoStore`.

### 6.2 Effects on visibility

- **Lists**:
  - Partner:
    - Sees only Firm-wide + Shared lists.
    - Personal lists hidden.
  - BD:
    - Sees all lists (including Personal).

- **Companies**:
  - Partner:
    - Sees revenue as **ranges** instead of exact numbers.
    - Relationship history, connections, interactions, and notes truncated to top items (with “+ more…” hints).
    - Matters & Opportunities show only **counts** and simple summary text.
  - BD:
    - Sees full revenue values.
    - Full lists for history, connections, interactions, notes.
    - Full Matters & Opportunities tables and analytics panels.

---

## 7. Routing & Persistence

- **Routing**:
  - Hash-based URLs (e.g. `#My%20Insights`, `#Contacts`, `#Touchpoints/Missed%20Touchpoints`).
  - Reloading the page keeps you on the same page and subview.
- **Data persistence**:
  - All demo state stored in `localStorage` under a single key.
  - Clear browser storage to reset the demo to its seeded state.

