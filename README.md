# Touchpoint Demo App

This is a mock, front‑end–only demo of the **Lawyer Touchpoints App** described in the Blakes requirements document. It focuses on showing end‑to‑end workflows and interactions using **seeded mock data** persisted in `localStorage` (no real integrations).

The app is organized into the following feature areas:

- **My Insights**
- **Contacts**
- **Companies**
- **Lists**
- **Touchpoints**

Each section below explains what the feature is for, what you can do there, and how interactions flow between modules.

---

## My Insights

**Purpose:**  
Surface an AI‑style, card‑based feed of relationship and business development insights for the lawyer.

**Key capabilities:**
- **Insight cards:** Each card shows:
  - Insight type badge (e.g. Fading Relationship, Untapped Opportunity, Engagement Trend).
  - Practice/industry tags.
  - Headline, description, and subject (contact or company).
  - Meta information (recent interactions, trend, status).
- **Quick actions on cards:**
  - **Like:** Toggles a liked state for the insight (persisted).
  - **Dismiss:** Removes the insight from the feed (persisted).
  - **Set reminder:** Creates a follow‑up touchpoint task due in ~3 days and dismisses the insight.
- **Create touchpoints directly from insights:**
  - **CTA button** and **target icon** both open the **Create Touchpoint** modal prefilled from the insight (subject, suggestion).
  - Saving the modal creates a new touchpoint task in the **Touchpoints** module.
- **Filtering:**
  - Text search across insight label, title, description, subject, and tags.
  - **High‑priority only** toggle to show only High‑priority insights.

**Flow & interactions:**
- Lawyer reviews insight feed → likes or dismisses items to signal relevance.
- For actionable cards:
  - **Create Touchpoint** to log a discrete follow‑up task, which then appears under **Touchpoints**.
  - Or **Set Reminder**, which auto‑creates a follow‑up task and hides the card.

---

## Contacts

**Purpose:**  
Strategic management of individual relationships (people).

**Key capabilities:**
- **Contacts table:**
  - Name, role, company.
  - Last interaction and relationship status (e.g. Good, Fading, Cold).
  - Per‑row actions:
    - **New touchpoint** (docPlus icon) → opens **Create Touchpoint** modal prefilled with the contact.
    - **Relationship** (target icon) – reserved for future relationship‑mapping flows.
    - **More actions** (listPlus icon) → opens **Add Note** for that contact.
- **Filtering & Advanced Search (F‑1):**
  - **Free‑text search** across name, role, company, last interaction, relationship.
  - **Relationship filter**: All, Good, Fading, Cold.
  - **List filter**: filter contacts by membership in a selected list (see Lists section).
  - **Saved Views**:
    - Save current filters under a custom name.
    - Apply a saved view from the dropdown.
    - Delete saved views via the same dropdown.
- **Contact detail modal:**
  - Contact role, company.
  - Relationship strength + score.
  - Internal connections.
  - Relationship history and recent interactions.
  - **Notes section**:
    - Shows all notes created for this contact with type and visibility.
  - **Actions in footer:**
    - **Add to list** → opens **Add Contact to List** modal.
    - **Add note** → opens **Add Contact Note** modal.
    - **Create touchpoint** → opens **Create Touchpoint** modal prefilled with the contact.

**Notes with visibility (F‑4):**
- **Add Contact Note** modal:
  - Note types: General, Meeting Notes, Client Preferences, Relationship Context, Special Dates, Personal Interests.
  - Rich text description.
  - Visibility: Private, Shared, Firm‑wide.
  - Optional “Share with” field (for shared notes).
- Notes are persisted per contact and displayed in the contact detail modal.

**Lists integration (F‑5 – lists portion):**
- **Add Contact to List** modal (from contact detail):
  - Search lists by name/tag/owner.
  - Multi‑select lists via checkboxes.
  - See list details inline: member count and last engagement.
  - Saving updates list membership and member counts in the **Lists** module.

**Flow & interactions:**
- Lawyer filters contacts using search + relationship + list filters or a **Saved View**.
- Selects a key contact and:
  - Reviews relationship history and notes.
  - Adds a new note with appropriate visibility.
  - Adds the contact to one or more lists (e.g. Trip Planning, Event, Campaign).
  - Creates a touchpoint task, which appears in **Touchpoints** and can later be completed/rescheduled.

---

## Companies

**Purpose:**  
Client portfolio management at the company level (health, engagement, and opportunities).

**Key capabilities:**
- **Companies table:**
  - Logo, name, categories.
  - Recent engagement summary and recency.
  - Client status.
  - Per‑row actions:
    - **New touchpoint** (docPlus icon) → opens **Create Touchpoint** modal, guessing a primary contact at that company when possible.
    - **Relationship** (target icon) – reserved for future firm‑relationship mapping.
    - **Analytics** (chart icon) – reserved for future analytics/embedded dashboards.
- **Company detail modal:**
  - Category, client status, recent engagement.
  - Revenue and hierarchy.
  - Relationship history, key internal connections, recent interactions.
  - Footer actions:
    - **Open profile** (placeholder).
    - **Add note** (placeholder for future company‑level notes).
    - **Create touchpoint** → opens **Create Touchpoint** modal for a chosen or inferred contact at this company.

**Flow & interactions:**
- Lawyer filters or scans companies, opens a company detail modal, then:
  - Reviews relationship history and key contacts.
  - Initiates a **Create touchpoint** action that ties back to relevant individuals and appears in the **Touchpoints** module.

---

## Lists

**Purpose:**  
Organize contacts into reusable segments for campaigns, events, targeting, and trip planning.

**Key capabilities (F‑5 – lists portion):**
- **Lists table:**
  - List name, owner.
  - Tag (e.g. Event, Privacy & Security).
  - Members count (driven by actual membership).
  - Last engagement.
  - Actions (relationship and more) reserved for future analytics/management.
- **List data model (demo store):**
  - Each list has:
    - `name`, `owner`, `type` (e.g. Campaign, Event, Targeting, Trip Planning), `tag`.
    - `memberIds`: IDs of contacts in that list.
- **Membership management:**
  - Managed from the **Contacts** module’s **Add Contact to List** modal.
  - Adding/removing a contact updates `memberIds` and immediately updates member counts displayed on the Lists page.

**Flow & interactions:**
- BD or lawyer defines target groups by assigning contacts to lists (e.g. “Regulatory Affairs Network Dinner”).
- Those lists can be used as filters in **Contacts** and later in **advanced search and campaigns**.

---

## Touchpoints

**Purpose:**  
Track both historical interactions and upcoming follow‑up tasks (touchpoints) across relationships.

**Key capabilities (F‑3 + part of F‑10):**
- **Touchpoints table:**
  - Mix of completed interactions and open tasks, built from:
    - Seeded historical interactions.
    - New tasks created from Insights, Contacts, and Companies.
  - Columns:
    - Date / Due date (depending on item kind).
    - Contact details (avatar, name, role, company).
    - Interaction summary and relationship status.
- **Views:**
  - Default view: all touchpoints (both tasks and completed interactions).
  - **Missed Touchpoints** view (via sidebar sub‑navigation):
    - Shows **overdue open tasks** based on due date and status.
- **Task lifecycle:**
  - Each touchpoint task has:
    - Status: open, completed, or cancelled.
    - Timestamps: createdAt, dueAt, completedAt/cancelledAt.
  - Touchpoint detail modal:
    - Shows interaction type, status, outcome.
    - Due date / completion date.
    - Relationship status and score.
    - History and notes.
    - Actions:
      - **Complete**: marks task as completed.
      - **Cancel**: marks task as cancelled.
      - **Reschedule**: update due date via a simple date input.

**Creation entry points (connected from other modules):**
- From **My Insights**:
  - CTA and target icon on insight cards open **Create Touchpoint** modal prefilled from the insight.
- From **Contacts**:
  - Per‑row docPlus icon.
  - “Create touchpoint” button in the contact detail modal.
- From **Companies**:
  - Per‑row docPlus icon.
  - “Create touchpoint” button in the company detail modal.

**Flow & interactions:**
- Lawyer sees an insight or a situation in Contacts/Companies → creates a touchpoint task.
- The task appears in **Touchpoints** and possibly in **Missed Touchpoints** if overdue.
- Lawyer uses the detail modal to **complete, cancel, or reschedule** tasks during follow‑through.

---

## Data & Persistence (Demo Only)

- All data is **mocked and front‑end only**.
- The app uses a small in‑browser store (`demoStore`) with:
  - Seeded contacts, companies, lists, touchpoints, and computed insights.
  - Notes, list membership, filters, saved views, and insight state.
  - Everything is serialized into `localStorage` under a single key so that:
    - Demo data persists across page refresh.
    - You can reset the store by clearing browser storage or via a helper action.

---

## Screenshots (to be added)

Each module/feature above is designed to align with a corresponding wireframe in the Blakes requirements document.  
You can add screenshots to this README under each section as they are produced (e.g. `![My Insights – Main Feed](./docs/my-insights.png)`).

