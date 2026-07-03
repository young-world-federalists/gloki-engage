---
name: gloki-frontend-architecture
description: "Use when navigating or changing the Communities2/Gloki React app structure: finding where flows/components/slices/routes live, adding a flow or route, choosing useFlowContract vs resolveInitiativeStageContract, touching Redux state or localStorage persistence, wondering why a display component deployed a contract, why data vanished on reload, why /welcome redirect fires, or where FlowProps/registry/App.tsx route map are defined. Keywords: flow registry, shared mode, stageKey, flowContractsSlice, frozen route map."
---

# Gloki Frontend Architecture

## Overview

Communities2 is a React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules SPA on
branch `ui` — a UI-only mockup where every "backend" call is answered locally by a mock
layer. The **core principle**: the app is organized around one seam and a few
comment-enforced invariants. Every component reads/writes contracts ONLY through
`src/services/api.ts` (the **seam** — the boundary Ouri swaps for real server calls),
the route map in `App.tsx` is frozen, three Redux slices persist themselves to
localStorage inside their reducers, and the single most expensive trap in the codebase
is that **`useFlowContract` deploys a contract as a side effect of mounting**. Nothing
here is enforced by tests (there is no test framework) — the invariants live in
comments and in this skill. Read the relevant section before touching structure.

Definitions used throughout:

- **Seam** — `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/`joinContract`), currently delegating to the `src/services/demo/` mock layer. Details: **gloki-seam-and-demo-data**.
- **Flow** — a pluggable governance/collaboration widget (voting, discussion, concerns…) rendered from a registry, each backed by its own Python contract.
- **Shared mode** — `useFlowContract`'s join-or-deploy mode where all community members share one sub-contract registered on a parent contract (vs per-user deploy).
- **Wire names** — Python contract method/field names (`add_proposal`, `get_results`…) that must match Ouri's real contracts exactly even when UI copy says "solution"/"mandate".
- **DEMO_VERSION** — version gate (`'global-v16'` at `src/services/demo/mockApi.ts:17`) that wipes and re-seeds all demo localStorage when bumped.

## When NOT to use this skill

| You are actually trying to… | Use instead |
|---|---|
| Understand push gates, locked product decisions, scope rules | **gloki-change-control** |
| Run a session end-to-end (prompt → spec → build → push) | **gloki-session-lifecycle** |
| Install deps, run dev server, build, deploy, slow-drive I/O rules | **gloki-build-env-run** |
| Change the mock layer, fixtures, seeding, DEMO_VERSION, IMethod shapes | **gloki-seam-and-demo-data** |
| Write or modify a Python contract | **gloki-python-contracts** |
| Understand QV math, mandates, trust, pipeline semantics | **gloki-governance-domain** |
| Debug a symptom (blank page, stale data, deploy loop) | **gloki-debugging-playbook** |
| Add/verify translations, fr/sw parity | **gloki-i18n-playbook** |
| Know which doc is authoritative or update docs | **gloki-docs-and-writing** |
| Delete code / trace consumers / recompose a component | **gloki-refactor-and-dead-code** |
| Verify a change is actually working | **gloki-verification-and-qa** |

## Directory map of `src/` (verified by listing, 2026-07-02)

```
src/
├── App.tsx          # FROZEN route map (see Routing) + RootRoute first-run redirect
├── main.tsx
├── assets/          # incl. assets/contracts/ — the only 2 real .py contract sources
├── components/
│   ├── AppHeader.tsx        # single banner landmark, one per page (DESIGN_SYSTEM.md)
│   ├── collaboration/       # flows/ live HERE (see next section), stage views, panels
│   ├── community/           # community home, chat, currency/funding
│   ├── identity/            # profile, digital agent, onboarding agent store
│   ├── initiative/          # initiative dashboard, stage cards, useMandateJourney
│   ├── mandate/             # published-mandate page (MandatePage)
│   ├── onboarding/          # /welcome flow
│   ├── stages/              # stage-feed components
│   └── shared/              # kit: Card/Button/Modal/EmptyState/Banner/Badge (barrel
│                            #   index.ts), SearchableSelect, CountryParticipation,
│                            #   SourceLinks, connectivity kit (SmartImage, OfflineBanner,
│                            #   useOnline, DataSaverToggle), presence/ (dev-lab only)
├── contexts/AuthContext.tsx # persists {publicKey, serverUrl} under localStorage 'user';
│                            #   dispatches hydrateContracts on identity change
├── hooks/           # useAllInitiatives, useCommunityTrust, useEventStream, useMandate,
│                    #   useSwipeNavigation (useSwipeRef callback ref), useUrlData
├── i18n/            # hand-rolled provider: index.tsx + en.ts/fr.ts/sw.ts + types.ts
├── pages/           # route-level views: HomeView, StageFeedView, CommunityView,
│                    #   IdentityView, Create*Page, LoginPage, NotFound,
│                    #   collaboration/InitiativeView
├── services/        # api.ts (THE SEAM), demo/ (mock layer), contracts/ (typed wrappers:
│                    #   gloki|community|initiative), eventStream.ts (real SSE client the
│                    #   demo layer NEVER feeds), interfaces.ts (IMethod), trust.ts,
│                    #   trustModel.ts, mandateRatification.ts, ai.ts, initiativeRoles.ts
├── store/           # index.ts + slices/ (see Redux map)
├── styles/          # variables.scss = the token source of truth, globals, animations
├── types/initiative.ts
└── utils/           # countries.ts (197 countries), regions.ts (6 world regions),
                     #   displayName, formatTimeAgo, localSecrets, sources, urlSafety…
```

## Flows: location, registry, props

**Flows live at `src/components/collaboration/flows/` — NOT `src/flows/`.** CLAUDE.md
and other docs write short paths like `flows/shared/useFlowContract.ts`; those are
relative to `src/components/collaboration/`. A model trusting the short path literally
wastes time searching or, worse, creates a duplicate directory. Verify anytime:

```bash
find src -maxdepth 3 -type d -name flows   # → ./components/collaboration/flows (only hit)
```

Contents: `registry.ts`, `types.ts`, `shared/` (`useFlowContract.ts`,
`flowContractsSlice.ts`, `stageMetrics.ts`, `CountryBadge.tsx`), plus flow dirs
`concerns/ discussion/ funding/ merge/ modifications/ roles/ voting/`.

**Registry** (`registry.ts`): `FLOW_REGISTRY` holds 5 `FlowDefinition`s —
`approval`, `quadratic` (QVFlow), `concerns` with `context: 'initiative'` (group
"Decision Making"); `discussion` and `roles` with `context: 'collab'`. `context`
separates flows shown in the community collab "Add Tab" menu (`'collab'`) from flows
used by the governance pipeline (`'initiative'`); omitted = shown in both.
`getFlow(id)` is the lookup helper; `FLOW_GROUPS` orders menu sections.

**FlowProps** (`flows/types.ts`, verified exact):

```ts
interface FlowProps {
  instanceId: string;
  collaborationId: string;
  collaborationType: 'initiative' | 'wish' | 'agreement' | 'collab';
  parentContractId?: string;  // parent contract for shared mode
  stageKey?: string;          // key under parent's details storing the sub-contract
}
```

`FlowDefinition = { id, label, icon, component, group?, context?: 'collab'|'initiative', isAvailable?(existingFlowIds) }`.

## useFlowContract: two modes, resilience, and THE trap

`useFlowContract(instanceId, contractName, contractFileName, contractCode, parentContractId?, stageKey?)`
(at `flows/shared/useFlowContract.ts`) returns
`{ contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry }`.
Mode selection: `isShared = !!parentContractId && !!stageKey` — passing BOTH switches
to shared mode; otherwise per-user.

| | Per-user mode | Shared mode |
|---|---|---|
| Who gets a contract | Each user deploys their own | All members share one, registered on the parent |
| Used by | Collab flows (discussion, roles in collab context) | All initiative dashboard flows (SolutionsBoard, QVFlow, DiscussionEngage…) |
| Sequence | `deployContract` → `setContract` | Probe parent → join existing OR deploy + register (below) |

**Shared-mode sequence** (verified in source, lines 138–274):

1. `contractRead` `get_stage_contract` on the parent **first**. If the method throws
   (communities created before the stage-contract registry existed), **fail fast with
   "This feature isn't available on this community…" WITHOUT deploying**. The comment
   at line 140 records why: the old code deployed first and discovered the missing
   registry afterwards, leaving an orphan immutable contract on every visit
   (contracts can never be deleted — see gloki-python-contracts).
2. If a stored sub-contract exists → `joinContract` (join failure swallowed = already
   joined) → `setContract`.
3. Else `deployContract`, then `contractWrite` `register_stage_contract`
   `{stage_key, contract_id, address, agent}` on the parent. A registration that
   returns an `error` or a missing `contractId` ALSO fails fast (old community —
   don't adopt the orphan). If another client won the registration race
   (`returned contractId !== newId`), join the winner's contract instead.

**Resilience features** (all verified): `DEPLOY_TIMEOUT_MS = 30_000` force-errors a
hung deploy; a stale-deploying-flag recovery effect on mount clears a `deploying` flag
left by a previous session (`[FlowContract] Clearing stale deploying flag`); all
diagnostics are prefixed `[FlowContract]` (grep the console for that); deploys are
gated on `scopeReady` (the flowContracts slice must be hydrated for the current
identity — see Redux map). Return-shape guard: `deployContract` may return `{id}` or a
plain string; the hook handles both — copy that pattern
(`(response as { id?: string }).id || (response as string)`).

**These invariants are comment-enforced only.** No test or type stops a future edit
from re-introducing the deploy-before-probe orphan bug. If you touch shared mode,
re-read the comments at lines 140–145 and 237–240 and preserve the fail-fast ordering.

### THE trap: useFlowContract deploys on mount

`useFlowContract` = **provision + subscribe**. Its mount effect ALWAYS walks the
deploy path if no contract is cached. Historical incident (S11, 2026-07-01, recorded
in project memory): a display-only preview card called `useFlowContract` and silently
deployed contracts on every render of a "read-only" screen — contracts that are
immutable and can never be removed.

**Rule: read-only components use `resolveInitiativeStageContract`, never
`useFlowContract`.**

`resolveInitiativeStageContract(serverUrl, publicKey, contractId, stageKey)` at
`src/services/contracts/initiative.ts:65` (verified) reads `get_stage_contract`,
falls back to `get_details` for older immutable contracts, returns
`InitiativeStageContract | null`, and **deploys nothing**. Verified consumers:
`useInitiativePost`, `useMandateJourney`, `VotePreview`, `InitiativeStagePanel`,
`stageMetrics`. Interactive flows that legitimately own their contract
(SolutionsBoard, ApprovalFlow, QVFlow, DiscussionEngage, ChatTopic, ConcernsFlow…)
are the `useFlowContract` callers. A sibling `resolveAndJoinInitiativeStageContract`
exists in the same file for read-then-join cases.

Decision rule: *"Does this component only display data?"* → `resolveInitiativeStageContract`.
*"Does this component let the user write to a flow it owns?"* → `useFlowContract`.
The hook has no read-only flag, so the trap remains live for all new code.

## Redux slices map (6 slices, verified in `src/store/index.ts`)

| Slice | File | Owns | Persistence |
|---|---|---|---|
| `communities` | `store/slices/communitiesSlice.ts` | currentCommunity, communityProperties/Members/ActiveMembers/Tasks/Nominates/Collaborations (all `Record<contractId,…>`), `initiativeStages` (initiativeContractId → `'problem'\|'discussion'\|'proposals'\|'vote'\|'mandate'\|'_unknown'` — note **wire name `proposals`**, UI says "Solutions"), `profiles: Record<publicKey, IProfile>` (global across communities) | NOT persisted |
| `user` | `store/slices/userSlice.ts` | publicKey, serverUrl, profile, profileContractId, contracts | NOT persisted (AuthContext persists `'user'` key itself) |
| `currency` | `store/slices/currencySlice.ts` | funding/currency view state | NOT persisted |
| `flowContracts` | `components/collaboration/flows/shared/flowContractsSlice.ts` | instanceId → contractId cache, `deploying` flags, `storageScope` | **Self-persists** `contracts` only, key `flowContracts:${encodeURIComponent(serverUrl)}::${publicKey}` (identity-scoped) |
| `preferences` | `store/slices/preferencesSlice.ts` | starred[] / hidden[] community IDs | **Self-persists**, key `'communityPreferences'` |
| `notifications` | `store/slices/notificationsSlice.ts` | items[] (only type `'merge_absorbed'`, capped at 100) | **Self-persists**, key `'communityNotifications'` |

**The persistence rule:** the three self-persisting slices write localStorage INSIDE
their reducers via a module-local save helper (`saveToStorage(...)` in
flowContractsSlice; equivalent inline saves in preferences/notifications). **Any new
reducer that mutates persisted state MUST call the slice's save helper, or the change
silently vanishes on reload** — nothing fails at build time, the bug only shows as
"my starred community un-starred itself". In flowContractsSlice, note the RTK idiom:
call `current(state)` before saving (Immer drafts can't be serialized directly).

**flowContracts is identity-scoped:** `buildFlowContractsScope(serverUrl, publicKey)`
builds the scope; `hydrateContracts({scopeKey})` reloads the cache on identity change
(dispatched from `AuthContext.tsx` — verified). `useFlowContract` refuses to deploy
until `storageScope` matches the current identity (`scopeReady`) — this prevents
deploying contracts against a stale user's cache. If you add another identity-scoped
store, copy this scope/hydrate pattern.

Full localStorage key inventory (frontend side): `'user'`, `flowContracts:<scope>`,
`'communityPreferences'`, `'communityNotifications'`, `'gloki.locale'`,
`'gloki.dataSaver'`, `'gloki.onboarding'`, plus the demo layer's `gloki_demo_*` keys
(owned by **gloki-seam-and-demo-data**).

## Routing: the frozen route map

`src/App.tsx` carries a banner comment (lines 13–31, verified): **"FROZEN ROUTE MAP …
lanes must NOT edit App.tsx."** Every area is a `/*` wildcard so features add
sub-routes INSIDE their owned component (e.g. new community tab → sub-route in
`CommunityView`, not a new top-level route). A genuinely new top-level route is
recorded in MASTER_TODO §10 for a Foundation pass — recommend-then-confirm with Eston
(see gloki-change-control), never added ad hoc.

Routes at HEAD (verified, App.tsx lines 113–125):

```
/                                                        → RootRoute (first-run → /welcome, else HomeView)
/welcome/*                                               → OnboardingFlow
/stage/:stageId                                          → StageFeedView
/identity/*                                              → IdentityView
/create-community                                        → CreateCommunityPage
/community/:communityId/*                                → CommunityView
/initiative/:initiativeHostServer/:initiativeHostAgent/:communityId/:initiativeId/*  → InitiativeView
/mandate/:communityId/:mandateId/*                       → MandatePage
/lab/presence                                            → PresenceLabRoute (dev page — see weak points)
*                                                        → NotFound
```

Notes: `BrowserRouter` basename comes from `import.meta.env.BASE_URL` (GitHub Pages
subpath — see gloki-build-env-run); all pages lazy-load in `Suspense` inside
`ErrorBoundary`; the global `<StageFooter/>` renders after `Routes` and
`<OfflineBanner/>` above; demo URL-hash hydration (`tryHydrateFromHash`) blocks render
until settled. CLAUDE.md's routing block omits `/mandate/...` and `/lab/presence` —
App.tsx is the ground truth.

**The isFirstRun pattern and its bug history** (App.tsx lines 55–65, verified): the
first-run check reads the digital-agent store's canonical `'gloki.onboarding'`
localStorage key via `getAgent()` / `getProgress().completed`. The old code checked a
key `'gloki.onboarding.completed'` **that nothing ever wrote**, so every returning
user was redirected back to `/welcome` forever. Lesson, generalized: when gating on a
localStorage key, grep for the WRITER of that key before trusting it —
`grep -rn "gloki.onboarding" src` should show both reader and writer.

## i18n in one paragraph (details: gloki-i18n-playbook)

Hand-rolled provider at `src/i18n/index.tsx` (no i18next). 3 locales — `en`/`fr`/`sw`;
flat dot-namespaced keys; lookup falls back active locale → en → inline default → the
key itself (missing keys are visible, never a crash). **English feature copy lives
inline in components** as `t('ns.key', 'English default')` — `en.ts` is only 117 lines
of shared shell strings, while `fr.ts`/`sw.ts` are full 1,113-key overlays kept at
strict key + `{var}` parity (authoritative count = the gloki-i18n-playbook scanner). Adding
a key to only one overlay is a silent break (fallback hides it). All parity ritual,
scanner recipe, and locale-testing steps belong to **gloki-i18n-playbook**.

## Styling in one paragraph (law: DESIGN_SYSTEM.md)

SCSS Modules, one `X.module.scss` per component. The single hard rule from
DESIGN_SYSTEM.md: **no ad-hoc values** — every colour/space/radius/shadow/font-size
comes from a token in `src/styles/variables.scss`; `rgba($token, 0.1)` is allowed,
literal `rgba(59,130,246,0.1)` is rejected in review. Stage colours mean only
stage/status and always pair with icon+label. Prefer the shared kit
(`components/shared` barrel: Card/Button/Modal/EmptyState/Banner/Badge). Read
DESIGN_SYSTEM.md before any UI change — it is the authority, not this skill.

## Doc authority (details: gloki-docs-and-writing)

When docs disagree: **CLAUDE.md, DESIGN_SYSTEM.md, FOR_OURI_seam.md, MASTER_TODO.md
win over ARCHITECTURE.md and docs/LANES.md**, and the code at HEAD beats all of them.
ARCHITECTURE.md is known-stale in places (still describes a 5-icon StageFooter with
"Proposals" and a `/stage/problem` landing page — both superseded; `/` lands on
HomeView, the footer is a 4-stage "Browse by stage"). Re-ground any spec or prompt
premise against HEAD before building — stale-doc trust is this repo's recurring
failure mode (recorded across S8–S15 project memory).

## Known-weak points (stated plainly — do not "discover" these again)

| Weak point | Detail | Status |
|---|---|---|
| **Metric-label-as-join-key in useMandate** | `src/hooks/useMandate.ts` (~line 131, verified) merges host/expert ratification data onto derived indicators **by metric label string**: `ratification?.indicators[label]`. Renaming a metric in an expert review orphans any previously entered target/baseline/cadence keyed under the old label — it silently reverts to "pending". Labels are de-duped via `Set` to avoid React-key collisions, but the string join remains. | Open fragility. If you rename a seeded metric, migrate or re-enter the ratification data. |
| **Comment-enforced invariants** | The orphan-contract prevention in useFlowContract shared mode, the frozen-route-map rule, and the reducer-must-save persistence rule are all enforced only by comments + this skill. No test framework exists to catch regressions. | Standing condition. Preserve the comments when editing; verification is grep + preview (gloki-verification-and-qa). |
| **ARCHITECTURE.md staleness** | Stale on StageFooter (5 icons vs locked 4-stage IA), "Proposals" naming, and `/` landing route. | Open hygiene debt; trust CLAUDE.md + code. |
| **`/lab/presence` dev route ships to production** | `App.tsx:124` (verified) — `PresenceLabRoute`, a dev verification page for presence primitives, is reachable in the deployed GitHub Pages build. | Known/accepted so far; removing it is a product/scope call for Eston (recommend-then-confirm), not a drive-by cleanup. |
| **No read-only flag on useFlowContract** | The deploy-on-mount trap (above) remains live for new code. | Standing; use resolveInitiativeStageContract for reads. |
| **Demo seam emits no write events** | `eventStream.ts` is a real SSE client the mock layer never feeds — after any `contractWrite` on this branch you must explicitly re-fetch; event-driven refresh paths are dead here. | Permanent characteristic of `ui` (details: gloki-seam-and-demo-data). |
| **Wire-name split is invisible in the UI** | UI says "Solutions"; the stage key in `initiativeStages`, i18n key families, and every contract method stay `proposals`/`proposal`. Renaming for "consistency" breaks Ouri's real-server swap silently. | Locked rule (docs/FOR_OURI_seam.md). |

## Worked example: adding a new initiative-pipeline flow

1. Create `src/components/collaboration/flows/myflow/MyFlow.tsx` accepting `FlowProps`.
2. Provision via the hook — shared mode, since all community members must share one
   contract:
   ```ts
   const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } =
     useFlowContract(instanceId, 'myflow', 'myflow_contract.py', contractCode,
                     parentContractId, stageKey);
   ```
   Render the `hasError` state — old communities will legitimately hit the
   "feature isn't available" path.
3. Contract code: on `ui` there is no real `.py` — the mock layer answers. Add a
   handler in `src/services/demo/demoContracts/` + register it in `demoRouter.ts` +
   document every method in `docs/FOR_OURI_seam.md` (see **gloki-seam-and-demo-data**;
   wire names snake_case, matching what Ouri will implement).
4. Register in `registry.ts` with `context: 'initiative'` and a `group`.
5. After every `contractWrite`, re-fetch (no SSE events on this branch).
6. All strings through `t('myflow.key', 'English default')` + fr/sw keys in the same
   commit (**gloki-i18n-playbook**); styles token-only (`DESIGN_SYSTEM.md`).
7. Verify: `npx tsc -b` clean, `npm run build` clean, walk the flow in the preview
   (**gloki-verification-and-qa**). Do not push without Eston's green light
   (**gloki-change-control**).

## Provenance and maintenance

All facts verified 2026-07-02 against branch `ui` @ commit `c26cdc4` by direct reads
of the cited files. Incident history (S11 read-only-that-deploys, isFirstRun bug,
orphan-contract bug) is drawn from code comments at HEAD plus project memory recorded
2026-06/07. Re-verify volatile facts before relying on them:

| Claim | Re-verify with |
|---|---|
| Flows dir location | `find src -maxdepth 3 -type d -name flows` |
| Registry contents (5 flows, contexts) | `grep -n "id: '" src/components/collaboration/flows/registry.ts` |
| FlowProps fields | read `src/components/collaboration/flows/types.ts` |
| resolveInitiativeStageContract at initiative.ts:65 + consumers | `grep -rn "resolveInitiativeStageContract" src` |
| useFlowContract consumers (interactive flows only) | `grep -rln "useFlowContract(" src/components` |
| 30s timeout / fail-fast probe / `[FlowContract]` logs | read `src/components/collaboration/flows/shared/useFlowContract.ts` |
| Slice list (6) and names | read `src/store/index.ts` |
| Persistence keys | `grep -rn "STORAGE_KEY" src/store/slices src/components/collaboration/flows/shared` |
| Route map + `/lab/presence` at App.tsx:124 | `grep -n "path=" src/App.tsx` |
| DEMO_VERSION value/line | `grep -n "DEMO_VERSION =" src/services/demo/mockApi.ts` (was `'global-v16'` @ line 17) |
| i18n file sizes (en seed-only vs full overlays) | `wc -l src/i18n/en.ts src/i18n/fr.ts src/i18n/sw.ts` |
| useMandate label join | `grep -n "indicators\[label\]" src/hooks/useMandate.ts` |

If a re-verification contradicts this skill, the code wins — update this file in the
same session (see gloki-docs-and-writing for doc-maintenance conventions).
