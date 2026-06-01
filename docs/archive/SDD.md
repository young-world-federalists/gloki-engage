# Software Description Document
## Communities — Decentralized Community Self-Governance

**Version:** 1.0  
**Date:** April 2026  
**Stack:** React 19 · TypeScript 5 · Redux Toolkit · Vite · Python Smart Contracts · MongoDB

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Frontend Application](#4-frontend-application)
5. [State Management](#5-state-management)
6. [Services Layer](#6-services-layer)
7. [Smart Contract System](#7-smart-contract-system)
8. [Collaboration Flows](#8-collaboration-flows)
9. [Real-Time Event System](#9-real-time-event-system)
10. [Authentication and Identity](#10-authentication-and-identity)
11. [Routing and Navigation](#11-routing-and-navigation)
12. [Key Data Models](#12-key-data-models)
13. [UI Patterns and Component Design](#13-ui-patterns-and-component-design)
14. [Build and Configuration](#14-build-and-configuration)

---

## 1. System Overview

Communities is a **decentralized community self-governance application** built as a single-page React application. It operates without a central backend server: all persistent data lives in Python smart contracts deployed by users to their own servers on the **Gloki** distributed network.

The application is organized around three areas: managing a personal profile, creating and joining communities, and collaborating within communities via initiatives, wishes, and agreements. Each collaboration can have any number of **flow** modules (voting, scheduling, budgeting, task boards, etc.) attached to it as independent contracts.

The application is a stateless frontend that:
- Reads and writes to smart contracts via HTTP API calls
- Subscribes to real-time contract events via Server-Sent Events (SSE)
- Composes collaborative flows as independent contracts attached to shared collaboration objects

The system is fully peer-to-peer at the data layer. There is no platform-owned database. Each user is their own data host.

---

## 2. Architecture

### 2.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React UI Layer                           │
│  Pages · Components · Flow Components · Dialogs · SCSS Modules  │
├─────────────────────────────────────────────────────────────────┤
│                     State Management Layer                      │
│        Redux Toolkit · Slices · Thunks · Selectors              │
├─────────────────────────────────────────────────────────────────┤
│                      Services Layer                             │
│   api.ts · eventStream.ts · contracts/* · openai.ts             │
├─────────────────────────────────────────────────────────────────┤
│                   Gloki Network (External)                      │
│   User Server A · User Server B · User Server N                 │
│   Python Smart Contracts · MongoDB Storage · SSE Endpoints      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Decentralized Data Model

Every piece of persistent data is owned by a user and stored in a contract on their server. There is no platform database.

```
User A (server-a.example.com / publicKeyA)
  ├── Gloki Profile Contract
  ├── Community Contract (if A created a community)
  ├── Initiative Contract (if A created an initiative)
  └── Flow Contracts (ranking, scheduling, etc. — one per tab A added)

User B (server-b.example.com / publicKeyB)
  ├── Gloki Profile Contract
  └── Flow Contracts (tabs B added to shared collaborations)
```

When User B views an initiative created by User A, the frontend makes HTTP calls to `server-a.example.com` to read User A's initiative contract. Each tab (flow) within that initiative may be hosted on a different user's server — whichever user added it.

### 2.3 Contract Reference Chain

```
Community Contract (User A's server)
  └── collaborations[]
        └── FlowRef { id, server, agent, type }
              ↓ dereferences to
        Flow Contract (any user's server)
```

A `FlowRef` is a pointer: `{ id: contractId, server: serverUrl, agent: publicKey, type: flowType }`. The frontend resolves references by issuing HTTP reads to the specified server.

---

## 3. Directory Structure

```
Communities2/
├── src/
│   ├── App.tsx                          # Root: routing tree + AuthProvider
│   ├── main.tsx                         # Entry point: Redux store + React mount
│   │
│   ├── assets/
│   │   └── contracts/                   # Python source for all smart contracts
│   │       ├── gloki_contract.py
│   │       ├── community_contract.py
│   │       ├── initiative_contract.py
│   │       ├── wish_contract.py
│   │       ├── agreement_contract.py
│   │       ├── issue_contract.py
│   │       └── *_flow_contract.py       # One per flow type (11 total)
│   │
│   ├── components/
│   │   ├── PageHeader.tsx               # Shared page header
│   │   ├── collaboration/
│   │   │   └── flows/                   # All flow UI modules
│   │   │       ├── FlowShell.tsx        # FlowLoading + FlowError components
│   │   │       ├── types.ts             # FlowProps + FlowDefinition interfaces
│   │   │       ├── registry.ts          # FLOW_REGISTRY array + getFlow()
│   │   │       └── {flowName}/          # One folder per flow type
│   │   │           ├── *Flow.tsx        # React component
│   │   │           ├── *Api.ts          # Contract read/write wrappers
│   │   │           └── *.module.scss    # Scoped styles
│   │   ├── community/                   # Community sub-components + dialogs
│   │   ├── identity/                    # Profile + communities + join
│   │   ├── initiative/                  # Initiative roadmap, steps, gaps
│   │   ├── issue/                       # Issue discussion, proposals, voting
│   │   └── wish/                        # Wish seeds, offers, related wishes
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx              # Auth state + login/logout logic
│   │
│   ├── hooks/
│   │   └── useEventStream.ts            # SSE subscription hooks
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── IdentityView.tsx
│   │   ├── CommunityView.tsx
│   │   ├── IssueView.tsx
│   │   └── collaboration/
│   │       ├── CollaborationPage.tsx    # Tab container for all collaboration types
│   │       ├── InitiativeView.tsx
│   │       ├── WishView.tsx
│   │       └── AgreementView.tsx
│   │
│   ├── services/
│   │   ├── api.ts                       # Low-level HTTP contract API
│   │   ├── eventStream.ts               # SSE singleton service
│   │   ├── interfaces.ts                # Shared TypeScript interfaces
│   │   ├── encodeDecode.ts              # QR code encoding helpers
│   │   ├── openai.ts                    # OpenAI integration
│   │   └── contracts/                   # Domain-specific contract wrappers
│   │       ├── flows.ts                 # Flow deployment + FlowRef management
│   │       ├── gloki.ts
│   │       ├── community.ts
│   │       ├── initiative.ts
│   │       ├── wish.ts
│   │       ├── agreement.ts
│   │       └── issue.ts
│   │
│   ├── store/
│   │   ├── index.ts                     # configureStore
│   │   ├── hooks.ts                     # useAppDispatch, useAppSelector
│   │   └── slices/
│   │       ├── userSlice.ts
│   │       ├── communitiesSlice.ts
│   │       ├── issuesSlice.ts
│   │       ├── initiativeSlice.ts
│   │       ├── wishSlice.ts
│   │       ├── agreementSlice.ts
│   │       └── currencySlice.ts
│   │
│   ├── styles/
│   │   ├── variables.scss               # Design tokens (colors, spacing, etc.)
│   │   └── index.scss                   # Global base styles
│   │
│   └── types/
│       └── initiative.ts                # InitiativeData interface
│
├── storage_interface.py                 # MongoDB bridge for smart contracts
├── PRD.md                               # Program Requirements Document
├── SDD.md                               # This document
└── vite.config.ts
```

---

## 4. Frontend Application

### 4.1 Entry Point

**`main.tsx`** mounts the application:

```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
```

**`App.tsx`** wraps all routes in `AuthProvider` and uses React Router's `<Routes>`. Unauthenticated users are redirected to `/identity` (which shows the login screen). All page components are lazily loaded with `React.lazy()` to reduce the initial bundle size.

### 4.2 Page Components

Each page component is a full-screen view composed of:
- A `PageHeader` with title, subtitle, back button, and action slots
- A sidebar navigation (tab buttons)
- A main content area that renders the active tab's sub-component

**`CollaborationPage.tsx`** is the most complex page. It is shared by `InitiativeView`, `WishView`, and `AgreementView`, which pass in the collaboration type, IDs, and server coordinates. It manages the tab bar, flow loading, and flow contract deployment.

### 4.3 Component Conventions

- All components are **function components** with TypeScript generics for props.
- Styles are **SCSS Modules** (`*.module.scss`) co-located with the component file.
- Icons are sourced exclusively from **Lucide React**.
- No inline styles; all visual logic lives in SCSS.
- Async operations trigger local `loading` / `error` state; global Redux state is for shared/cached domain data only.

---

## 5. State Management

### 5.1 Redux Store Configuration

```typescript
// store/index.ts
export const store = configureStore({
  reducer: {
    user:          userReducer,
    communities:   communitiesReducer,
    issues:        issuesReducer,
    initiative:    initiativeReducer,
    wish:          wishReducer,
    agreement:     agreementReducer,
    currency:      currencyReducer,
  },
});
```

### 5.2 Slice Overview

#### `userSlice`

Owns authentication credentials and the user's contract list.

```typescript
interface UserState {
  publicKey:         string | null;
  serverUrl:         string | null;
  profile:           IProfile | null;
  profileContractId: string | null;
  contracts:         IContract[];
  loading:           boolean;
  error:             string | null;
}
```

Key thunks:
- **`initializeUser()`** — Checks agent existence, registers if new, fetches contracts, reads profile.
- **`fetchContracts()`** — Refreshes the full contract list from the server.
- **`readProfile()`** — Reads the Gloki profile contract; deploys a new one if absent.

#### `communitiesSlice`

Normalizes all community data by contract ID.

```typescript
interface CommunitiesState {
  communityProperties:     Record<string, CommunityProperties>;
  communityMembers:        Record<string, string[]>;         // contractId → publicKeys
  communityCollaborations: Record<string, Collaboration[]>;  // contractId → collab list
  profiles:                Record<string, IProfile>;         // publicKey  → profile
  // ...loading maps per contractId
}
```

#### Domain Slices (`initiative`, `wish`, `agreement`, `issues`, `currency`)

Follow the same normalization pattern: all entities keyed by contract ID, with per-entity loading and error flags.

### 5.3 Thunk Pattern

All async Redux operations use `createAsyncThunk`. The standard pattern:

```typescript
export const fetchCommunityMembers = createAsyncThunk(
  'communities/fetchMembers',
  async ({ serverUrl, publicKey, contractId }: FetchArgs) => {
    const members = await getMembers(serverUrl, publicKey, contractId);
    return { contractId, members };
  }
);
```

Results are handled in `extraReducers` with `pending` / `fulfilled` / `rejected` cases.

### 5.4 Local vs. Global State

- **Redux** holds data that must survive navigation: user identity, community members, collaboration lists, profiles.
- **`useState`** holds ephemeral UI state: form inputs, open/closed dialogs, active tabs, loading indicators within a single component.
- Flow data (task lists, scheduling slots, votes, etc.) is **not stored in Redux** — it is fetched directly by each flow component from the contract on mount, and held in local state. This avoids stale data issues across multiple simultaneous flow views.

---

## 6. Services Layer

### 6.1 `api.ts` — Low-Level HTTP Client

All network communication goes through this module. Each function wraps a `fetch` call with a 10-second `AbortController` timeout.

**Base URL pattern:** `${serverUrl}/ibc/app/${publicKey}`

| Function | HTTP | Path | Purpose |
|----------|------|------|---------|
| `isExistAgent` | GET | `/` | Check if agent is registered |
| `registerAgent` | PUT | `/` | Register a new agent |
| `getContracts` | GET | `/contracts` | List all contracts for user |
| `deployContract` | POST | `/?action=deploy_contract` | Deploy a new contract |
| `joinContract` | POST | `/?action=join_contract` | Join an existing contract |
| `contractRead` | GET | `/${contractId}/${method}?action=contract_read` | Read contract state |
| `contractWrite` | POST | `/${contractId}/${method}?action=contract_write` | Mutate contract state |

All write operations serialize a `{ name, values }` method object as the request body.

### 6.2 `services/contracts/` — Domain-Specific Wrappers

Each file provides typed wrappers over `contractRead` / `contractWrite` for a specific contract class:

```typescript
// Example from community.ts
export async function getMembers(
  serverUrl: string, publicKey: string, contractId: string
): Promise<string[]> {
  const result = await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_members', values: {} } as IMethod,
  });
  return Array.isArray(result) ? result.map(String) : [];
}
```

### 6.3 `services/contracts/flows.ts` — Flow Contract Deployment

This module manages the full lifecycle of flow contracts.

**`FLOW_SPECS`** maps each flow type ID to its Python class name and the source code imported from `src/assets/contracts/`:

```typescript
const FLOW_SPECS: Record<string, { name: string; contract: string; code: string }> = {
  'ranking':          { name: 'ranking_flow',    contract: 'RankingFlow',    code: rankingSource },
  'scheduling':       { name: 'scheduling_flow', contract: 'SchedulingFlow', code: schedulingSource },
  // ... 9 more entries
};
```

**`deployFlowContract(serverUrl, publicKey, flowType)`**  
Calls `api.deployContract()` with the Python class source. Returns the new contract ID.

**`addFlow(server, agent, collaborationId, flowRef)`**  
Calls the collaboration contract's `add_flow` method with a `FlowRef` object.

**`getFlows(server, agent, collaborationId)`**  
Calls the collaboration contract's `get_flows` method. Returns an array of `FlowRef` objects.

### 6.4 Flow-Specific API Modules (`*Api.ts`)

Each flow type has its own API module co-located in its component folder. These modules:

1. Define TypeScript interfaces for the flow's data model.
2. Provide typed read functions that call `contractRead` and normalize the result.
3. Provide typed write functions that call `contractWrite` with the correct method name and parameters.
4. Contain pure helper functions (e.g., `totalRaised`, `computeSlotsPerDay`) for derived data.

This encapsulation means the flow component never calls `api.ts` directly — only through its own `*Api.ts` module.

---

## 7. Smart Contract System

### 7.1 Contract Language and Runtime

Smart contracts are **Python classes** deployed to and executed by a Gloki server. The server handles:
- Storing and retrieving contract state via MongoDB (via `storage_interface.py`)
- Routing HTTP method calls to the correct Python class method
- Access control (only registered agents may write to contracts they participate in)
- Broadcasting SSE events on every `contract_write`

### 7.2 Storage Abstraction

All contracts use a `Storage` class that provides dict-like persistence to MongoDB:

```python
class Storage:
    # Store by explicit key (for ID-addressed documents)
    storage['my-uuid'] = { 'field': 'value' }

    # Append with auto-generated key (for sequential lists)
    storage.append({ 'field': 'value' })

    # Read all documents
    [storage[key].get_dict() for key in storage]

    # Update a single field on an existing document
    storage['my-uuid']['field'] = new_value

    # Replace a list field on an existing document
    storage['my-uuid']['listField'] = new_list
```

**Key design rule:** If a document will ever be looked up or mutated by ID (e.g., updating a task's status), it must be stored as `storage[item['id']] = item`. Using `storage.append()` generates opaque internal keys, making field-level updates impossible.

### 7.3 Contract Anatomy

Every contract follows this structure:

```python
class ExampleFlow:

    def __init__(self):
        self.items = Storage('items')   # One Storage per data type

    def add_item(self, item):
        self.items[item['id']] = item   # Store by ID for later field updates

    def get_items(self):
        return [self.items[key].get_dict() for key in self.items]

    def update_item_field(self, item_id, field, value):
        self.items[item_id][field] = value   # Field-level mutation

    def replace_list_field(self, item_id, list_field, new_list):
        self.items[item_id][list_field] = new_list  # Whole-list replacement
```

### 7.4 Contract Registry

| Category | Contract Class | Python File | Key Storages |
|----------|---------------|-------------|--------------|
| Identity | `GlokiContract` | `gloki_contract.py` | profile |
| Domain | `CommunityContract` | `community_contract.py` | members, properties, collaborations, accounts |
| Domain | `InitiativeContract` | `initiative_contract.py` | flows, properties |
| Domain | `WishContract` | `wish_contract.py` | flows, related, offers, seeds |
| Domain | `AgreementContract` | `agreement_contract.py` | flows, properties |
| Domain | `IssueContract` | `issue_contract.py` | description, comments, proposals |
| Flow | `RankingFlow` | `ranking_flow_contract.py` | proposals, rankings |
| Flow | `ScoringFlow` | `scoring_flow_contract.py` | options, scores |
| Flow | `ConcernsFlow` | `concerns_flow_contract.py` | concerns |
| Flow | `SchedulingFlow` | `scheduling_flow_contract.py` | config, selections |
| Flow | `TaskBoardFlow` | `task_board_flow_contract.py` | tasks |
| Flow | `RolesFlow` | `roles_flow_contract.py` | roles |
| Flow | `FundraisingFlow` | `fundraising_flow_contract.py` | config, contributions |
| Flow | `BudgetAllocationFlow` | `budget_allocation_flow_contract.py` | fund_link, items, allocations |
| Flow | `DiscussionFlow` | `discussion_flow_contract.py` | comments |
| Flow | `QAFlow` | `qa_flow_contract.py` | questions, answers |
| Flow | `DocumentFlow` | `document_flow_contract.py` | elements, proposals, votes |

### 7.5 Python Constraints

The contract runtime runs a restricted subset of Python. Notable restrictions:
- `isinstance` is **not supported** — type checks must be avoided in contract code.
- Third-party imports are not available.
- The `master()` built-in returns the calling user's public key.
- List `.append()` on **nested fields within a stored document** is not supported — the client must compute the new list and replace the field wholesale.

---

## 8. Collaboration Flows

### 8.1 Flow Definition Interface

Every flow is described by a `FlowDefinition` object registered in `registry.ts`:

```typescript
interface FlowDefinition {
  id:             string;
  label:          string;
  icon:           React.ComponentType<{ size?: number }>;
  component:      React.ComponentType<FlowProps>;
  group?:         string;
  isAvailable?:   (existingFlowIds: string[]) => boolean;
  setupComponent?: React.ComponentType<{
    onDone:   (config: Record<string, unknown>) => void;
    onCancel: () => void;
  }>;
  onInit?:        (
    server: string, agent: string, contractId: string,
    config: Record<string, unknown>, currentUser: string
  ) => Promise<void>;
}
```

Every flow component receives `FlowProps`:

```typescript
interface FlowProps {
  instanceId:   string;   // The flow's contract ID
  flowServer:   string;   // Server where the flow contract lives
  flowAgent:    string;   // Owner of the flow contract
  currentUser:  string;   // Current user's public key
}
```

### 8.2 Flow Registry

`FLOW_REGISTRY` in `registry.ts` is an array of `FlowDefinition` objects, organized into four named groups defined in `FLOW_GROUPS`:

```
Decision Making        → Ranking Vote, Scoring Vote, Concern Resolution
Planning & Execution   → Scheduling, Task Board, Role Nomination
Governance & Finance   → Fundraising, Budget Allocation
Communication          → Discussion, Q&A, Document
```

`getFlow(id)` provides O(n) lookup by ID.

### 8.3 Tab Lifecycle in `CollaborationPage`

```
┌──────────────────────────────────────────────────────────────────┐
│ Mount                                                            │
│   getFlows(collabServer, collabAgent, collabId)                  │
│   → setTabs(flowRefs.map(ref => CollaborationTab))              │
│   → setActiveInstanceId(tabs[0].instanceId)                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│ User clicks "Add" button                                         │
│   setShowAddMenu(true)                                           │
│   Renders FLOW_REGISTRY grouped menu                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │ has setupComponent?                   │ no setupComponent
         ▼                                       ▼
┌────────────────────┐              ┌─────────────────────────────┐
│ setPendingFlow(def) │              │ addTab(flowId, undefined)   │
│ Render dialog      │              └──────────────┬──────────────┘
│ User fills config  │                             │
│ User clicks "Done" │                             │
│ addTab(id, config) │                             │
└────────┬───────────┘                             │
         └──────────────────┬──────────────────────┘
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│ addTab(flowId, config?)                                           │
│  1. deployFlowContract(userServer, userKey, flowId)              │
│     → returns contractId                                         │
│  2. if config && flowDef.onInit:                                 │
│       flowDef.onInit(server, key, contractId, config, user)      │
│       (e.g. setupRange, configureFund)                           │
│  3. addFlow(collabServer, collabAgent, collabId, FlowRef)        │
│  4. setTabs([...tabs, newTab])                                   │
│  5. setActiveInstanceId(contractId)                              │
└───────────────────────────────────────────────────────────────────┘
```

### 8.4 Flow Component Pattern

Every flow component follows the same internal structure:

```tsx
const ExampleFlow: React.FC<FlowProps> = ({ instanceId, flowServer, flowAgent, currentUser }) => {
  const [data,    setData]    = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await api.loadData(flowServer, flowAgent, instanceId);
      setData(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [instanceId, flowServer, flowAgent]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <FlowLoading />;
  if (error)   return <FlowError message={error} onRetry={load} />;

  return <ActiveUI data={data} onAction={...} />;
};
```

`FlowLoading` and `FlowError` are shared components from `FlowShell.tsx`.

### 8.5 Setup Dialogs

Flows that require configuration before creation (Scheduling, Fundraising) export a `SetupDialog` component:

```tsx
export const MySetupDialog: React.FC<{
  onDone:   (config: Record<string, unknown>) => void;
  onCancel: () => void;
}> = ({ onDone, onCancel }) => {
  // Form fields in state
  // Validate and call onDone(config) on submit
  // Call onCancel() on dismiss
};
```

The `CollaborationPage` renders this component as a modal overlay when `pendingFlow` is set. On `onDone`, it calls `addTab` with the config; on `onCancel`, it clears `pendingFlow` without creating a tab.

The `onInit` function in the registry receives the config after the contract is deployed and performs the initialization write (e.g., calling `set_config` on the new contract).

---

## 9. Real-Time Event System

### 9.1 `EventStreamService` (`services/eventStream.ts`)

A **singleton** that manages one SSE connection per session.

```typescript
class EventStreamService {
  private source:             EventSource | null;
  private listeners:          Map<EventType, Set<EventListener>>;
  private connectionListeners: Set<ConnectionListener>;
  private reconnectAttempts:  number;

  connect(serverUrl: string, agent: string): void;
  disconnect(): void;
  addEventListener(type: EventType, listener: EventListener): void;
  removeEventListener(type: EventType, listener: EventListener): void;
  addConnectionListener(listener: ConnectionListener): void;
  isConnectedToStream(): boolean;
}

export const eventStreamService = new EventStreamService(); // singleton
```

SSE endpoint: `${serverUrl}/stream?agent=${agent}`

Event types: `contract_write`, `deploy_contract`, `a2a_connect`

On reconnect, the service uses exponential backoff (max 5 retries) before giving up.

### 9.2 React Hooks (`hooks/useEventStream.ts`)

```typescript
// Listen for a specific event type
useEventStream(eventType: string, listener: (event: MessageEvent) => void): void

// Monitor connection status
useEventStreamConnection(): { isConnected: boolean }
```

`useEventStream` wraps `addEventListener` / `removeEventListener` with cleanup on unmount. Listener stability is managed with `useRef` to avoid stale closure issues.

### 9.3 Event-Driven Data Refresh Pattern

Components that need to stay current with other users' writes use this pattern:

```tsx
useEventStream('contract_write', useCallback((event) => {
  const data = JSON.parse(event.data);
  if (data.contractId === instanceId) {
    void load();  // Re-fetch the contract data
  }
}, [instanceId, load]));
```

### 9.4 Auto Contract List Refresh

In `AuthContext`, a `deploy_contract` listener is registered immediately after login:

```typescript
eventStreamService.addEventListener('deploy_contract', () => {
  dispatch(fetchContracts());
});
```

This ensures the user's sidebar contract list updates automatically when they deploy a new flow from any tab.

---

## 10. Authentication and Identity

### 10.1 `AuthContext` (`contexts/AuthContext.tsx`)

Provides `{ isAuthenticated, isLoading, login, logout }` to the entire component tree.

**`login(publicKey, serverUrl)`:**

```
1. Persist { publicKey, serverUrl } to localStorage
2. dispatch(setCurrentUser({ publicKey, serverUrl }))
3. eventStreamService.connect(serverUrl, publicKey)
4. Register 'deploy_contract' SSE listener → dispatch(fetchContracts())
5. dispatch(initializeUser())
   ├── isExistAgent()
   │   └── if not found → registerAgent()
   ├── fetchContracts()
   └── readProfile()
       └── if no profile contract → deployContract(gloki_contract.py)
```

**`logout()`:**

```
1. Remove localStorage entry
2. dispatch(clearUser())
3. eventStreamService.disconnect()
```

### 10.2 Session Persistence

On `App.tsx` mount, `AuthProvider` reads `localStorage` for stored credentials. If found, it dispatches `initializeUser()` silently, restoring the session without requiring re-login.

### 10.3 Public Key Validation

Login enforces that the public key is exactly 64 alphanumeric hexadecimal characters. This mirrors the Gloki network's key format requirement.

### 10.4 `master()` Built-in

In smart contract Python code, `master()` returns the public key of the agent making the current call. This is the primary identity mechanism inside contracts — there are no usernames, and all data can be attributed to a public key.

---

## 11. Routing and Navigation

### 11.1 Route Definitions (`App.tsx`)

```
/                                                        → redirect to /identity
/identity/*                                             → IdentityView
/community/:communityId/*                               → CommunityView
/initiative/:hostServer/:hostAgent/:communityId/:id/*   → InitiativeView
/wish/:communityId/:wishId/*                            → WishView
/agreement/:communityId/:agreementId                    → AgreementView
/issue/:hostServer/:hostAgent/:communityId/:issueId/*   → IssueView
```

### 11.2 URL Parameter Design

Initiative and Issue URLs encode the **host server** and **host agent** in the path. This is required because the decentralized architecture means a contract can live on any user's server. By embedding the coordinates in the URL, the application can deep-link to any resource across the network without a central resolver.

URLs are base64 or URI-encoded where the server URL contains special characters.

### 11.3 Navigation State

When navigating to a collaboration page (wish, initiative, agreement), the originating component passes the full collaboration object in React Router's `state`:

```typescript
navigate(`/wish/${communityId}/${item.id}/related`, { state: { wish: item } });
```

The destination page reads `location.state` to pre-populate data before its async fetches complete, eliminating perceived loading latency.

### 11.4 Nested Routing in Views

Multi-tab pages (`IdentityView`, `CommunityView`, `InitiativeView`, etc.) use nested `<Routes>` with the `/*` wildcard on the parent:

```tsx
<Routes>
  <Route path="profile"      element={<Profile />} />
  <Route path="communities"  element={<Communities />} />
  <Route path="join"         element={<JoinCommunity />} />
  <Route path="*"            element={<Navigate to="profile" replace />} />
</Routes>
```

The active tab is reflected in the URL, making deep links and browser back/forward work correctly.

---

## 12. Key Data Models

### 12.1 Core Interfaces (`services/interfaces.ts`)

```typescript
interface IContract {
  id:           string;                       // Contract ID on its server
  name:         string;
  contract:     string;                       // Python class name
  code:         string;                       // Python source
  protocol:     string;
  pid:          string;                       // Owner's public key
  address:      string;                       // Owner's server URL
  group:        string[];
  threshold:    number;
  profile:      string | null;                // Linked profile contract ID
  constructor:  Record<string, unknown>;
}

interface IMethod {
  name:         string;                       // Python method name
  arguments?:   string[];
  values?:      Record<string, unknown>;      // Named parameters
  parameters?:  Record<string, unknown>;
}

interface IProfile {
  firstName:    string;
  lastName:     string;
  userPhoto:    string;                       // Base64 image
  userBio:      string;
  openaiApiKey?: string;
}
```

### 12.2 Flow Reference

```typescript
interface FlowRef {
  id:     string;   // Contract ID on the owner's server
  server: string;   // Owner's server URL
  agent:  string;   // Owner's public key
  type:   string;   // Flow type ID (e.g., 'ranking', 'scheduling')
}
```

### 12.3 Collaboration Tab (local UI state)

```typescript
interface CollaborationTab {
  instanceId: string;   // = FlowRef.id
  flowId:     string;   // = FlowRef.type
  flowServer: string;   // = FlowRef.server
  flowAgent:  string;   // = FlowRef.agent
}
```

### 12.4 Flow Data Models (selected)

```typescript
// Scheduling
interface RangeConfig {
  title: string; description: string; organizerId: string;
  startDate: string; endDate: string;
  dailyStart: number; dailyEnd: number;   // hours (0–23)
  slotMinutes: number;                    // granularity
}
interface ParticipantSelection {
  participantId: string;
  slots: number[];                        // flat global slot indices
}

// Task Board
interface Task {
  id: string; title: string; description: string;
  ownerId: string | null;
  status: 'backlog' | 'in-progress' | 'done';
  createdBy: string; createdAt: number;
}

// Roles
interface Role {
  id: string; name: string; description: string;
  createdBy: string; createdAt: number;
  assignees:        string[];
  purpose:          string;
  responsibilities: RoleItem[];
  autonomy:         RoleItem[];
  authorities:      RoleItem[];
  boundaries:       RoleItem[];
  votes:            Record<string, Record<string, 'approve' | 'disapprove'>>;
}
// Vote key scheme:
//   'purpose'        → vote on purpose text
//   'holder_<id>'    → vote on a role holder
//   'item_<id>'      → vote on a list item

// Fundraising
interface FundConfig { name: string; description: string; goal: number | null; }
interface Contribution { id: string; participantId: string; amount: number; timestamp: number; }

// Discussion
interface Comment { id: string; author: string; text: string; parentId: string | null; timestamp: number; }
```

---

## 13. UI Patterns and Component Design

### 13.1 Design Tokens

All visual constants are defined in `styles/variables.scss` and imported into component SCSS files via `@use '../../../../styles/variables' as *`. This covers:

- **Colors:** `$primary`, `$warning`, `$error`, `$success`, `$gray-100` through `$gray-900`
- **Spacing:** `$spacing-xs`, `$spacing-sm`, `$spacing-md`, `$spacing-lg`, `$spacing-xl`, `$spacing-2xl`, `$spacing-3xl`
- **Typography:** `$text-xs` through `$text-2xl`, `$font-normal`, `$font-medium`, `$font-semibold`, `$font-bold`
- **Shape:** `$radius-sm`, `$radius-md`, `$radius-lg`, `$radius-full`
- **Effects:** `$shadow-sm`, `$shadow-base`, `$shadow-lg`, `$transition-base`

### 13.2 Modal Dialog Pattern

Setup dialogs (Scheduling, Fundraising, and community dialogs) use a consistent structure:

```
.overlay   → fixed full-screen backdrop (rgba black, z-index 1000)
  .dialog  → centered white box (max-width ~520px, max-height 90vh, overflow-y: auto)
    .header         → title + close (×) button
    .dialogContent  → form fields (gap: spacing-lg)
    .dialogActions  → Cancel + Confirm buttons (right-aligned, gray-50 background)
```

### 13.3 Flow Card Pattern

Many flows (Roles, Task Board, Concerns) use a card layout:

```
.card          → white, border, border-radius, box-shadow
  .cardHeader  → flex row: expand toggle + title + action buttons
  .cardBody    → collapsible content (sections with titles and items)
```

### 13.4 Collapsible Card (Roles)

Role cards use a `useState(false)` expanded flag toggled by a chevron button. The card header (name, assignees, join/leave) is always visible. The `cardBody` with all five role definition sections renders only when `expanded === true`.

Vote buttons on assignees are shown only when `expanded && !isHolder`, keeping the collapsed view clean.

### 13.5 Inline Edit Pattern

List items (role sections, task descriptions) use inline edit state:

```typescript
const [editId,   setEditId]   = useState<string | null>(null);
const [editText, setEditText] = useState('');

// Show input when editId === item.id
// Commit on Enter or ✓ button
// Cancel on Escape or × button
```

### 13.6 Optimistic UI

For voting (Concern Resolution, Role Nomination), the new vote state is computed client-side and sent to the contract in a single write. The UI does not wait for the write to confirm before re-rendering — it re-fetches after the write completes (or on error, can re-fetch to restore truth).

### 13.7 Drag-to-Select (Scheduling Heatmap)

The scheduling grid implements a drag-to-select interaction using `mousedown`, `mouseenter`, and a global `mouseup` handler:

- `dragModeRef` — `'select' | 'deselect' | null`, set on `mousedown` based on current slot state
- `draggedRef` — set of slot indices touched during the current drag
- `persistedRef` — confirmed slots (written to contract)
- `effectiveSlots` — `persistedRef ∪ draggedRef` (or `persistedRef ∖ draggedRef` in deselect mode)

All drag state lives in `useRef` (not `useState`) to avoid re-render overhead during drag, with a single `useState` trigger at the end of each drag to commit the effective slots to the UI and contract.

---

## 14. Build and Configuration

### 14.1 Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  // SCSS variables auto-imported via additionalData or @use in each file
});
```

Python contract files in `src/assets/contracts/` are imported as raw strings using Vite's `?raw` import suffix:

```typescript
import rankingSource from '../../assets/contracts/ranking_flow_contract.py?raw';
```

This embeds the Python source as a JavaScript string at build time, enabling the frontend to deploy contracts without a separate file download.

### 14.2 TypeScript Configuration

- `tsconfig.app.json` targets ES2020 with strict mode enabled.
- Path aliases are not used; all imports are relative paths.
- `"moduleResolution": "bundler"` enables Vite's module resolution.

### 14.3 NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint with TypeScript rules |

### 14.4 Environment

No `.env` files are required for basic operation. The server URL is provided at runtime by the user during login and stored in `localStorage`. There are no build-time API keys or environment-specific configuration.
