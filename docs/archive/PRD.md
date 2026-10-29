# Program Requirements Document
## Communities — Decentralized Community Self-Governance

**Version:** 1.0  
**Date:** April 2026

---

## 1. Product Overview

### 1.1 Vision

Communities is a decentralized self-governance application that gives groups of people the tools to organize, make decisions, and coordinate action without relying on a central authority or platform owner. Every participant hosts their own data; the application aggregates it into a shared, real-time collaborative experience.

### 1.2 Application Structure

The application is organized around three primary areas:

1. **Profile** — Users manage their personal identity: name, photo, and server connection. This is the entry point to the application.
2. **Communities** — Users create and join communities. A community is the top-level container for a group of people working together toward shared goals.
3. **Collaboration** — Within a community, members create and manage **initiatives** (active projects), **wishes** (ideas or requests), and **agreements** (formal commitments). Each of these can have any number of **collaboration flows** attached — structured tools for scheduling, voting, budgeting, assigning roles, managing tasks, and more.

### 1.3 Technology Foundation

The application is built on the **Gloki** distributed network. Each user registers a public key on a server they control. Smart contracts — written in Python and deployed to a user's server — serve as the persistent, trustless data layer. All application data lives in these contracts; the React frontend is a stateless view and interaction layer on top of them.

---

## 2. Users and Roles

### 2.1 User Identity

Every user is identified by a **64-character hexadecimal public key** and a **server URL**. There are no usernames or passwords. Identity is cryptographic.

A user's profile (name, photo) is stored in a Gloki profile contract on their server and is readable by anyone who knows their public key and server.

### 2.2 Roles Within a Community

| Role | Description |
|------|-------------|
| **Creator** | Founded the community. Manages community properties and membership. |
| **Member** | Joined the community. Can participate in all flows and create collaborations. |
| **Visitor** | Has the community ID but has not joined. Can view but cannot participate. |

### 2.3 Roles Within a Collaboration Flow

Within a flow, roles are contextual:

- **Role Holder** (Roles flow): A member assigned to a named role. Can edit role definition fields.
- **Participant** (Scheduling, Task Board, etc.): Any member who has contributed data to a flow.
- **Organizer** (Scheduling): The member who created and configured the scheduling range.
- **Contributor** (Fundraising): Any member who has submitted a contribution.

---

## 3. Core Domain Concepts

### 3.1 Community

A community is the top-level container. It holds:
- A name, description, and creation date
- A list of member public keys
- A community currency/token system
- A set of collaborations (wishes, initiatives, agreements)
- A list of issues

Communities are referenced by a contract ID. To join a community, a user scans a QR code or uses a shared link.

### 3.2 Collaboration Types

There are three collaboration types. All three share the same structure: a title, a description, a host server and agent, and a list of attached flow tabs.

| Type | Description |
|------|-------------|
| **Wish** | A desire or request expressed by a community member. The starting point for collaboration. |
| **Initiative** | An active project with momentum. Often emerges from a wish. |
| **Agreement** | A formal commitment between parties. Captures outcomes and responsibilities. |

### 3.3 Flows

A **flow** is a modular, composable collaboration tool that can be attached to any collaboration as a tab. Each flow is backed by its own smart contract. Multiple flows of different types can be active simultaneously within one collaboration.

Flows are organized into four categories:

- **Decision Making** — tools for surfacing options and reaching consensus
- **Planning & Execution** — tools for coordinating work over time
- **Governance & Finance** — tools for managing resources and authority
- **Communication** — tools for structured conversation and documentation

### 3.4 Issues

Issues are a standalone mechanism for raising problems or feature requests within a community. They include a description, discussion thread, proposals, and votes. Issues are separate from the collaboration system.

---

## 4. Feature Requirements

### 4.1 Identity and Profile

**FR-ID-01** Users must authenticate using a public key and server URL.  
**FR-ID-02** On first login, the platform registers the user's agent on their server if not already registered.  
**FR-ID-03** Users can set a first name, last name, and profile photo (auto-resized to 200×200px).  
**FR-ID-04** Users can store an OpenAI API key in their profile for AI-assisted features.  
**FR-ID-05** Login state persists across browser sessions via localStorage.  
**FR-ID-06** Users can view all communities they are part of from their profile page.  
**FR-ID-07** Users can join a community by scanning a QR code or entering a community ID.

### 4.2 Community Management

**FR-CM-01** Users can create a new community with a name and description.  
**FR-CM-02** Community creators can edit community properties (name, description, instructions).  
**FR-CM-03** Members are listed with their profile information.  
**FR-CM-04** Communities can be shared via a QR code.  
**FR-CM-05** A community-level currency/token system tracks balances per member.  
**FR-CM-06** The community page provides tabs for Collaborations, Members, Currency, Issues, and Share.

### 4.3 Collaborations

**FR-CO-01** Members can create wishes, initiatives, and agreements within a community.  
**FR-CO-02** All three collaboration types are listed in a unified Collaborations view.  
**FR-CO-03** Collaborations can be filtered (by type) and sorted (by activity or date).  
**FR-CO-04** Clicking a collaboration opens its dedicated page.  
**FR-CO-05** Each collaboration page shows a tab bar with all attached flows plus an "Add" button.  
**FR-CO-06** New flow tabs are added from a grouped dropdown menu.  
**FR-CO-07** Flows that require configuration (e.g., Scheduling, Fundraising) show a setup dialog before the tab is created. If the dialog is cancelled, no tab is created.  
**FR-CO-08** Flow tabs can be closed (removed from the collaboration).  
**FR-CO-09** Each flow is deployed as an independent smart contract on the creating user's server.  
**FR-CO-10** The URL for an initiative encodes the host server, host agent, community ID, and initiative ID to support decentralized access.

### 4.4 Collaboration Flows

#### 4.4.1 Ranking Vote

**FR-FL-RK-01** Members can add proposals to be ranked.  
**FR-FL-RK-02** Each member independently ranks all proposals.  
**FR-FL-RK-03** The aggregate ranking is computed and displayed in real time.

#### 4.4.2 Scoring Vote

**FR-FL-SC-01** Members can add options to be scored.  
**FR-FL-SC-02** Each member assigns a numerical score to each option.  
**FR-FL-SC-03** Average scores are displayed alongside individual inputs.

#### 4.4.3 Concern Resolution

**FR-FL-CN-01** Members can submit concerns (blockers, objections, questions).  
**FR-FL-CN-02** Each concern can be voted on (approve / disapprove) by all members.  
**FR-FL-CN-03** Votes are stored per concern and displayed as counts.  
**FR-FL-CN-04** Members can change or clear their vote at any time.

#### 4.4.4 Scheduling

**FR-FL-SC-01** The organizer defines a date range, daily start/end hours, and slot duration (in minutes).  
**FR-FL-SC-02** The configuration is set via a dialog before the tab is created.  
**FR-FL-SC-03** Each member selects their available slots by dragging across a heatmap grid.  
**FR-FL-SC-04** The grid displays days as rows and time slots as columns.  
**FR-FL-SC-05** The heatmap aggregates all member selections: cells are shaded by number of available participants.  
**FR-FL-SC-06** The current user's selected slots are visually distinguished from the aggregate.  
**FR-FL-SC-07** The organizer can edit the configuration after creation.

#### 4.4.5 Task Board

**FR-FL-TB-01** Members can create tasks with a title and description.  
**FR-FL-TB-02** Tasks move through statuses: Backlog → In Progress → Done.  
**FR-FL-TB-03** Members can claim (assign to themselves) or release a task.  
**FR-FL-TB-04** Task status can be advanced or reverted individually.  
**FR-FL-TB-05** Tasks are displayed in columns by status (Kanban layout).

#### 4.4.6 Role Nomination

**FR-FL-RL-01** Members can define named roles within the collaboration.  
**FR-FL-RL-02** Any member can join a role to become a holder.  
**FR-FL-RL-03** Role cards are collapsible. In collapsed state they show the role name, current holders, and a join/leave button.  
**FR-FL-RL-04** In expanded state, the card shows five structured sections: Purpose, Responsibilities, Autonomy, Authorities, and Boundaries.  
**FR-FL-RL-05** Role holders can edit all sections. Non-holders have read-only access to sections.  
**FR-FL-RL-06** Purpose is a free-form paragraph; the other four sections are item lists.  
**FR-FL-RL-07** List items support inline add, edit, and delete (holders only).  
**FR-FL-RL-08** Non-holders can approve or disapprove each holder's name, the purpose text, and every individual list item.  
**FR-FL-RL-09** Vote buttons toggle: clicking an active vote clears it.  
**FR-FL-RL-10** Approve/disapprove counts are shown on each voteable element.

#### 4.4.7 Fundraising

**FR-FL-FN-01** A setup dialog (shown before tab creation) collects: fund name (required), description (optional), and target goal in credits (optional).  
**FR-FL-FN-02** Once created, the fund displays total raised, number of contributors, the target goal, and the current user's total contribution.  
**FR-FL-FN-03** A progress bar shows percentage reached when a goal is set.  
**FR-FL-FN-04** Any member can contribute any positive amount.  
**FR-FL-FN-05** All contributions are listed in reverse chronological order with contributor, amount, and timestamp.

#### 4.4.8 Budget Allocation

**FR-FL-BA-01** The budget flow can be linked to a fundraising flow to use collected funds as the total budget.  
**FR-FL-BA-02** Members can define budget line items.  
**FR-FL-BA-03** Each member independently proposes an allocation across line items.  
**FR-FL-BA-04** The aggregated allocations are displayed.

#### 4.4.9 Discussion

**FR-FL-DS-01** Members can post comments.  
**FR-FL-DS-02** Comments can be replied to, forming a nested thread.  
**FR-FL-DS-03** The thread is displayed as a tree with visual indentation.  
**FR-FL-DS-04** Comments are stored flat (with a parentId reference) and rendered as a tree client-side.

#### 4.4.10 Q&A

**FR-FL-QA-01** Members can post questions.  
**FR-FL-QA-02** Members can post answers to any question.  
**FR-FL-QA-03** Questions and their answers are displayed together.

#### 4.4.11 Document

**FR-FL-DC-01** A collaborative document can be built from structured elements.  
**FR-FL-DC-02** Members can propose edits to document elements.  
**FR-FL-DC-03** Proposals can be voted on.  
**FR-FL-DC-04** The document can be exported to PDF.

### 4.5 Real-Time Updates

**FR-RT-01** The application maintains a Server-Sent Events (SSE) connection to the user's server.  
**FR-RT-02** When another participant writes to a shared contract, all connected clients receive an event and refresh the relevant data automatically.  
**FR-RT-03** The connection is established before the user's contracts are loaded, to avoid missing events during initialization.

### 4.6 Issues

**FR-IS-01** Community members can raise issues with a title and description.  
**FR-IS-02** Issues have a discussion thread.  
**FR-IS-03** Members can submit proposals as responses to an issue.  
**FR-IS-04** Proposals can be voted on.

---

## 5. Smart Contract System

### 5.1 Overview

All persistent data lives in Python smart contracts deployed to user-controlled servers. The frontend reads and writes to these contracts via HTTP. There is no centralized database.

### 5.2 Storage Pattern

All contracts use a `Storage` abstraction for persistence:

```python
self.items = Storage('items')

# Store by key
self.items[item['id']] = item

# Append (for auto-keyed lists)
self.items.append(item)

# Read all
return [self.items[key].get_dict() for key in self.items]

# Update a field on a stored document
self.items[item_id]['fieldName'] = new_value
```

Field-level updates (e.g., `self.items[id]['status'] = value`) are the mechanism for all mutations on existing records. List fields within a document are replaced wholesale by sending the full new list from the client.

### 5.3 Contract Registry

| Contract | Purpose |
|----------|---------|
| `gloki_contract.py` | User profile: name, photo, API keys |
| `community_contract.py` | Community properties, members, accounts, collaborations |
| `initiative_contract.py` | Initiative metadata and attached flow references |
| `wish_contract.py` | Wish metadata and attached flow references |
| `agreement_contract.py` | Agreement metadata and attached flow references |
| `issue_contract.py` | Issue description, comments, proposals |
| `ranking_flow_contract.py` | Ranked-choice voting proposals and rankings |
| `scoring_flow_contract.py` | Score-based voting options and scores |
| `concerns_flow_contract.py` | Concerns and per-concern vote maps |
| `scheduling_flow_contract.py` | Range config and per-participant slot selections |
| `task_board_flow_contract.py` | Tasks stored by ID with owner and status fields |
| `roles_flow_contract.py` | Roles stored by ID with sections, assignees, and votes |
| `fundraising_flow_contract.py` | Fund config and contribution list |
| `budget_allocation_flow_contract.py` | Fund link, line items, and per-member allocations |
| `discussion_flow_contract.py` | Flat comment list with parentId for tree structure |
| `qa_flow_contract.py` | Questions and answers |
| `document_flow_contract.py` | Document elements, proposals, and votes |

---

## 6. Navigation and URL Structure

| URL Pattern | Page |
|------------|------|
| `/identity/*` | User profile, communities, join |
| `/community/:communityId/*` | Community hub |
| `/initiative/:hostServer/:hostAgent/:communityId/:initiativeId/*` | Initiative page |
| `/wish/:communityId/:wishId/*` | Wish page |
| `/agreement/:communityId/:agreementId` | Agreement page |
| `/issue/:hostServer/:hostAgent/:communityId/:issueId/*` | Issue page |

Initiative and issue URLs encode the host server and agent in the path to support cross-server navigation in the decentralized network.

---

## 7. Non-Functional Requirements

**NFR-01 Decentralization:** No application data is stored on a platform-owned server. All data lives in contracts on user-controlled servers.

**NFR-02 Performance:** Contract read/write calls have a 10-second timeout. The UI remains responsive during network operations using loading states.

**NFR-03 Real-time Sync:** All participants viewing the same flow see updates within seconds of a contract write, via Server-Sent Events.

**NFR-04 Offline Resilience:** The UI degrades gracefully when the server is unreachable, showing error states with retry options.

**NFR-05 Security:** Authentication is cryptographic (public key). No passwords are stored. Contract access is enforced server-side by the Gloki network.

**NFR-06 Composability:** New flow types can be added without modifying existing flows or the collaboration page. Each flow is a self-contained component and contract pair registered in a central registry.

**NFR-07 Portability:** Users can move their data between servers. The contract system is not tied to any specific deployment.

---

## 8. Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 with TypeScript |
| Build tool | Vite |
| State management | Redux Toolkit |
| Routing | React Router 7 |
| Styling | SCSS Modules |
| Icons | Lucide React |
| QR codes | `qrcode.react`, `@yudiel/react-qr-scanner` |
| PDF export | jsPDF, svg2pdf.js |
| Drag and drop | react-dnd |
| Smart contracts | Python (deployed to Gloki server) |
| Real-time events | Server-Sent Events (SSE) |

---

## 9. Out of Scope

The following are explicitly not part of the current version:

- Mobile native applications (iOS/Android)
- Email or push notifications
- Automated moderation or content filtering
- Integration with external identity providers (OAuth, SSO)
- Contract-level access control lists beyond the Gloki network's built-in model
- Offline-first / local-first data sync

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **Agent** | A user's registered identity on a Gloki server, identified by their public key |
| **Contract** | A Python class deployed to a Gloki server that stores and mutates data |
| **Flow** | A modular collaboration tool, backed by a contract, that can be attached to any collaboration |
| **Flow tab** | The UI representation of an attached flow within a collaboration page |
| **Gloki** | The distributed server network that hosts user agents and contracts |
| **Storage** | The key-value persistence abstraction used inside contracts |
| **Host server / Host agent** | The server and public key of the participant who deployed a given contract |
| **Wish** | A user-expressed goal or desire, the primary unit of community intent |
| **Initiative** | An active collaborative project, often derived from a wish |
| **Agreement** | A formal mutual commitment, the output of a negotiation |
| **Credits** | The unit of community currency used in fundraising and budget flows |
