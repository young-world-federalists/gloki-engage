# One app, two states per page

**Status: introduced on branch `unified` (2026-10-29), applied to every page.** This replaces the old
split, where the `ui` branch was the app on stubs and `server-side` was the app on real servers. GitHub
Pages is deployed by hand; see [Branches and deployment](#branches-and-deployment).

## The idea

There is one app, and its base is the **real** network. Every URL has two states:

```
/identity/communities             the real page, on real data
/identity/communities?demo=true   the same page in demo mode, on demo data
```

**The flag decides the data layer, never the id.** On a real page every contract call goes to the
network; in demo mode every call goes to the demo layer (`src/services/demo/`). An id from the other
layer — a `demo-…` id on a real page, a real id in demo mode — is simply not found, and the page shows
its usual "not found" message.

Two people work on the same code, on the same trunk:

- **Eston** designs a new page or feature in demo mode, on demo data, on top of the working real app.
- **Ouri** builds the real side against the same UI.
- Both compare the two states side by side (two tabs: one with `?demo=true`, one without).
- When Eston is happy, the demo version is removed by hand.

## Every page is one of three kinds

| Kind | Wrapper | Without the flag | With `?demo=true` |
|---|---|---|---|
| **Two states** | `TwoStatePage` | the real page | the demo version, with the demo notice at the top |
| **Real only** | `RealOnlyPage` | the real page | the real page anyway, with a notice that the flag is ignored |
| **Demo only** | `DemoOnlyPage` | a "not yet implemented" message, with a link to the demo | the demo page, with the demo notice |

The wrappers are in `src/components/shared/PageModes.tsx`. A two-state page either renders the same
component in both states (the data layer is what changes) or a separate demo variant:

```tsx
<TwoStatePage><StageFeedView /></TwoStatePage>                          // same component, both layers
<TwoStatePage real={<CommunitiesReal />} demo={<CommunitiesDemo />} />  // separate demo variant
```

A separate demo variant lives next to its page in a **`*.demo.tsx`** file (e.g.
`Communities.demo.tsx`), so a cleanup is one search: `git ls-files '*.demo.tsx'`.

## How it works

| Piece | Where | What it does |
|---|---|---|
| `useDemoMode()` | `hooks/useDemoMode.ts` | `true` in demo mode: `?demo=true`, or carried over from the previous page (below) |
| `DemoFlagUrlSync` | same file, mounted in `App.tsx` | writes `?demo=true` back into the URL of a page reached in demo mode |
| `setDemoDataMode` / `isDemoDataMode` | `services/dataMode.ts` | the data layer for the page being shown; the wrappers set it while the page renders, `App` resets it to real on every navigation |
| `contractRead` / `contractWrite` / `joinContract` | `services/api.ts` | follow the data layer, for any id |
| `communitiesForMode(contracts)` | `services/dataMode.ts` | the communities a page lists: the seeded demo communities in demo mode, the real ones otherwise |
| `<DemoNotice />` | `components/shared/DemoNotice.tsx` | the demo banner, with "Show real data" |
| `useInitiativeFound(id)` | `hooks/useInitiativeFound.ts` | "not found" for issue and mandate pages, in the page's layer |

**The flag sticks to in-app navigation.** Once a page is shown in demo mode, every link — in the page
or in the menu — keeps demo mode, and the next page's URL gets `?demo=true`. Demo mode ends only on
purpose: "Show real data" on the demo banner, "Leave demo mode" on a real-only page, or `?demo=false`.
A fresh page load starts from the URL alone. (So no link needs to carry the flag by hand.)

Pages that depend on the URL's sub-path decide per sub-page: the community page (`CommunityView`) uses
the real layer for its real-only sub-pages (Identity & Trust, Start an initiative) and the flag for the
rest; the issue page (`InitiativeView`) has a two-state discussion and demo-only suggest/collaboration
views.

## Rules

1. **Demo mode never reaches the network**: every contract call follows the data layer. The signed-in
   identity, the profile and verification (real-only pages) stay real.
2. **Demo data uses demo ids** (`demo-…`). Both states share the Redux store and some browser storage
   (starred/hidden communities, the flow-contract cache), keyed by id, so the two can't overwrite each
   other, even in two tabs at once. A reload does **not** clean up mixed browser storage; keeping the
   ids apart is the only protection.
3. **Every demo page shows `<DemoNotice />`** (the wrappers add it), so sample data is never mistaken for
   real.
4. **The flag covers the page's content, not the frame.** The header, menu, footer and the signed-in
   identity are real in both states.
5. **New code** imports `services/demo` only from `*.demo.tsx` files and the demo layer itself; data
   access otherwise goes through `src/services/`.

Known limit: the data layer is one setting for the page being shown. An async call started by the
previous page and finishing after a navigation can land in the new page's layer.

## A feature's life

1. **Eston** branches from the trunk, builds the page's demo version (a `*.demo.tsx` variant, or the same
   component on new demo stubs/fixtures in `src/services/demo/`), wraps the route with `TwoStatePage` or
   `DemoOnlyPage`, and merges back.
2. **Ouri** builds the real side in `src/services/` and the page's real variant against the same UI; a
   demo-only page becomes two-state.
3. **Both** compare `/page` and `/page?demo=true`.
4. **Cleanup, by hand, once Eston is happy:** delete the `*.demo.tsx` variant or the demo-only wrapper,
   and any demo fixtures nothing else uses; the page becomes real-only.

## The data layers

| Layer | Where | Used in |
|---|---|---|
| Real services | `src/services/api.ts` (`*OnChain`, routed `contractRead`/`contractWrite`), `src/services/contracts/`, `verificationRegistry.ts`, `applicationSettings.ts`, `contractHosts.ts` | real pages |
| Real contracts | `gloki_engage_community_contract.py`, `gloki_engage_initiative_contract.py`, `digital_agent_contract.py`, `gloki_verification_contract.py`, `gloki_engage_application_settings.py` | the real network |
| Demo layer | `src/services/demo/` (mock contracts, fixtures, personas, `DEMO_VERSION`) | demo mode |

`getContracts` still merges the seeded demo communities into the signed-in user's contract list; pages
list only their own layer through `communitiesForMode`.

## Pages and their state

| Path | Kind |
|---|---|
| `/` (Home), `/stage/:stageId`, `/organization` | **two states** (same component; real vs demo communities) |
| `/identity/communities`, `/identity/hidden` | **two states** (separate demo variant, `Communities.demo.tsx`) |
| `/community/:communityId` (feed), `…/members` | **two states** (the community is looked up in the page's layer) |
| `/initiative/…/:initiativeId/discussion`, `/mandate/:communityId/:mandateId` | **two states** (with "not found") |
| `/initiative/…/:initiativeId` | redirects to the community feed |
| `/welcome/*`, `/identity/profile`, `/identity/join`, `/identity/verification`, `…/request`, `…/approve`, `/create-community`, `/community/:id/create-initiative`, `/community/:id/identity` | **real only** |
| `/community/:id/collab`, `collab/:collabId`, `chat`, `chat/:topicId`, `currency`, `settings`, `write-together`; `/identity/verification/invite`, `call`, `daily`; `/identity/notifications`; `…/:initiativeId/suggest`, `…/collaboration`; `/forum` (beta) | **demo only** |
| `/identity/about`, `/identity/contact`, `/lab/presence`, not-found | no data |

## Separate from the beta trim

The beta (sign-up, keys, verification, one forum) is a **build** setting, `VITE_APP_MODE=beta`
(`npm run dev:beta`, `npm run build:beta`), read only in `src/appMode.ts`. It hides parts of the app; it
doesn't change where data comes from. Demo mode works the same in both builds. (The beta's forum is
demo-only, so without the flag the beta lands on "not yet implemented".)

Unlike the demo flag, the beta has one whole-app override and no URL form: on a beta build,
localStorage `gloki.fullApp` = `'true'` runs the full app in that browser. The beta writes the key as
`'false'` on first load, so it's there to toggle in DevTools (Application → Local Storage); reload after
changing it. It's read once at startup and only hides or shows parts of the app, so it's not access
control.

## Branches and deployment

- **Trunk:** `unified`, to become `main`. Work happens on short feature branches off it, merged back
  continuously; demo-mode pages keep the trunk usable while a feature is half done.
- **Deployment:** by hand (Actions → Run workflow, choosing the branch): one app, `build:beta` at the
  site root (`.github/workflows/deploy.yml`). The full app is the same deploy with `gloki.fullApp` set (above).
- **Retired:** `server-side` and `ui`. Their own copies of the workflow still deploy the old two-app
  site if pushed, so don't push them (or update their workflow) while they exist.
- **Settings:** `.env` holds the required `VITE_APPLICATION_SERVER_URL` / `VITE_APPLICATION_AGENT`
  (the central application account); `.env.local` and the `github-pages` environment variables override
  them; `vite.config.ts` refuses to build without them.
