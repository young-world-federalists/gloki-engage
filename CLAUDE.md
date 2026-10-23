# Communities2

**Branch:** `ui` — the UI branch (built against stubs). **Deploys come from Ouri's `server-side` branch** (since 2026-09-02): Ouri merges `ui` → `server-side`; GitHub Pages builds on every push to `server-side`. A push to `ui` does NOT deploy.

> Architecture, the 8 flows, learnings, and known limitations live in
> **[ARCHITECTURE.md](./ARCHITECTURE.md)**. UI standards live in
> **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**. Read those before changing a page, flow,
> contract, or component style.

## Branch model & data-layer seam

Current flow (since 2026-09-02, S34 D11): **`ui`** (this branch — UI built against **stubs**) → **`server-side`** (Ouri's branch — merges `ui` in, wires the real server calls; **this is what deploys**) → **`main`** (Ouri's stale old line, currently at `d28594a`). Develop on `ui`; Ouri merges `ui` → `server-side` at will (PRs #22/#23 precedent) and that push triggers the GitHub Pages deploy. Ouri does not want step-by-step PR review — keep `ui` runnable.

**The seam rule:** every component/page reads & writes through `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/`joinContract`), currently backed by the **`src/services/demo/` mock layer**. Never call a real server from a component. Keep the UI↔service boundary clean so swapping stubs → server calls is a localized change inside `src/services/` that never touches components.

> Backend contract hand-off (every method/field the UI relies on): **[docs/FOR_OURI_seam.md](./docs/FOR_OURI_seam.md)**.

## Stack

- React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules
- Python blockchain contracts: `Storage()`, `master()`, `timestamp()`, `partners()` — no imports, no `.get(key, default)`
- Contract API: `contractRead()`/`contractWrite()` from `src/services/api.ts`; `deployContract()`/`joinContract()` for contracts
- Vite `?raw` suffix for importing Python contract source
- **No test framework** — verify via `npm run dev` and browser DevTools
- **Design system**: `DESIGN_SYSTEM.md` — component patterns, spacing, typography, mobile standards. Reference when building UI.

## Key Patterns

- `FlowProps`: `{ instanceId, collaborationId, collaborationType, parentContractId?, stageKey? }`. Flow registry uses `context: 'collab' | 'initiative'` to separate flows shown in collab menu vs pipeline.
- `useFlowContract` hook (`flows/shared/useFlowContract.ts`): returns `{ contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry }`. Two modes:
  - **Per-user** (default): deploys a contract per user. Used by Collab flows.
  - **Shared** (`parentContractId` + `stageKey`): reads parent contract for stored sub-contract; joins if found, deploys and stores if not. All initiative dashboard flows use this so community members share one contract.
  - **Resilience**: 30s deploy timeout, stale deploying recovery on mount, cancellation-safe. Diagnostic logs prefixed `[FlowContract]`.
- `flowContractsSlice` (`flows/shared/flowContractsSlice.ts`): localStorage-backed contract ID cache
- `preferencesSlice` (`store/slices/preferencesSlice.ts`): localStorage-backed starred/hidden community IDs
- `useSwipeRef` (`hooks/useSwipeNavigation.ts`): callback ref for horizontal swipe
- Profiles at `state.communities.profiles[publicKey]`; fields: `firstName`, `lastName`, `userPhoto`, `userBio`, `country?`
- Auth at `state.user.serverUrl`/`publicKey`
- Country utilities: `src/utils/countries.ts` — 197 countries (ISO 3166-1), `getCountryByCode()`, `getCountryColor()`, `getCountryName()`, `getCountryFlag()`
- `CountryParticipation` (`components/shared/CountryParticipation.tsx`): shows top country flags with participation counts
- `SearchableSelect` (`components/shared/SearchableSelect.tsx`): reusable searchable dropdown

## Routing

```
/ → HomeView (cross-community overview; first-run users redirect to /welcome)
/stage/:stageId → StageFeedView (per-stage browse, driven by the global StageFooter)
/identity/* → IdentityView (communities, profile, join, about, contact)
/create-community → CreateCommunityPage (full onboarding page)
/community/:communityId/* → CommunityView (feed, collab, collab/:collabId, chat, chat/:topicId, currency, members, identity, create-initiative)
/initiative/:host/:agent/:communityId/:initiativeId/* → InitiativeView → InitiativeDashboard
/initiative/:host/:agent/:communityId/:initiativeId/discussion → DiscussionStageView
```

## Deployment

- GitHub Pages builds from **`server-side`** (`.github/workflows/deploy.yml`, trigger `push: branches: [server-side]` + `workflow_dispatch`). `ui` → `server-side` is Ouri's merge (PRs #22/#23 precedent).
- `public/404.html` handles SPA deep-link routing
- **Production build runs `tsc -b`** — fix all TS errors before pushing; Ouri's merge inherits any red build
- Contracts are immutable after deploy — new methods require new communities
- The real initiative contract lives on `server-side` at `src/assets/contracts/gloki_engage_initiative_contract.py`; contract additions made on `ui` are delivered as a patch under `docs/contracts/` + `docs/FOR_OURI_seam.md`
