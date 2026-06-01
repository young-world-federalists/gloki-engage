# Communities2

**Branch:** `ui` — deployed to GitHub Pages (UI-only mockup; no backend)

> Architecture, the 8 flows, learnings, and known limitations live in
> **[ARCHITECTURE.md](./ARCHITECTURE.md)**. UI standards live in
> **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**. Read those before changing a page, flow,
> contract, or component style.

## Branch model & data-layer seam

Three-branch flow: **`main`** (live / upstream) → **`new-features`** (Ouri's layer — real server calls) → **`ui`** (this branch — UI built against **stubs**). Develop on `ui`; at a milestone Ouri derives `new-features` from `ui`, wires the real server calls, and pushes to `main`. Ouri does not want step-by-step PR review — keep `ui` runnable.

**The seam rule:** every component/page reads & writes through `src/services/api.ts` (`contractRead`/`contractWrite`/`deployContract`/`joinContract`), currently backed by the **`src/services/demo/` mock layer**. Never call a real server from a component. Keep the UI↔service boundary clean so swapping stubs → server calls is a localized change inside `src/services/` that never touches components.

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
/ → /stage/problem (redirect)
/stage/:stageId → StageFeedView
/identity/* → IdentityView (communities, profile, join, about, contact)
/create-community → CreateCommunityPage (full onboarding page)
/community/:communityId/* → CommunityView (feed, collab, collab/:collabId, chat, chat/:topicId, currency, members, identity, create-initiative)
/initiative/:host/:agent/:communityId/:initiativeId/* → InitiativeView → InitiativeDashboard
/initiative/:host/:agent/:communityId/:initiativeId/discussion → DiscussionStageView
```

## Deployment

- GitHub Pages: configured via repo Settings → Pages, source branch `ui`
- `public/404.html` handles SPA deep-link routing
- **Production build runs `tsc -b`** — fix all TS errors before pushing
- Contracts are immutable after deploy — new methods require new communities
