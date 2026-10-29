# Communities2

**Branch:** `unified` — the one trunk (to become `main`): one app on the real network, where any
page can also have a demo variant at `?demo=true`. Read **[docs/DEMO_MODE.md](./docs/DEMO_MODE.md)**
first. (`server-side` and `ui` are the retiring two-branch model; they still deploy until the switch.)

> Architecture, the 8 flows, learnings, and known limitations live in
> **[ARCHITECTURE.md](./ARCHITECTURE.md)**. UI standards live in
> **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**. Read those before changing a page, flow,
> contract, or component style.

## Branch model & data-layer seam

- **One trunk, short feature branches.** Branch off `unified`, merge back continuously. A feature
  that is only designed so far lives behind its page's `?demo=true` variant, so the trunk stays
  usable. Both Eston (designs, demo variants) and Ouri (real server side) work this way.
- **Two states per page** ([docs/DEMO_MODE.md](./docs/DEMO_MODE.md)): `/page` is real,
  `/page?demo=true` is demo mode. **The flag decides the data layer, never the id**: in demo mode every
  contract call goes to the demo layer, otherwise to the network; an id from the other layer is just
  "not found". Every route is wrapped as `TwoStatePage`, `RealOnlyPage` (ignores the flag and says so)
  or `DemoOnlyPage` ("not yet implemented" without the flag). The flag sticks to in-app navigation
  until "Show real data". Demo versions are removed by hand once the real page replaces them.
- **The seam rule:** components never call a server directly. Pages read and write through
  `src/services/` (`api.ts`, `services/contracts/`, the verification and settings modules), which
  follow the page's data layer (`services/dataMode.ts`); separate demo variants (`*.demo.tsx`) use
  `src/services/demo/`. Swapping or adding a backend stays a change inside `src/services/`.

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
  - **Shared** (`parentContractId` + `stageKey`): reads parent contract for stored sub-contract; joins if found, deploys and stores if not. Used for demo issues, so community members share one sub-contract per stage.
  - **Single-contract** (shared mode with a real parent, `isSingleContract`): resolves straight to the parent — a real issue contract holds every stage, so stage flows read and write it directly (through its creator's agent, `contractHosts.ts`).
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
/identity/* → IdentityView (communities, hidden, profile, join, verification/*, notifications, about, contact)
/create-community → CreateCommunityPage (full onboarding page)
/community/:communityId/* → CommunityView (feed, collab, collab/:collabId, chat, chat/:topicId, currency, members, identity, create-initiative)
/initiative/:host/:agent/:communityId/:initiativeId/* → InitiativeView → InitiativeDashboard
/initiative/:host/:agent/:communityId/:initiativeId/discussion → DiscussionStageView
/mandate/:communityId/:mandateId/* → MandatePage
/welcome/* → OnboardingFlow · /organization → OrganizationHome · /forum → ForumPage (beta build only)
```

Any of these accepts `?demo=true`; a page without a demo variant ignores it (status per path:
docs/DEMO_MODE.md).

## Deployment

- GitHub Pages builds from the **retiring** branches until the trunk switch
  (`.github/workflows/deploy.yml`, on a push to `server-side` or `ui`): `server-side` with
  `build:prod` at the site root, `ui` with `build:beta` at `/demo/`. A push to `unified` doesn't deploy.
- Build settings: `.env` holds the required `VITE_APPLICATION_SERVER_URL` / `VITE_APPLICATION_AGENT`
  (the central application account); `.env.local` and the `github-pages` environment variables override
  them; `vite.config.ts` refuses to build without them. They are baked in at build time.
- The beta trim is a build mode (`VITE_APP_MODE=beta`, `npm run dev:beta` / `build:beta`), separate
  from `?demo=true`.
- `public/404.html` handles SPA deep-link routing (root and `/demo/`)
- **Production build runs `tsc -b`** — fix all TS errors before pushing
- Contracts are immutable after deploy — new methods only reach contracts deployed afterwards
- The real contracts live in `src/assets/contracts/` (`gloki_engage_*`, `digital_agent_contract.py`,
  `gloki_verification_contract.py`, `gloki_engage_application_settings.py`). Members don't join issue
  contracts: calls go through the creator's agent with the member's key as `agent`
  (`src/services/contractHosts.ts`).
