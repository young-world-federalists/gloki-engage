---
name: gloki-frontend-architecture
description: "Use when navigating or changing the Communities2/Gloki React app structure: finding where flows/components/slices/routes live, adding a flow, a route or a page's demo variant (Page.demo.tsx, useDemoMode), choosing useFlowContract vs resolveInitiativeStageContract, touching Redux state or localStorage persistence, wondering why a display component deployed a contract, why data vanished on reload, why /welcome redirect fires, or where FlowProps/registry/App.tsx route map are defined. Keywords: flow registry, shared mode, single-contract mode, stageKey, flowContractsSlice, frozen route map, ?demo=true."
---

# Gloki Frontend Architecture

## Overview

Communities2 is a React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules SPA: **one app on the real
network, where any page can also show its demo variant at `?demo=true`** (`docs/DEMO_MODE.md`). It is
organised around a few comment-enforced invariants:

- Components reach data only through **the seam**, `src/services/` — real variants through the real
  services, demo variants through `src/services/demo/` (**gloki-seam-and-demo-data**).
- Each page with two states is a switch: `useDemoMode() ? <PageDemo /> : <PageReal />`, with the demo
  variant in `Page.demo.tsx`.
- The top-level route map in `App.tsx` is frozen in shape.
- Three Redux slices persist themselves to localStorage inside their reducers.
- **`useFlowContract` deploys a contract as a side effect of mounting** — the most expensive trap in the
  codebase.

Nothing is enforced by tests (there is no test framework).

## When NOT to use this skill

| You are actually trying to… | Use instead |
|---|---|
| Push gates, locked decisions, change classes | **gloki-change-control** |
| Run a session end-to-end | **gloki-session-lifecycle** |
| Install, run, build, deploy, the local node | **gloki-build-env-run** |
| Real vs demo data, fixtures, seeding, DEMO_VERSION | **gloki-seam-and-demo-data** |
| Write or modify a Python contract | **gloki-python-contracts** |
| QV math, mandates, trust, pipeline semantics | **gloki-governance-domain** |
| Debug a symptom | **gloki-debugging-playbook** |
| Translations, fr/sw parity | **gloki-i18n-playbook** |
| Which doc is authoritative / update docs | **gloki-docs-and-writing** |
| Delete code / trace consumers | **gloki-refactor-and-dead-code** |
| Verify a change works | **gloki-verification-and-qa** |

## Directory map of `src/`

```
src/
├── App.tsx            # FROZEN route map + RootRoute (first-run → /welcome)
├── appMode.ts         # the beta build flag (VITE_APP_MODE) — the only reader
├── main.tsx
├── assets/contracts/  # the Python contracts (real ones + references) — gloki-python-contracts
├── components/
│   ├── AppHeader.tsx        # single banner landmark, one per page (DESIGN_SYSTEM.md)
│   ├── collaboration/       # flows/ live HERE, stage views, panels
│   ├── community/           # community home, chat, currency/funding, identity & trust
│   ├── identity/            # communities, profile, join, verification/*, notifications, agent/
│   ├── initiative/          # issue dashboard, stage cards, solutions board
│   ├── mandate/             # published-mandate page
│   ├── onboarding/          # /welcome flow
│   ├── stages/              # stage-feed components
│   └── shared/              # kit (barrel index.ts): Card, Button, Modal, EmptyState, Banner,
│                            #   Badge, SearchableSelect, StageFooter, …
├── contexts/AuthContext.tsx # persists {publicKey, serverUrl} under localStorage 'user'
├── hooks/             # useDemoMode (+ DemoFlagUrlSync, withDemo), useInitiativeFound, useVerificationRegistry,
│                      #   useVerification, useCommunityTrust, useInitiativeHostReady,
│                      #   useAllInitiatives, useEventStream, useMandate, …
├── i18n/              # hand-rolled provider: index.tsx + en.ts/fr.ts/sw.ts + types.ts
├── pages/             # route-level views: HomeView, StageFeedView, CommunityView,
│                      #   IdentityView, Create*Page, LoginPage, ForumPage, collaboration/InitiativeView
├── services/          # THE SEAM: api.ts, contractHosts.ts, contracts/, verificationRegistry.ts,
│                      #   applicationSettings.ts, applicationServer.ts, eventStream.ts,
│                      #   verification.ts, forum.ts, trust.ts, trustModel.ts, … + demo/ (the demo layer)
├── store/             # index.ts + slices/
├── styles/            # variables.scss = token source of truth
├── types/initiative.ts
└── utils/             # countries.ts (197), regions.ts, displayName, formatTimeAgo, …
```

## A page with two states

Every route element is wrapped as `TwoStatePage`, `RealOnlyPage` or `DemoOnlyPage`
(`src/components/shared/PageModes.tsx`); the wrapper sets the page's data layer while it renders and
shows the right notice. Most two-state pages render the same component in both states — the data layer
is what changes. A page with a separate demo variant passes both:

```tsx
// src/components/identity/Communities.tsx
const Communities: React.FC<CommunitiesProps> = (props) => (
  <TwoStatePage real={<CommunitiesReal {...props} />} demo={<CommunitiesDemo {...props} />} />
);
```

`CommunitiesDemo` lives in `Communities.demo.tsx`. Pick a whole component per state — never branch on
the flag inside one (hooks can't be conditional). Pages that decide per sub-path do it themselves:
`CommunityView` (real-only Identity & Trust / Start an initiative, the flag elsewhere, and the community
looked up with `communitiesForMode`) and `InitiativeView` (two-state discussion with "not found",
demo-only suggest/collaboration). Each page's kind: `docs/DEMO_MODE.md`.

## Flows: location, registry, props

**Flows live at `src/components/collaboration/flows/` — not `src/flows/`.** Short paths in docs
(`flows/shared/useFlowContract.ts`) are relative to `src/components/collaboration/`.

Contents: `registry.ts`, `types.ts`, `shared/` (`useFlowContract.ts`, `flowContractsSlice.ts`,
`useContractSync.ts`, `stageMetrics.ts`, `CountryBadge.tsx`), plus `concerns/ discussion/ funding/ merge/
modifications/ roles/ voting/`.

**Registry** (`registry.ts`): `FLOW_REGISTRY` holds 5 `FlowDefinition`s — `approval`, `quadratic`
(QVFlow), `concerns` with `context: 'initiative'`; `discussion` and `roles` with `context: 'collab'`.
`context` separates the community collab "Add Tab" menu (`'collab'`) from the governance pipeline
(`'initiative'`); omitted = both. `getFlow(id)` looks one up.

**FlowProps** (`flows/types.ts`):

```ts
interface FlowProps {
  instanceId: string;
  collaborationId: string;
  collaborationType: 'initiative' | 'wish' | 'agreement' | 'collab';
  parentContractId?: string;  // parent contract for shared mode
  stageKey?: string;          // key under the parent that stores the sub-contract
}
```

## useFlowContract: modes and THE trap

`useFlowContract(instanceId, contractName, contractFileName, contractCode, parentContractId?, stageKey?)`
returns `{ contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry }`.

| Mode | When | What happens |
|---|---|---|
| **Single-contract** | shared mode with a **real** parent (`isSingleContract`) | Resolves straight to the parent: a real issue contract holds every stage, so stage components read and write the issue contract itself. No deploy, no join |
| **Shared** | `parentContractId` + `stageKey` with a demo parent | Probe `get_stage_contract` on the parent → join the stored sub-contract, or deploy one and `register_stage_contract` it (first write wins; a lost race joins the winner) |
| **Per-user** | no parent | Each user deploys their own (collab flows) |

Shared-mode safeguards: if the parent lacks `get_stage_contract` (an older community), **fail fast with
"This feature isn't available on this community…" without deploying** (contracts can't be deleted);
`DEPLOY_TIMEOUT_MS = 30_000`; stale `deploying` flags are cleared on mount; deploys wait for the
flowContracts slice to be hydrated for the current identity (`scopeReady`); logs are prefixed
`[FlowContract]`. These are comment-enforced — preserve the fail-fast ordering if you touch it.

### THE trap: useFlowContract deploys on mount

A display-only preview card once called `useFlowContract` and silently deployed contracts on every
render. **Read-only components use `resolveInitiativeStageContract`**
(`src/services/contracts/initiative.ts`), which only reads (for a real issue it simply returns the issue
contract). Decision rule: *only displays data?* → `resolveInitiativeStageContract`; *lets the user write
to a flow it owns?* → `useFlowContract`.

## Redux slices (6, `src/store/index.ts`)

| Slice | File | Owns | Persistence |
|---|---|---|---|
| `communities` | `store/slices/communitiesSlice.ts` | community properties/members/collaborations (`Record<contractId,…>`), `initiativeStages` (wire value `proposals` for Solutions), `profiles: Record<publicKey, IProfile>` | not persisted |
| `user` | `store/slices/userSlice.ts` | publicKey, serverUrl, contracts, `digitalAgentProfile` / `digitalAgentContractId` / `digitalAgentProfileChecked` (the real profile contract), the older `profile` / `profileContractId` | not persisted (AuthContext stores `'user'`) |
| `currency` | `store/slices/currencySlice.ts` | funding view state | not persisted |
| `flowContracts` | `flows/shared/flowContractsSlice.ts` | instanceId → contractId cache, `deploying` flags, `storageScope` | **self-persists**, identity-scoped key `flowContracts:<serverUrl>::<publicKey>` |
| `preferences` | `store/slices/preferencesSlice.ts` | starred[] / hidden[] community ids | **self-persists**, `'communityPreferences'` |
| `notifications` | `store/slices/notificationsSlice.ts` | notification items | **self-persists**, identity-scoped (`storageScope`) |

Real and demo variants share this store; disjoint ids (`demo-…` vs hex) keep their entries apart.

**Persistence rule:** the self-persisting slices write localStorage inside their reducers. A new reducer
that mutates persisted state MUST call the slice's save helper, or the change vanishes on reload. In
flowContractsSlice call `current(state)` before saving (Immer drafts can't be serialised). Identity-scoped
stores follow `buildFlowContractsScope` + `hydrateContracts` (dispatched from `AuthContext.tsx`).

Other localStorage keys: `'user'`, `'gloki.locale'`, `'gloki.dataSaver'`, `gloki.digitalAgent:<scope>`
(trust-graph cache), plus the demo layer's `gloki_demo_*`.

## Routing: the frozen route map

`App.tsx` routes:

```
/                                         → RootRoute (first-run → /welcome; else HomeView, or /forum in the beta)
/welcome/*                                → OnboardingFlow
/stage/:stageId                           → StageFeedView
/identity/*                               → IdentityView (communities, hidden, profile, join, verification/*, notifications, about, contact)
/create-community                         → CreateCommunityPage
/community/:communityId/*                 → CommunityView
/initiative/:initiativeHostServer/:initiativeHostAgent/:communityId/:initiativeId/* → InitiativeView
/mandate/:communityId/:mandateId/*        → MandatePage
/organization                             → OrganizationHome
/forum                                    → ForumPage (beta build only)
/lab/presence                             → PresenceLabRoute (dev page)
*                                         → NotFound
```

Each area is a `/*` wildcard; new sub-routes go inside the area's component. A new top-level route is a
product decision (**gloki-change-control**). Demo variants need no routes — same URL plus `?demo=true`.

- The issue route carries the creator's node and agent: `InitiativeView` registers them with
  `contractHosts` before any child reads. Routes without them (`/mandate/…`) wait for
  `useInitiativeHostReady`, which loads the community's issue list first.
- `BrowserRouter` basename comes from the Vite base; pages lazy-load in `Suspense` inside
  `ErrorBoundary`; `<StageFooter/>` renders after `Routes` (not in the beta).
- **First run** is decided by the real profile contract: `RootRoute` waits for
  `digitalAgentProfileChecked`, then sends anyone without a `digitalAgentProfile` to `/welcome`.

## i18n in one paragraph (details: gloki-i18n-playbook)

Hand-rolled i18n: `src/i18n/index.ts` (hooks, `translate`), provider in `src/i18n/I18nProvider.tsx`. Locales `en`/`fr`/`sw`; flat dot-namespaced keys; lookup
falls back active locale → en → inline default → key. **English copy lives inline** as
`t('ns.key', 'English default')`; `en.ts` holds only shared shell strings, while `fr.ts`/`sw.ts` are
full overlays at strict key + `{var}` parity. The beta build hides the language switcher.

## Styling in one paragraph (law: DESIGN_SYSTEM.md)

SCSS Modules, one `X.module.scss` per component. **No ad-hoc values** — every colour/space/radius/
shadow/font-size from a token in `src/styles/variables.scss`; `rgba($token, 0.1)` is fine. Prefer the
shared kit. DESIGN_SYSTEM.md is the authority.

## Known weak points

| Weak point | Detail |
|---|---|
| **Metric label as join key in useMandate** | `src/hooks/useMandate.ts` merges ratification data onto indicators **by metric label string** (`ratification?.indicators[label]`). Renaming a metric orphans its entered target/baseline/cadence |
| **Comment-enforced invariants** | Shared-mode fail-fast ordering, the frozen route map and the reducer-must-save rule are enforced only by comments + this skill |
| **One data layer at a time** | The page's layer is one module setting; an async call from the previous page finishing after a navigation can land in the new page's layer |
| **`/lab/presence` ships to production** | A dev page reachable on the deployed site; removing it is a product call |
| **No read-only flag on useFlowContract** | The deploy-on-mount trap stays live for new code |
| **Wire-name split** | UI says "Solutions"; stage keys, i18n families and contract methods stay `proposals`/`proposal` |

## Worked examples

**Giving a page a demo variant** (Eston's path):

1. If the existing component can show demo data as is, wrap its route with `TwoStatePage` (or
   `DemoOnlyPage` while it has no real side) and add the demo stubs/fixtures it needs.
2. For a different design, put it in `Page.demo.tsx` as `PageDemo` and pass both:
   `<TwoStatePage real={<PageReal />} demo={<PageDemo />} />`.
3. New demo data → `src/services/demo/fixtures/*` (+ `DEMO_VERSION` bump) — **gloki-seam-and-demo-data**.
4. Update the page's row in `docs/DEMO_MODE.md`; strings via `t()` with fr/sw.

**Adding an issue-pipeline flow**:

1. `src/components/collaboration/flows/myflow/MyFlow.tsx` accepting `FlowProps`; provision with
   `useFlowContract(instanceId, 'myflow', 'myflow_contract.py', code, parentContractId, stageKey)` and
   render the `hasError` state.
2. Real side: the methods go on the real issue contract (single-contract mode), member-specific ones take
   `agent` and join `INITIATIVE_MEMBER_METHODS` — **gloki-python-contracts**. Demo side: a handler in
   `src/services/demo/demoContracts/` registered in `demoRouter.ts`. Both in `docs/FOR_OURI_seam.md`.
3. Register in `registry.ts` with `context: 'initiative'` and a `group`.
4. Refresh after writes per layer (demo: re-fetch; real: the write's event + `useContractSync`).
5. Strings through `t()` + fr/sw; styles token-only; `npx tsc -b` and `npm run build` clean; walk it in
   the app (**gloki-verification-and-qa**).

## Provenance and maintenance

Rewritten 2026-10-29 on branch `unified`. Re-verify before relying on these:

| Claim | Re-verify with |
|---|---|
| Flows dir | `find src -maxdepth 3 -type d -name flows` |
| Registry contents | `grep -n "id: '" src/components/collaboration/flows/registry.ts` |
| Single-contract mode | `grep -n isSingleContract src/components/collaboration/flows/shared/useFlowContract.ts` |
| Slice list | `src/store/index.ts` |
| Route map | `grep -n "path=" src/App.tsx` |
| First-run rule | `grep -n "digitalAgentProfile" src/App.tsx` |
| Pages with two states | `git ls-files '*.demo.tsx'` |
| useMandate label join | `grep -n "indicators\[label\]" src/hooks/useMandate.ts` |
