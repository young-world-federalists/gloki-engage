# Communities2

**Branch:** `unified` — the one trunk (to become `main`): one app on the real network, where any
page can also have a demo variant at `?demo=true`. Read **[docs/DEMO_MODE.md](./docs/DEMO_MODE.md)**
first. (`server-side` and `ui` are the retired two-branch model; GitHub Pages is deployed by hand.)

> **IBC-GO (2026-11-20):** `unified` has been merged into `main`, which is now the trunk and the default branch.
> The move to ibc-go is merged into `main` too (from `ibc-go-migration`); its plan, decisions and what is
> still open are in [docs/IBC_GO_MIGRATION.md](./docs/IBC_GO_MIGRATION.md).

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

> **IBC-GO (2026-11-19):** the real network is now [ibc-go](https://github.com/ouripoupko/ibc-go), with Solidity
> contracts on an EVM (`src/assets/contracts/sol/`). The Python rules above apply only to the demo layer's
> two remaining `.py` contracts. Every real call goes through `src/services/ibc.ts` (`IbcApp` from the npm
> package `@ouripoupko/ibc`): users sign in on their own node with a passkey. `contractRead`/`contractWrite`
> keep their shape. Real deploys and joins happen in the contract modules (`services/contracts/*.ts`,
> `digitalAgentContract.ts`, `verificationRegistry.ts`); `deployContract()` is demo-only, and so is
> `joinContract()`. The `?raw` imports now load `.sol` source.

- **No test framework** — verify via `npm run dev` and browser DevTools
- **Design system**: `DESIGN_SYSTEM.md` — component patterns, spacing, typography, mobile standards. Reference when building UI.

## Key Patterns

- `FlowProps`: `{ instanceId, collaborationId, collaborationType, parentContractId?, stageKey? }`. Flow registry uses `context: 'collab' | 'initiative'` to separate flows shown in collab menu vs pipeline.
- `useFlowContract` hook (`flows/shared/useFlowContract.ts`): returns `{ contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry }`. Two modes:
  - **Per-user** (default): deploys a contract per user. Used by Collab flows.
  - **Shared** (`parentContractId` + `stageKey`): reads parent contract for stored sub-contract; joins if found, deploys and stores if not. Used for demo issues, so community members share one sub-contract per stage.
  - **Single-contract** (shared mode with a real parent, `isSingleContract`): resolves straight to the parent — a real issue contract holds every stage, so stage flows read and write it directly (through its creator's agent, `contractHosts.ts`).
  > **IBC-GO (2026-11-19):** a real issue is still one agreement, but split into a root contract plus
  > `Solutions` and `Decision` (the 24 KB EVM limit). Flows reach it through its adapter
  > (`initiativeAdapter` in `services/contracts/glokiEngageInitiative.ts`, registered in `contractHosts.ts`),
  > which maps the old method names onto the Solidity functions. Members use it as guests of the creator's
  > node; there's no `agent` argument.
  - **Resilience**: 30s deploy timeout, stale deploying recovery on mount, cancellation-safe. Diagnostic logs prefixed `[FlowContract]`.
- `flowContractsSlice` (`flows/shared/flowContractsSlice.ts`): localStorage-backed contract ID cache
- `preferencesSlice` (`store/slices/preferencesSlice.ts`): localStorage-backed starred/hidden community IDs
- Profiles at `state.communities.profiles[publicKey]`; fields: `firstName`, `lastName`, `userPhoto`, `userBio`, `country?`
- Auth at `state.user.serverUrl`/`publicKey`
  > **IBC-GO (2026-11-19):** `publicKey` now holds the user's agent id (a checksummed `0x…` address), and
  > `serverUrl` holds their node. The profile map is keyed by the same id.
- Country utilities: `src/utils/countries.ts` — 197 countries (ISO 3166-1), `getCountryByCode()`, `getCountryColor()`, `getCountryName()`, `getCountryFlag()`
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

- GitHub Pages is deployed by hand (`.github/workflows/deploy.yml`, Actions → Run workflow, choosing the
  branch): one app, `build:beta` at the site root. A push never deploys.
- Build settings: `.env` holds the required `VITE_APPLICATION_SERVER_URL` / `VITE_APPLICATION_AGENT`
  (the central application account); `.env.local` and the `github-pages` environment variables override
  them; `vite.config.ts` refuses to build without them. They are baked in at build time.
  > **IBC-GO (2026-11-19):** a third required setting, `VITE_APPLICATION_SETTINGS_CONTRACT` (the public
  > `ApplicationSettings` contract). `node tools/setup-application.mjs <node url> <key file>` creates the
  > account and prints all three settings, once per network. `.env` leaves the agent and settings
  > contract empty until the live node (ouri.gloki.contact) is set up, the next step now that the
  > migration is merged; use `.env.local` for a local node at `http://localhost:2611`.
- The beta trim is a build mode (`VITE_APP_MODE=beta`, `npm run dev:beta` / `build:beta`), separate
  from `?demo=true`. On a beta build, localStorage `gloki.fullApp` = `'true'` turns the whole app into the
  full app in that browser (the beta writes the key as `'false'` on first load; reload after changing
  it). A private switch, not access control (`src/appMode.ts`).
- `public/404.html` handles SPA deep-link routing
- **Production build runs `tsc -b`** — fix all TS errors before pushing
- Contracts are immutable after deploy — new methods only reach contracts deployed afterwards
- The real contracts live in `src/assets/contracts/` (`gloki_engage_*`, `digital_agent_contract.py`,
  `gloki_verification_contract.py`, `gloki_engage_application_settings.py`). Members don't join issue
  contracts: calls go through the creator's agent with the member's key as `agent`
  (`src/services/contractHosts.ts`).
  > **IBC-GO (2026-11-19):** the Python contracts named above are gone. The real ones are
  > `src/assets/contracts/sol/*.sol`: `DigitalAgent`, `ApplicationSettings`, `GlokiVerification`,
  > `GlokiEngageCommunity`, `GlokiEngageInitiative`, `Forum`. Community members are partners plus the
  > contract's own `enroll` list. Issues, verification, settings and the forum are used as guests, through
  > their host's node, signed by the member's own key. `contractHosts.ts` is now a registry of adapters.
  > Check contracts with `tools/ibc-check/` (README there) against a local node.
